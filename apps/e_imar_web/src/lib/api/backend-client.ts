import type {
  BackendMapLayerResponse,
  ComplianceSimulationResponse,
  MunicipalGISDiscoveryResponse,
  MunicipalGISEndpointListResponse,
  MunicipalGISEndpointRecord,
  LatestRegionsResponse,
  ParcelContextResponse,
  ParcelResponse,
  ParcelSummaryResponse,
  PlanResponse,
  ReportResponse,
  LiveMapLayerProbeResponse,
  SourceHealthRecord,
  SourceQualityRecord,
  SourceQualityResponse,
  SourceActivationResponse,
  SourceRegistryRecord
} from "@/types/api";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiFetchError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.details = details;
  }
}

export function humanizeApiError(error: unknown, fallback?: string) {
  if (error instanceof ApiFetchError) {
    if (error.status == null) {
      return "Backend erişilemiyor. FastAPI servisinin http://localhost:8000 üzerinde çalıştığını kontrol edin.";
    }
    if (error.status === 404) return fallback ?? "İstenen kayıt canlı API üzerinde bulunamadı.";
    if (error.status >= 500) return "Backend geçici olarak yanıt veremiyor. Servis loglarını kontrol edin.";
    return fallback ?? "API isteği tamamlanamadı; gönderilen parametreleri kontrol edin.";
  }
  if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
    return "Backend erişilemiyor. FastAPI servisinin http://localhost:8000 üzerinde çalıştığını kontrol edin.";
  }
  return fallback ?? "İşlem tamamlanamadı; lütfen tekrar deneyin.";
}

function makeUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(makeUrl(path), { ...options, headers });
  } catch (error) {
    throw new ApiFetchError("Backend erişilemiyor", undefined, error);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `Backend isteği başarısız (${response.status})`;
    throw new ApiFetchError(message, response.status, payload);
  }

  return payload as T;
}

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  const out = qs.toString();
  return out ? `?${out}` : "";
}

export function searchBackendParcels(query: string) {
  return apiFetch<ParcelResponse[]>(`/parsel/search${queryString({ query })}`);
}

export function lookupBackendParcel(params: {
  ada?: string;
  parsel?: string;
  il?: string;
  ilce?: string;
}) {
  return apiFetch<ParcelResponse[]>(`/parsel${queryString(params)}`);
}

export function getBackendParcelGeometry(parcelId: number) {
  return apiFetch<GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection | Record<string, unknown>>(
    `/parsel/geometry/${parcelId}`
  );
}

export function getBackendParcelContext(
  parcelId: number,
  params: { include_geometry?: boolean; limit?: number } = {}
) {
  return apiFetch<ParcelContextResponse>(`/parsel/${parcelId}/context${queryString(params)}`);
}

export function getBackendParcelRelatedPlans(
  parcelId: number,
  params: { include_geometry?: boolean; limit?: number } = {}
) {
  return apiFetch<ParcelContextResponse>(`/parsel/${parcelId}/related-plans${queryString(params)}`);
}

export function getBackendParcelSummary(parcelId: number) {
  return apiFetch<ParcelSummaryResponse>(`/parsel/${parcelId}/summary`);
}

export function generateBackendReport(body: Record<string, unknown>) {
  return apiFetch<ReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getBackendReport(reportId: number) {
  return apiFetch<ReportResponse>(`/reports/${reportId}`);
}

export function createBackendWatchlistItem(body: {
  parcel_id: number;
  label?: string;
  notification_channels?: string[];
}) {
  return apiFetch<Record<string, unknown>>("/watchlist", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getBackendWatchlist() {
  return apiFetch<Array<Record<string, unknown>>>("/watchlist");
}

export function deleteBackendWatchlistItem(itemId: string | number) {
  return apiFetch<Record<string, unknown>>(`/watchlist/${itemId}`, {
    method: "DELETE"
  });
}

export function simulateBackendVolume(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/simulation/building/volume", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function simulateBackendCompliance(body: Record<string, unknown>) {
  return apiFetch<ComplianceSimulationResponse>("/simulation/compliance", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getBackendMapLayers() {
  return apiFetch<{ layers?: BackendMapLayerResponse[] } | BackendMapLayerResponse[]>("/map/layers");
}

export function listSources() {
  return apiFetch<SourceRegistryRecord[]>("/sources");
}

export function getSourceHealth() {
  return apiFetch<SourceHealthRecord[] | { sources?: SourceHealthRecord[]; [key: string]: unknown }>("/sources/health");
}

function normalizeSourceQualityRecord(record: SourceQualityRecord): SourceQualityRecord {
  return {
    ...record,
    coverage: record.coverage ?? {
      has_geometry: false,
      has_imar: false,
      has_aski: false,
      has_documents: false,
      capabilities: []
    },
    geometry_available: record.geometry_available === true,
    imar_available: record.imar_available === true,
    aski_available: record.aski_available === true,
    history_available: record.history_available === true,
    endpoint_count: record.endpoint_count ?? 0,
    discovered_endpoints: Array.isArray(record.discovered_endpoints) ? record.discovered_endpoints : [],
    recent_probe_events: Array.isArray(record.recent_probe_events) ? record.recent_probe_events : undefined,
    probe_events: Array.isArray(record.probe_events) ? record.probe_events : undefined,
    consecutive_failures: record.consecutive_failures ?? 0
  };
}

function normalizeSourceQualityResponse(payload: SourceQualityResponse): SourceQualityResponse {
  const sources = Array.isArray(payload.sources) ? payload.sources.map(normalizeSourceQualityRecord) : [];
  return {
    ...payload,
    status: payload.status ?? "unavailable",
    fetched_at: payload.fetched_at ?? new Date().toISOString(),
    history_available: payload.history_available === true,
    total: typeof payload.total === "number" ? payload.total : sources.length,
    live_checked: payload.live_checked === true,
    rollup: payload.rollup ?? {},
    sources
  };
}

export async function getSourceQuality(params: {
  limit?: number;
  live_check?: boolean;
  category?: string;
  capability?: string;
} = {}) {
  const payload = await apiFetch<SourceQualityResponse>(`/sources/quality${queryString(params)}`);
  return normalizeSourceQualityResponse(payload);
}

export async function getSourceQualityDetail(sourceId: string, liveCheck = false) {
  const payload = await apiFetch<SourceQualityResponse>(`/sources/quality/${sourceId}${queryString({ live_check: liveCheck })}`);
  return normalizeSourceQualityResponse(payload);
}

export function getSourceActivation(params: { limit?: number; live_check?: boolean; force?: boolean } = {}) {
  return apiFetch<SourceActivationResponse>(`/sources/activation${queryString(params)}`);
}

export function discoverSource(sourceId: string) {
  return apiFetch<Record<string, unknown>>(`/sources/${sourceId}/discover`, { method: "POST" });
}

export function discoverMunicipalityGis(slug: string, force = false) {
  return apiFetch<MunicipalGISDiscoveryResponse>(`/municipalities/${slug}/discover${queryString({ force })}`, {
    method: "POST"
  });
}

export function listMunicipalityGisEndpoints(slug: string) {
  return apiFetch<MunicipalGISEndpointListResponse>(`/municipalities/${slug}/gis-endpoints`);
}

export function refreshMunicipalityGisEndpoints(slug: string) {
  return apiFetch<MunicipalGISDiscoveryResponse>(`/municipalities/${slug}/gis-endpoints/refresh`, {
    method: "POST"
  });
}

export function getLiveMapLayers() {
  return apiFetch<{ layers?: BackendMapLayerResponse[] } | BackendMapLayerResponse[]>("/map/live-layers");
}

export function probeLiveMapLayer(sourceId: string, endpointUrl?: string, layerName?: string) {
  return apiFetch<LiveMapLayerProbeResponse>(`/map/live-layers/probe${queryString({ source_id: sourceId, endpoint_url: endpointUrl, layer_name: layerName })}`);
}

export function getBackendPlans() {
  return apiFetch<PlanResponse[]>("/plans");
}

export function getBackendAskiPlans() {
  return apiFetch<PlanResponse[]>("/plans/aski");
}

export function getBackendLatestRegions(params: {
  limit?: number;
  province?: string;
  district?: string;
  municipality_slug?: string;
  has_geometry?: boolean;
} = {}) {
  return apiFetch<LatestRegionsResponse>(`/plans/latest-regions${queryString(params)}`);
}
