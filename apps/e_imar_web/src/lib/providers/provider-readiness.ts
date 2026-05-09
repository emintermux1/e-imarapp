import type { ParcelDataMode, ParcelSourceMetadata } from "@/data/parcel-source";
import type { LocationExplorerTarget } from "@/data/location-navigation";
import type {
  SourceCoverageState,
  SourceCoverageSummary
} from "@/lib/source-coverage";
import type { SourceEntry, SourceHealthResponse, SourceProbe } from "@/lib/api/types";
import { sanitizeEndpointUrl } from "@/lib/workflow-helpers";

export type ReadinessLabel =
  | "hazır"
  | "yapılandırma bekliyor"
  | "korumalı erişim"
  | "demo fallback"
  | "planlandı";

export type ReadinessTone = "success" | "warning" | "danger" | "muted" | "info";

export interface ReadinessMetric {
  label: string;
  value: string;
  detail?: string;
  tone: ReadinessTone;
}

export interface ReadinessRow {
  id: string;
  title: string;
  subtitle: string;
  label: ReadinessLabel;
  tone: ReadinessTone;
  endpoint?: string;
  endpointLabel: string;
  detail: string;
  notes: string[];
}

export interface ExplorerReadinessModel {
  headerLabel: string;
  headerDetail: string;
  metrics: ReadinessMetric[];
  rows: ReadinessRow[];
  nextActions: string[];
  sourceCoverageSummary?: SourceCoverageSummary | null;
}

interface BuildProviderReadinessArgs {
  metadata: ParcelSourceMetadata;
  coverage: SourceCoverageState;
  sources: SourceEntry[];
  health: SourceHealthResponse | null;
  cityTargets: LocationExplorerTarget[];
}

export function buildProviderExplorerModel({
  metadata,
  coverage,
  sources,
  health,
  cityTargets
}: BuildProviderReadinessArgs): ExplorerReadinessModel {
  const healthById = new Map((health?.sources ?? []).map((entry) => [entry.id, entry]));
  const sourceRows = sources.length > 0 ? sources.map((source) => buildSourceRow(source, healthById.get(source.id))) : buildFallbackRows(metadata);
  const metrics = buildMetrics(metadata, coverage.summary, sources.length, health?.total ?? null);
  return {
    headerLabel: metadata.mode === "demo" ? "Demo fallback" : metadata.mode === "api" ? "API hedefi" : "Vector tile hedefi",
    headerDetail:
      metadata.fallbackReason ??
      (metadata.endpoint ? "Uç nokta okunuyor." : "Uç nokta şu anda görünmüyor; connector katmanı beklemede."),
    metrics,
    rows: sourceRows,
    nextActions: buildNextActions(metadata, coverage, sources, health, cityTargets),
    sourceCoverageSummary: coverage.summary
  };
}

export function modeLabel(mode: ParcelDataMode) {
  if (mode === "api") return "API";
  if (mode === "vector-tile") return "Vector tile";
  return "Demo";
}

export function readinessTone(label: ReadinessLabel): ReadinessTone {
  switch (label) {
    case "hazır":
      return "success";
    case "korumalı erişim":
    case "yapılandırma bekliyor":
      return "warning";
    case "demo fallback":
      return "info";
    case "planlandı":
      return "muted";
  }
}

export function readinessClassName(tone: ReadinessTone) {
  switch (tone) {
    case "success":
      return "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300";
    case "warning":
      return "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300";
    case "danger":
      return "border-rose-500/25 bg-rose-500/8 text-rose-700 dark:text-rose-300";
    case "info":
      return "border-sky-500/25 bg-sky-500/8 text-sky-700 dark:text-sky-300";
    case "muted":
    default:
      return "border-border-subtle bg-surface-1 text-fg-secondary";
  }
}

function buildMetrics(
  metadata: ParcelSourceMetadata,
  summary: SourceCoverageSummary | null | undefined,
  sourceCount: number,
  healthTotal: number | null
): ReadinessMetric[] {
  return [
    {
      label: "İstenen mod",
      value: modeLabel(metadata.requestedMode),
      detail: "Kullanıcı isteği",
      tone: metadata.requestedMode === metadata.mode && !metadata.fallbackReason ? "success" : "warning"
    },
    {
      label: "Aktif mod",
      value: modeLabel(metadata.mode),
      detail: metadata.fallbackReason ? "Demo fallback aktif" : metadata.mode === "demo" ? "Demo veri" : "Canlı hedef",
      tone: metadata.mode === "demo" ? "info" : "success"
    },
    {
      label: "Endpoint",
      value: metadata.endpoint ? "var" : "yok",
      detail: metadata.endpoint ? sanitizeEndpointUrl(metadata.endpoint) : "Canlı uç nokta görünmüyor",
      tone: metadata.endpoint ? "success" : "warning"
    },
    {
      label: "Resmî veri",
      value: metadata.official ? "evet" : "hayır",
      detail: metadata.official ? "Kaynak resmi akışa bağlı" : "Sentetik/demo katman",
      tone: metadata.official ? "success" : "muted"
    },
    {
      label: "Kaynaklar",
      value: sourceCount > 0 ? sourceCount.toLocaleString("tr-TR") : "0",
      detail: healthTotal != null ? `${healthTotal.toLocaleString("tr-TR")} sağlık satırı` : "Registry okunamadı",
      tone: sourceCount > 0 ? "success" : "warning"
    },
    {
      label: "Bootstrap",
      value: summary ? summary.totalSources.toLocaleString("tr-TR") : "—",
      detail: summary ? `Güncel: ${summary.lastGeneratedAt}` : "Kaynak özeti bağlanmadı",
      tone: summary ? "success" : "warning"
    }
  ];
}

function buildSourceRow(source: SourceEntry, health: SourceProbe | undefined): ReadinessRow {
  const label = classifySourceLabel(source, health);
  const endpoint = source.base_url ? sanitizeEndpointUrl(source.base_url) : undefined;
  return {
    id: source.id,
    title: source.name,
    subtitle: [source.provider, source.category].filter(Boolean).join(" · "),
    label,
    tone: readinessTone(label),
    endpoint,
    endpointLabel: endpoint ? "uç nokta var" : "uç nokta yok",
    detail:
      health?.message ??
      source.notes ??
      (label === "hazır"
        ? "Canlı bağlantı doğrulandı"
        : label === "korumalı erişim"
        ? "Giriş / legal izin / koruma akışı gerekiyor"
        : label === "demo fallback"
        ? "Bu katman sentetik demo veriye düşüyor"
        : "Bağlayıcı yapılandırması bekliyor"),
    notes: compactNotes(source, health)
  };
}

function buildFallbackRows(metadata: ParcelSourceMetadata): ReadinessRow[] {
  return [
    {
      id: "parcel-mode",
      title: "Parsel kaynağı",
      subtitle: metadata.label,
      label: metadata.fallbackReason ? "demo fallback" : metadata.mode === "demo" ? "demo fallback" : "yapılandırma bekliyor",
      tone: metadata.fallbackReason || metadata.mode === "demo" ? "info" : "warning",
      endpoint: metadata.endpoint ? sanitizeEndpointUrl(metadata.endpoint) : undefined,
      endpointLabel: metadata.endpoint ? "uç nokta var" : "uç nokta yok",
      detail: metadata.fallbackReason ?? "Canlı veri katmanı henüz bağlanmadı",
      notes: [...metadata.notes]
    }
  ];
}

function classifySourceLabel(source: SourceEntry, health?: SourceProbe): ReadinessLabel {
  const status = (health?.status ?? "").toLowerCase();
  const message = `${health?.message ?? ""} ${source.auth ?? ""} ${(source.notes ?? "")}`.toLowerCase();
  if (status.includes("ok")) return "hazır";
  if (status.includes("protected") || status.includes("credential") || message.includes("captcha") || message.includes("login") || message.includes("legal")) {
    return "korumalı erişim";
  }
  if (status.includes("planned") || source.discovery_strategy.toLowerCase().includes("plan")) return "planlandı";
  if (!health) return "yapılandırma bekliyor";
  if (status.includes("demo")) return "demo fallback";
  return "yapılandırma bekliyor";
}

function compactNotes(source: SourceEntry, health?: SourceProbe) {
  const notes = [health?.message, source.notes].filter((note): note is string => Boolean(note));
  return [...new Set(notes)].slice(0, 3);
}

function buildNextActions(
  metadata: ParcelSourceMetadata,
  coverage: SourceCoverageState,
  sources: SourceEntry[],
  health: SourceHealthResponse | null,
  cityTargets: LocationExplorerTarget[]
) {
  const actions: string[] = [];
  if (metadata.fallbackReason) {
    actions.push(metadata.fallbackReason);
  } else if (metadata.mode === "demo") {
    actions.push("Canlı parsel yükleme yerine demo veri katmanı çiziliyor.");
  }
  if (!metadata.endpoint) {
    actions.push("Canlı endpoint tanımla: API_BASE_URL veya vector tile URL.");
  }
  if (!coverage.summary) {
    actions.push("Kaynak bootstrap özetini backend tarafında aç.");
  }
  if ((health?.sources ?? []).some((entry) => /protected|credential|captcha/i.test(entry.status))) {
    actions.push("Korumalı kaynaklar için erişim / auth akışını bağla.");
  }
  if (sources.length === 0) {
    actions.push("/api/v1/sources registry yanıtını doğrula.");
  }
  if (cityTargets.length > 0) {
    actions.push(`${cityTargets.length.toLocaleString("tr-TR")} demo kapsama şehri üzerinden harita gezinmesi yapılabilir.`);
  }
  return actions;
}
