import { Injectable, NotFoundException } from '@nestjs/common';
import { SOURCE_REGISTRY, SourceAccessStatus, SourceRegistryEntry } from '../sources/source-registry';
import { isProtectedSource, isPublicCandidateSource, probeStatusToPublicHealthBucket } from '../sources/source-coverage';
import { ConnectorKind, ProbeResult, ProbeStatus } from './connector.types';
import { HttpProbeService } from './http-probe.service';

const COMMON_PATHS = [
  '/NetGIS/Services/MapService.ashx',
  '/NetGIS/Services/QueryService.ashx',
  '/NetGIS/Services/GeometryService.ashx',
  '/imardurumu/Services/ImarDurumu.ashx',
  '/imardurumu/Services/ImarDurumu.asmx',
  '/imardurumu/Service/ImarDurumu.ashx',
  '/imardurumu/Service/ImarDurumu.asmx',
  '/imardurumu/Services/MapService.ashx',
  '/imardurumu/Services/QueryService.ashx',
  '/imardurumu/Services/Proxy.ashx',
  '/wms.ashx?request=GetCapabilities&service=WMS',
  '/webgis_net/wms.ashx?request=GetCapabilities&service=WMS',
  '/netgis7/wms?request=GetCapabilities&service=WMS',
  '/netgis5/wms?request=GetCapabilities&service=WMS',
  '/gisapi/wms?request=GetCapabilities&service=WMS',
  '/WebGIS/wms?request=GetCapabilities&service=WMS',
  '/keos/wms?request=GetCapabilities&service=WMS',
  '/geoserver/ows?service=WMS&request=GetCapabilities',
  '/geoserver/ows?service=WFS&request=GetCapabilities',
  '/ows?service=WMS&request=GetCapabilities',
  '/ows?service=WFS&request=GetCapabilities',
  '/wms?service=WMS&request=GetCapabilities',
  '/arcgis/rest/services?f=pjson'
];

const DEFAULT_PUBLIC_HEALTH_LIMIT = 25;
const MAX_PUBLIC_HEALTH_LIMIT = 50;

export interface PublicHealthFilters {
  limit?: number | string;
  connectorKind?: ConnectorKind | string;
  vendor?: string;
  province?: string;
  accessStatus?: SourceAccessStatus;
}

export interface PublicHealthResult {
  sourceId: string;
  name: string;
  homepageUrl: string;
  accessStatus: SourceAccessStatus;
  metadata?: SourceRegistryEntry['metadata'];
  checkedEndpoints: number;
  bestStatus: ProbeStatus | 'skipped_protected' | 'error';
  detectedKinds: ConnectorKind[];
  availableEndpoints: string[];
  nextAction: string;
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly httpProbe: HttpProbeService) {}

  getSource(id: string): SourceRegistryEntry {
    const source = SOURCE_REGISTRY.find((entry) => entry.id === id);
    if (!source) throw new NotFoundException(`Source '${id}' is not registered.`);
    return source;
  }

  listSources(): SourceRegistryEntry[] {
    return SOURCE_REGISTRY;
  }

  buildCandidateEndpoints(source: SourceRegistryEntry): string[] {
    const homepage = new URL(source.homepageUrl);
    const base = `${homepage.protocol}//${homepage.host}`;
    const normalizedPath = this.normalizeBasePath(homepage.pathname);
    const candidates = new Set<string>();

    candidates.add(new URL(normalizedPath || '/', base).toString());
    if (normalizedPath && normalizedPath !== '/') {
      candidates.add(new URL(normalizedPath.replace(/\/$/, '/Services/ImarDurumu.asmx'), base).toString());
      candidates.add(new URL(normalizedPath.replace(/\/$/, '/Services/ImarDurumu.ashx'), base).toString());
    }

    for (const path of COMMON_PATHS) candidates.add(`${base}${path}`);
    return [...candidates];
  }

  async discoverSource(id: string): Promise<{ source: SourceRegistryEntry; candidates: string[]; probes: ProbeResult[]; generatedAt: string }> {
    const source = this.getSource(id);
    const candidates = this.buildCandidateEndpoints(source);
    const probes = await Promise.all(candidates.map((endpoint) => this.httpProbe.probe(endpoint)));
    return { source, candidates, probes, generatedAt: new Date().toISOString() };
  }

  async discoverMunicipalityPatterns(slug: string): Promise<{ slug: string; candidates: ProbeResult[]; note: string; generatedAt: string }> {
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const endpoints = [
      `https://keos.${normalizedSlug}.bel.tr/`,
      `https://webgis.${normalizedSlug}.bel.tr/`,
      `https://eimar.${normalizedSlug}.bel.tr/`
    ];
    const candidates = await Promise.all(endpoints.map((endpoint) => this.httpProbe.probe(endpoint)));
    return {
      slug: normalizedSlug,
      candidates,
      note: 'Pattern discovery only generates host candidates and does not imply permission, availability, or a registered source.',
      generatedAt: new Date().toISOString()
    };
  }

  async discoverPublicHealth(filters: PublicHealthFilters = {}) {
    const limit = this.clampPublicHealthLimit(filters.limit);
    const filteredSources = this.filterPublicHealthSources(filters);
    const protectedMatches = filteredSources.filter(isProtectedSource);
    const candidates = filteredSources.filter(isPublicCandidateSource).slice(0, limit);
    const results: PublicHealthResult[] = [];
    const totals = {
      checked: 0,
      skippedProtected: protectedMatches.length,
      available: 0,
      requiresCredentials: protectedMatches.length,
      captcha: 0,
      unavailable: 0,
      errors: 0
    };

    for (const source of candidates) {
      try {
        const probes = await Promise.all(this.buildCandidateEndpoints(source).map((endpoint) => this.httpProbe.probe(endpoint)));
        const result = this.toPublicHealthResult(source, probes);
        results.push(result);
        totals.checked += 1;
        totals[probeStatusToPublicHealthBucket(result.bestStatus as ProbeStatus)] += 1;
      } catch {
        results.push({
          sourceId: source.id,
          name: source.name,
          homepageUrl: source.homepageUrl,
          accessStatus: source.access.status,
          metadata: source.metadata,
          checkedEndpoints: 0,
          bestStatus: 'error',
          detectedKinds: [],
          availableEndpoints: [],
          nextAction: 'Probe failed without exposing credentials or bypassing protections; retry later or inspect manually.'
        });
        totals.checked += 1;
        totals.errors += 1;
      }
    }

    for (const source of protectedMatches) {
      results.push({
        sourceId: source.id,
        name: source.name,
        homepageUrl: source.homepageUrl,
        accessStatus: source.access.status,
        metadata: source.metadata,
        checkedEndpoints: 0,
        bestStatus: 'skipped_protected',
        detectedKinds: [],
        availableEndpoints: [],
        nextAction: 'Skipped automated probing because this source requires approved credentials or legal agreement.'
      });
    }

    return {
      status: results.some((result) => result.bestStatus === 'error') ? 'partial' : 'ok',
      generatedAt: new Date().toISOString(),
      limit,
      appliedFilters: this.publicHealthAppliedFilters(filters),
      totals,
      results
    };
  }

  private normalizeBasePath(pathname: string): string {
    if (!pathname || pathname === '/') return '/';
    const withoutFile = pathname.replace(/[^/]+\.(aspx?|html?|php)$/i, '');
    return withoutFile.endsWith('/') ? withoutFile : `${withoutFile}/`;
  }

  private clampPublicHealthLimit(rawLimit: PublicHealthFilters['limit']): number {
    const parsed = Number(rawLimit ?? DEFAULT_PUBLIC_HEALTH_LIMIT);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PUBLIC_HEALTH_LIMIT;
    return Math.min(Math.floor(parsed), MAX_PUBLIC_HEALTH_LIMIT);
  }

  private filterPublicHealthSources(filters: PublicHealthFilters): SourceRegistryEntry[] {
    const vendor = filters.vendor?.toLocaleLowerCase('tr-TR');
    const province = filters.province?.toLocaleLowerCase('tr-TR');
    return SOURCE_REGISTRY.filter((source) => {
      if (filters.connectorKind && !source.connectorKinds.includes(filters.connectorKind as ConnectorKind)) return false;
      if (vendor && source.metadata?.vendor?.toLocaleLowerCase('tr-TR') !== vendor) return false;
      if (province && source.metadata?.province?.toLocaleLowerCase('tr-TR') !== province) return false;
      if (filters.accessStatus && source.access.status !== filters.accessStatus) return false;
      return isPublicCandidateSource(source) || isProtectedSource(source);
    });
  }

  private publicHealthAppliedFilters(filters: PublicHealthFilters) {
    return {
      connectorKind: filters.connectorKind,
      vendor: filters.vendor,
      province: filters.province,
      accessStatus: filters.accessStatus
    };
  }

  private toPublicHealthResult(source: SourceRegistryEntry, probes: ProbeResult[]): PublicHealthResult {
    const priority = [
      ProbeStatus.Available,
      ProbeStatus.MethodContractRequired,
      ProbeStatus.CaptchaRequired,
      ProbeStatus.RequiresCredentials,
      ProbeStatus.RequiresLegalAgreement,
      ProbeStatus.RateLimited,
      ProbeStatus.EndpointChanged,
      ProbeStatus.Unavailable,
      ProbeStatus.UnsupportedFormat
    ];
    const best = probes.slice().sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0];
    const available = probes.filter((probe) => probe.status === ProbeStatus.Available || probe.status === ProbeStatus.MethodContractRequired);
    const detectedKinds = Array.from(new Set(probes.flatMap((probe) => probe.detectedKinds)));

    return {
      sourceId: source.id,
      name: source.name,
      homepageUrl: source.homepageUrl,
      accessStatus: source.access.status,
      metadata: source.metadata,
      checkedEndpoints: probes.length,
      bestStatus: best?.status ?? ProbeStatus.Unavailable,
      detectedKinds,
      availableEndpoints: available.map((probe) => probe.endpoint),
      nextAction: this.publicHealthNextAction(best?.status ?? ProbeStatus.Unavailable)
    };
  }

  private publicHealthNextAction(status: ProbeStatus): string {
    if (status === ProbeStatus.Available) return 'Inspect public endpoint contract and provenance before ingestion.';
    if (status === ProbeStatus.MethodContractRequired) return 'Inspect WSDL/method contract before any method call.';
    if (status === ProbeStatus.CaptchaRequired) return 'Stop automated discovery; captcha is present.';
    if (status === ProbeStatus.RequiresCredentials || status === ProbeStatus.RequiresLegalAgreement) return 'Stop and request approved credentials or legal access.';
    if (status === ProbeStatus.RateLimited) return 'Back off and retry later with lower rate.';
    return 'No callable public endpoint confirmed; keep registry status unknown/unavailable.';
  }
}
