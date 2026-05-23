export interface StatusEnvelope {
  status: string;
  message?: string;
  next_actions?: string[];
  fetched_at?: string;
}

export interface SourceEntry {
  id: string;
  name: string;
  base_url: string;
  provider: string;
  auth: string;
  category: string;
  discovery_strategy: string;
  capabilities: string[];
  municipality_name?: string | null;
  notes?: string | null;
}

export interface SourceProbe {
  status: string;
  http_status?: number | null;
  latency_ms?: number | null;
  discovered_endpoints?: string[];
  message?: string | null;
}

export interface MunicipalityCapabilitySource {
  id: string;
  name: string;
  homepageUrl: string;
  province?: string;
  district?: string;
  municipalitySlug?: string;
  vendor?: string;
  accessStatus: string;
  accessNotes: string;
  connectorKinds: string[];
  capabilities: string[];
}

export interface MunicipalityCapability {
  source: MunicipalityCapabilitySource | null;
  registered: boolean;
  publicCandidate: boolean;
  protected: boolean;
  lastHealth: null;
  imarQuerySupport: string;
  parcelGeometrySupport: string;
  reasonNoData: string;
  nextAction: string;
}

export interface MunicipalityCoverageEntry {
  id: string;
  name: string;
  homepageUrl: string;
  province?: string;
  district?: string;
  municipalitySlug?: string;
  vendor?: string;
  accessStatus: string;
  capabilities: string[];
  connectorKinds: string[];
  capability?: MunicipalityCapability;
}

export interface MunicipalityCoverageResponse extends StatusEnvelope {
  count: number;
  municipalities: MunicipalityCoverageEntry[];
}

export interface SourceStatusEntry {
  id: string;
  name: string;
  status:
    | "available"
    | "captcha_required"
    | "requires_credentials"
    | "unavailable"
    | "unknown";
  method: "soap" | "wms" | "netgis" | "html" | "unknown";
  lastChecked: string | null;
  endpoints?: string[];
  baseUrl: string;
  type: "keos" | "webgis" | "ekent" | "custom";
  vendor: string;
  region: "istanbul" | "ankara" | "izmir" | "diger";
  bbox: [number, number, number, number];
}

export interface WebsiteSearchResult {
  label: string;
  municipalityId: string;
  bbox: [number, number, number, number];
  parcelData?: {
    ada?: string;
    parsel?: string;
    imarDurumu?: string;
  };
  source: string;
}

export interface WebsiteSearchResponse {
  type: "parcel" | "address" | "municipality" | "coordinate";
  results: WebsiteSearchResult[];
  message?: string;
}

export interface MunicipalParcelWorkflowAttempt {
  status: string;
  source: string | null;
  endpoint?: string;
  method?: string;
  message: string;
}

export interface MunicipalParcelWorkflowResponse extends StatusEnvelope {
  query: {
    province?: string;
    district?: string;
    municipalityId?: string;
    municipalitySlug?: string;
    mahalle?: string;
    ada?: string;
    parsel?: string;
    lng?: number;
    lat?: number;
  };
  municipalityCapability: MunicipalityCapability;
  parcelGeometryAttempt: MunicipalParcelWorkflowAttempt;
  zoningAttempt: MunicipalParcelWorkflowAttempt;
  parcelData?: {
    ada?: string;
    parsel?: string;
    imarDurumu?: string;
    planNotu?: string;
    sourceUrl?: string;
    method?: string;
    status?: string;
  } | null;
  noDataReason: string;
  provenance: ProvenanceRecord[];
}

export interface OgcLayerCatalogEntry {
  name?: string;
  title?: string;
  crs?: string[];
  srs?: string[];
  bbox?: unknown;
  queryable?: boolean;
  abstract?: string;
}

export interface OgcLayerCatalogResponse extends StatusEnvelope {
  sourceId: string;
  endpoint?: string;
  service: "WMS" | "WFS";
  generatedAt: string;
  layers: OgcLayerCatalogEntry[];
  status: "ok" | "protected" | "unavailable" | "unsupported_format";
  provenance: ProvenanceRecord[];
}

export interface ProvenanceRecord {
  sourceId: string;
  sourceName: string;
  endpoint?: string;
  fetchedAt: string;
  responseHash?: string;
  dataType: "official" | "public_metadata" | "demo" | "derived";
  confidence: number;
  connectorKind?: string;
  status: string;
}

export interface SourcesResponse extends StatusEnvelope {
  sources: SourceEntry[];
  total: number;
}

export interface SourceDetailResponse extends StatusEnvelope {
  source: SourceEntry;
  probe: SourceProbe;
}

export interface SourceHealthResponse extends StatusEnvelope {
  total: number;
  rollup: Record<string, number>;
  sources: Array<SourceEntry & SourceProbe>;
}

export interface AskiNotice {
  id: string;
  title: string;
  document_url?: string;
  source_id: string;
}

export interface AskiActiveResponse extends StatusEnvelope {
  count: number;
  notices: AskiNotice[];
  sources: Array<Record<string, unknown>>;
  total_sources: number;
  ok_sources: number;
}

export interface AskiGeoJsonResponse {
  type: "FeatureCollection";
  status: string;
  count: number;
  features: GeoJSON.Feature[];
  sources: Array<Record<string, unknown>>;
  fetched_at?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
