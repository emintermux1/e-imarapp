const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  return apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return apiFetch<{ id: number; email: string; message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Parcels
export async function searchParcel(params: { ada?: string; parsel?: string; il?: string; ilce?: string }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.append(k, v); });
  return apiFetch<{ items: import("./types").ParcelResponse[] }>(`/parsel?${qs}`);
}

export async function searchParcelQuery(query: string) {
  return apiFetch<import("./types").ParcelResponse[]>(`/parsel/search?query=${encodeURIComponent(query)}`);
}

export async function getParcelGeometry(parcelId: number) {
  return apiFetch<{ parcel_id: number; ada: string; parsel: string; geojson?: Record<string, unknown>; wkt?: string }>(`/parsel/geometry/${parcelId}`);
}

// Plans
export async function getPlans() {
  return apiFetch<{ items: import("./types").PlanResponse[]; total: number }>("/plans");
}

export async function getAskiPlans() {
  return apiFetch<{ items: import("./types").PlanResponse[]; total: number }>("/plans/aski");
}

export async function getPlan(id: number) {
  return apiFetch<import("./types").PlanResponse>(`/plans/${id}`);
}

// Municipalities
export async function getMunicipalities() {
  return apiFetch<import("./types").MunicipalityResponse[]>("/municipalities");
}

export async function getMunicipality(slug: string) {
  return apiFetch<import("./types").MunicipalityResponse>(`/municipalities/${slug}`);
}

export async function discoverMunicipality(slug: string) {
  return apiFetch<import("./types").MunicipalityDiscoveryResponse>(`/municipalities/${slug}/discover`, {
    method: "POST",
  });
}

export async function getMunicipalityImarStatus(slug: string, ada: string, parsel: string) {
  return apiFetch<import("./types").ImarStatusResponse>(`/municipalities/${slug}/imar-status?ada=${ada}&parsel=${parsel}`);
}

export async function normalizeSourceCandidate(body: {
  url: string;
  name?: string;
  province?: string;
  district?: string;
  probe?: boolean;
}) {
  return apiFetch<import("./types").SourceCandidateNormalizationResponse>("/sources/candidates/normalize", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Map
export async function getMapLayers() {
  return apiFetch<{ service_type: string; identification?: Record<string, unknown>; layers: import("./types").LayerInfo[]; url: string }>("/map/layers");
}

// Reports
export async function generateReport(body: Record<string, unknown>) {
  return apiFetch<import("./types").ReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getReport(id: number) {
  return apiFetch<import("./types").ReportResponse>(`/reports/${id}`);
}

// Watchlist
export async function getWatchlist() {
  return apiFetch<import("./types").WatchlistItemResponse[]>("/watchlist");
}

export async function addWatchlist(body: Record<string, unknown>) {
  return apiFetch<import("./types").WatchlistItemResponse>("/watchlist", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteWatchlist(itemId: number) {
  return apiFetch<{ status: string }>(`/watchlist/${itemId}`, { method: "DELETE" });
}

// Simulation
export async function simulateVolume(body: Record<string, unknown>) {
  return apiFetch<import("./types").BuildingVolumeResponse>("/simulation/building/volume", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function simulateShadow(body: Record<string, unknown>) {
  return apiFetch<import("./types").ShadowAnalysisResponse>("/simulation/shadow", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function simulateCompliance(body: Record<string, unknown>) {
  return apiFetch<import("./types").ComplianceResponse>("/simulation/compliance", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function simulateCesiumTileset(body: Record<string, unknown>) {
  return apiFetch<import("./types").CesiumTilesetResponse>("/simulation/cesium-tileset", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Satellite
export async function satelliteChanges(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/satellite/changes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function satelliteIllegalConstruction(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/satellite/illegal-construction", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function satelliteConstructionProgress(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/satellite/construction-progress", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function satelliteEmptyParcels(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/satellite/empty-parcels", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Analysis
export async function analysisMergeable(parcelIds: number[]) {
  return apiFetch<Record<string, unknown>>("/analysis/mergeable-parcels", {
    method: "POST",
    body: JSON.stringify(parcelIds),
  });
}

export async function analysisValueEstimate(parcelId: number) {
  return apiFetch<Record<string, unknown>>(`/analysis/area-value-estimate?parcel_id=${parcelId}`);
}

export async function analysisImarChanges(oldPlan: Record<string, unknown>, newPlan: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/analysis/detect-imar-changes", {
    method: "POST",
    body: JSON.stringify({ old_plan: oldPlan, new_plan: newPlan }),
  });
}

export async function analysisPlanLegend(pdfUrl: string) {
  return apiFetch<Record<string, unknown>>(`/analysis/parse-plan-legend?pdf_url=${encodeURIComponent(pdfUrl)}`);
}

// User Data
export async function getFavorites() {
  return apiFetch<{ items: Record<string, unknown>[]; total: number }>("/user-data/favorites");
}

export async function saveFavorite(itemType: string, itemId: number, label?: string) {
  return apiFetch<{ status: string; item_type: string; item_id: number }>(`/user-data/favorites?item_type=${itemType}&item_id=${itemId}${label ? `&label=${encodeURIComponent(label)}` : ""}`, { method: "POST" });
}

export async function getHistory() {
  return apiFetch<{ items: Record<string, unknown>[]; total: number }>("/user-data/history");
}

export async function getNearby(lat: number, lon: number, radius = 1000) {
  return apiFetch<{ center: { lat: number; lon: number }; radius_m: number; results: import("./types").NearbyResult[] }>(`/user-data/nearby?lat=${lat}&lon=${lon}&radius_m=${radius}`);
}
