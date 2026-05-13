import type {
  BackendMapLayerResponse,
  ComplianceSimulationResponse,
  MunicipalGISDiscoveryResponse,
  MunicipalGISEndpointListResponse,
  MunicipalGISEndpointRecord,
  LatestRegionsResponse,
  ParcelResponse,
  PlanResponse,
  ReportResponse,
  SourceHealthRecord,
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
  return apiFetch<SourceHealthRecord[]>("/sources/health");
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
