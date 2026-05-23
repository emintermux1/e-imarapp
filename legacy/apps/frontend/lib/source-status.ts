export type SourceProbeStatus =
  | "verified_live"
  | "official_contract_required"
  | "method_contract_required"
  | "protected"
  | "requires_credentials"
  | "captcha_required"
  | "public_metadata"
  | "not_ready"
  | "source_not_found"
  | "unavailable"
  | "ok";

export type SourceCategory = "tkgm" | "municipality" | "eplan" | "other";

export type ProductizedSourceProbe = {
  sourceId: string;
  sourceName: string;
  category: SourceCategory;
  status: SourceProbeStatus;
  endpoint?: string | null;
  checkedAt?: string | null;
  dataType: "official" | "public_metadata" | "derived" | "demo" | "unavailable";
  message: string;
  nextAction?: string;
  evidenceHash?: string;
};

export type StatusTone = "good" | "info" | "warn" | "blocked" | "neutral";

const STATUS_COPY: Record<SourceProbeStatus, { label: string; tone: StatusTone; official: boolean }> = {
  verified_live: { label: "Canlı doğrulandı", tone: "good", official: true },
  ok: { label: "Hazır", tone: "good", official: false },
  public_metadata: { label: "Metadata", tone: "info", official: false },
  official_contract_required: { label: "Resmî contract gerekli", tone: "warn", official: false },
  method_contract_required: { label: "Method contract gerekli", tone: "warn", official: false },
  protected: { label: "Korumalı kaynak", tone: "blocked", official: false },
  requires_credentials: { label: "Yetki gerekli", tone: "blocked", official: false },
  captcha_required: { label: "Captcha var", tone: "blocked", official: false },
  not_ready: { label: "Hazır değil", tone: "warn", official: false },
  source_not_found: { label: "Kaynak yok", tone: "neutral", official: false },
  unavailable: { label: "Ulaşılamıyor", tone: "blocked", official: false }
};

export function statusCopy(status?: string) {
  return STATUS_COPY[normalizeStatus(status)] ?? STATUS_COPY.unavailable;
}

export function normalizeStatus(status?: string): SourceProbeStatus {
  if (!status) return "unavailable";
  if (status in STATUS_COPY) return status as SourceProbeStatus;
  if (status === "registry_metadata") return "public_metadata";
  if (status === "blocked") return "protected";
  if (status === "requires_legal_agreement") return "official_contract_required";
  return "unavailable";
}

export function sourceToneClasses(tone: StatusTone) {
  switch (tone) {
    case "good":
      return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
    case "info":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
    case "warn":
      return "border-amber-300/35 bg-amber-300/10 text-amber-100";
    case "blocked":
      return "border-rose-300/35 bg-rose-300/10 text-rose-100";
    default:
      return "border-white/15 bg-white/5 text-slate-200";
  }
}

export function sourceDotClass(tone: StatusTone) {
  switch (tone) {
    case "good":
      return "bg-emerald-300";
    case "info":
      return "bg-cyan-300";
    case "warn":
      return "bg-amber-300";
    case "blocked":
      return "bg-rose-300";
    default:
      return "bg-slate-300";
  }
}

export function normalizeReadinessSources(payload?: unknown): ProductizedSourceProbe[] {
  const sources = isRecord(payload) && Array.isArray(payload.sources) ? payload.sources : [];
  if (sources.length === 0) return defaultReadinessSources();
  return sources.filter(isRecord).map((source) => {
    const status = normalizeStatus(asString(source.status));
    return {
      sourceId: asString(source.sourceId) ?? "unknown-source",
      sourceName: asString(source.sourceName) ?? "Bilinmeyen kaynak",
      category: normalizeCategory(asString(source.category)),
      status,
      endpoint: asString(source.endpoint),
      checkedAt: asString(source.checkedAt),
      dataType: normalizeDataType(asString(source.dataType), status),
      message: asString(source.message) ?? fallbackMessage(status),
      nextAction: asString(source.nextAction),
      evidenceHash: asString(source.evidenceHash)
    };
  });
}

export function probesFromMunicipalWorkflow(workflow?: unknown): ProductizedSourceProbe[] {
  if (!isRecord(workflow)) return [];
  const provenance = Array.isArray(workflow.provenance) ? workflow.provenance.filter(isRecord) : [];
  const query = isRecord(workflow.query) ? workflow.query : {};
  const zoningAttempt = isRecord(workflow.zoningAttempt) ? workflow.zoningAttempt : {};
  const parcelAttempt = isRecord(workflow.parcelGeometryAttempt) ? workflow.parcelGeometryAttempt : {};
  const municipalityName = asString(query.district) ? `${asString(query.district)} Belediyesi` : "Belediye kaynağı";

  return [
    {
      sourceId: "tkgm-parsel-sorgu",
      sourceName: "TKGM Parsel Sorgu",
      category: "tkgm",
      status: normalizeStatus(asString(parcelAttempt.status)),
      endpoint: asString(parcelAttempt.endpoint),
      checkedAt: new Date().toISOString(),
      dataType: "unavailable",
      message: asString(parcelAttempt.message) ?? "TKGM parsel geometri contract henüz doğrulanmadı.",
      nextAction: "Resmî erişim contract doğrulanmadan canlı geometri etiketi kullanılmaz."
    },
    {
      sourceId: asString(zoningAttempt.source) ?? asString(query.municipalityId) ?? "municipality-source",
      sourceName: provenance[0] ? asString(provenance[0].sourceName) ?? municipalityName : municipalityName,
      category: "municipality",
      status: normalizeStatus(asString(zoningAttempt.status) ?? asString(workflow.status)),
      endpoint: asString(zoningAttempt.endpoint),
      checkedAt: new Date().toISOString(),
      dataType: provenance[0] ? normalizeDataType(asString(provenance[0].dataType), normalizeStatus(asString(zoningAttempt.status))) : "unavailable",
      message: asString(zoningAttempt.message) ?? asString(workflow.noDataReason) ?? "Belediye imar method contract henüz çözülmedi.",
      nextAction: "Kaynak method contract doğrulanırsa canlı sonuç üretilebilir.",
      evidenceHash: provenance[0] ? asString(provenance[0].responseHash) : undefined
    }
  ];
}

export function defaultReadinessSources(): ProductizedSourceProbe[] {
  return [
    {
      sourceId: "tkgm-parsel-sorgu",
      sourceName: "TKGM Parsel Sorgu",
      category: "tkgm",
      status: "not_ready",
      endpoint: "https://parselsorgu.tkgm.gov.tr/",
      dataType: "unavailable",
      message: "Doğrulanmış public canlı geometri contract henüz etkin değil.",
      nextAction: "Contract ve yasal erişim doğrulanmalı."
    },
    {
      sourceId: "municipality-registry",
      sourceName: "Belediye kaynakları",
      category: "municipality",
      status: "public_metadata",
      dataType: "public_metadata",
      message: "Registry/discovery metadata gösterilir; resmî imar sonucu olarak etiketlenmez.",
      nextAction: "Belediye bazında method contract doğrulanmalı."
    },
    {
      sourceId: "eplan",
      sourceName: "e-Plan",
      category: "eplan",
      status: "method_contract_required",
      dataType: "unavailable",
      message: "Canlı plan sorgu contract doğrulaması gerekiyor.",
      nextAction: "Contract doğrulanana kadar resmi sonuç etiketi kullanılmaz."
    }
  ];
}

function normalizeCategory(category?: string): SourceCategory {
  if (category === "tkgm" || category === "municipality" || category === "eplan") return category;
  return "other";
}

function normalizeDataType(dataType: string | undefined, status: SourceProbeStatus): ProductizedSourceProbe["dataType"] {
  if (dataType === "official" && status === "verified_live") return "official";
  if (dataType === "public_metadata") return "public_metadata";
  if (dataType === "derived" || dataType === "demo") return dataType;
  return status === "verified_live" ? "official" : "unavailable";
}

function fallbackMessage(status: SourceProbeStatus) {
  if (status === "verified_live") return "Kaynak canlı yanıt verdi.";
  if (status === "public_metadata") return "Kaynak metadata seviyesinde doğrulandı.";
  if (status === "protected") return "Kaynak korumalı olduğu için erişim aşılmadı.";
  return "Kaynak canlı sonuç için hazır değil.";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
