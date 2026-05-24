import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import http from 'node:http';
import https from 'node:https';
import { URLSearchParams } from 'node:url';
import { DatabaseService } from '../database/database.service';
import { MunicipalOgcDiscoveryResult, OgcDiscoveryService } from './ogc-discovery.service';
import {
  findMunicipalRegistryEntry,
  MunicipalRegistryEntry,
  MunicipalStatus,
  MUNICIPAL_REGISTRY
} from '../sources/municipal-registry';

export type ConnectorMethod = 'soap' | 'wms' | 'netgis' | 'html' | 'unknown';
export type ConnectorCapabilityStatus = 'available' | 'captcha_required' | 'requires_credentials' | 'unavailable';

export interface ConnectorCapability {
  municipalityId: string;
  method: ConnectorMethod;
  endpoints: string[];
  status: ConnectorCapabilityStatus;
  discoveredAt: Date;
  ogc?: MunicipalOgcDiscoveryResult;
}

export interface KeosParcelQueryInput {
  municipalityId: string;
  ada?: string;
  parsel?: string;
  lng?: number;
  lat?: number;
  bbox?: [number, number, number, number];
}

export interface KeosParcelQueryResult {
  status: ConnectorCapabilityStatus | 'not_supported';
  municipalityId: string;
  method: ConnectorMethod;
  endpoint?: string;
  sourceUrl: string;
  ada?: string;
  parsel?: string;
  imarDurumu?: string;
  planNotu?: string;
  raw?: unknown;
  message?: string;
  cached?: boolean;
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

type TextResponse = {
  url: string;
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
};

const TIMEOUT_MS = 8000;
const USER_AGENT = 'e-imarapp-keos-connector/0.1 (+public discovery; no captcha bypass)';
const SOAP_ACTIONS = ['GetParcelInfo', 'ParselSorgu'];

@Injectable()
export class KeosConnector {
  private readonly capabilityCache = new Map<string, ConnectorCapability>();

  constructor(
    private readonly database?: DatabaseService,
    private readonly ogc?: OgcDiscoveryService
  ) {}

  async discover(municipality: string | MunicipalRegistryEntry): Promise<ConnectorCapability> {
    const entry = typeof municipality === 'string' ? findMunicipalRegistryEntry(municipality) : municipality;
    if (!entry) return this.capability(municipality.toString(), 'unknown', [], 'unavailable');

    const candidates = [
      { method: 'soap' as const, url: this.endpoint(entry, 'Default.asmx?WSDL'), accepts: (response: TextResponse) => this.looksLikeSoap(response) },
      { method: 'wms' as const, url: this.endpoint(entry, '?SERVICE=WMS&REQUEST=GetCapabilities'), accepts: (response: TextResponse) => this.looksLikeWms(response) },
      { method: 'netgis' as const, url: this.endpoint(entry, 'js/config.js'), accepts: (response: TextResponse) => this.looksLikeNetgis(response) },
      { method: 'html' as const, url: this.endpoint(entry, ''), accepts: (response: TextResponse) => this.looksLikeHtmlForm(response) }
    ];

    const endpoints: string[] = [];
    for (const candidate of candidates) {
      try {
        const response = await this.fetchText(candidate.url);
        endpoints.push(response.url);
        const protectedStatus = this.protectedStatus(response.status, response.text);
        if (protectedStatus) {
          const capability = this.capability(entry.id, candidate.method, endpoints, protectedStatus);
          this.capabilityCache.set(entry.id, capability);
          return capability;
        }
        if (response.status >= 200 && response.status < 400 && candidate.accepts(response)) {
          const capability = this.capability(entry.id, candidate.method, endpoints, 'available');
          const ogc = candidate.method === 'wms' ? await this.resolveOgc(entry) : undefined;
          if (ogc) capability.ogc = ogc;
          this.capabilityCache.set(entry.id, capability);
          return capability;
        }
      } catch {
        endpoints.push(candidate.url);
      }
    }

    const capability = this.capability(entry.id, 'unknown', endpoints, 'unavailable');
    const ogc = await this.resolveOgc(entry);
    if (ogc?.status === 'available') {
      capability.method = 'wms';
      capability.status = 'available';
      capability.endpoints = [...new Set([...(ogc.wms_url ? [ogc.wms_url] : []), ...(ogc.wfs_url ? [ogc.wfs_url] : []), ...endpoints])];
      capability.ogc = ogc;
    }
    this.capabilityCache.set(entry.id, capability);
    return capability;
  }

  async queryParcel(input: KeosParcelQueryInput): Promise<KeosParcelQueryResult> {
    const entry = findMunicipalRegistryEntry(input.municipalityId);
    if (!entry) {
      return {
        status: 'unavailable',
        municipalityId: input.municipalityId,
        method: 'unknown',
        sourceUrl: '',
        message: 'Belediye registry içinde bulunamadı.'
      };
    }

    const cached = this.capabilityCache.get(entry.id);
    const capability = cached ?? await this.discover(entry);
    if (capability.status !== 'available') {
      return {
        status: capability.status,
        municipalityId: entry.id,
        method: capability.method,
        endpoint: capability.endpoints[0],
        sourceUrl: entry.baseUrl,
        ada: input.ada,
        parsel: input.parsel,
        cached: Boolean(cached),
        message: capability.status === 'captcha_required'
          ? 'Bu belediye captcha/güvenlik kontrolü gerektiriyor; otomatik sorgu durduruldu.'
          : capability.status === 'requires_credentials'
            ? 'Bu belediye kimlik doğrulama gerektiriyor; onaylı erişim olmadan sorgu yapılmadı.'
            : 'Bu belediyeden canlı veri alınamıyor.'
      };
    }

    if (capability.method === 'soap') return this.querySoap(entry, input, capability, Boolean(cached));
    if (capability.method === 'wms') return this.queryWms(entry, input, capability, Boolean(cached));
    if (capability.method === 'html') return this.queryHtml(entry, input, capability, Boolean(cached));

    return {
      status: 'not_supported',
      municipalityId: entry.id,
      method: capability.method,
      endpoint: capability.endpoints[0],
      sourceUrl: entry.baseUrl,
      ada: input.ada,
      parsel: input.parsel,
      cached: Boolean(cached),
      message: 'Keşfedilen NetGIS/config endpoint için güvenli ada-parsel çağrı kontratı henüz doğrulanmadı.'
    };
  }

  cachedCapability(municipalityId: string): ConnectorCapability | undefined {
    return this.capabilityCache.get(municipalityId);
  }

  registry() {
    return MUNICIPAL_REGISTRY;
  }

  private async querySoap(entry: MunicipalRegistryEntry, input: KeosParcelQueryInput, capability: ConnectorCapability, cached: boolean): Promise<KeosParcelQueryResult> {
    if (!input.ada || !input.parsel) return this.invalidParcelInput(entry, capability, cached);
    const endpoint = this.endpoint(entry, 'Default.asmx');
    for (const action of SOAP_ACTIONS) {
      try {
        const response = await this.fetchText(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: action
          },
          body: this.soapEnvelope(action, input.ada, input.parsel)
        });
        const protectedStatus = this.protectedStatus(response.status, response.text);
        if (protectedStatus) return this.blockedParcelResult(entry, input, capability.method, endpoint, protectedStatus, cached);
        if (response.status >= 200 && response.status < 400) {
          const parsed = this.parseParcelResponse(response.text, input.ada, input.parsel);
          await this.persistParcelIfGeometry(entry, endpoint, parsed.raw);
          return {
            status: 'available',
            municipalityId: entry.id,
            method: 'soap',
            endpoint,
            sourceUrl: endpoint,
            ada: parsed.ada ?? input.ada,
            parsel: parsed.parsel ?? input.parsel,
            imarDurumu: parsed.imarDurumu,
            planNotu: parsed.planNotu,
            raw: parsed.raw,
            cached
          };
        }
      } catch {}
    }
    return {
      status: 'unavailable',
      municipalityId: entry.id,
      method: 'soap',
      endpoint,
      sourceUrl: endpoint,
      ada: input.ada,
      parsel: input.parsel,
      cached,
      message: 'SOAP ada/parsel çağrısı başarısız oldu.'
    };
  }

  private async queryWms(entry: MunicipalRegistryEntry, input: KeosParcelQueryInput, capability: ConnectorCapability, cached: boolean): Promise<KeosParcelQueryResult> {
    const bbox = input.bbox ?? this.featureInfoBbox(input.lng, input.lat, entry.bbox);
    const ogc = capability.ogc ?? await this.resolveOgc(entry);
    const layerName = this.pickParcelLayer(ogc?.available_layers ?? []);
    const endpoint = this.wmsFeatureInfoUrl(entry, bbox, ogc?.wms_url, layerName);
    try {
      const response = await this.fetchText(endpoint);
      const protectedStatus = this.protectedStatus(response.status, response.text);
      if (protectedStatus) return this.blockedParcelResult(entry, input, capability.method, endpoint, protectedStatus, cached);
      if (response.status >= 200 && response.status < 400) {
        const parsed = this.parseParcelResponse(response.text, input.ada, input.parsel);
        await this.persistParcelIfGeometry(entry, endpoint, parsed.raw);
        return {
          status: 'available',
          municipalityId: entry.id,
          method: 'wms',
          endpoint,
          sourceUrl: endpoint,
          ada: parsed.ada ?? input.ada,
          parsel: parsed.parsel ?? input.parsel,
          imarDurumu: parsed.imarDurumu,
          planNotu: parsed.planNotu,
          raw: parsed.raw,
          cached
        };
      }
    } catch {}
    return {
      status: 'unavailable',
      municipalityId: entry.id,
      method: 'wms',
      endpoint,
      sourceUrl: endpoint,
      ada: input.ada,
      parsel: input.parsel,
      cached,
      message: 'WMS GetFeatureInfo çağrısı başarısız oldu.'
    };
  }

  private async queryHtml(entry: MunicipalRegistryEntry, input: KeosParcelQueryInput, capability: ConnectorCapability, cached: boolean): Promise<KeosParcelQueryResult> {
    if (!input.ada || !input.parsel) return this.invalidParcelInput(entry, capability, cached);
    const pageEndpoint = this.endpoint(entry, '');
    const postEndpoint = this.endpoint(entry, 'Default.aspx');
    try {
      const page = await this.fetchText(pageEndpoint);
      const protectedStatus = this.protectedStatus(page.status, page.text);
      if (protectedStatus) return this.blockedParcelResult(entry, input, capability.method, pageEndpoint, protectedStatus, cached);
      const fields = this.hiddenFields(page.text);
      fields.set(this.findFieldName(fields, 'ada'), input.ada);
      fields.set(this.findFieldName(fields, 'parsel'), input.parsel);
      const response = await this.fetchText(postEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: fields.toString()
      });
      const blocked = this.protectedStatus(response.status, response.text);
      if (blocked) return this.blockedParcelResult(entry, input, capability.method, postEndpoint, blocked, cached);
      if (response.status >= 200 && response.status < 400) {
        const parsed = this.parseParcelResponse(response.text, input.ada, input.parsel);
        return {
          status: 'available',
          municipalityId: entry.id,
          method: 'html',
          endpoint: postEndpoint,
          sourceUrl: postEndpoint,
          ada: parsed.ada ?? input.ada,
          parsel: parsed.parsel ?? input.parsel,
          imarDurumu: parsed.imarDurumu,
          planNotu: parsed.planNotu,
          raw: parsed.raw,
          cached
        };
      }
    } catch {}
    return {
      status: 'unavailable',
      municipalityId: entry.id,
      method: 'html',
      endpoint: postEndpoint,
      sourceUrl: postEndpoint,
      ada: input.ada,
      parsel: input.parsel,
      cached,
      message: 'HTML form ada/parsel sorgusu başarısız oldu.'
    };
  }

  private endpoint(entry: MunicipalRegistryEntry, path: string): string {
    const base = new URL(entry.queryPath.replace(/^\/?/, '/'), entry.baseUrl);
    return new URL(path, base).toString();
  }

  private capability(municipalityId: string, method: ConnectorMethod, endpoints: string[], status: ConnectorCapabilityStatus): ConnectorCapability {
    return { municipalityId, method, endpoints: [...new Set(endpoints)], status, discoveredAt: new Date() };
  }

  private looksLikeSoap(response: TextResponse): boolean {
    const text = response.text.slice(0, 20000).toLowerCase();
    return /<\?xml|<wsdl:definitions|<definitions|soap|webservice|web service/.test(text) && /operation|soapaction|parsel|imar|ada|getparcelinfo/i.test(response.text);
  }

  private looksLikeWms(response: TextResponse): boolean {
    const text = response.text.slice(0, 20000).toLowerCase();
    return /wms_capabilities|wmt_ms_capabilities|serviceexceptionreport|getmap|getfeatureinfo|<layer/.test(text);
  }

  private looksLikeNetgis(response: TextResponse): boolean {
    return /netgis|keos|workspace|mapservice|layers|imardurumu|geoserver|wms/i.test(response.text);
  }

  private looksLikeHtmlForm(response: TextResponse): boolean {
    const text = response.text.toLowerCase();
    return /<html|<form/.test(text) && (/__viewstate|ada|parsel|imar|g-recaptcha|captcha/.test(text));
  }

  private protectedStatus(status: number, text: string): ConnectorCapabilityStatus | null {
    const normalized = text.toLocaleLowerCase('tr-TR');
    if (status === 403 || /captcha|recaptcha|hcaptcha|güvenlik kodu|guvenlik kodu|bot kontrol/.test(normalized)) return 'captcha_required';
    if (status === 401 || /login|signin|oturum aç|oturum ac|giriş|giris|unauthorized|forbidden|yetkisiz/.test(normalized)) return 'requires_credentials';
    return null;
  }

  private soapEnvelope(action: string, ada: string, parsel: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="http://tempuri.org/">
      <ada>${this.xmlEscape(ada)}</ada>
      <parsel>${this.xmlEscape(parsel)}</parsel>
    </${action}>
  </soap:Body>
</soap:Envelope>`;
  }

  private wmsFeatureInfoUrl(entry: MunicipalRegistryEntry, bbox: [number, number, number, number], wmsUrl?: string | null, layerName?: string): string {
    const layer = layerName ?? 'parsel';
    const base = wmsUrl ? new URL(wmsUrl) : new URL('/geoserver/wms', entry.baseUrl);
    base.searchParams.set('SERVICE', 'WMS');
    base.searchParams.set('VERSION', '1.1.1');
    base.searchParams.set('REQUEST', 'GetFeatureInfo');
    base.searchParams.set('LAYERS', layer);
    base.searchParams.set('QUERY_LAYERS', layer);
    base.searchParams.set('INFO_FORMAT', 'application/json');
    base.searchParams.set('SRS', 'EPSG:4326');
    base.searchParams.set('BBOX', bbox.join(','));
    base.searchParams.set('WIDTH', '256');
    base.searchParams.set('HEIGHT', '256');
    base.searchParams.set('X', '128');
    base.searchParams.set('Y', '128');
    base.searchParams.set('I', '128');
    base.searchParams.set('J', '128');
    return base.toString();
  }

  private async resolveOgc(entry: MunicipalRegistryEntry): Promise<MunicipalOgcDiscoveryResult | undefined> {
    if (!this.ogc) return undefined;
    const seeds = [entry.baseUrl, this.endpoint(entry, '')];
    return this.ogc.discoverMunicipalEndpoints(seeds);
  }

  private pickParcelLayer(layers: Array<{ name?: string; title?: string }>): string | undefined {
    const hints = ['parsel', 'pars_el', 'parcel', 'ada', 'imar_durumu', 'imar'];
    for (const hint of hints) {
      const match = layers.find((layer) => {
        const haystack = `${layer.name ?? ''} ${layer.title ?? ''}`.toLocaleLowerCase('tr-TR');
        return haystack.includes(hint);
      });
      if (match?.name) return match.name;
    }
    return layers.find((layer) => layer.name)?.name;
  }

  private featureInfoBbox(lng: number | undefined, lat: number | undefined, fallback: [number, number, number, number]): [number, number, number, number] {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return fallback;
    const delta = 0.0008;
    return [Number(lng) - delta, Number(lat) - delta, Number(lng) + delta, Number(lat) + delta];
  }

  private hiddenFields(html: string): URLSearchParams {
    const $ = cheerio.load(html);
    const params = new URLSearchParams();
    $('input').each((_index, element) => {
      const name = $(element).attr('name');
      if (!name) return;
      const type = ($(element).attr('type') ?? '').toLowerCase();
      if (type === 'hidden' || /^__/.test(name) || /viewstate|eventvalidation/i.test(name)) {
        params.set(name, $(element).attr('value') ?? '');
      }
    });
    return params;
  }

  private findFieldName(fields: URLSearchParams, target: 'ada' | 'parsel'): string {
    for (const key of fields.keys()) {
      if (key.toLocaleLowerCase('tr-TR').includes(target)) return key;
    }
    return target;
  }

  private parseParcelResponse(text: string, ada?: string, parsel?: string): { ada?: string; parsel?: string; imarDurumu?: string; planNotu?: string; raw: unknown } {
    const raw = this.tryParseJson(text) ?? this.compactText(text);
    const haystack = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return {
      ada: this.pickField(raw, ['ada', 'Ada']) ?? ada,
      parsel: this.pickField(raw, ['parsel', 'Parsel', 'parselNo', 'ParselNo']) ?? parsel,
      imarDurumu: this.pickField(raw, ['imarDurumu', 'imar_durumu', 'kullanim', 'fonksiyon', 'lejant', 'planFonksiyonu']) ?? this.regexValue(haystack, /(imar durumu|fonksiyon|kullanım|kullanim|lejant)\s*[:=]\s*([^<>\n\r;]+)/iu),
      planNotu: this.pickField(raw, ['planNotu', 'plan_notu', 'not', 'notes']) ?? this.regexValue(haystack, /(plan notu|plan notları|plan notlari)\s*[:=]\s*([^<>\n\r]+)/iu),
      raw
    };
  }

  private pickField(raw: unknown, keys: string[]): string | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const stack = [raw as Record<string, unknown>];
    while (stack.length) {
      const item = stack.pop();
      if (!item) continue;
      for (const [key, value] of Object.entries(item)) {
        if (keys.some((candidate) => candidate.toLocaleLowerCase('tr-TR') === key.toLocaleLowerCase('tr-TR')) && typeof value === 'string' && value.trim()) return value.trim();
        if (value && typeof value === 'object') {
          if (Array.isArray(value)) value.filter((child) => child && typeof child === 'object').forEach((child) => stack.push(child as Record<string, unknown>));
          else stack.push(value as Record<string, unknown>);
        }
      }
    }
    return undefined;
  }

  private regexValue(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    return match?.[2]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  }

  private tryParseJson(text: string): unknown | null {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private compactText(text: string): string {
    return text.replace(/<script\b[^]*?<\/script>/giu, ' ').replace(/<style\b[^]*?<\/style>/giu, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
  }

  private invalidParcelInput(entry: MunicipalRegistryEntry, capability: ConnectorCapability, cached: boolean): KeosParcelQueryResult {
    return {
      status: 'not_supported',
      municipalityId: entry.id,
      method: capability.method,
      endpoint: capability.endpoints[0],
      sourceUrl: entry.baseUrl,
      cached,
      message: 'Ada/parsel sorgusu için ada ve parsel değerleri gereklidir.'
    };
  }

  private blockedParcelResult(entry: MunicipalRegistryEntry, input: KeosParcelQueryInput, method: ConnectorMethod, endpoint: string, status: ConnectorCapabilityStatus, cached: boolean): KeosParcelQueryResult {
    return {
      status,
      municipalityId: entry.id,
      method,
      endpoint,
      sourceUrl: endpoint,
      ada: input.ada,
      parsel: input.parsel,
      cached,
      message: status === 'captcha_required' ? 'Captcha tespit edildi; bypass denenmedi.' : 'Kimlik doğrulama gerektiren akış durduruldu.'
    };
  }

  private async persistParcelIfGeometry(entry: MunicipalRegistryEntry, endpoint: string, raw: unknown): Promise<void> {
    if (!this.database?.isConfigured()) return;
    const features = this.geoJsonFeatures(raw);
    if (!features.length) return;
    for (const feature of features.slice(0, 5)) {
      const geometry = feature.geometry;
      if (!geometry) continue;
      const properties = feature.properties ?? {};
      const ada = this.stringProp(properties, ['ada', 'Ada']);
      const parsel = this.stringProp(properties, ['parsel', 'Parsel', 'parselNo', 'ParselNo']);
      await this.database.query(
        `insert into parcels (source_id, ada, parsel_no, external_id, geom, attributes, source_fetched_at)
         values ($1, $2, $3, $4, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)), $6::jsonb, now())
         on conflict do nothing`,
        [entry.id, ada, parsel, this.stringProp(properties, ['id', 'objectid', 'OBJECTID']), JSON.stringify(geometry), JSON.stringify({ ...properties, source_url: endpoint })]
      );
    }
  }

  private geoJsonFeatures(raw: unknown): Array<{ geometry?: unknown; properties?: Record<string, unknown> }> {
    if (!raw || typeof raw !== 'object') return [];
    const record = raw as { type?: string; features?: unknown; geometry?: unknown; properties?: unknown };
    if (record.type === 'FeatureCollection' && Array.isArray(record.features)) return record.features.filter((item): item is { geometry?: unknown; properties?: Record<string, unknown> } => Boolean(item && typeof item === 'object'));
    if (record.type === 'Feature') return [record as { geometry?: unknown; properties?: Record<string, unknown> }];
    return [];
  }

  private stringProp(properties: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = properties[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return null;
  }

  private async fetchText(endpoint: string, options: RequestOptions = {}, redirects = 0): Promise<TextResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const transport = url.protocol === 'https:' ? https : http;
      const body = options.body;
      const headers = {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xml,text/xml,application/json,application/javascript,text/javascript,*/*;q=0.8',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...options.headers
      };
      const request = transport.request(
        url,
        {
          method: options.method ?? 'GET',
          headers,
          timeout: options.timeoutMs ?? TIMEOUT_MS,
          rejectUnauthorized: false
        } as https.RequestOptions,
        (response) => {
          const status = response.statusCode ?? 0;
          const location = response.headers.location;
          if ([301, 302, 303, 307, 308].includes(status) && location && redirects < 3) {
            response.resume();
            resolve(this.fetchText(new URL(Array.isArray(location) ? location[0] : location, url).toString(), options, redirects + 1));
            return;
          }
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => {
            if (Buffer.concat(chunks).byteLength < 512_000) chunks.push(chunk);
          });
          response.on('end', () => resolve({ url: endpoint, status, headers: response.headers, text: Buffer.concat(chunks).toString('utf8') }));
        }
      );
      request.on('timeout', () => request.destroy(new Error('Request timed out.')));
      request.on('error', reject);
      if (body) request.write(body);
      request.end();
    });
  }

  private xmlEscape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}
