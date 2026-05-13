export type DataSourceStatus =
  | "live"
  | "fallback"
  | "unavailable"
  | "computed"
  | "demo"
  | "official"
  | "public_metadata"
  | "derived"
  | "not_ready";

export interface ParcelResponse {
  id: number;
  ada: string;
  parsel: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  nitelik?: string;
  alan_m2?: number;
  tapu_durumu?: string;
  geometri?: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection | Record<string, unknown>;
  pafta?: string;
  mevkii?: string;
}

export interface PlanResponse {
  id: number;
  municipality_id?: number;
  plan_type?: string;
  status?: string;
  aski_start?: string;
  aski_end?: string;
  pdf_url?: string;
  gml_url?: string;
  geom_geojson?: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection | Record<string, unknown>;
}

export interface LatestRegionResponse {
  id: number;
  label: string;
  municipality_id?: number;
  municipality_name?: string;
  municipality_slug?: string;
  province?: string;
  district?: string;
  plan_type?: string;
  status?: string;
  aski_start?: string;
  aski_end?: string;
  pdf_url?: string;
  gml_url?: string;
  source: DataSourceStatus;
  has_geometry: boolean;
  geom_geojson?: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection | Record<string, unknown>;
}

export interface LatestRegionsResponse {
  items: LatestRegionResponse[];
  total: number;
  geometry_count: number;
  status: DataSourceStatus;
  message?: string;
}

export interface ReportResponse {
  id: number;
  user_id: number;
  parcel_id?: number;
  plan_id?: number;
  status: string;
  pdf_url?: string;
}

export interface BackendMapLayerResponse {
  id: string | number;
  source_id?: string;
  name?: string;
  title?: string;
  type?: string;
  status?: string;
  source?: string;
  url?: string;
  homepage_url?: string;
  center?: [number, number];
  province?: string;
  district?: string;
  kind?: string;
  requires_proxy?: boolean;
  requires_approval?: boolean;
  requires_credentials?: boolean;
  candidate_endpoint_count?: number;
  candidate_endpoint_types?: string[];
  layers?: string[];
  [key: string]: unknown;
}

export interface SourceRegistryRecord {
  id: string;
  name: string;
  kind?: string;
  province?: string | null;
  district?: string | null;
  slug?: string;
  homepage_url?: string;
  base_url?: string;
  candidate_endpoints?: string[];
  notes?: string;
  requires_approval?: boolean;
  requires_credentials?: boolean;
  center?: [number, number] | null;
  provider?: string;
  auth?: string;
  category?: string;
  discovery_strategy?: string;
  capabilities?: string[];
  municipality_name?: string | null;
}

export interface SourceHealthRecord {
  source_id: string;
  name: string;
  slug: string;
  kind: string;
  homepage_url: string;
  status: string;
  http_status?: number | null;
  checked_url?: string;
  requires_approval?: boolean;
  requires_credentials?: boolean;
}

export interface OgcLayerSummary {
  name?: string | null;
  title?: string | null;
  srs?: string[];
  crs?: string[];
  bbox?: Record<string, unknown> | null;
  queryable?: boolean;
  abstract?: string | null;
  sources?: string[];
}

export interface MunicipalGISEndpointRecord {
  id: string;
  source_id: string;
  municipality_id?: number | null;
  base_url: string;
  wms_url: string;
  wms_get_capabilities_url: string;
  wms_version?: string | null;
  wfs_url?: string | null;
  wfs_get_capabilities_url?: string | null;
  available_layers: OgcLayerSummary[];
  supported_srs: string[];
  supported_formats: string[];
  status: string;
  discovered_at: string;
  refresh_after: string;
  last_error?: string | null;
  metadata: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MunicipalGISDiscoveryResponse {
  slug: string;
  name: string;
  tested_patterns: number;
  live_endpoints: Array<Record<string, unknown>>;
  keos_url?: string | null;
  wms_url?: string | null;
  wfs_url?: string | null;
  discovered_at: string;
  refresh_after?: string | null;
  ogc?: {
    status?: string;
    base_url?: string | null;
    wms_url?: string | null;
    wms_get_capabilities_url?: string | null;
    wms_version?: string | null;
    wfs_url?: string | null;
    wfs_get_capabilities_url?: string | null;
    available_layers?: OgcLayerSummary[];
    supported_srs?: string[];
    supported_formats?: string[];
    metadata?: Record<string, unknown>;
    last_error?: string | null;
    tested_urls?: string[];
    discovered_at?: string;
    refresh_after?: string;
  };
}

export interface MunicipalGISEndpointListResponse extends Array<MunicipalGISEndpointRecord> {}

export interface ComplianceSimulationResponse {
  compliant?: boolean;
  is_compliant?: boolean;
  status?: string;
  violations?: Array<string | { message?: string; rule?: string; severity?: string }>;
  warnings?: Array<string | { message?: string; rule?: string; severity?: string }>;
  [key: string]: unknown;
}

export type MarketProviderId = "sahibinden" | "emlakjet" | "hepsiemlak" | "zingat";
export type MarketReadinessStatus = "ok" | "blocked" | "unsupported" | "requires_credentials" | "not_configured" | "unavailable" | "no_match";
export type MarketListingType = "sale" | "rent" | "lease";

export interface ParcelMarketContext {
  parcelId?: string | null;
  il?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  ada?: string | null;
  parsel?: string | null;
  areaM2?: number | null;
  zoningType?: string | null;
  centroid?: [number, number] | null;
}

export interface MarketListingMatch {
  status: "strong" | "partial" | "weak" | "none";
  score: number;
  reason: string;
  parcelKey: string;
}

export interface NormalizedMarketListing {
  id: string;
  providerId: MarketProviderId;
  providerName: string;
  title: string;
  listingType: MarketListingType;
  priceAmount: number | null;
  currency: "TRY";
  areaM2: number | null;
  pricePerM2: number | null;
  location: {
    il?: string | null;
    ilce?: string | null;
    mahalle?: string | null;
    address?: string | null;
    centroid?: [number, number] | null;
  };
  url: string | null;
  publishedAt: string | null;
  capturedAt: string;
  match: MarketListingMatch;
  provenance: {
    source: "provider_adapter";
    providerId: MarketProviderId;
    readinessStatus: MarketReadinessStatus;
    reason: string;
  };
}

export interface MarketProviderReadiness {
  status: MarketReadinessStatus;
  reason: string;
  configured: boolean;
  source: "adapter";
  checkedAt: string;
}

export interface ProviderMarketResult {
  providerId: MarketProviderId;
  providerName: string;
  sourceUrl: string;
  readiness: MarketProviderReadiness;
  listings: NormalizedMarketListing[];
}

export interface MarketSummary {
  listingCount: number;
  pricedListingCount: number;
  providerCount: number;
  providerListingCount: Record<MarketProviderId, number>;
  medianAskingPriceTRY: number | null;
  averageAskingPriceTRY: number | null;
  medianPricePerM2TRY: number | null;
  averagePricePerM2TRY: number | null;
  minAskingPriceTRY: number | null;
  maxAskingPriceTRY: number | null;
}

export interface MarketAnalysisResult {
  status: "ok" | "requires_data" | "requires_credentials" | "provider_error" | "unavailable";
  provider: "openai" | "local" | null;
  generatedAt: string;
  inputCount: number;
  confidence: number | null;
  summary: string | null;
  bullets: string[];
  caveats: string[];
  reason?: string;
}

export interface ParcelMarketResponse {
  status: "ok" | "empty" | "unavailable" | "degraded";
  request: ParcelMarketContext;
  providers: ProviderMarketResult[];
  listings: NormalizedMarketListing[];
  summary: MarketSummary | null;
  analysis: MarketAnalysisResult;
  warnings: string[];
  caveats: string[];
  generatedAt: string;
  freshness: {
    status: "fresh" | "no_data" | "stale";
    checkedAt: string;
    listingCount: number;
    providerCount: number;
  };
}
