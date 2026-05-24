import { ACTIVE_PLANS } from "@/data/active-plans";
import { BELEDIYE_LIST } from "@/data/belediye";
import { FALLBACK_SOURCE_HEALTH, FALLBACK_SOURCES } from "@/data/generated/source-fixtures";
import { getParcelByMapId, searchParcels } from "@/data/parcels";
import { PROVINCES } from "@/data/provinces";
import type {
  LatestRegionResponse,
  LatestRegionsResponse,
  ParcelContextResponse,
  ParcelSummaryResponse,
  PlanResponse,
  ReportResponse,
  SourceActivationResponse,
  SourceHealthRecord,
  SourceQualityRecord,
  SourceQualityResponse,
  SourceRegistryRecord,
  WebsiteBootstrapResponse,
  WebsiteLiveReadinessResponse,
  WebsiteWorkspaceResponse
} from "@/types/api";
import type { ParcelProps } from "@/types/parcel";
import type {
  MunicipalParcelWorkflowResponse,
  MunicipalityCoverageEntry,
  MunicipalityCoverageResponse,
  OgcLayerCatalogResponse
} from "@/lib/api/types";

const NOW = () => new Date().toISOString();

function demoParcelProps(backendId: number): ParcelProps | undefined {
  return getParcelByMapId(backendId)?.properties;
}

function buildRelatedPlans(parcel: ParcelProps) {
  const planIndex = ACTIVE_PLANS.findIndex(
    (entry) => entry.province === parcel.il && entry.district === parcel.ilce
  );
  const plan = ACTIVE_PLANS[planIndex >= 0 ? planIndex : 0];
  return [
    {
      id: (planIndex >= 0 ? planIndex : 0) + 1,
      label: plan.title,
      municipality_name: parcel.ilce,
      municipality_slug: null,
      province: parcel.il,
      district: parcel.ilce,
      status: parcel.planStatus ?? "yururlukte",
      plan_type: plan.planType,
      aski_start: null,
      aski_end: null,
      pdf_url: null,
      gml_url: null,
      has_geometry: true,
      relation: "district_match"
    }
  ];
}

export function buildDemoParcelContext(backendId: number): ParcelContextResponse | null {
  const parcel = demoParcelProps(backendId);
  if (!parcel) return null;
  const related = buildRelatedPlans(parcel);
  return {
    parcel: {
      id: backendId,
      ada: parcel.ada,
      parsel: parcel.parsel,
      il: parcel.il,
      ilce: parcel.ilce,
      mahalle: parcel.mahalle,
      source_status: "demo"
    },
    quality: {
      geometry_available: true,
      source_status: "demo",
      source_name: "Örnek parsel katmanı",
      confidence: 0.72,
      confidence_label: "medium",
      quality_hints: ["Demo modu", "Resmi kadastro kaydı değildir"],
      plan_match_status: "matched",
      aski_match_status: parcel.aski?.durum === "askida" ? "matched" : "none",
      imar_params_status: "known",
      message: "Örnek parsel verisi"
    },
    match_method: "district",
    related_plans: related,
    active_aski_plans: parcel.aski?.durum === "askida" ? related : [],
    total_related: related.length,
    geometry_included: true,
    history_available: false,
    generated_at: NOW(),
    message: "Demo modu özet bağlamı"
  };
}

export function buildDemoParcelSummary(backendId: number): ParcelSummaryResponse | null {
  const parcel = demoParcelProps(backendId);
  if (!parcel) return null;
  const related = buildRelatedPlans(parcel);
  return {
    parcel: {
      id: backendId,
      ada: parcel.ada,
      parsel: parcel.parsel,
      il: parcel.il,
      ilce: parcel.ilce,
      mahalle: parcel.mahalle,
      source_status: "demo"
    },
    location: {
      il: parcel.il,
      ilce: parcel.ilce,
      mahalle: parcel.mahalle,
      municipality: parcel.ilce
    },
    geometry_status: "available",
    source_trust: {
      source_status: "demo",
      source_message: "Örnek veri katmanı",
      source_name: "Açık/kayıtlı parsel verisi"
    },
    related_plan_count: related.length,
    related_aski_count: parcel.aski?.durum === "askida" ? 1 : 0,
    report_eligibility: "eligible_with_warnings",
    warnings: ["Demo modu: rapor PDF üretimi simüle edilir, resmi belge değildir."],
    generated_at: NOW()
  };
}

function demoAskiPlans(): PlanResponse[] {
  return ACTIVE_PLANS.slice(0, 18).map((plan, index) => ({
    id: index + 1,
    municipality_id: index + 1,
    plan_type: plan.planType,
    status: "askida",
    aski_start: plan.registeredAt,
    aski_end: plan.registeredAt,
    pdf_url: undefined,
    created_at: plan.registeredAt,
    gml_url: undefined,
    geom_geojson: {
      type: "Point",
      coordinates: plan.center
    }
  }));
}

function demoLatestRegions(): LatestRegionsResponse {
  const items: LatestRegionResponse[] = ACTIVE_PLANS.slice(0, 12).map((plan, index) => ({
    id: index + 1,
    label: plan.title,
    municipality_name: plan.district,
    province: plan.province,
    district: plan.district,
    plan_type: plan.planType,
    status: "askida",
    aski_start: plan.registeredAt,
    source: "demo",
    has_geometry: true,
    geom_geojson: {
      type: "Point",
      coordinates: plan.center
    }
  }));
  return {
    items,
    total: items.length,
    geometry_count: items.length,
    status: "demo",
    message: "Demo modu: örnek imar bölgeleri"
  };
}

function demoSourceRegistry(): SourceRegistryRecord[] {
  return FALLBACK_SOURCES.slice(0, 24).map((source) => ({
    id: source.id,
    name: source.name,
    kind: source.category,
    homepage_url: source.base_url,
    base_url: source.base_url,
    provider: source.provider,
    auth: source.auth,
    category: source.category,
    discovery_strategy: source.discovery_strategy,
    capabilities: source.capabilities,
    municipality_name: source.municipality_name,
    requires_credentials: source.auth.includes("requires"),
    requires_approval: source.auth.includes("requires")
  }));
}

function demoSourceHealth(): SourceHealthRecord[] {
  return FALLBACK_SOURCE_HEALTH.sources.map((source) => ({
    source_id: source.id,
    name: source.name,
    homepage_url: source.base_url,
    status: source.status === "live" ? "live" : "external_only",
    http_status: source.http_status,
    checked_url: source.base_url,
    requires_credentials: source.auth.includes("requires"),
    requires_approval: source.auth.includes("requires")
  }));
}

function demoSourceQuality(): SourceQualityResponse {
  const sources: SourceQualityRecord[] = demoSourceRegistry().slice(0, 12).map((source, index) => ({
    source_id: source.id,
    key: source.id,
    name: source.name,
    province: source.province ?? null,
    district: source.district ?? null,
    municipality_name: source.municipality_name ?? null,
    category: source.category ?? "catalog",
    status: index % 3 === 0 ? "live" : "public_metadata",
    coverage: {
      has_geometry: index % 2 === 0,
      has_imar: true,
      has_aski: index % 4 === 0,
      has_documents: false,
      capabilities: source.capabilities ?? []
    },
    geometry_available: index % 2 === 0,
    imar_available: true,
    aski_available: index % 4 === 0,
    history_available: false,
    endpoint_count: 1,
    discovered_endpoints: (source.candidate_endpoints ?? []).map((url) => ({ url })),
    consecutive_failures: 0
  }));
  return {
    status: "demo",
    fetched_at: NOW(),
    history_available: false,
    total: sources.length,
    live_checked: false,
    rollup: { demo: sources.length },
    sources
  };
}

function demoSourceActivation(): SourceActivationResponse {
  const sources = demoSourceRegistry().slice(0, 8).map((source, index) => ({
    sourceId: source.id,
    name: source.name,
    jurisdiction: source.municipality_name ? "municipal" : "national",
    category: source.category ?? "catalog",
    homepageUrl: source.homepage_url ?? source.base_url ?? "",
    accessStatus: "public_metadata",
    runtimeStatus: index % 2 === 0 ? "live" : "metadata_only",
    activationStatus: "metadata_only" as const,
    capabilities: source.capabilities ?? [],
    connectorKinds: ["public-portal"],
    usableEndpoints: source.candidate_endpoints ?? [],
    nextAction: "Demo modu kayıt özeti",
    provenance: [
      {
        endpoint: source.base_url ?? "",
        status: "demo",
        confidence: 0.6
      }
    ],
    lastCheckedAt: NOW()
  }));
  return {
    status: "demo",
    generatedAt: NOW(),
    liveChecked: false,
    summary: {
      total: sources.length,
      active: 2,
      blocked: 0,
      needsContract: 1,
      metadataOnly: sources.length - 2,
      unavailable: 0,
      byActivationStatus: { metadata_only: sources.length },
      byCategory: { catalog: sources.length },
      byJurisdiction: { national: sources.length }
    },
    sources
  };
}

function demoLiveReadiness(): WebsiteLiveReadinessResponse {
  return {
    status: "ok",
    generatedAt: NOW(),
    deployment: {
      apiBaseUrl: null,
      httpsReady: false,
      requiredEnv: [
        { key: "NEXT_PUBLIC_EIMAR_DATA_MODE", configured: true, purpose: "demo" },
        { key: "NEXT_PUBLIC_MAPTILER_KEY", configured: false, purpose: "opsiyonel harita" },
        { key: "NEXT_PUBLIC_EIMAR_API_BASE_URL", configured: false, purpose: "canlı API (demo kapalı)" }
      ]
    },
    sources: [
      {
        sourceId: "demo-parcels",
        sourceName: "Örnek parsel katmanı",
        category: "other",
        status: "public_metadata",
        checkedAt: NOW(),
        dataType: "public_metadata",
        message: "Harita üzerinde örnek parseller gösteriliyor.",
        nextAction: "Canlı API için NEXT_PUBLIC_EIMAR_DATA_MODE=api ayarlayın."
      },
      {
        sourceId: "tkgm-parsel-sorgu",
        sourceName: "TKGM Parsel Sorgu",
        category: "tkgm",
        status: "public_metadata",
        checkedAt: NOW(),
        dataType: "public_metadata",
        message: "Portal referansı; demo modunda otomatik sorgu yapılmaz.",
        nextAction: "Resmi sorgu için TKGM portalını açın."
      },
      {
        sourceId: "csb-e-plan",
        sourceName: "e-Plan",
        category: "eplan",
        status: "public_metadata",
        checkedAt: NOW(),
        dataType: "public_metadata",
        message: "Plan katalog referansı.",
        nextAction: "Canlı plan akışı backend ile açılır."
      }
    ]
  };
}

function demoWebsiteBootstrap(): WebsiteBootstrapResponse {
  return {
    status: "ok",
    sourceCoverage: {
      totalSources: FALLBACK_SOURCES.length,
      municipalSources: 12,
      nationalSources: 8,
      globalSources: 4,
      publicCandidateCount: 18,
      protectedCount: 6,
      lastGeneratedAt: NOW()
    }
  };
}

function demoWebsiteWorkspace(userReference: string): WebsiteWorkspaceResponse {
  return {
    userReference,
    history: { status: "demo", count: 0, items: [] },
    favorites: { status: "demo", count: 0, items: [] },
    subscriptions: { status: "demo", count: 0, subscriptions: [] }
  };
}

function demoMunicipalityCoverage(params?: {
  province?: string;
  district?: string;
}): MunicipalityCoverageResponse {
  const municipalities: MunicipalityCoverageEntry[] = BELEDIYE_LIST.slice(0, 20).map((record) => {
    const province = PROVINCES.find((entry) => entry.slug === record.ilSlug);
    return {
      id: record.id,
      name: record.ad,
      province: province?.name ?? record.ilSlug,
      district: "",
      municipalitySlug: record.id,
      homepageUrl: "",
      accessStatus: "public_metadata",
      capabilities: ["zoning_status", "municipal_gis"],
      connectorKinds: ["municipal_portal"],
      capability: {
        source: null,
        registered: true,
        publicCandidate: true,
        protected: false,
        lastHealth: null,
        imarQuerySupport: "demo",
        parcelGeometrySupport: "demo",
        reasonNoData: "Demo modu: belediye sorgusu simüle edilir.",
        nextAction: "Canlı belediye akışı için API moduna geçin."
      }
    };
  });
  const filtered = municipalities.filter((entry) => {
    if (params?.province && entry.province !== params.province) return false;
    if (params?.district && entry.district !== params.district) return false;
    return true;
  });
  return {
    status: "ok",
    count: filtered.length,
    municipalities: filtered
  };
}

function demoMunicipalWorkflow(payload: Record<string, unknown>): MunicipalParcelWorkflowResponse {
  const ada = String(payload.ada ?? "101");
  const parsel = String(payload.parsel ?? "4");
  const municipalityId = String(payload.municipalityId ?? payload.municipalitySlug ?? "ibb");
  const match = searchParcels(`${ada}/${parsel}`, 1)[0]?.properties;
  return {
    status: "ok",
    query: {
      province: String(payload.province ?? match?.il ?? "İstanbul"),
      district: String(payload.district ?? match?.ilce ?? ""),
      municipalityId,
      municipalitySlug: municipalityId,
      mahalle: String(payload.mahalle ?? match?.mahalle ?? ""),
      ada,
      parsel
    },
    municipalityCapability: {
      source: null,
      registered: true,
      publicCandidate: true,
      protected: false,
      lastHealth: null,
      imarQuerySupport: "demo",
      parcelGeometrySupport: "demo",
      reasonNoData: "Demo modu simülasyonu",
      nextAction: "Gerçek belediye yanıtı için API modu gerekir."
    },
    parcelGeometryAttempt: {
      status: "demo",
      source: "demo-parcels",
      message: "Örnek parsel geometrisi kullanıldı."
    },
    zoningAttempt: {
      status: "demo",
      source: "demo-parcels",
      message: match ? `${match.zoningType} · ${match.detailedUse ?? "genel kullanım"}` : "Örnek imar durumu"
    },
    parcelData: {
      ada,
      parsel,
      imarDurumu: match?.zoningType ?? "Konut",
      planNotu: match?.planNotlari?.[0] ?? "Demo plan notu",
      method: "demo",
      status: "demo"
    },
    noDataReason: "Demo modu: gerçek belediye yanıtı simüle edildi.",
    provenance: [
      {
        sourceId: "demo-parcels",
        sourceName: "Örnek parsel katmanı",
        dataType: "demo",
        confidence: 0.72,
        endpoint: "local://demo-parcels",
        fetchedAt: NOW(),
        responseHash: "demo",
        status: "demo"
      }
    ]
  };
}

function demoOgcCatalog(sourceId: string): OgcLayerCatalogResponse {
  return {
    status: "ok",
    sourceId,
    service: "WMS",
    generatedAt: NOW(),
    endpoint: `https://demo.example.test/wms/${sourceId}`,
    provenance: [
      {
        sourceId: "demo-parcels",
        sourceName: "Demo WMS katalogu",
        dataType: "demo",
        confidence: 0.65,
        endpoint: `https://demo.example.test/wms/${sourceId}`,
        fetchedAt: NOW(),
        status: "demo"
      }
    ],
    layers: [
      {
        name: "imar_plani",
        title: "İmar Planı (demo)",
        crs: ["EPSG:4326"],
        queryable: true
      },
      {
        name: "parsel",
        title: "Parsel Sınırı (demo)",
        crs: ["EPSG:4326"],
        queryable: true
      }
    ]
  };
}

function demoReport(reportId: number): ReportResponse {
  return {
    id: reportId,
    user_id: 1,
    parcel_id: reportId,
    status: "generated",
    pdf_url: undefined,
    created_at: NOW()
  };
}

function stripQuery(path: string) {
  return path.split("?")[0] ?? path;
}

export function resolveDemoApiFixture<T>(path: string, options: RequestInit = {}): T | undefined {
  const normalized = stripQuery(path.replace(/^\/api\/v1/, ""));
  const method = (options.method ?? "GET").toUpperCase();

  if (normalized.startsWith("/parsel/") && normalized.endsWith("/context")) {
    const id = Number(normalized.split("/")[2]);
    const context = buildDemoParcelContext(id);
    return (context ?? { status: "not_found" }) as T;
  }
  if (normalized.startsWith("/parsel/") && normalized.endsWith("/summary")) {
    const id = Number(normalized.split("/")[2]);
    const summary = buildDemoParcelSummary(id);
    return (summary ?? { status: "not_found" }) as T;
  }
  if (normalized.startsWith("/parsel/geometry/")) {
    const id = Number(normalized.split("/")[3]);
    const feature = getParcelByMapId(id);
    return (feature?.geometry ?? { type: "Point", coordinates: [29, 41] }) as T;
  }
  if (normalized.startsWith("/parsel/search") || normalized === "/parsel") {
    return [] as T;
  }
  if (normalized === "/plans/aski") return demoAskiPlans() as T;
  if (normalized.startsWith("/plans/latest-regions")) return demoLatestRegions() as T;
  if (normalized === "/plans") return [] as T;
  if (normalized === "/watchlist") return [] as T;
  if (normalized === "/sources") return demoSourceRegistry() as T;
  if (normalized === "/sources/health") return demoSourceHealth() as T;
  if (normalized.startsWith("/sources/quality")) return demoSourceQuality() as T;
  if (normalized.startsWith("/sources/activation")) return demoSourceActivation() as T;
  if (normalized.startsWith("/map/live-layers")) return { layers: [] } as T;
  if (normalized.startsWith("/reports/") && method === "GET") {
    const id = Number(normalized.split("/")[2]);
    return demoReport(Number.isFinite(id) ? id : 1) as T;
  }
  if (normalized === "/reports/generate" && method === "POST") {
    return demoReport(Math.floor(Date.now() / 1000)) as T;
  }

  return undefined;
}

export function resolveDemoOriginFixture<T>(path: string, options: RequestInit = {}): T | undefined {
  const normalized = stripQuery(path);
  const method = (options.method ?? "GET").toUpperCase();

  if (normalized === "/website/live-readiness") return demoLiveReadiness() as T;
  if (normalized.startsWith("/website/bootstrap")) return demoWebsiteBootstrap() as T;
  if (normalized.startsWith("/website/workspace")) {
    const ref = new URL(`http://local${path}`).searchParams.get("userReference") ?? "demo-user";
    return demoWebsiteWorkspace(ref) as T;
  }
  if (normalized === "/website/bff/municipal-parcel-workflow" && method === "POST") {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    return demoMunicipalWorkflow(body) as T;
  }
  if (normalized === "/website/bff/parcel-market" && method === "POST") {
    return {
      status: "demo",
      request: {},
      providers: [],
      listings: [],
      summary: null,
      analysis: {
        status: "demo",
        provider: null,
        generatedAt: NOW(),
        inputCount: 0,
        confidence: null,
        summary: "Demo modu piyasa analizi",
        bullets: ["Örnek veri"],
        caveats: ["Canlı piyasa verisi demo modunda kapalı."],
        reason: "demo"
      },
      warnings: [],
      caveats: [],
      generatedAt: NOW(),
      freshness: { status: "demo", checkedAt: NOW(), listingCount: 0, providerCount: 0 }
    } as T;
  }

  const apiFixture = resolveDemoApiFixture<T>(`/api/v1${normalized}`, options);
  return apiFixture;
}

export function resolveDemoEimarFixture<T>(path: string): T | undefined {
  if (path.includes("/sources/municipality-coverage")) {
    const query = path.includes("?") ? new URL(`http://local${path}`).searchParams : new URLSearchParams();
    return demoMunicipalityCoverage({
      province: query.get("province") ?? undefined,
      district: query.get("district") ?? undefined
    }) as T;
  }
  if (path.includes("/aski/active")) {
    return {
      status: "ok",
      count: demoAskiPlans().length,
      notices: [],
      sources: [],
      total_sources: 3,
      ok_sources: 3
    } as T;
  }
  return undefined;
}

export function resolveDemoOgcCatalog(sourceId: string): OgcLayerCatalogResponse {
  return demoOgcCatalog(sourceId);
}

export function resolveDemoMunicipalWorkflow(payload: Record<string, unknown>): MunicipalParcelWorkflowResponse {
  return demoMunicipalWorkflow(payload);
}

export function resolveDemoMunicipalityCoverage(params?: {
  province?: string;
  district?: string;
}): MunicipalityCoverageResponse {
  return demoMunicipalityCoverage(params);
}
