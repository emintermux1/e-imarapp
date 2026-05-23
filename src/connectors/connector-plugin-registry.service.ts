import { Injectable } from '@nestjs/common';
import { SOURCE_REGISTRY, SourceRegistryEntry } from '../sources/source-registry';
import { ConnectorKind } from './connector.types';
import { DiscoveryService } from './discovery.service';

export interface ConnectorPluginDefinition {
  kind: ConnectorKind;
  label: string;
  family: 'municipal' | 'ogc' | 'public_api' | 'portal';
  detects: string[];
  candidatePaths: string[];
  outputContract: {
    requiredFields: ['sourceUrl', 'retrievedAt', 'provenance', 'confidence', 'limitations'];
    dataTypes: Array<'official' | 'public_metadata' | 'derived' | 'unavailable'>;
  };
  legalBoundary: string;
  nextStep: string;
}

@Injectable()
export class ConnectorPluginRegistryService {
  constructor(private readonly discovery: DiscoveryService) {}

  list() {
    return {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      requiredResponseFields: ['sourceUrl', 'retrievedAt', 'provenance', 'confidence', 'limitations'],
      plugins: CONNECTOR_PLUGINS
    };
  }

  get(kind: ConnectorKind | string) {
    const plugin = CONNECTOR_PLUGINS.find((entry) => entry.kind === kind);
    return plugin ? { status: 'ok', plugin } : { status: 'not_found', kind };
  }

  planForSource(sourceId: string) {
    const source = SOURCE_REGISTRY.find((entry) => entry.id === sourceId);
    if (!source) return { status: 'source_not_found', sourceId };
    const plugins = this.pluginsForSource(source);
    return {
      status: 'ok',
      sourceId: source.id,
      sourceName: source.name,
      homepageUrl: source.homepageUrl,
      accessStatus: source.access.status,
      vendor: source.metadata?.vendor ?? null,
      plugins,
      candidates: this.discovery.buildCandidateEndpoints(source),
      nextAction: source.access.status === 'requires_credentials' || source.access.status === 'requires_legal_agreement'
        ? 'Do not probe protected flows; request approved access first.'
        : 'Run plugin discovery, inspect public contracts, then persist provenance before normalized ingestion.'
    };
  }

  private pluginsForSource(source: SourceRegistryEntry): ConnectorPluginDefinition[] {
    const kinds = new Set(source.connectorKinds);
    const vendor = source.metadata?.vendor;
    if (vendor === 'netcad') {
      kinds.add(ConnectorKind.NetcadKeos);
      kinds.add(ConnectorKind.Keos);
      kinds.add(ConnectorKind.Wms);
      kinds.add(ConnectorKind.Wfs);
    }
    if (vendor === 'webgis') {
      kinds.add(ConnectorKind.Webgis);
      kinds.add(ConnectorKind.Ogc);
      kinds.add(ConnectorKind.Wms);
      kinds.add(ConnectorKind.Wfs);
    }
    if (vendor === 'ekent') kinds.add(ConnectorKind.Ekent);
    return CONNECTOR_PLUGINS.filter((plugin) => kinds.has(plugin.kind));
  }
}

const REQUIRED_FIELDS = ['sourceUrl', 'retrievedAt', 'provenance', 'confidence', 'limitations'] as ConnectorPluginDefinition['outputContract']['requiredFields'];

export const CONNECTOR_PLUGINS: ConnectorPluginDefinition[] = [
  {
    kind: ConnectorKind.NetcadKeos,
    label: 'Netcad / KEOS public imar portal',
    family: 'municipal',
    detects: ['NetGIS', 'KEOS', '.ashx', '.asmx', 'imardurumu'],
    candidatePaths: ['/NetGIS/Services/*.ashx', '/imardurumu/Services/ImarDurumu.asmx', '/imardurumu/Services/QueryService.ashx'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'derived', 'unavailable'] },
    legalBoundary: 'Only public HTML/JS/WSDL metadata is inspected; captcha/session flows are not bypassed.',
    nextStep: 'Resolve WSDL/public method names, hash responses, then map ada/parsel fields with provenance.'
  },
  {
    kind: ConnectorKind.Keos,
    label: 'KEOS vendor fingerprint',
    family: 'municipal',
    detects: ['keos.*.bel.tr', 'KEOS scripts', 'ImarDurumu service references'],
    candidatePaths: ['/imardurumu/', '/keos/', '/Services/ImarDurumu.asmx'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'derived', 'unavailable'] },
    legalBoundary: 'Public portal metadata only until municipality-specific terms and endpoint contract are verified.',
    nextStep: 'Classify KEOS endpoint contract and attach official/public_metadata confidence labels.'
  },
  {
    kind: ConnectorKind.Webgis,
    label: 'Municipal WebGIS / Kent Rehberi',
    family: 'municipal',
    detects: ['webgis', 'kentrehberi', 'e-harita', 'eimar'],
    candidatePaths: ['/webgis/', '/kentrehberi/', '/imardurumu/', '/arcgis/rest/services?f=pjson'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'derived', 'unavailable'] },
    legalBoundary: 'Discovery records public map metadata; parcel/zoning values stay unavailable until query semantics are proven.',
    nextStep: 'Detect ArcGIS/OGC layers and mark queryable zoning/parcel candidates.'
  },
  {
    kind: ConnectorKind.Ekent,
    label: 'eKent / e-Belediye public imar portal',
    family: 'municipal',
    detects: ['ekent', 'ebelediye', 'imar durumu'],
    candidatePaths: ['/imardurumu/', '/kentrehberi/', '/api/', '/services/'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'derived', 'unavailable'] },
    legalBoundary: 'No scraping around bot protection; manual/partner API is preferred where terms require it.',
    nextStep: 'Resolve public metadata or partner API contract; otherwise report requires_credentials/captcha_required.'
  },
  {
    kind: ConnectorKind.ArcgisRest,
    label: 'ArcGIS REST services',
    family: 'public_api',
    detects: ['arcgis/rest/services', 'MapServer', 'FeatureServer'],
    candidatePaths: ['/arcgis/rest/services?f=pjson', '/ArcGIS/rest/services?f=pjson'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'official', 'unavailable'] },
    legalBoundary: 'Service metadata is public only if the endpoint allows anonymous access and terms permit use.',
    nextStep: 'Catalog MapServer/FeatureServer layers, then identify parcel/zoning fields and source license.'
  },
  {
    kind: ConnectorKind.Mapserver,
    label: 'Generic MapServer public metadata',
    family: 'ogc',
    detects: ['MapServer', 'GetCapabilities', 'f=pjson'],
    candidatePaths: ['/MapServer?f=pjson', '/arcgis/rest/services?f=pjson'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'official', 'unavailable'] },
    legalBoundary: 'Anonymous service metadata is inspected only; protected layer queries are not attempted.',
    nextStep: 'Record public layer metadata/readiness and only query attributes after terms and layer semantics are verified.'
  },
  {
    kind: ConnectorKind.Overpass,
    label: 'OpenStreetMap / Overpass context lookup',
    family: 'public_api',
    detects: ['overpass-api', 'openstreetmap', 'building', 'landuse'],
    candidatePaths: ['https://overpass-api.de/api/interpreter'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'derived', 'unavailable'] },
    legalBoundary: 'Use as public context/basemap only; never present OSM/Overpass results as official cadastral parcel records.',
    nextStep: 'Apply strict radius, timeout, and rate-limit fallback messaging before displaying context around a parcel.'
  },
  {
    kind: ConnectorKind.Geoserver,
    label: 'GeoServer OWS',
    family: 'ogc',
    detects: ['geoserver', 'ows', 'GetCapabilities'],
    candidatePaths: ['/geoserver/ows?service=WMS&request=GetCapabilities', '/geoserver/ows?service=WFS&request=GetCapabilities'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'official', 'unavailable'] },
    legalBoundary: 'Capabilities metadata is not equivalent to permission to bulk ingest layer features.',
    nextStep: 'Parse WMS/WFS capabilities and persist layer provenance/confidence before querying features.'
  },
  {
    kind: ConnectorKind.Wms,
    label: 'OGC WMS',
    family: 'ogc',
    detects: ['service=WMS', 'WMS_Capabilities'],
    candidatePaths: ['?service=WMS&request=GetCapabilities'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'unavailable'] },
    legalBoundary: 'WMS is usually rendered map imagery/metadata; do not infer parcel attributes from pixels.',
    nextStep: 'Use WMS for coverage/visual layers and find paired WFS/API for attributes.'
  },
  {
    kind: ConnectorKind.Wfs,
    label: 'OGC WFS',
    family: 'ogc',
    detects: ['service=WFS', 'FeatureTypeList'],
    candidatePaths: ['?service=WFS&request=GetCapabilities'],
    outputContract: { requiredFields: REQUIRED_FIELDS, dataTypes: ['public_metadata', 'official', 'unavailable'] },
    legalBoundary: 'Feature access must respect service terms, legal basis, and rate limits.',
    nextStep: 'Parse feature types, sample field schema safely, and mark official/public_metadata before ingestion.'
  }
];
