export type DataSourceStatus = "live" | "fallback" | "unavailable" | "computed" | "demo";

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
  geometri?: GeoJSON.Geometry | GeoJSON.Feature | Record<string, unknown>;
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
  geom_geojson?: GeoJSON.Geometry | GeoJSON.Feature | Record<string, unknown>;
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
  name?: string;
  title?: string;
  type?: string;
  status?: string;
  source?: string;
  [key: string]: unknown;
}

export interface ComplianceSimulationResponse {
  compliant?: boolean;
  is_compliant?: boolean;
  status?: string;
  violations?: Array<string | { message?: string; rule?: string; severity?: string }>;
  warnings?: Array<string | { message?: string; rule?: string; severity?: string }>;
  [key: string]: unknown;
}
