import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectorKind, EndpointProbeResult, SourceMetadata } from './connector.types';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

interface ExtractedEndpoint {
  endpoint: string;
  evidence: string;
}

@Injectable()
export class NetcadKeosService {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly httpProbe: HttpProbeService
  ) {}

  strategy() {
    return {
      summary:
        'Netcad/KEOS portals are pulled by discovering the real service URLs used by the public imar page, then querying those endpoints with source-specific connector plugins.',
      flow: [
        'Fetch the public imar page.',
        'Extract same-origin JavaScript and service references.',
        'Probe common Netcad/KEOS .ashx/.asmx, NetGIS, WMS/WFS, ArcGIS, and GeoServer endpoints.',
        'For ASMX endpoints, inspect ?WSDL and method pages before calling methods.',
        'For ASHX endpoints, use discovered JavaScript request names and payload contracts.',
        'Persist source_id, endpoint, payload, response hash, and fetched_at for provenance.',
        'Normalize real geometry into PostGIS only after endpoint response schema is verified.'
      ],
      dataPullModes: [
        {
          mode: 'ada_parsel',
          description: 'Call the discovered imar/parsel service with ada/parsel fields when the JS or WSDL exposes the contract.'
        },
        {
          mode: 'map_click_coordinate',
          description: 'Send a point or identify request to map/query services and normalize returned parcel/zoning features.'
        },
        {
          mode: 'wms_wfs',
          description: 'Use GetCapabilities and feature queries when a standards-compliant WMS/WFS endpoint is exposed.'
        },
        {
          mode: 'arcgis_rest',
          description: 'Use ArcGIS layer metadata and query endpoints when the portal is backed by ArcGIS REST services.'
        }
      ],
      guardrails: [
        'No guessed parcel result is emitted.',
        'If a method contract is not discoverable, connector status remains endpoint_changed or unsupported_format.',
        'If captcha/session appears later, status becomes captcha_required or requires_credentials.'
      ]
    };
  }

  async discover(sourceId: string) {
    const source = this.discovery.getSource(sourceId);
    if (!source.connectorKinds.includes(ConnectorKind.NetcadKeos) && !source.homepageUrl.includes('keos')) {
      throw new NotFoundException(`Source '${sourceId}' is not registered as a Netcad/KEOS candidate.`);
    }

    const homepage = await this.fetchText(source.homepageUrl);
    const extracted = homepage.ok ? await this.extractEndpointCandidates(source, homepage.text) : [];
    const common = this.discovery.buildCandidateEndpoints(source).map((endpoint) => ({ endpoint, evidence: 'common-candidate' }));
    const endpoints = this.uniqueByEndpoint([...extracted, ...common]);
    const probes = await Promise.all(endpoints.map((candidate) => this.httpProbe.probe(candidate.endpoint)));

    return {
      source,
      homepage: {
        endpoint: source.homepageUrl,
        status: homepage.ok ? 'fetched' : 'unavailable',
        httpStatus: homepage.httpStatus,
        issue: homepage.ok ? undefined : homepage.error
      },
      extractedEndpointCount: endpoints.length,
      endpoints: probes.map((probe, index) => ({
        ...probe,
        evidence: endpoints[index]?.evidence
      })),
      nextStep: this.nextStep(probes),
      generatedAt: new Date().toISOString()
    };
  }

  private async extractEndpointCandidates(source: SourceMetadata, html: string): Promise<ExtractedEndpoint[]> {
    const base = new URL(source.homepageUrl);
    const htmlCandidates = this.extractEndpointStrings(html, base, 'html');
    const scripts = this.extractScriptUrls(html, base).slice(0, 20);
    const scriptTexts = await Promise.all(scripts.map((scriptUrl) => this.fetchText(scriptUrl)));
    const scriptCandidates = scriptTexts.flatMap((result, index) =>
      result.ok ? this.extractEndpointStrings(result.text, base, `script:${scripts[index]}`) : []
    );
    return this.uniqueByEndpoint([...htmlCandidates, ...scriptCandidates]);
  }

  private extractScriptUrls(html: string, base: URL): string[] {
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]).filter(Boolean);
    return [...new Set(scripts.map((src) => this.resolveUrl(src, base)).filter((url): url is string => Boolean(url)))].filter(
      (url) => new URL(url).origin === base.origin
    );
  }

  private extractEndpointStrings(text: string, base: URL, evidence: string): ExtractedEndpoint[] {
    const matches = text.match(/["'`]([^"'`]*(?:ashx|asmx|NetGIS|arcgis\/rest|geoserver|GetCapabilities)[^"'`]*)["'`]/gi) ?? [];
    return matches
      .map((raw) => raw.slice(1, -1).replace(/\\\//g, '/'))
      .map((candidate) => this.resolveUrl(candidate, base))
      .filter((url): url is string => Boolean(url))
      .filter((url) => ['http:', 'https:'].includes(new URL(url).protocol))
      .map((endpoint) => ({ endpoint, evidence }));
  }

  private resolveUrl(candidate: string | undefined, base: URL): string | undefined {
    if (!candidate || candidate.startsWith('data:') || candidate.startsWith('javascript:')) {
      return undefined;
    }
    try {
      return new URL(candidate, base).toString();
    } catch {
      return undefined;
    }
  }

  private async fetchText(url: string): Promise<{ ok: true; text: string; httpStatus: number } | { ok: false; httpStatus?: number; error: string }> {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'turkiye-e-imar-netcad-discovery/0.1' },
        redirect: 'follow'
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok) {
        return { ok: false, httpStatus: response.status, error: `HTTP ${response.status}` };
      }
      if (!contentType.includes('text') && !contentType.includes('javascript') && !contentType.includes('html')) {
        return { ok: true, text: '', httpStatus: response.status };
      }
      return { ok: true, text: (await response.text()).slice(0, 500_000), httpStatus: response.status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  }

  private uniqueByEndpoint<T extends { endpoint: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.endpoint)) {
        return false;
      }
      seen.add(item.endpoint);
      return true;
    });
  }

  private nextStep(probes: EndpointProbeResult[]): string {
    const available = probes.filter((probe) => probe.status === 'available');
    if (available.some((probe) => probe.endpoint.toLowerCase().includes('.asmx'))) {
      return 'Inspect ASMX WSDL/method contracts and implement the source-specific ada/parsel or coordinate request payload.';
    }
    if (available.some((probe) => probe.detectedKinds.includes(ConnectorKind.Wms) || probe.detectedKinds.includes(ConnectorKind.Wfs))) {
      return 'Parse GetCapabilities and map feature layers into PostGIS ingestion tasks.';
    }
    if (available.some((probe) => probe.detectedKinds.includes(ConnectorKind.ArcGisRest))) {
      return 'Read ArcGIS layer metadata and implement query/identify ingestion tasks.';
    }
    return 'Use browser network capture for this source if static HTML/JS did not expose a supported contract.';
  }
}
