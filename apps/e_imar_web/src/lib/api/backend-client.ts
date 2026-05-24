import type {
  BackendMapLayerResponse,
  BackendMapProviderResponse,
  BackendTileStatusResponse,
  ComplianceSimulationResponse,
  AnalysisPipelineResponse,
  AnalysisRunsResponse,
  BackendWatchlistItem,
  BuildingEnvelopeResponse,
  EmsalShareCalculationResponse,
  EplanSearchResponse,
  EplanSubscriptionResponse,
  IngestionRequirementsResponse,
  MergeCandidatesResponse,
  MunicipalGISDiscoveryResponse,
  MunicipalGISEndpointListResponse,
  MunicipalGISEndpointRecord,
  LatestRegionsResponse,
  ParcelContextResponse,
  ParcelResponse,
  ParcelSummaryResponse,
  PlanResponse,
  PremiumModuleState,
  ReportResponse,
  LiveMapLayerProbeResponse,
  SourceHealthRecord,
  SourceQualityRecord,
  SourceQualityResponse,
  SourceActivationResponse,
  SourceRegistryRecord,
  PlanNoteExplainResponse,
  WebsiteBootstrapResponse,
  WebsiteLiveReadinessResponse,
  WebsiteParcelReportResponse,
  WebsiteParcelWorkflowResponse,
  WebsiteSessionStartResponse,
  WebsiteSessionVerifyResponse,
  WebsiteWorkspaceResponse
} from "@/types/api";
import { resolveDemoApiFixture, resolveDemoOriginFixture } from "@/data/demo-api-fixtures";
import { shouldUseDemoFixtures, demoModeLabel } from "@/lib/demo-mode";
import { readPublicBackendBase, toApiOrigin } from "@/lib/public-config";

export const API_BASE = readPublicBackendBase();
export const API_ORIGIN = toApiOrigin(API_BASE);

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
  if (shouldUseDemoFixtures()) {
    if (error instanceof ApiFetchError && error.status == null) {
      return fallback ?? demoModeLabel();
    }
    if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
      return fallback ?? demoModeLabel();
    }
  }
  if (error instanceof ApiFetchError) {
    if (error.status == null) {
      return `Backend erişilemiyor. NestJS API servisinin ${API_BASE} üzerinde çalıştığını kontrol edin.`;
    }
    if (error.status === 404) return fallback ?? "İstenen kayıt canlı API üzerinde bulunamadı.";
    if (error.status >= 500) return "Backend geçici olarak yanıt veremiyor. Servis loglarını kontrol edin.";
    return fallback ?? "API isteği tamamlanamadı; gönderilen parametreleri kontrol edin.";
  }
  if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
    return `Backend erişilemiyor. NestJS API servisinin ${API_BASE} üzerinde çalıştığını kontrol edin.`;
  }
  return fallback ?? "İşlem tamamlanamadı; lütfen tekrar deneyin.";
}

function makeUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function makeOriginUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (shouldUseDemoFixtures()) {
    const fixture = resolveDemoApiFixture<T>(path, options);
    if (fixture !== undefined) return fixture;
  }

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

export async function originFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (shouldUseDemoFixtures()) {
    const fixture = resolveDemoOriginFixture<T>(path, options);
    if (fixture !== undefined) return fixture;
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(makeOriginUrl(path), { ...options, headers });
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

export async function safeOriginFetch<T>(
  path: string,
  fallback: T,
  options: RequestInit = {}
): Promise<T> {
  try {
    return await originFetch<T>(path, options);
  } catch (error) {
    return {
      ...(fallback as Record<string, unknown>),
      error: humanizeApiError(error)
    } as T;
  }
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
  return apiFetch<BackendWatchlistItem[]>("/watchlist");
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

export function getWebsiteBootstrap(userReference?: string) {
  return originFetch<WebsiteBootstrapResponse>(`/website/bootstrap${queryString({ userReference })}`);
}

export function getWebsiteLiveReadiness() {
  return originFetch<WebsiteLiveReadinessResponse>("/website/live-readiness");
}

export function startWebsiteSession(body: { userReference: string; roles?: string[]; expiresInHours?: number }) {
  return originFetch<WebsiteSessionStartResponse>("/website/session/start", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function verifyWebsiteSession(token: string) {
  return originFetch<WebsiteSessionVerifyResponse>("/website/session/verify", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export function getWebsiteWorkspace(userReference: string) {
  return originFetch<WebsiteWorkspaceResponse>(`/website/workspace/${encodeURIComponent(userReference)}`);
}

export function runWebsiteParcelWorkflow(body: {
  userReference?: string;
  query: {
    type?: string;
    ada?: string;
    parselNo?: string;
    municipalityId?: string;
    province?: string;
    district?: string;
    mahalle?: string;
  };
  emsalInput?: {
    parcelAreaM2: number;
    emsal: number;
    taksRatio?: number;
    floorAreaPerUnitM2?: number;
    parkingPerUnit?: number;
    ownerShareRatio?: number;
    contractorShareRatio?: number;
    circulationLossRatio?: number;
  };
}) {
  return originFetch<WebsiteParcelWorkflowResponse>("/website/bff/parcel-workflow", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function generateWebsiteParcelReport(body: {
  query: {
    type?: string;
    ada?: string;
    parselNo?: string;
    municipalityId?: string;
    province?: string;
    district?: string;
    mahalle?: string;
  };
  parcelWorkflow?: Record<string, unknown> | null;
  municipalWorkflow?: Record<string, unknown> | null;
}) {
  return originFetch<WebsiteParcelReportResponse>("/website/bff/parcel-report", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function explainWebsitePlanNote(body: {
  userReference?: string;
  noteText: string;
  audience?: "citizen" | "architect" | "investor";
  maxBullets?: number;
}) {
  return originFetch<PlanNoteExplainResponse>("/website/bff/plan-note-explain", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getAnalysisPipeline() {
  return apiFetch<AnalysisPipelineResponse>("/analysis/pipeline");
}

export function getAnalysisRuns(limit = 20) {
  return apiFetch<AnalysisRunsResponse>(`/analysis/runs${queryString({ limit })}`);
}

export function explainBackendPlanNote(body: {
  noteText: string;
  audience?: "citizen" | "architect" | "investor";
  maxBullets?: number;
}) {
  return apiFetch<PlanNoteExplainResponse>("/analysis/plan-notes/explain", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getBackendBuildingEnvelope(parcelId: string, userReference?: string) {
  return apiFetch<BuildingEnvelopeResponse>(`/simulation/building-envelope/${encodeURIComponent(parcelId)}${queryString({ userReference })}`);
}

export function getBackendMergeCandidates(parcelId: string) {
  return apiFetch<MergeCandidatesResponse>(`/simulation/merge-candidates/${encodeURIComponent(parcelId)}`);
}

export async function getPremiumModuleStates(parcelId?: string, userReference = "web-cockpit") {
  const results = await Promise.allSettled([
    getAnalysisPipeline(),
    getAnalysisRuns(5),
    parcelId ? getBackendBuildingEnvelope(parcelId, userReference) : Promise.resolve<BuildingEnvelopeResponse>({ status: "not_ready", parcelId, issue: { message: "Parsel seçilmedi." } }),
    parcelId ? getBackendMergeCandidates(parcelId) : Promise.resolve<MergeCandidatesResponse>({ status: "not_ready", parcelId, issue: { message: "Parsel seçilmedi." } }),
    searchEplanPlans({ limit: 5 }),
    listEplanSubscriptions(userReference)
  ]);
  const [pipeline, runs, envelope, merge, eplan, subscriptions] = results;
  return [
    stateFromSettled("analysis", "Analiz hattı", pipeline, {
      href: "/calisma-alani",
      actionLabel: "Workspace",
      describe: (value: AnalysisPipelineResponse) => `${value.stages.length} aşama · ${value.storage ?? "storage belirsiz"}`
    }),
    stateFromSettled("analysis-runs", "Analiz çalışmaları", runs, {
      href: "/calisma-alani",
      actionLabel: "Çalışmaları gör",
      describe: (value: AnalysisRunsResponse) => `${value.count ?? value.runs.length} çalışma · ${value.status}`
    }),
    stateFromSettled("building-envelope", "Yapı zarfı", envelope, {
      href: "/emsal",
      actionLabel: "Emsal hesapla",
      describe: (value: BuildingEnvelopeResponse) =>
        value.status === "ok"
          ? `${Math.round(value.envelope?.maxConstructionAreaM2 ?? 0).toLocaleString("tr-TR")} m² inşaat alanı`
          : issueMessage(value.issue, value.status)
    }),
    stateFromSettled("merge-candidates", "Tevhid komşuları", merge, {
      href: "/",
      actionLabel: "Haritada seç",
      describe: (value: MergeCandidatesResponse) =>
        value.status === "ok"
          ? `${value.candidates?.length ?? 0} komşu parsel`
          : value.note ?? issueMessage(value.issue, value.status)
    }),
    stateFromSettled("eplan", "E-plan akışı", eplan, {
      href: "/kaynaklar",
      actionLabel: "Kaynakları aç",
      describe: (value: EplanSearchResponse) =>
        value.status === "ok" || value.status === "empty"
          ? `${value.count ?? value.plans?.length ?? 0} plan · ${value.source ?? "e-plan"}`
          : issueMessage(value.issue, value.status)
    }),
    stateFromSettled("subscriptions", "Plan bildirimleri", subscriptions, {
      href: "/calisma-alani",
      actionLabel: "Abonelikleri gör",
      describe: (value: EplanSubscriptionResponse) =>
        value.status === "ok"
          ? `${value.count ?? value.subscriptions?.length ?? 0} abonelik`
          : issueMessage(value.issue, value.status)
    })
  ];
}

export function calculateBackendEmsalShare(body: {
  parcelAreaM2: number;
  emsal: number;
  taksRatio?: number;
  floorAreaPerUnitM2?: number;
  parkingPerUnit?: number;
  ownerShareRatio?: number;
  contractorShareRatio?: number;
  circulationLossRatio?: number;
}) {
  return apiFetch<EmsalShareCalculationResponse>("/simulation/emsal-share/calculate", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function stateFromSettled<T>(
  key: string,
  title: string,
  result: PromiseSettledResult<T>,
  options: {
    href?: string;
    actionLabel?: string;
    describe: (value: T) => string;
  }
): PremiumModuleState {
  if (result.status === "fulfilled") {
    const status = readStatus(result.value);
    return {
      key,
      title,
      status,
      detail: options.describe(result.value),
      href: options.href,
      actionLabel: options.actionLabel
    };
  }
  return {
    key,
    title,
    status: "unavailable",
    detail: humanizeApiError(result.reason, "Modül şu an canlı endpoint'ten okunamadı."),
    href: options.href,
    actionLabel: options.actionLabel
  };
}

function readStatus(value: unknown) {
  if (value && typeof value === "object" && "status" in value) return String((value as { status?: unknown }).status ?? "ok");
  return "ok";
}

function issueMessage(issue: unknown, fallback: string) {
  if (issue && typeof issue === "object" && "message" in issue) {
    const message = (issue as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function searchEplanPlans(params: {
  province?: string;
  district?: string;
  status?: string;
  planType?: string;
  limit?: number;
} = {}) {
  return apiFetch<EplanSearchResponse>(`/eplan/search${queryString(params)}`);
}

export function getEplanAskidakiPlans(params: { province?: string; district?: string } = {}) {
  return apiFetch<EplanSearchResponse>(`/eplan/askidaki-planlar${queryString(params)}`);
}

export function listEplanSubscriptions(userReference: string) {
  return apiFetch<EplanSubscriptionResponse>(`/eplan/subscriptions${queryString({ userReference })}`);
}

export function upsertEplanSubscription(body: {
  userReference: string;
  channel: "webhook" | "push";
  target: string;
  platform?: string;
  metadata?: Record<string, unknown>;
  active?: boolean;
}) {
  return apiFetch<EplanSubscriptionResponse>("/eplan/subscriptions", {
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

export function getBackendTileStatus() {
  return apiFetch<BackendTileStatusResponse>("/map/tiles/status");
}

export function getBackendMapProviders() {
  return apiFetch<BackendMapProviderResponse[]>("/map/providers");
}

export function getBackendMapProviderHealth() {
  return apiFetch<Record<string, unknown>>("/map/providers/health");
}

export function getIngestionRequirements() {
  return apiFetch<IngestionRequirementsResponse>("/ingestion/requirements");
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
