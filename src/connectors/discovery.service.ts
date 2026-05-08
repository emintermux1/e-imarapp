import { Injectable, NotFoundException } from '@nestjs/common';
import { MUNICIPAL_DOMAIN_PATTERNS, SOURCE_REGISTRY } from '../sources/source-registry';
import { ConnectorKind, SourceDiscoveryResult, SourceMetadata } from './connector.types';
import { HttpProbeService } from './http-probe.service';

@Injectable()
export class DiscoveryService {
  constructor(private readonly httpProbe: HttpProbeService) {}

  listSources(): readonly SourceMetadata[] {
    return SOURCE_REGISTRY;
  }

  getSource(sourceId: string): SourceMetadata {
    const source = SOURCE_REGISTRY.find((candidate) => candidate.id === sourceId);
    if (!source) {
      throw new NotFoundException(`Source '${sourceId}' is not registered.`);
    }
    return source;
  }

  async discoverSource(sourceId: string): Promise<SourceDiscoveryResult> {
    const source = this.getSource(sourceId);
    const homepage = await this.httpProbe.probe(source.homepageUrl);
    const endpoints = await Promise.all(this.buildCandidateEndpoints(source).map((endpoint) => this.httpProbe.probe(endpoint)));

    return {
      source,
      homepage,
      endpoints,
      generatedAt: new Date().toISOString()
    };
  }

  async discoverMunicipalityPatterns(municipalitySlug: string) {
    const normalizedSlug = municipalitySlug.toLocaleLowerCase('tr-TR');
    const candidates = MUNICIPAL_DOMAIN_PATTERNS.map((pattern) =>
      pattern.replace('{municipality}', normalizedSlug)
    );
    const probes = await Promise.all(candidates.map((endpoint) => this.httpProbe.probe(endpoint)));

    return {
      municipalitySlug: normalizedSlug,
      candidates: probes,
      generatedAt: new Date().toISOString(),
      note: 'Pattern discovery only reports live endpoint status. It does not imply permission to scrape or ingest protected data.'
    };
  }

  buildCandidateEndpoints(source: SourceMetadata): string[] {
    const base = this.toBaseUrl(source.homepageUrl);
    const candidates = new Set<string>(source.candidateEndpoints ?? []);

    if (source.connectorKinds.includes(ConnectorKind.NetcadKeos) || source.homepageUrl.includes('keos')) {
      candidates.add(new URL('/NetGIS/Services/MapService.ashx', base).toString());
      candidates.add(new URL('/imardurumu/Services/ImarDurumu.ashx', base).toString());
    }

    if (source.connectorKinds.includes(ConnectorKind.MunicipalPortal)) {
      candidates.add(new URL('/arcgis/rest/services?f=pjson', base).toString());
      candidates.add(new URL('/geoserver/ows?service=WMS&request=GetCapabilities', base).toString());
      candidates.add(new URL('/geoserver/ows?service=WFS&request=GetCapabilities', base).toString());
    }

    if (source.connectorKinds.includes(ConnectorKind.OpenData)) {
      candidates.add(new URL('/api/3/action/package_search', base).toString());
    }

    if (source.connectorKinds.includes(ConnectorKind.Wms) || source.connectorKinds.includes(ConnectorKind.RasterTile)) {
      candidates.add(new URL('/ows?service=WMS&request=GetCapabilities', base).toString());
      candidates.add(new URL('/wmts?service=WMTS&request=GetCapabilities', base).toString());
    }

    if (source.connectorKinds.includes(ConnectorKind.VectorTile)) {
      candidates.add(new URL('/tiles/{z}/{x}/{y}.pbf', base).toString());
      candidates.add(new URL('/styles.json', base).toString());
    }

    return [...candidates].filter((endpoint) => endpoint !== source.homepageUrl);
  }

  private toBaseUrl(rawUrl: string): string {
    const url = new URL(rawUrl);
    return `${url.protocol}//${url.host}`;
  }
}
