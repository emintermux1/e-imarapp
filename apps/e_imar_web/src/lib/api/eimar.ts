import type {
  AskiActiveResponse,
  AskiGeoJsonResponse,
  MunicipalityCoverageResponse,
  MunicipalParcelWorkflowResponse,
  OgcLayerCatalogResponse,
  Result,
  SourceDetailResponse,
  SourceHealthResponse,
  SourcesResponse,
} from "@/lib/api/types";
import {
  FALLBACK_SOURCE_HEALTH,
  FALLBACK_SOURCES_RESPONSE,
  getFallbackSourceDetail
} from "@/data/generated/source-fixtures";

async function request<T>(path: string): Promise<Result<T>> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    const json = (await response.json()) as T;
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return { ok: true, data: json };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function fetchSources() {
  const result = await request<SourcesResponse>("/api/v1/sources");
  return result.ok ? result : { ok: true as const, data: FALLBACK_SOURCES_RESPONSE };
}

export async function fetchSourceHealth() {
  const result = await request<SourceHealthResponse>("/api/v1/sources/health");
  return result.ok ? result : { ok: true as const, data: FALLBACK_SOURCE_HEALTH };
}

export async function fetchSourceDetail(sourceId: string) {
  const result = await request<SourceDetailResponse>(`/api/v1/sources/${encodeURIComponent(sourceId)}`);
  if (result.ok) return result;
  const fallback = getFallbackSourceDetail(sourceId);
  return fallback ? { ok: true as const, data: fallback } : result;
}

export function reprobeSource(sourceId: string) {
  return fetch(`/api/v1/sources/${encodeURIComponent(sourceId)}/probe`, { method: "POST" })
    .then(async (response) => {
      const json = (await response.json()) as SourceDetailResponse;
      if (!response.ok) return { ok: false as const, error: `HTTP ${response.status}` };
      return { ok: true as const, data: json };
    })
    .catch((error) => ({ ok: false as const, error: error instanceof Error ? error.message : "Unknown error" }));
}

export function fetchActiveAski() {
  return request<AskiActiveResponse>("/api/v1/aski/active");
}

export function fetchActiveAskiGeoJSON() {
  return request<AskiGeoJsonResponse>("/api/v1/aski/active/geojson");
}

export function fetchMunicipalityCoverage(params?: { province?: string; district?: string; vendor?: string; accessStatus?: string }) {
  const search = new URLSearchParams();
  if (params?.province) search.set("province", params.province);
  if (params?.district) search.set("district", params.district);
  if (params?.vendor) search.set("vendor", params.vendor);
  if (params?.accessStatus) search.set("accessStatus", params.accessStatus);
  const query = search.toString();
  return request<MunicipalityCoverageResponse>(`/api/v1/sources/municipality-coverage${query ? `?${query}` : ""}`);
}

export function fetchMunicipalParcelWorkflow(payload: {
  province?: string;
  district?: string;
  municipalityId?: string;
  municipalitySlug?: string;
  mahalle?: string;
  ada?: string;
  parsel?: string;
}) {
  return fetch(`/website/bff/municipal-parcel-workflow`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const json = (await response.json()) as MunicipalParcelWorkflowResponse;
      if (!response.ok) return { ok: false as const, error: `HTTP ${response.status}` };
      return { ok: true as const, data: json };
    })
    .catch((error) => ({ ok: false as const, error: error instanceof Error ? error.message : "Unknown error" }));
}

export function fetchOgcCatalog(sourceId: string, params?: { endpoint?: string; service?: "WMS" | "WFS" }) {
  const search = new URLSearchParams();
  if (params?.endpoint) search.set("endpoint", params.endpoint);
  if (params?.service) search.set("service", params.service);
  const query = search.toString();
  return request<OgcLayerCatalogResponse>(`/connectors/${encodeURIComponent(sourceId)}/ogc/catalog${query ? `?${query}` : ""}`);
}
