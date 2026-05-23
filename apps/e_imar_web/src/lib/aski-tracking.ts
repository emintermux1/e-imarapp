import type { AskiPolygonFeature, AskiPolygonStatus } from "../data/aski-polygons";

export type ProvenanceKind = "demo" | "public_metadata" | "official" | "derived";

export type AskiAlertIntent =
  | "imar_change"
  | "aski_plan"
  | "cevre_plan"
  | "source_access_status_change";

export interface AskiTrackingFilters {
  municipality?: string;
  status?: AskiPolygonStatus | "all";
  from?: string;
  to?: string;
  parcelId?: string | null;
}

export const ASKI_PROVENANCE_LABELS: Record<ProvenanceKind, string> = {
  demo: "demo",
  public_metadata: "public_metadata",
  official: "official",
  derived: "derived"
};

export const ASKI_ALERT_INTENT_LABELS: Record<AskiAlertIntent, string> = {
  imar_change: "İmar değişimi",
  aski_plan: "Askı planı",
  cevre_plan: "Çevre planı",
  source_access_status_change: "Kaynak erişim durumu"
};

export const PARSEL_ALARM_NAME = "Parsel Alarm";

export const DEFAULT_WATCHLIST_ALERT_INTENTS: AskiAlertIntent[] = [
  "imar_change",
  "aski_plan",
  "cevre_plan",
  "source_access_status_change"
];

export function formatProvenanceBadge(kind: ProvenanceKind) {
  return ASKI_PROVENANCE_LABELS[kind];
}

export function filterAskiRecords(
  records: AskiPolygonFeature[],
  filters: AskiTrackingFilters
) {
  const municipality = normalize(filters.municipality);
  const status = filters.status ?? "all";
  const from = filters.from ? new Date(filters.from).getTime() : null;
  const to = filters.to ? new Date(filters.to).getTime() : null;
  const parcelId = normalize(filters.parcelId ?? undefined);

  return records.filter((record) => {
    if (municipality) {
      const haystack = normalize([
        record.belediye,
        record.ilSlug,
        record.ilceSlug,
        record.label,
        record.planAdi
      ].filter(Boolean).join(" "));
      if (!haystack.includes(municipality)) return false;
    }

    if (status !== "all" && record.durum !== status) return false;

    if (from != null) {
      const start = new Date(record.baslangic).getTime();
      const end = new Date(record.bitis).getTime();
      if (Number.isFinite(start) && end < from) return false;
    }

    if (to != null) {
      const start = new Date(record.baslangic).getTime();
      if (Number.isFinite(start) && start > to) return false;
    }

    if (parcelId) {
      const match = normalize(record.matchedParcelId ?? undefined);
      if (match !== parcelId) return false;
    }

    return true;
  });
}

export function findAskiMatchesForParcel(
  records: AskiPolygonFeature[],
  parcelId: string,
  district?: string,
  province?: string
) {
  const normalizedParcelId = normalize(parcelId);
  const normalizedDistrict = normalize(district);
  const normalizedProvince = normalize(province);

  return records.filter((record) => {
    if (record.matchedParcelId && normalize(record.matchedParcelId) === normalizedParcelId) {
      return true;
    }
    if (normalizedDistrict && normalize(record.ilceSlug) === normalizedDistrict) return true;
    if (normalizedProvince && normalize(record.ilSlug) === normalizedProvince) return true;
    return false;
  });
}

export function summarizeAskiProvenance(records: AskiPolygonFeature[]) {
  return records.reduce<Record<ProvenanceKind, number>>(
    (acc, record) => {
      const provenance = record.provenance ?? "demo";
      acc[provenance] += 1;
      return acc;
    },
    { demo: 0, public_metadata: 0, official: 0, derived: 0 }
  );
}

function normalize(value?: string | null) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}
