import { Injectable, NotFoundException } from '@nestjs/common';
import { SOURCE_REGISTRY, SourceRegistryEntry } from '../sources/source-registry';
import { ProbeResult } from './connector.types';
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
  '/geoserver/ows?service=WMS&request=GetCapabilities',
  '/geoserver/ows?service=WFS&request=GetCapabilities',
  '/arcgis/rest/services?f=pjson'
];

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

  private normalizeBasePath(pathname: string): string {
    if (!pathname || pathname === '/') return '/';
    const withoutFile = pathname.replace(/[^/]+\.(aspx?|html?|php)$/i, '');
    return withoutFile.endsWith('/') ? withoutFile : `${withoutFile}/`;
  }
}
