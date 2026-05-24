import type {
  AskiActiveResponse,
  AskiGeoJsonResponse,
  MunicipalityCoverageResponse,
  MunicipalParcelWorkflowResponse,
  OgcLayerCatalogResponse,
  Result,
  SourceDetailResponse,
  SourceEntry,
  SourceHealthResponse,
  SourceProbe,
  SourceStatusEntry,
  SourcesResponse,
  WebsiteSearchResponse,
} from "@/lib/api/types";
import {
  FALLBACK_SOURCE_HEALTH,
  FALLBACK_SOURCES_RESPONSE,
  getFallbackSourceDetail,
} from "@/data/generated/source-fixtures";

const API_PROXY_BASE = "/api/v1";

async function request<T>(path: string): Promise<Result<T>> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    const json = (await response.json()) as T;
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return { ok: true, data: json };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.sources)) return payload.sources;
  if (Array.isArray(payload.data)) return payload.data;
  if (isRecord(payload.data)) {
    if (Array.isArray(payload.data.sources)) return payload.data.sources;
    if (Array.isArray(payload.data.results)) return payload.data.results;
    if (Array.isArray(payload.data.items)) return payload.data.items;
  }
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function responseRecord(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? { ...payload.data, ...payload } : payload;
}

function normalizeSourceEntry(value: unknown): SourceEntry | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id ?? value.source_id ?? value.key);
  const name = readString(value.name ?? value.title, id);
  const baseUrl = readString(
    value.base_url ??
      value.homepage_url ??
      value.homepageUrl ??
      value.endpoint_url ??
      value.service_url,
  );
  if (!id || !name || !baseUrl) return null;
  const requiresCredentials = value.requires_credentials === true;
  const requiresApproval = value.requires_approval === true;
  const rawAuth = readString(value.auth ?? value.accessStatus);
  const auth =
    rawAuth ||
    (requiresCredentials
      ? "requires_credentials"
      : requiresApproval
        ? "requires_legal_agreement"
        : "metadata_only");
  const category = readString(
    value.category ?? value.kind ?? value.type,
    "catalog",
  );
  const provider = readString(
    value.provider ?? value.vendor ?? value.kind ?? value.type,
    "registry",
  );
  const discoveryStrategy = readString(
    value.discovery_strategy ?? value.kind ?? value.type,
    "registry",
  );
  const capabilities = readStringArray(value.capabilities);
  return {
    id,
    name,
    base_url: baseUrl,
    provider,
    auth,
    category,
    discovery_strategy: discoveryStrategy,
    capabilities,
    municipality_name: readNullableString(
      value.municipality_name ??
        value.municipalityName ??
        value.district ??
        value.province,
    ),
    notes: readNullableString(
      value.notes ?? value.accessNotes ?? value.message,
    ),
  };
}

function endpointStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item))
        return readString(item.url ?? item.endpoint ?? item.href);
      return "";
    })
    .filter((item) => item.length > 0);
}

function normalizeProbe(value: unknown): SourceProbe {
  const record: Record<string, unknown> = isRecord(value) ? value : {};
  return {
    status: readString(
      record.status ?? record.raw_status ?? record.accessStatus,
      "unknown",
    ),
    http_status: readNumber(record.http_status),
    latency_ms: readNumber(record.latency_ms),
    discovered_endpoints: endpointStrings(
      record.discovered_endpoints ??
        record.candidate_endpoints ??
        record.endpoints,
    ),
    message: readNullableString(
      record.message ??
        record.failure_reason ??
        record.user_message ??
        record.notes,
    ),
  };
}

function normalizeSourcesResponse(payload: unknown): SourcesResponse | null {
  const sources = sourceItems(payload)
    .map(normalizeSourceEntry)
    .filter((source): source is SourceEntry => Boolean(source));
  if (!sources.length) return null;
  const record = responseRecord(payload);
  return {
    status: readString(record.status, "ok"),
    message: readNullableString(record.message) ?? undefined,
    next_actions: readStringArray(record.next_actions),
    fetched_at: readNullableString(record.fetched_at) ?? undefined,
    total: readNumber(record.total) ?? sources.length,
    sources,
  };
}

function normalizeHealthResponse(
  payload: unknown,
): SourceHealthResponse | null {
  const sources = sourceItems(payload)
    .map((item) => {
      const source = normalizeSourceEntry(item);
      if (!source) return null;
      return { ...source, ...normalizeProbe(item) };
    })
    .filter((source): source is SourceEntry & SourceProbe => Boolean(source));
  if (!sources.length) return null;
  const record = responseRecord(payload);
  const rollup = isRecord(record.rollup)
    ? (Object.fromEntries(
        Object.entries(record.rollup).filter(
          ([, value]) => typeof value === "number",
        ),
      ) as Record<string, number>)
    : sources.reduce<Record<string, number>>((acc, source) => {
        acc[source.status] = (acc[source.status] ?? 0) + 1;
        return acc;
      }, {});
  return {
    status: readString(record.status, "ok"),
    message: readNullableString(record.message) ?? undefined,
    next_actions: readStringArray(record.next_actions),
    fetched_at: readNullableString(record.fetched_at) ?? undefined,
    total: readNumber(record.total) ?? sources.length,
    rollup,
    sources,
  };
}

function normalizeDetailResponse(
  payload: unknown,
): SourceDetailResponse | null {
  const record = responseRecord(payload);
  if (!Object.keys(record).length) return null;
  const source = normalizeSourceEntry(record.source ?? record);
  if (!source) return null;
  return {
    status: readString(record.status, "ok"),
    message: readNullableString(record.message) ?? undefined,
    next_actions: readStringArray(record.next_actions),
    fetched_at: readNullableString(record.fetched_at) ?? undefined,
    source,
    probe: normalizeProbe(record.probe ?? record),
  };
}

export async function fetchSources(): Promise<Result<SourcesResponse>> {
  const result = await request<unknown>("/api/v1/sources");
  if (result.ok) {
    const normalized = normalizeSourcesResponse(result.data);
    if (normalized) return { ok: true as const, data: normalized };
  }
  return { ok: true as const, data: FALLBACK_SOURCES_RESPONSE };
}

export async function fetchSourceHealth(): Promise<
  Result<SourceHealthResponse>
> {
  const result = await request<unknown>("/api/v1/sources/health");
  if (result.ok) {
    const normalized = normalizeHealthResponse(result.data);
    if (normalized) return { ok: true as const, data: normalized };
  }
  return { ok: true as const, data: FALLBACK_SOURCE_HEALTH };
}

export async function fetchSourceDetail(
  sourceId: string,
): Promise<Result<SourceDetailResponse>> {
  const result = await request<unknown>(
    `/api/v1/sources/${encodeURIComponent(sourceId)}`,
  );
  if (result.ok) {
    const normalized = normalizeDetailResponse(result.data);
    if (normalized) return { ok: true as const, data: normalized };
  }
  const fallback = getFallbackSourceDetail(sourceId);
  if (fallback) return { ok: true as const, data: fallback };
  return {
    ok: false as const,
    error: result.ok ? "Unexpected source response" : result.error,
  };
}

export function reprobeSource(sourceId: string) {
  return fetch(
    `${API_PROXY_BASE}/sources/${encodeURIComponent(sourceId)}/probe`,
    { method: "POST" },
  )
    .then(async (response) => {
      const json = (await response.json()) as unknown;
      if (!response.ok)
        return { ok: false as const, error: `HTTP ${response.status}` };
      const normalized = normalizeDetailResponse(json);
      if (normalized) return { ok: true as const, data: normalized };
      const fallback = getFallbackSourceDetail(sourceId);
      if (fallback) return { ok: true as const, data: fallback };
      return { ok: false as const, error: "Unexpected source response" };
    })
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
}

export function fetchActiveAski() {
  return request<AskiActiveResponse>(`${API_PROXY_BASE}/aski/active`);
}

export function fetchActiveAskiGeoJSON() {
  return request<AskiGeoJsonResponse>(`${API_PROXY_BASE}/aski/active/geojson`);
}

export function fetchMunicipalityCoverage(params?: {
  province?: string;
  district?: string;
  vendor?: string;
  accessStatus?: string;
}) {
  const search = new URLSearchParams();
  if (params?.province) search.set("province", params.province);
  if (params?.district) search.set("district", params.district);
  if (params?.vendor) search.set("vendor", params.vendor);
  if (params?.accessStatus) search.set("accessStatus", params.accessStatus);
  const query = search.toString();
  return request<MunicipalityCoverageResponse>(
    `${API_PROXY_BASE}/sources/municipality-coverage${query ? `?${query}` : ""}`,
  );
}

export function fetchSourceStatus() {
  return request<SourceStatusEntry[]>(`${API_PROXY_BASE}/sources/status`);
}

export function searchWebsite(payload: {
  query: string;
  municipalityId?: string;
}) {
  return fetch(`/website/bff/search`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const json = (await response.json()) as WebsiteSearchResponse;
      if (!response.ok)
        return { ok: false as const, error: `HTTP ${response.status}` };
      return { ok: true as const, data: json };
    })
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
}

export function fetchMunicipalParcelWorkflow(payload: {
  province?: string;
  district?: string;
  municipalityId?: string;
  municipalitySlug?: string;
  mahalle?: string;
  ada?: string;
  parsel?: string;
  lng?: number;
  lat?: number;
}) {
  return fetch(`/website/bff/municipal-parcel-workflow`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const json = (await response.json()) as MunicipalParcelWorkflowResponse;
      if (!response.ok)
        return { ok: false as const, error: `HTTP ${response.status}` };
      return { ok: true as const, data: json };
    })
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
}

export function fetchOgcCatalog(
  sourceId: string,
  params?: { endpoint?: string; service?: "WMS" | "WFS" },
) {
  return fetch(`/connectors/${encodeURIComponent(sourceId)}/ogc/catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: params?.endpoint,
      service: params?.service ?? "WMS",
    }),
    cache: "no-store",
  })
    .then(async (response) => {
      const json = (await response.json()) as OgcLayerCatalogResponse;
      if (!response.ok) {
        return { ok: false as const, error: `HTTP ${response.status}` };
      }
      return { ok: true as const, data: json };
    })
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
}
