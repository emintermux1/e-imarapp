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

@Injectable()
export class OgcDiscoveryService {
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  constructor(
    private readonly db: DatabaseService,
    private readonly discovery: DiscoveryService,
    private readonly probe: HttpProbeService
  ) {}

  buildGetCapabilitiesUrl(base: string, path: string, service = 'WMS'): string {
    const absolute = new URL(path, base).toString();
    const delimiter = absolute.includes('?') ? '&' : '?';
    return `${absolute}${delimiter}request=GetCapabilities&service=${service}`;
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

  private async safeFetchText(endpoint: string): Promise<{ text: string; status: number } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(endpoint, { redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'e-imarapp-ogc-discovery/0.1', Accept: 'application/xml,text/xml,text/html,*/*;q=0.8' } });
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
}
