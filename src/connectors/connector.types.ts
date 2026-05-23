export enum ConnectorKind {
  NetcadKeos = 'netcad_keos',
  Keos = 'keos',
  Webgis = 'webgis',
  MunicipalPortal = 'municipal_portal',
  PublicPortal = 'public_portal',
  PublicApi = 'public_api',
  Ogc = 'ogc',
  Wms = 'wms',
  Wfs = 'wfs',
  Geoserver = 'geoserver',
  ArcgisRest = 'arcgis_rest',
  Mapserver = 'mapserver',
  Overpass = 'overpass',
  Ekent = 'ekent',
  Documentation = 'documentation'
}

export enum ProbeStatus {
  Available = 'available',
  Unavailable = 'unavailable',
  RequiresCredentials = 'requires_credentials',
  RequiresLegalAgreement = 'requires_legal_agreement',
  CaptchaRequired = 'captcha_required',
  RateLimited = 'rate_limited',
  UnsupportedFormat = 'unsupported_format',
  EndpointChanged = 'endpoint_changed',
  MethodContractRequired = 'method_contract_required'
}

export type PublicReadinessStatus =
  | 'verified_live'
  | 'public_metadata'
  | 'captcha_required'
  | 'requires_credentials'
  | 'requires_legal_agreement'
  | 'unavailable';

export interface ProbeResult {
  endpoint: string;
  status: ProbeStatus;
  httpStatus?: number;
  contentType?: string | null;
  finalUrl?: string;
  detectedKinds: ConnectorKind[];
  headers?: Record<string, string>;
  error?: string;
  note?: string;
}

export interface DiscoveredEndpoint {
  endpoint: string;
  probe: ProbeResult;
  provenance: 'source_homepage' | 'html' | 'javascript' | 'common_candidate' | 'wsdl_candidate';
  nextAction: string;
}
