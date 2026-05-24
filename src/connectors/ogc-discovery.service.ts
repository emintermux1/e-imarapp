import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { provenanceRecord, ProvenanceRecord } from '../common/provenance';
import { DatabaseService } from '../database/database.service';
import { ConnectorKind } from './connector.types';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

export interface OgcLayerCatalog {
  sourceId: string;
  endpoint?: string;
  service: 'WMS' | 'WFS';
  generatedAt: string;
  layers: Array<{ name?: string; title?: string; crs?: string[]; srs?: string[]; bbox?: unknown; queryable?: boolean; abstract?: string }>;
  status: 'ok' | 'protected' | 'unavailable' | 'unsupported_format';
  provenance: ProvenanceRecord[];
}

export interface MunicipalOgcDiscoveryResult {
  status: 'available' | 'captcha_required' | 'rate_limited' | 'requires_credentials' | 'unsupported_format' | 'unavailable' | 'endpoint_changed';
  base_url: string | null;
  wms_url: string | null;
  wms_get_capabilities_url: string | null;
  wms_version: string | null;
  wfs_url: string | null;
  wfs_get_capabilities_url: string | null;
  available_layers: OgcLayerCatalog['layers'];
  supported_srs: string[];
  supported_formats: string[];
  metadata: Record<string, unknown>;
  last_error: string | null;
  tested_urls: string[];
  discovered_at: string;
  refresh_after: string;
}

export const COMMON_WMS_PATHS = [
  '/wms.ashx',
  '/webgis_net/wms.ashx',
  '/netgis7/wms',
  '/netgis5/wms',
  '/gisapi/wms',
  '/WebGIS/wms',
  '/keos/wms',
  '/geoserver/ows',
  '/ows'
];

export const COMMON_WFS_PATHS = [
  '/wfs.ashx',
  '/webgis_net/wfs.ashx',
  '/netgis7/wfs',
  '/netgis5/wfs',
  '/gisapi/wfs',
  '/WebGIS/wfs',
  '/keos/wfs',
  '/geoserver/ows',
  '/ows'
];

const WMS_VERSIONS = ['1.3.0', '1.1.1'] as const;
const WFS_VERSION = '2.0.0';
const REFRESH_DAYS = 7;

@Injectable()
export class OgcDiscoveryService {
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  constructor(
    private readonly db: DatabaseService,
    private readonly discovery: DiscoveryService,
    private readonly probe: HttpProbeService
  ) {}

  buildGetCapabilitiesUrl(base: string, path: string, service: 'WMS' | 'WFS' = 'WMS', version?: string): string {
    const absolute = new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
    const url = new URL(absolute);
    url.searchParams.set('service', service);
    url.searchParams.set('request', 'GetCapabilities');
    if (version) url.searchParams.set('version', version);
  return url.toString();
  }

  buildNetcadCandidateRoots(homepageUrl: string): string[] {
    try {
      const homepage = new URL(homepageUrl);
      return [`${homepage.protocol}//${homepage.host}/`];
    } catch {
      return [];
    }
  }

  async discoverMunicipalEndpoints(seedUrls: string[]): Promise<MunicipalOgcDiscoveryResult> {
    const discoveredAt = new Date();
    const refreshAfter = new Date(discoveredAt.getTime() + REFRESH_DAYS * 86400000);
    const testedUrls: string[] = [];
    let lastError: string | null = null;
    let bestWms: { url: string; capsUrl: string; version: string | null; layers: OgcLayerCatalog['layers']; formats: string[] } | null = null;
    let bestWfs: { url: string; capsUrl: string; layers: OgcLayerCatalog['layers']; formats: string[] } | null = null;
    const supportedSrs = new Set<string>();
    const supportedFormats = new Set<string>();
    const metadata: Record<string, unknown> = {};

    const baseUrls = [...new Set(seedUrls.map((seed) => this.extractBaseUrl(seed)).filter(Boolean) as string[])];
    for (const baseUrl of baseUrls) {
      for (const path of COMMON_WMS_PATHS) {
        for (const version of WMS_VERSIONS) {
          const capsUrl = this.buildGetCapabilitiesUrl(baseUrl, path, 'WMS', version);
          testedUrls.push(capsUrl);
          const fetched = await this.safeFetchText(capsUrl);
          if (!fetched) continue;
          if (fetched.status === 401 || fetched.status === 403 || this.looksProtected(fetched.text)) {
            lastError = this.classifyHttpError(fetched.status, fetched.text);
            continue;
          }
          if (!this.looksLikeCapabilitiesXml(fetched.text)) {
            lastError = 'unsupported_format';
            continue;
          }
          const layers = this.parseLayerCatalogXml(fetched.text, 'WMS');
          const parsed = await this.parseCapabilitiesXml(fetched.text);
          parsed.srs.forEach((item) => supportedSrs.add(item));
          const formats = this.extractFormats(fetched.text);
          formats.forEach((item) => supportedFormats.add(item));
          bestWms = {
            url: this.stripGetCapabilities(capsUrl),
            capsUrl,
            version,
            layers,
            formats
          };
          metadata.service = 'WMS';
          metadata.title = parsed.serviceTitle;
          metadata.version = version;
          break;
        }
        if (bestWms) break;
      }
      if (bestWms) break;
    }

    for (const baseUrl of baseUrls) {
      for (const path of COMMON_WFS_PATHS) {
        const capsUrl = this.buildGetCapabilitiesUrl(baseUrl, path, 'WFS', WFS_VERSION);
        testedUrls.push(capsUrl);
        const fetched = await this.safeFetchText(capsUrl);
        if (!fetched) continue;
        if (fetched.status === 401 || fetched.status === 403 || this.looksProtected(fetched.text)) {
          lastError = this.classifyHttpError(fetched.status, fetched.text);
          continue;
        }
        if (!this.looksLikeCapabilitiesXml(fetched.text)) {
          lastError = 'unsupported_format';
          continue;
        }
        const layers = this.parseLayerCatalogXml(fetched.text, 'WFS');
        const parsed = await this.parseCapabilitiesXml(fetched.text);
        parsed.srs.forEach((item) => supportedSrs.add(item));
        const formats = this.extractFormats(fetched.text);
        formats.forEach((item) => supportedFormats.add(item));
        bestWfs = { url: this.stripGetCapabilities(capsUrl), capsUrl, layers, formats };
        metadata.wfs_title = parsed.serviceTitle;
        break;
      }
      if (bestWfs) break;
    }

    const mergedLayers = this.mergeLayers(bestWms?.layers ?? [], bestWfs?.layers ?? []);
    mergedLayers.forEach((layer) => (layer.srs ?? layer.crs ?? []).forEach((item) => supportedSrs.add(item)));

    return {
      status: this.classifyOgcStatus(bestWms, bestWfs, lastError),
      base_url: bestWms?.url ? this.extractBaseUrl(bestWms.url) : bestWfs?.url ? this.extractBaseUrl(bestWfs.url) : baseUrls[0] ?? null,
      wms_url: bestWms?.url ?? null,
      wms_get_capabilities_url: bestWms?.capsUrl ?? null,
      wms_version: bestWms?.version ?? null,
      wfs_url: bestWfs?.url ?? null,
      wfs_get_capabilities_url: bestWfs?.capsUrl ?? null,
      available_layers: mergedLayers,
      supported_srs: [...supportedSrs].sort(),
      supported_formats: [...supportedFormats].sort(),
      metadata,
      last_error: lastError,
      tested_urls: testedUrls.slice(0, 120),
      discovered_at: discoveredAt.toISOString(),
      refresh_after: refreshAfter.toISOString()
    };
  }

  async catalog(sourceId: string, input: { endpoint?: string; service?: 'WMS' | 'WFS' } = {}): Promise<OgcLayerCatalog> {
    const source = this.discovery.getSource(sourceId);
    const service = input.service ?? (input.endpoint?.toLocaleUpperCase('tr-TR').includes('WFS') ? 'WFS' : 'WMS');
    const endpoint = input.endpoint ?? this.discovery.buildCandidateEndpoints(source).find((candidate) => /getcapabilities|wms|wfs|geoserver|ows/i.test(candidate));
    if (!endpoint) return { sourceId, service, generatedAt: new Date().toISOString(), layers: [], status: 'unavailable', provenance: [] };
    const url = /request=getcapabilities/i.test(endpoint) ? endpoint : this.buildGetCapabilitiesUrl(source.homepageUrl, endpoint, service);
    const fetched = await this.safeFetchText(url);
    if (!fetched) return { sourceId, endpoint: url, service, generatedAt: new Date().toISOString(), layers: [], status: 'unavailable', provenance: [] };
    const provenance = [provenanceRecord({ sourceId: source.id, sourceName: source.name, endpoint: url, dataType: 'public_metadata', connectorKind: ConnectorKind.Ogc, status: 'capabilities_fetched', confidence: 0.7, responseBody: fetched.text })];
    if (this.looksProtected(fetched.text) || fetched.status === 401 || fetched.status === 403) return { sourceId, endpoint: url, service, generatedAt: new Date().toISOString(), layers: [], status: 'protected', provenance };
    try {
      const parsed = this.parser.parse(fetched.text);
      const layers = service === 'WFS' ? this.extractWfsLayers(parsed) : this.extractWmsLayers(parsed);
      return { sourceId, endpoint: url, service, generatedAt: new Date().toISOString(), layers, status: layers.length ? 'ok' : 'unsupported_format', provenance };
    } catch {
      return { sourceId, endpoint: url, service, generatedAt: new Date().toISOString(), layers: [], status: 'unsupported_format', provenance };
    }
  }

  async parseCapabilitiesXml(xml: string): Promise<{ serviceTitle?: string; srs: string[]; raw: unknown }> {
    const parsed = this.parser.parse(xml);
    return {
      serviceTitle: this.findFirst(parsed, ['Title', 'ows:Title']),
      srs: this.extractSrs(parsed),
      raw: parsed
    };
  }

  parseLayerCatalogXml(xml: string, service: 'WMS' | 'WFS' = 'WMS') {
    const parsed = this.parser.parse(xml);
    return service === 'WFS' ? this.extractWfsLayers(parsed) : this.extractWmsLayers(parsed);
  }

  extractSrs(input: unknown): string[] {
    const out = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (['SRS', 'CRS', 'DefaultCRS', 'OtherCRS', 'ows:SupportedCRS'].includes(key)) {
          const values = Array.isArray(child) ? child : [child];
          for (const item of values) {
            if (typeof item !== 'string') continue;
            for (const token of item.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean)) out.add(token);
          }
        } else {
          visit(child);
        }
      }
    };
    visit(input);
    return [...out];
  }

  private extractWmsLayers(parsed: unknown): OgcLayerCatalog['layers'] {
    const layers: OgcLayerCatalog['layers'] = [];
    this.visit(parsed, (key, value) => {
      if (key !== 'Layer' || !value) return;
      const entries = Array.isArray(value) ? value : [value];
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue;
        const layer = entry as Record<string, unknown>;
        if (typeof layer.Name !== 'string' && typeof layer.Title !== 'string') continue;
        layers.push({
          name: typeof layer.Name === 'string' ? layer.Name : undefined,
          title: typeof layer.Title === 'string' ? layer.Title : undefined,
          crs: this.extractSrs(layer),
          srs: this.extractSrs(layer),
          bbox: layer.BoundingBox ?? layer.EX_GeographicBoundingBox ?? layer.LatLonBoundingBox,
          queryable: layer['@_queryable'] === '1' || layer['@_queryable'] === 1 || layer['@_queryable'] === true,
          abstract: typeof layer.Abstract === 'string' ? layer.Abstract : undefined
        });
      }
    });
    return this.uniqueLayers(layers);
  }

  private extractWfsLayers(parsed: unknown): OgcLayerCatalog['layers'] {
    const layers: OgcLayerCatalog['layers'] = [];
    this.visit(parsed, (key, value) => {
      if (!['FeatureType', 'wfs:FeatureType'].includes(key) || !value) return;
      const entries = Array.isArray(value) ? value : [value];
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue;
        const layer = entry as Record<string, unknown>;
        layers.push({
          name: this.stringValue(layer.Name ?? layer['wfs:Name']),
          title: this.stringValue(layer.Title ?? layer['wfs:Title']),
          crs: this.extractSrs(layer),
          srs: this.extractSrs(layer),
          bbox: layer.WGS84BoundingBox ?? layer['ows:WGS84BoundingBox'] ?? layer.LatLongBoundingBox,
          queryable: true,
          abstract: this.stringValue(layer.Abstract ?? layer['ows:Abstract'])
        });
      }
    });
    return this.uniqueLayers(layers);
  }

  private uniqueLayers(layers: OgcLayerCatalog['layers']): OgcLayerCatalog['layers'] {
    const seen = new Set<string>();
    return layers.filter((layer) => {
      const key = `${layer.name ?? ''}:${layer.title ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private findFirst(input: unknown, names: string[]): string | undefined {
    if (!input || typeof input !== 'object') return undefined;
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (names.includes(key) && typeof value === 'string') return value;
      const nested = this.findFirst(value, names);
      if (nested) return nested;
    }
    return undefined;
  }

  private visit(value: unknown, fn: (key: string, value: unknown) => void): void {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      fn(key, child);
      if (Array.isArray(child)) child.forEach((item) => this.visit(item, fn));
      else this.visit(child, fn);
    }
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private async safeFetchText(endpoint: string, timeoutMs = 8000): Promise<{ text: string; status: number } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'e-imarapp-ogc-discovery/0.1 (+https://github.com/emintermux1/e-imarapp)', Accept: 'application/xml,text/xml,text/html,*/*;q=0.8' }
      });
      const text = await response.text();
      if (response.status === 401 || response.status === 403 || this.looksProtected(text)) return { text, status: response.status };
      if (!response.ok) return null;
      return { text, status: response.status };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private looksProtected(text: string): boolean {
    return /(captcha|recaptcha|g-recaptcha|login|giriş|oturum|unauthorized|forbidden)/iu.test(text);
  }

  private looksLikeCapabilitiesXml(xml: string): boolean {
    const sample = xml.slice(0, 5120).toLowerCase();
    return /wms_capabilities|wmt_ms_capabilities|wfs_capabilities|service|capability|featuretypelist/.test(sample);
  }

  private extractBaseUrl(candidate: string): string | null {
    try {
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return `${parsed.protocol}//${parsed.host}/`;
    } catch {
      return null;
    }
  }

  private stripGetCapabilities(url: string): string {
    const parsed = new URL(url);
    ['request', 'service', 'version'].forEach((key) => parsed.searchParams.delete(key));
    parsed.search = parsed.searchParams.toString();
    return parsed.toString();
  }

  private classifyHttpError(status: number, text: string): string {
    if (status === 429) return 'rate_limited';
    if (/captcha|recaptcha/i.test(text)) return 'captcha_required';
    if (/login|signin|giriş|oturum|yetki|unauthorized|forbidden/i.test(text)) return 'requires_credentials';
    return 'unavailable';
  }

  private classifyOgcStatus(
    wms: { url: string } | null,
    wfs: { url: string } | null,
    lastError: string | null
  ): MunicipalOgcDiscoveryResult['status'] {
    if (wms || wfs) return 'available';
    if (lastError === 'captcha_required' || lastError === 'rate_limited' || lastError === 'requires_credentials') return lastError;
    if (lastError === 'unsupported_format') return 'unsupported_format';
    if (lastError === 'unavailable') return 'unavailable';
    return 'endpoint_changed';
  }

  private mergeLayers(wmsLayers: OgcLayerCatalog['layers'], wfsLayers: OgcLayerCatalog['layers']): OgcLayerCatalog['layers'] {
    const merged = new Map<string, OgcLayerCatalog['layers'][number] & { sources?: string[] }>();
    for (const layer of [...wmsLayers, ...wfsLayers]) {
      const key = `${layer.name ?? ''}:${layer.title ?? ''}`;
      const existing = merged.get(key) ?? { ...layer, sources: [] };
      if (layer.title && !existing.title) existing.title = layer.title;
      if (layer.name && !existing.name) existing.name = layer.name;
      existing.sources = [...new Set([...(existing.sources ?? []), wmsLayers.includes(layer) ? 'WMS' : 'WFS'])];
      merged.set(key, existing);
    }
    return [...merged.values()];
  }

  private extractFormats(xml: string): string[] {
    const formats = new Set<string>();
  for (const match of xml.matchAll(/<(?:[\w:]+:)?Format>([^<]+)<\/(?:[\w:]+:)?Format>/gi)) {
      const value = match[1]?.trim();
      if (value) formats.add(value);
    }
    return [...formats];
  }
}
