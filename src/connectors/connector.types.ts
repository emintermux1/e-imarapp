import { IntegrationIssue } from '../common/error-taxonomy';

export enum ConnectorKind {
  NationalPortal = 'national_portal',
  MunicipalPortal = 'municipal_portal',
  Wms = 'wms',
  Wfs = 'wfs',
  ArcGisRest = 'arcgis_rest',
  GeoServer = 'geoserver',
  NetcadKeos = 'netcad_keos',
  OpenData = 'open_data',
  Basemap = 'basemap',
  RasterTile = 'raster_tile',
  VectorTile = 'vector_tile',
  Satellite = 'satellite'
}

export enum AccessStatus {
  Public = 'public',
  RequiresCredentials = 'requires_credentials',
  RequiresLegalAgreement = 'requires_legal_agreement',
  Unknown = 'unknown'
}

export enum ProbeStatus {
  Available = 'available',
  Unavailable = 'unavailable',
  RequiresCredentials = 'requires_credentials',
  CaptchaRequired = 'captcha_required',
  RateLimited = 'rate_limited',
  UnsupportedFormat = 'unsupported_format'
}

export interface SourceAccess {
  status: AccessStatus;
  notes: string;
}

export interface SourceMetadata {
  id: string;
  name: string;
  jurisdiction: 'national' | 'municipal' | 'regional' | 'global';
  category: 'parcel' | 'plan' | 'address' | 'municipal_gis' | 'basemap' | 'open_data' | 'satellite' | 'tile_service';
  homepageUrl: string;
  connectorKinds: ConnectorKind[];
  access: SourceAccess;
  capabilities: string[];
  seedOnly?: boolean;
  municipalityName?: string;
  candidateEndpoints?: string[];
  documentationUrls?: string[];
}

export interface EndpointProbeResult {
  endpoint: string;
  status: ProbeStatus;
  httpStatus?: number;
  detectedKinds: ConnectorKind[];
  title?: string;
  contentType?: string;
  issue?: IntegrationIssue;
}

export interface SourceDiscoveryResult {
  source: SourceMetadata;
  homepage: EndpointProbeResult;
  endpoints: EndpointProbeResult[];
  generatedAt: string;
}
