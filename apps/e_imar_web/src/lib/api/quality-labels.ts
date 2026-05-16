import type { DataSourceStatus, ParcelQualityMetadata, ParcelSummaryResponse, SourceQualityRecord } from "@/types/api";

export const SOURCE_STATUS_LABELS: Record<DataSourceStatus, string> = {
  live: "Canlı",
  fallback: "Kayıtlı kaynak",
  unavailable: "Erişilemiyor",
  computed: "Hesaplandı",
  demo: "Örnek veri",
  official: "Resmî",
  public_metadata: "Açık kayıt",
  derived: "Türetilmiş",
  not_ready: "Keşif bekliyor"
};

export const SOURCE_STATUS_TITLES: Record<DataSourceStatus, string> = {
  live: "Kaynak canlı yanıt verdi; veri doğrudan servis/API üzerinden geldi.",
  fallback: "Canlı endpoint yerine kayıtlı public kaynak metadatası kullanılıyor.",
  unavailable: "Kaynak şu an yanıt vermiyor veya bu veri türünü yayınlamıyor.",
  computed: "Uygulama tarafından hesaplandı; resmî kaynak yerine geçmez.",
  demo: "Örnek veri; resmî kayıt gibi yorumlanmamalı.",
  official: "Resmî veya doğrulanmış kaynaktan gelen kayıt.",
  public_metadata: "Açık metadata/registry üzerinden gösterilen kayıt.",
  derived: "Birincil veriden türetilmiş değer.",
  not_ready: "Public kaynak bağlantısı veya kapsamı keşif bekliyor."
};

export function sourceStatusLabel(status: DataSourceStatus | string | undefined) {
  return status && status in SOURCE_STATUS_LABELS
    ? SOURCE_STATUS_LABELS[status as DataSourceStatus]
    : status ?? "Bilinmiyor";
}

export function sourceStatusTitle(status: DataSourceStatus | string | undefined) {
  return status && status in SOURCE_STATUS_TITLES
    ? SOURCE_STATUS_TITLES[status as DataSourceStatus]
    : "Kaynak durumu backend tarafından bu etiketle döndü.";
}

export function sourceStatusTone(status: DataSourceStatus | string | undefined) {
  if (status === "live" || status === "official") return "success";
  if (status === "fallback" || status === "not_ready") return "warning";
  if (status === "unavailable") return "error";
  if (status === "computed" || status === "public_metadata" || status === "derived") return "info";
  return "muted";
}

export function formatQualityTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function geometryLabel(available?: boolean | null) {
  return available ? "Geometri var" : "Geometri yok";
}

export function matchStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    matched: "eşleşti",
    unknown: "bilinmiyor",
    none: "eşleşme yok",
    known: "biliniyor",
    not_available: "yok",
    spatial: "mekânsal",
    municipality: "belediye",
    district: "ilçe"
  };
  return value ? labels[value] ?? value : "bilinmiyor";
}

export function explainMissingData(record?: SourceQualityRecord | null) {
  if (!record) return "Bu kaynak için kalite kaydı gelmedi; servis listesi yenilenebilir.";
  if (record.user_message) return record.user_message;
  if (record.failure_reason) return record.failure_reason;
  if (!record.geometry_available) return "Kaynak kayıt döndürüyor; geometri katmanı yayınlanmadığı için haritada çizim yok.";
  if (record.status === "unavailable") return "Kaynak son kontrolde yanıt vermedi; portal veya endpoint geçici kapalı olabilir.";
  if (record.status === "fallback") return "Canlı endpoint yavaş/eksik olduğu için kayıtlı public kaynak metadatası kullanılıyor.";
  return "Kaynak kullanılabilir; kapsam belediye, katman tipi veya ada/parsel eşleşmesine göre değişebilir.";
}

export function reportEligibilityLabel(value?: ParcelSummaryResponse["report_eligibility"] | string) {
  if (value === "eligible") return "Rapor üretilebilir";
  if (value === "eligible_with_warnings") return "Uyarılı rapor";
  if (value === "limited") return "Sınırlı rapor";
  return "Rapor durumu belirsiz";
}

export function parcelQualityMessage(quality?: ParcelQualityMetadata | null) {
  if (!quality) return "Kalite metadata yok; sonuç kaynak etiketiyle sınırlı.";
  if (quality.message) return quality.message;
  const hints = quality.quality_hints?.filter(Boolean) ?? [];
  if (hints.length > 0) return hints.slice(0, 2).join(" · ");
  return quality.geometry_available
    ? "Parsel geometriyle birlikte döndü."
    : "Parsel kaydı bulundu; geometri backend tarafından sağlanmadı.";
}
