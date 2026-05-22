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
  geometri?: Record<string, unknown>;
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
  geom_geojson?: Record<string, unknown>;
}

export interface MunicipalityResponse {
  id: number;
  name: string;
  province?: string;
  district?: string;
  slug: string;
  type?: string;
  keos_url?: string;
  wms_url?: string;
  wfs_url?: string;
}

export interface MunicipalityDiscoveryResponse {
  slug: string;
  name: string;
  tested_patterns: number;
  live_endpoints: Record<string, unknown>[];
  keos_url?: string;
  wms_url?: string;
  wfs_url?: string;
  discovered_at: string;
}

export interface ImarStatusResponse {
  belediye: string;
  ada: string;
  parsel: string;
  imar_durumu?: string;
  plan_turu?: string;
  taks?: number;
  kaks?: number;
  h_max?: number;
  gabari?: string;
  yapilasma_sarti?: string;
  kullanim_amaci?: string;
  aciklama?: string;
}

export interface ReportResponse {
  id: number;
  user_id: number;
  parcel_id?: number;
  plan_id?: number;
  status: string;
  pdf_url?: string;
}

export type Audience = "citizen" | "architect" | "investor";

export interface ParcelReportResponse {
  status?: string;
  reportId?: string;
  generatedAt?: string;
  title?: string;
  disclaimer?: string;
  query?: Record<string, unknown>;
  sections?: Array<{
    title?: string;
    fields?: Array<{ label?: string; value?: string; status?: string }>;
  }>;
  provenance?: Array<Record<string, unknown>>;
  printableHtml?: string;
  downloadFilename?: string;
  message?: string;
}

export interface WebsiteLiveReadinessResponse {
  status?: string;
  generatedAt?: string;
  deployment?: {
    apiBaseUrl?: string | null;
    httpsReady?: boolean;
    requiredEnv?: Array<{ key?: string; configured?: boolean; purpose?: string }>;
  };
  sources?: Array<Record<string, unknown>>;
}

export interface PlanNoteExplainResponse {
  status?: string;
  provider?: string;
  model?: string;
  issue?: { code?: string; message?: string } | string;
  message?: string;
  explanation?:
    | {
        sadeOzeti?: string;
        plainSummary?: string;
        bullets?: string[];
        yapilasmaKosullari?: string[];
        risks?: string[];
        riskler?: string[];
        requiredOpinions?: string[];
        gerekliKurumGorusleri?: string[];
        uncertainties?: string[];
        bilinmeyenler?: string[];
        [key: string]: unknown;
      }
    | string
    | Record<string, unknown>;
}

export interface SourceCandidateNormalizationResponse {
  status?: string;
  message?: string;
  normalizedUrl?: string;
  vendor?: string;
  municipalitySlug?: string;
  sourceIdCandidate?: string;
  accessStatusGuess?: string;
  accessStatusReason?: string;
  connectorKinds?: string[];
  capabilities?: string[];
  wouldRegister?: {
    id?: string;
    name?: string;
    jurisdiction?: string;
    category?: string;
    homepageUrl?: string;
    connectorKinds?: string[];
    access?: { status?: string; notes?: string };
    capabilities?: string[];
    metadata?: Record<string, unknown>;
  };
  probeCandidates?: string[];
  note?: string;
}

export interface WatchlistItemResponse {
  id: number;
  user_id: number;
  parcel_id?: number;
  plan_id?: number;
  geom_wkt?: string;
  notification_channels: string[];
  label?: string;
}

export interface LayerInfo {
  name: string;
  title?: string;
  abstract?: string;
  bounding_box_wgs84?: number[];
  crs_options?: string[];
  styles?: string[];
}

export interface BuildingVolumeResponse {
  base_area_m2: number;
  total_floor_area_m2: number;
  volume_m3: number;
  height_m: number;
  floors: number;
  floor_height: number;
  cesium_bounding_box: Record<string, unknown>;
  footprint_geojson?: Record<string, unknown>;
}

export interface ShadowAnalysisResponse {
  shadow_geojson?: Record<string, unknown>;
  shadow_length_m: number;
  shadow_area_m2_approx?: number;
  building_height_m: number;
  sun_azimuth_deg: number;
  sun_elevation_deg: number;
  note?: string;
}

export interface ComplianceResponse {
  compliant: boolean;
  emsal_compliant: boolean;
  emsal_required: number;
  emsal_calculated: number;
  hmax_compliant: boolean;
  hmax_required: number;
  hmax_calculated: number;
  gabari_compliant: boolean;
  gabari_required: number;
  parcel_area_m2: number;
  base_area_m2: number;
  total_floor_area_m2: number;
  violations: string[];
}

export interface CesiumTilesetResponse {
  tileset: Record<string, unknown>;
}

export interface User {
  id: number;
  email: string;
}

export interface NearbyResult {
  id: number;
  ada: string;
  parsel: string;
  province?: string;
  district?: string;
  municipality?: string;
  distance_m: number;
}
