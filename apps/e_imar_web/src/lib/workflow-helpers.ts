import type {
  MunicipalityCoverageEntry,
  MunicipalParcelWorkflowResponse,
  OgcLayerCatalogEntry,
  ProvenanceRecord
} from "@/lib/api/types";

const SECRET_PARAM_KEYS = [
  "token",
  "apikey",
  "api_key",
  "key",
  "auth",
  "authorization",
  "access_token",
  "password"
];

export function sanitizeEndpointUrl(raw?: string | null, maxLength = 120): string {
  if (!raw) return "—";
  try {
    const url = new URL(raw);
    for (const key of SECRET_PARAM_KEYS) url.searchParams.delete(key);
    url.hash = "";
    const value = url.toString();
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  } catch {
    const value = raw.replace(/\s+/g, " ").trim();
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }
}

export function shortenResponseHash(hash?: string | null) {
  if (!hash) return null;
  return hash.length > 12 ? `${hash.slice(0, 12)}…` : hash;
}

export function formatConfidenceLabel(confidence?: number | null) {
  if (confidence == null || Number.isNaN(confidence)) return "—";
  const normalized = Math.max(0, Math.min(1, confidence));
  const percent = Math.round(normalized * 100);
  if (percent >= 80) return `yüksek %${percent}`;
  if (percent >= 50) return `orta %${percent}`;
  return `düşük %${percent}`;
}

export function noDataReasonLabel(status?: string | null, source?: { accessStatus?: string; protected?: boolean } | null) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("public_discovery") || normalized.includes("active_public_source")) return "Public kaynak bulundu; servis alanları provenance ile çözülüyor";
  if (normalized.includes("captcha") || normalized.includes("protected")) return "Kaynak captcha/login gerektiriyor";
  if (normalized.includes("source_not_found")) return "Belediye kaynağı registry içinde bulunamadı";
  if (source?.protected || source?.accessStatus === "requires_credentials" || source?.accessStatus === "requires_legal_agreement") {
    return "Kaynak captcha/login veya onaylı erişim gerektiriyor";
  }
  return "Public kaynak keşfi henüz tamamlanmadı";
}

export function summarizeMunicipalityCoverage(entries: MunicipalityCoverageEntry[]) {
  const counts = {
    registered: entries.filter((entry) => Boolean(entry.capability?.registered ?? true)).length,
    publicCandidate: entries.filter((entry) => Boolean(entry.capability?.publicCandidate)).length,
    protected: entries.filter((entry) => Boolean(entry.capability?.protected)).length,
    publicSupported: entries.filter((entry) => entry.capability?.imarQuerySupport === "supported").length
  };
  return counts;
}

export function filterMunicipalityCoverage(
  entries: MunicipalityCoverageEntry[],
  filters: { province?: string; district?: string; vendor?: string; accessStatus?: string }
) {
  const province = normalize(filters.province);
  const district = normalize(filters.district);
  const vendor = normalize(filters.vendor);
  const accessStatus = normalize(filters.accessStatus);
  return entries.filter((entry) => {
    if (province && normalize(entry.province) !== province) return false;
    if (district && normalize(entry.district) !== district) return false;
    if (vendor && normalize(entry.vendor) !== vendor) return false;
    if (accessStatus && normalize(entry.accessStatus) !== accessStatus) return false;
    return true;
  });
}

export function formatWorkflowProvenance(result?: MunicipalParcelWorkflowResponse | null) {
  const records = result?.provenance ?? [];
  return records.map((record) => ({
    sourceName: record.sourceName,
    sourceId: record.sourceId,
    endpoint: sanitizeEndpointUrl(record.endpoint),
    fetchedAt: record.fetchedAt,
    responseHash: shortenResponseHash(record.responseHash) ?? undefined,
    dataType: record.dataType,
    confidenceLabel: formatConfidenceLabel(record.confidence),
    status: record.status
  }));
}

export function normalizeOgcLayer(layer: OgcLayerCatalogEntry) {
  return {
    name: layer.name ?? "—",
    title: layer.title ?? layer.name ?? "—",
    queryable: Boolean(layer.queryable),
    crs: layer.crs?.length ? layer.crs.join(", ") : layer.srs?.join(", ") ?? "—",
    bbox: formatBbox(layer.bbox)
  };
}

export function buildWmsTileUrl(
  endpoint: string,
  layerName: string,
  options?: { styles?: string; format?: string; transparent?: boolean; version?: "1.1.1" | "1.3.0"; crs?: string }
) {
  const url = new URL(endpoint);
  for (const key of SECRET_PARAM_KEYS) url.searchParams.delete(key);
  url.hash = "";
  const base = url.toString();
  const separator = base.includes("?") ? "&" : "?";
  const version = options?.version ?? "1.1.1";
  const params = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: version,
    LAYERS: layerName,
    STYLES: options?.styles ?? "",
    FORMAT: options?.format ?? "image/png",
    TRANSPARENT: options?.transparent === false ? "false" : "true",
    BBOX: "{bbox-epsg-3857}",
    WIDTH: "256",
    HEIGHT: "256"
  });
  if (version === "1.3.0") params.set("CRS", options?.crs ?? "EPSG:3857");
  else params.set("SRS", options?.crs ?? "EPSG:3857");
  return `${base}${separator}${params.toString()}`;
}

function normalize(value?: string) {
  return value?.trim().toLocaleLowerCase("tr-TR");
}

function formatBbox(bbox: unknown): string {
  if (!bbox || typeof bbox !== "object") return "—";
  if (Array.isArray(bbox) && bbox.length >= 4) {
    return bbox.slice(0, 4).map((value) => String(value)).join(", ");
  }
  const record = bbox as Record<string, unknown>;
  const parts = ["minx", "miny", "maxx", "maxy", "west", "south", "east", "north"]
    .map((key) => record[key])
    .filter((value) => value != null)
    .slice(0, 4);
  return parts.length > 0 ? parts.map((value) => String(value)).join(", ") : "—";
}
