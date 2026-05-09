import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { provenanceRecord, ProvenanceRecord } from '../common/provenance';
import { ConnectorKind, DiscoveredEndpoint, ProbeResult, ProbeStatus } from './connector.types';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

const REFERENCE_PATTERN = /["'`(=]\s*([^"'`)\s]*(?:\.ashx|\.asmx|NetGIS[^"'`)\s]*|arcgis\/rest[^"'`)\s]*|geoserver[^"'`)\s]*|GetCapabilities[^"'`)\s]*))/gi;
const TARGET_METHODS = ['AdaParselSorgu', 'GetImarDurumu', 'GetParsel', 'GetPlanInfo', 'ImarDurumu', 'ParselSorgu'];
const PARAM_NAMES = ['ada', 'parsel', 'mahalle', 'ilce', 'belediye', 'x', 'y'];

export interface MethodResolverResult {
  sourceId: string;
  endpoint?: string;
  generatedAt: string;
  methods: string[];
  candidateMethods: string[];
  payloadHints: Array<{ kind: 'method' | 'action' | 'query_param' | 'json' | 'form'; value: string; snippet?: string }>;
  status: 'method_contract_required' | 'candidate_methods_found' | 'unsupported_format' | 'protected' | 'unavailable';
  provenance: ProvenanceRecord[];
}

@Injectable()
export class NetcadKeosService {
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly probe: HttpProbeService
  ) {}

  strategy() {
    return {
      connector: ConnectorKind.NetcadKeos,
      flow: [
        'Fetch the public imar page.',
        'Extract same-origin JavaScript and service references.',
        'For ASMX endpoints, inspect ?WSDL and method pages before calling methods.',
        'Probe discovered and common candidates without bypassing login, captcha, or session controls.',
        'Persist only verified endpoint metadata and provenance before real ingestion.'
      ],
      guardrails: [
        'Do not invent parcel, zoning, or plan responses.',
        'Do not bypass captcha, login, rate-limit, or legal approval requirements.',
        'Treat ASMX method calls as unsupported until WSDL/method contract is inspected.'
      ]
    };
  }

  async discover(sourceId: string): Promise<{ sourceId: string; endpoints: DiscoveredEndpoint[]; generatedAt: string; nextAction: string }> {
    const source = this.discovery.getSource(sourceId);
    const homepage = new URL(source.homepageUrl);
    const provenance = new Map<string, DiscoveredEndpoint['provenance']>();

    this.add(provenance, source.homepageUrl, 'source_homepage');
    for (const endpoint of this.discovery.buildCandidateEndpoints(source)) this.add(provenance, endpoint, 'common_candidate');

    const page = await this.safeFetchText(source.homepageUrl);
    if (page) {
      const htmlRefs = this.extractServiceReferences(page.text, source.homepageUrl, homepage.origin);
      for (const ref of htmlRefs) this.add(provenance, ref, 'html');
      const scripts = this.extractSameOriginScripts(page.text, source.homepageUrl, homepage.origin);
      for (const script of scripts.slice(0, 12)) {
        const js = await this.safeFetchText(script);
        if (!js) continue;
        for (const ref of this.extractServiceReferences(js.text, script, homepage.origin)) this.add(provenance, ref, 'javascript');
      }
    }

    for (const endpoint of [...provenance.keys()]) {
      if (/\.asmx(?:$|[?#])/i.test(endpoint)) this.add(provenance, this.withWsdl(endpoint), 'wsdl_candidate');
    }

    const endpoints: DiscoveredEndpoint[] = [];
    for (const [endpoint, sourceProvenance] of provenance) {
      const probe = await this.probe.probe(endpoint);
      endpoints.push({ endpoint, probe, provenance: sourceProvenance, nextAction: this.nextAction(endpoint, probe) });
    }

    return {
      sourceId,
      endpoints,
      generatedAt: new Date().toISOString(),
      nextAction: endpoints.some((item) => item.probe.status === ProbeStatus.Available)
        ? 'Inspect available endpoint contracts and persist provenance before ingestion.'
        : 'No callable public endpoint confirmed; review source manually or wait for approved access.'
    };
  }

  async resolveMethods(sourceId: string, input: { endpoint?: string } = {}): Promise<MethodResolverResult> {
    const source = this.discovery.getSource(sourceId);
    const candidates = input.endpoint ? [input.endpoint] : this.discovery.buildCandidateEndpoints(source).filter((endpoint) => /\.asmx(?:$|[?#])/i.test(endpoint));
    const provenance: ProvenanceRecord[] = [];
    const methods = new Set<string>();
    const candidateMethods = new Set<string>();
    const payloadHints = new Map<string, MethodResolverResult['payloadHints'][number]>();
    let protectedSeen = false;
    let unavailableSeen = false;
    let unsupportedSeen = false;
    let selectedEndpoint: string | undefined;

    const page = await this.safeFetchText(source.homepageUrl);
    if (page) {
      for (const hint of this.extractPayloadHints(page.text)) payloadHints.set(`${hint.kind}:${hint.value}:${hint.snippet ?? ''}`, hint);
      provenance.push(provenanceRecord({ sourceId: source.id, sourceName: source.name, endpoint: source.homepageUrl, dataType: 'public_metadata', connectorKind: ConnectorKind.NetcadKeos, status: 'homepage_inspected', confidence: 0.4, responseBody: page.text }));
      const origin = new URL(source.homepageUrl).origin;
      for (const script of this.extractSameOriginScripts(page.text, source.homepageUrl, origin).slice(0, 8)) {
        const js = await this.safeFetchText(script);
        if (!js) continue;
        for (const hint of this.extractPayloadHints(js.text)) payloadHints.set(`${hint.kind}:${hint.value}:${hint.snippet ?? ''}`, hint);
        provenance.push(provenanceRecord({ sourceId: source.id, sourceName: source.name, endpoint: script, dataType: 'public_metadata', connectorKind: ConnectorKind.NetcadKeos, status: 'javascript_inspected', confidence: 0.45, responseBody: js.text }));
      }
    }

    for (const endpoint of candidates.slice(0, 8)) {
      const wsdlEndpoint = this.withWsdl(endpoint);
      const fetched = await this.safeFetchText(wsdlEndpoint);
      selectedEndpoint = selectedEndpoint ?? wsdlEndpoint;
      if (!fetched) {
        unavailableSeen = true;
        continue;
      }
      provenance.push(provenanceRecord({ sourceId: source.id, sourceName: source.name, endpoint: wsdlEndpoint, dataType: 'public_metadata', connectorKind: ConnectorKind.NetcadKeos, status: 'wsdl_fetched', confidence: 0.65, responseBody: fetched.text }));
      if (this.looksProtected(fetched.text)) {
        protectedSeen = true;
        continue;
      }
      const parsedMethods = this.extractWsdlMethods(fetched.text);
      if (!parsedMethods.length) {
        unsupportedSeen = true;
        continue;
      }
      parsedMethods.forEach((method) => methods.add(method));
      parsedMethods.filter((method) => this.isCandidateMethod(method)).forEach((method) => candidateMethods.add(method));
    }

    return {
      sourceId,
      endpoint: selectedEndpoint,
      generatedAt: new Date().toISOString(),
      methods: [...methods].sort(),
      candidateMethods: [...candidateMethods].sort(),
      payloadHints: [...payloadHints.values()].slice(0, 50),
      status: candidateMethods.size > 0
        ? 'candidate_methods_found'
        : protectedSeen
          ? 'protected'
          : methods.size > 0
            ? 'method_contract_required'
            : unsupportedSeen
              ? 'unsupported_format'
              : unavailableSeen
                ? 'unavailable'
                : 'method_contract_required',
      provenance
    };
  }

  extractWsdlMethods(xml: string): string[] {
    const names = new Set<string>();
    try {
      const parsed = this.parser.parse(xml);
      this.visit(parsed, (key, value) => {
        if ((key.endsWith('operation') || key === 'operation') && value && typeof value === 'object') {
          const name = (value as Record<string, unknown>)['@_name'];
          if (typeof name === 'string') names.add(name);
        }
      });
    } catch {}
    for (const match of xml.matchAll(/<\s*(?:wsdl:)?operation\b[^>]*\bname=["']([^"']+)["']/gi)) names.add(match[1]);
    return [...names];
  }

  extractPayloadHints(text: string): MethodResolverResult['payloadHints'] {
    const hints: MethodResolverResult['payloadHints'] = [];
    const add = (kind: MethodResolverResult['payloadHints'][number]['kind'], value: string, snippet?: string) => hints.push({ kind, value: this.sanitize(value), snippet: snippet ? this.sanitize(snippet).slice(0, 220) : undefined });
    for (const method of TARGET_METHODS) {
      const regex = new RegExp(`\\b${method}\\b`, 'iu');
      const match = text.match(regex);
      if (match?.[0]) add('method', match[0], this.contextSnippet(text, match.index ?? 0));
    }
    for (const match of text.matchAll(/(?:url|method|action)\s*[:=]\s*["']([^"']{1,120})["']/giu)) add('action', match[1], this.contextSnippet(text, match.index ?? 0));
    for (const param of PARAM_NAMES) {
      const regex = new RegExp(`[?&,{\\s"'](${param})["']?\\s*[:=]`, 'giu');
      for (const match of text.matchAll(regex)) add('query_param', match[1], this.contextSnippet(text, match.index ?? 0));
    }
    for (const match of text.matchAll(/\{[^{}]*(?:ada|parsel|mahalle|ilce|belediye|x|y)[^{}]*\}/giu)) add('json', 'payload_snippet', match[0]);
    for (const match of text.matchAll(/(?:data|body)\s*[:=]\s*([^;\n]{1,220})/giu)) add('form', 'payload_snippet', match[1]);
    return hints.slice(0, 80);
  }

  private extractSameOriginScripts(html: string, pageUrl: string, origin: string): string[] {
    const $ = cheerio.load(html);
    const scripts = new Set<string>();
    $('script[src]').each((_i, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      const url = this.toAbsolute(src, pageUrl);
      if (url && new URL(url).origin === origin) scripts.add(url);
    });
    return [...scripts];
  }

  private extractServiceReferences(text: string, baseUrl: string, origin: string): string[] {
    const refs = new Set<string>();
    for (const match of text.matchAll(REFERENCE_PATTERN)) {
      const raw = match[1]?.replace(/\\\//g, '/').replace(/[;,]+$/, '');
      if (!raw || raw.includes(' ')) continue;
      const absolute = this.toAbsolute(raw, baseUrl);
      if (!absolute) continue;
      const url = new URL(absolute);
      if (url.origin !== origin) continue;
      refs.add(url.toString());
    }
    return [...refs];
  }

  private toAbsolute(raw: string, baseUrl: string): string | null {
    try {
      const cleaned = raw.trim();
      if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('javascript:')) return null;
      return new URL(cleaned, baseUrl).toString();
    } catch {
      return null;
    }
  }

  private add(map: Map<string, DiscoveredEndpoint['provenance']>, endpoint: string, provenance: DiscoveredEndpoint['provenance']): void {
    try {
      const parsed = new URL(endpoint);
      if (!['http:', 'https:'].includes(parsed.protocol)) return;
      if (!map.has(parsed.toString())) map.set(parsed.toString(), provenance);
    } catch {}
  }

  private withWsdl(endpoint: string): string {
    const url = new URL(endpoint);
    url.search = '?WSDL';
    return url.toString();
  }

  private nextAction(endpoint: string, probe: ProbeResult): string {
    if (probe.status === ProbeStatus.CaptchaRequired) return 'Stop automated discovery; captcha is present.';
    if (probe.status === ProbeStatus.RequiresCredentials) return 'Stop and request approved credentials or legal access.';
    if (/\.asmx(?:$|[?#])/i.test(endpoint)) return 'Inspect WSDL and method contract before any method call.';
    if (probe.status === ProbeStatus.Available) return 'Inspect request payloads from public JavaScript before ingestion.';
    if (probe.status === ProbeStatus.MethodContractRequired) return 'Method contract is required before calling this endpoint.';
    return 'Do not ingest from this endpoint until availability and contract are verified.';
  }

  private async safeFetchText(endpoint: string): Promise<{ text: string; status: number } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(endpoint, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'e-imarapp-netcad-discovery/0.1', Accept: 'text/html,application/xml,text/xml,application/javascript,text/javascript,*/*;q=0.8' }
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

  private isCandidateMethod(method: string): boolean {
    const normalized = this.normalizeTurkish(method);
    return TARGET_METHODS.some((target) => normalized.includes(this.normalizeTurkish(target))) || ((normalized.includes('ada') || normalized.includes('parsel')) && (normalized.includes('imar') || normalized.includes('sorgu')));
  }

  private normalizeTurkish(value: string): string {
    return value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/İ/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private looksProtected(text: string): boolean {
    return /(captcha|recaptcha|g-recaptcha|login|giriş|oturum|unauthorized|forbidden)/iu.test(text);
  }

  private visit(value: unknown, fn: (key: string, value: unknown) => void): void {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      fn(key, child);
      if (Array.isArray(child)) child.forEach((item) => this.visit(item, fn));
      else this.visit(child, fn);
    }
  }

  private contextSnippet(text: string, index: number): string {
    return text.slice(Math.max(0, index - 70), Math.min(text.length, index + 150));
  }

  private sanitize(value: string): string {
    return value
      .replace(/(authorization|cookie|token|key|secret|password)\s*[:=]\s*['"]?[^&\s"';}]+['"]?/giu, '$1=[redacted]')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
