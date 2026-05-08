import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ConnectorKind, DiscoveredEndpoint, ProbeResult, ProbeStatus } from './connector.types';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

const REFERENCE_PATTERN = /["'`(=]\s*([^"'`)\s]*(?:\.ashx|\.asmx|NetGIS[^"'`)\s]*|arcgis\/rest[^"'`)\s]*|geoserver[^"'`)\s]*|GetCapabilities[^"'`)\s]*))/gi;

@Injectable()
export class NetcadKeosService {
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
        headers: { 'User-Agent': 'e-imarapp-netcad-discovery/0.1', Accept: 'text/html,application/javascript,text/javascript,*/*;q=0.8' }
      });
      if (!response.ok) return null;
      return { text: await response.text(), status: response.status };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
