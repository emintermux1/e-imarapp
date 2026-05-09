import type {
  AskiActiveResponse,
  AskiGeoJsonResponse,
  Result,
  SourceDetailResponse,
  SourceHealthResponse,
  SourcesResponse,
} from "@/lib/api/types";

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

export function fetchSources() {
  return request<SourcesResponse>("/api/v1/sources");
}

export function fetchSourceHealth() {
  return request<SourceHealthResponse>("/api/v1/sources/health");
}

export function fetchSourceDetail(sourceId: string) {
  return request<SourceDetailResponse>(`/api/v1/sources/${encodeURIComponent(sourceId)}`);
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
