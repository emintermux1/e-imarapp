import { Injectable } from '@nestjs/common';
import { SOURCE_REGISTRY, SourceRegistryEntry } from '../sources/source-registry';
import { ConnectorKind, ProbeStatus, PublicReadinessStatus } from './connector.types';
import { HttpProbeService } from './http-probe.service';

export interface OpenPublicProbeResult {
  sourceId?: string;
  status: PublicReadinessStatus;
  checkedUrls: string[];
  verifiedLayers: Array<{ name?: string; title?: string; service?: string }>;
  detectedKinds: ConnectorKind[];
  message: string;
}

export interface OverpassContextResult {
  status: PublicReadinessStatus;
  endpoint: string;
  elements: unknown[];
  message: string;
  fallback: string;
}

const USER_AGENT = 'e-imarapp-open-public-source/0.1 (+metadata only)';

@Injectable()
export class OpenPublicSourceService {
  constructor(private readonly httpProbe: HttpProbeService) {}

  readinessForSource(source: SourceRegistryEntry): { status: PublicReadinessStatus; message: string } {
    if (source.access.status === 'requires_legal_agreement') return { status: 'requires_legal_agreement', message: 'Requires approved legal agreement; automated public probing is disabled.' };
    if (source.access.status === 'requires_credentials') return { status: 'requires_credentials', message: 'Requires credentials or authenticated workflow; automated public probing is disabled.' };
    if (source.access.status === 'public_metadata' || source.access.status === 'metadata_only') return { status: 'public_metadata', message: source.access.notes };
    if (source.access.status === 'public') return { status: 'public_metadata', message: 'Registered as public candidate; live readiness is verified by connector probes.' };
    return { status: 'unavailable', message: 'No public endpoint readiness has been verified.' };
  }

  registryReadiness() {
    const sources = SOURCE_REGISTRY.map((source) => ({
      sourceId: source.id,
      name: source.name,
      homepageUrl: source.homepageUrl,
      connectorKinds: source.connectorKinds,
      capabilities: source.capabilities,
      accessStatus: source.access.status,
      publicReadiness: this.readinessForSource(source)
    }));
    return {
      status: 'ok',
      allowedStatuses: ['verified_live', 'public_metadata', 'captcha_required', 'requires_credentials', 'requires_legal_agreement', 'unavailable'] satisfies PublicReadinessStatus[],
      sources
    };
  }

  async probeEPlanWms(): Promise<OpenPublicProbeResult> {
    return this.probeCapabilities('csb-e-plan', [
      'https://e-plan.gov.tr/geoserver/ows?service=WMS&request=GetCapabilities',
      'https://eplan.csb.gov.tr/geoserver/ows?service=WMS&request=GetCapabilities',
      'https://eplan.csb.gov.tr/arcgis/rest/services?f=pjson'
    ], 'E-Plan WMS/GetCapabilities public metadata probe.');
  }

  async probeTucbsPublicCatalog(): Promise<OpenPublicProbeResult> {
    return this.probeCapabilities('tucbs-public-api', [
      'https://tucbs-public-api.csb.gov.tr/',
      'https://tucbs.gov.tr/',
      'https://tucbs.csb.gov.tr/geonetwork/srv/tur/catalog.search'
    ], 'TUCBS public catalog/metadata discovery without e-Devlet or credentialed flows.');
  }

  async discoverMunicipalCapabilities(input: { baseUrl: string }): Promise<OpenPublicProbeResult> {
    const baseUrl = this.normalizeHttpUrl(input.baseUrl);
    if (!baseUrl) {
      return { status: 'unavailable', checkedUrls: [], verifiedLayers: [], detectedKinds: [], message: 'A valid http/https municipal base URL is required.' };
    }
    const base = new URL(baseUrl);
    const origin = `${base.protocol}//${base.host}`;
    return this.probeCapabilities(undefined, [
      new URL('/geoserver/ows?service=WMS&request=GetCapabilities', origin).toString(),
      new URL('/geoserver/ows?service=WFS&request=GetCapabilities', origin).toString(),
      new URL('/ows?service=WMS&request=GetCapabilities', origin).toString(),
      new URL('/arcgis/rest/services?f=pjson', origin).toString(),
      new URL('/ArcGIS/rest/services?f=pjson', origin).toString(),
      new URL('/MapServer?f=pjson', baseUrl).toString()
    ], 'Generic municipal WMS/GeoServer/MapServer public metadata discovery.');
  }

  async lookupOsmContext(input: { lat: number; lon: number; radiusMeters?: number; endpoint?: string }): Promise<OverpassContextResult> {
    const endpoint = input.endpoint ?? 'https://overpass-api.de/api/interpreter';
    const radius = Math.max(10, Math.min(250, Math.trunc(input.radiusMeters ?? 60)));
    if (!Number.isFinite(input.lat) || !Number.isFinite(input.lon) || Math.abs(input.lat) > 90 || Math.abs(input.lon) > 180) {
      return this.osmFallback(endpoint, 'Latitude/longitude is invalid; no OpenStreetMap request was made.');
    }
    const query = `[out:json][timeout:10];(way(around:${radius},${input.lat},${input.lon})["building"];way(around:${radius},${input.lat},${input.lon})["landuse"];relation(around:${radius},${input.lat},${input.lon})["boundary"];);out tags center 25;`;
    const response = await this.fetchText(endpoint, { method: 'POST', body: `data=${encodeURIComponent(query)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' } });
    if (!response) return this.osmFallback(endpoint, 'OpenStreetMap/Overpass context is temporarily unavailable; continue with registered municipal/OGC sources.');
    if (response.status === 429) return this.osmFallback(endpoint, 'OpenStreetMap/Overpass rate limit reached; back off and retry later with a smaller radius.');
    if (response.status === 401 || response.status === 403) return { status: 'requires_credentials', endpoint, elements: [], message: 'Overpass endpoint denied anonymous access; no protected flow was bypassed.', fallback: 'Use another public Overpass mirror or municipal source metadata.' };
    if (response.status < 200 || response.status >= 300) return this.osmFallback(endpoint, `OpenStreetMap/Overpass returned HTTP ${response.status}; no context layer is ready.`);
    try {
      const parsed = JSON.parse(response.text) as { elements?: unknown[] };
      return {
        status: 'verified_live',
        endpoint,
        elements: (parsed.elements ?? []).slice(0, 25),
        message: 'OpenStreetMap context lookup succeeded. Use only as public basemap/context, not official cadastral evidence.',
        fallback: 'If context is sparse, display municipal WMS/parcel metadata readiness instead.'
      };
    } catch {
      return this.osmFallback(endpoint, 'OpenStreetMap/Overpass returned a non-JSON response; context is unavailable.');
    }
  }

  private async probeCapabilities(sourceId: string | undefined, urls: string[], message: string): Promise<OpenPublicProbeResult> {
    const probes = await Promise.all(urls.map((url) => this.httpProbe.probe(url)));
    const bestStatus = this.bestStatus(probes.map((probe) => probe.status));
    const verifiedLayers = probes
      .filter((probe) => probe.status === ProbeStatus.Available || probe.status === ProbeStatus.MethodContractRequired)
      .map((probe) => ({ name: probe.endpoint, title: probe.finalUrl ?? probe.endpoint, service: this.serviceFromEndpoint(probe.endpoint) }));
    const detectedKinds = Array.from(new Set(probes.flatMap((probe) => probe.detectedKinds)));
    return {
      sourceId,
      status: bestStatus,
      checkedUrls: urls,
      verifiedLayers,
      detectedKinds,
      message: this.messageForStatus(bestStatus, message)
    };
  }

  private bestStatus(statuses: ProbeStatus[]): PublicReadinessStatus {
    if (statuses.some((status) => status === ProbeStatus.Available || status === ProbeStatus.MethodContractRequired)) return 'verified_live';
    if (statuses.includes(ProbeStatus.CaptchaRequired)) return 'captcha_required';
    if (statuses.includes(ProbeStatus.RequiresLegalAgreement)) return 'requires_legal_agreement';
    if (statuses.includes(ProbeStatus.RequiresCredentials)) return 'requires_credentials';
    return 'unavailable';
  }

  private messageForStatus(status: PublicReadinessStatus, context: string): string {
    if (status === 'verified_live') return `${context} Public capabilities metadata is reachable; inspect terms and provenance before ingestion.`;
    if (status === 'captcha_required') return `${context} Captcha/bot protection detected; automated discovery stopped.`;
    if (status === 'requires_credentials') return `${context} Anonymous public metadata was not reachable; credentials are required.`;
    if (status === 'requires_legal_agreement') return `${context} Legal agreement is required before integration.`;
    if (status === 'public_metadata') return `${context} Public metadata only.`;
    return `${context} No public capabilities endpoint was confirmed.`;
  }

  private serviceFromEndpoint(endpoint: string): string {
    if (/service=wfs/i.test(endpoint)) return 'WFS';
    if (/mapserver|arcgis\/rest/i.test(endpoint)) return 'MapServer';
    return 'WMS';
  }

  private normalizeHttpUrl(raw: string): string | null {
    try {
      const url = new URL(raw);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }

  private osmFallback(endpoint: string, message: string): OverpassContextResult {
    return { status: 'unavailable', endpoint, elements: [], message, fallback: 'Show source readiness as public_metadata/unavailable and avoid retry loops against Overpass.' };
  }

  private async fetchText(endpoint: string, init: RequestInit = {}): Promise<{ status: number; text: string } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(endpoint, {
        ...init,
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json,text/plain,*/*;q=0.8',
          ...(init.headers ?? {})
        }
      });
      return { status: response.status, text: await response.text() };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
