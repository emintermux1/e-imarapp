import { getAllParcels, getParcelSourceMetadata } from "@/data/parcels";
import { getRiskGridCollection } from "@/data/risk-grid";
import { getTransportLineCollection } from "@/data/transport-lines";
import { inTurkey } from "@/lib/utils";
import type { ParcelFeature, ParcelProps } from "@/types/parcel";

export type SelectionSource = "map" | "parcel" | "search" | "system";
export type InsightTone = "good" | "info" | "warning" | "danger" | "muted";
export type InsightKind = "zoning" | "potential" | "risk" | "mobility" | "opportunity" | "confidence";

export interface SelectedPoint {
  lng: number;
  lat: number;
  source: SelectionSource;
  nearestParcelId?: string;
}

export interface NearbyParcelSuggestion {
  parcel: ParcelProps;
  distanceM: number;
}

export interface PlaceInsightCard {
  id: string;
  kind: InsightKind;
  title: string;
  value: string;
  detail: string;
  tone: InsightTone;
  bullets: string[];
  provenance: "demo" | "derived" | "live" | "unavailable";
}

export interface SelectedPlaceAnalysis {
  title: string;
  subtitle: string;
  coordinateLabel: string;
  sourceLabel: string;
  disclaimer: string;
  selectedParcel?: ParcelProps;
  nearestParcel?: NearbyParcelSuggestion;
  insights: PlaceInsightCard[];
}

interface BuildAnalysisArgs {
  point: SelectedPoint | null;
  parcel?: ParcelProps | null;
}

const riskGrid = getRiskGridCollection();
const transportLines = getTransportLineCollection();

export function buildSelectedPlaceAnalysis({
  point,
  parcel
}: BuildAnalysisArgs): SelectedPlaceAnalysis | null {
  const resolvedPoint = point ?? pointFromParcel(parcel ?? null);
  if (!resolvedPoint) return null;

  const nearest = parcel
    ? undefined
    : findNearestParcel(resolvedPoint.lng, resolvedPoint.lat, 2500);
  const contextParcel = parcel ?? nearest?.parcel ?? null;
  const risk = nearestRiskCell(resolvedPoint.lng, resolvedPoint.lat);
  const transport = nearestTransport(resolvedPoint.lng, resolvedPoint.lat);
  const metadata = getParcelSourceMetadata();
  const coordinateLabel = `${resolvedPoint.lat.toFixed(5)}, ${resolvedPoint.lng.toFixed(5)}`;

  return {
    title: parcel ? `${parcel.ada}/${parcel.parsel} parsel analizi` : "Seçili nokta analizi",
    subtitle: contextParcel
      ? `${contextParcel.mahalle} · ${contextParcel.ilce} / ${contextParcel.il}`
      : inTurkey(resolvedPoint.lng, resolvedPoint.lat)
        ? "Türkiye çalışma alanı içinde serbest nokta"
        : "Türkiye çalışma alanı dışında / sınırda nokta",
    coordinateLabel,
    sourceLabel: sourceLabel(resolvedPoint.source),
    disclaimer:
      metadata.official || parcel?.sourceStatus === "live"
        ? "Bu ekran seçili konum için türetilmiş karar destek özetidir; resmi imar durumu veya tapu kaydı yerine geçmez."
        : "Örnek/türetilmiş analizdir; resmi kayıt değildir. Belediye/TKGM/e-Plan kaydı gibi sunulmamalıdır.",
    selectedParcel: parcel ?? undefined,
    nearestParcel: nearest,
    insights: [
      zoningInsight(contextParcel),
      potentialInsight(contextParcel),
      riskInsight(contextParcel, risk),
      mobilityInsight(contextParcel, transport),
      opportunityInsight(contextParcel, nearest, transport),
      confidenceInsight(metadata, contextParcel, resolvedPoint)
    ]
  };
}

export function findNearestParcel(
  lng: number,
  lat: number,
  maxDistanceM = 2000
): NearbyParcelSuggestion | undefined {
  let best: NearbyParcelSuggestion | undefined;
  for (const feature of getAllParcels()) {
    const centroid = feature.properties.centroid ?? polygonCentroid(feature);
    if (!centroid) continue;
    const distanceM = haversineMeters([lng, lat], centroid);
    if (distanceM > maxDistanceM) continue;
    if (!best || distanceM < best.distanceM) {
      best = { parcel: feature.properties, distanceM };
    }
  }
  return best;
}

function zoningInsight(parcel: ParcelProps | null): PlaceInsightCard {
  if (!parcel) {
    return {
      id: "zoning-none",
      kind: "zoning",
      title: "Plan kullanımı",
      value: "Yakın parsel yok",
      detail: "Bu nokta örnek parsel kapsamasının dışında kalıyor.",
      tone: "muted",
      provenance: "unavailable",
      bullets: ["Yakındaki imar parametreleri için parsel seçimi veya canlı kaynak gerekir."]
    };
  }
  return {
    id: "zoning",
    kind: "zoning",
    title: "Plan kullanımı",
    value: parcel.detailedUse ?? parcel.zoningType,
    detail: `${parcel.planScale ?? "1/1000"} · ${parcel.planStatus ?? "örnek plan"}`,
    tone: parcel.zoningType === "Konut" || parcel.zoningType === "Karma" ? "good" : parcel.zoningType === "Kamu" || parcel.zoningType === "Yesil" ? "warning" : "info",
    provenance: parcel.sourceStatus === "live" ? "live" : "demo",
    bullets: [
      `Fonksiyon: ${parcel.zoningType}`,
      `Yapılaşma: ${parcel.yapilasmaSekli}, gabari ${parcel.gabariM || "—"} m`,
      ...(parcel.constraints?.length ? [`Kısıt: ${parcel.constraints.slice(0, 2).join(", ")}`] : [])
    ]
  };
}

function potentialInsight(parcel: ParcelProps | null): PlaceInsightCard {
  if (!parcel) {
    return {
      id: "potential-none",
      kind: "potential",
      title: "Yapı potansiyeli",
      value: "Hesaplanamadı",
      detail: "TAKS/KAKS için parsel eşleşmesi gerekli.",
      tone: "muted",
      provenance: "unavailable",
      bullets: ["Noktayı bir parsel sınırına yakın seçerek yaklaşık potansiyel üretilebilir."]
    };
  }
  const constructionM2 = Math.round(parcel.yuzolcumuM2 * parcel.kaks);
  const footprintM2 = Math.round(parcel.yuzolcumuM2 * parcel.taks);
  const units = Math.max(1, Math.round(constructionM2 / 95));
  return {
    id: "potential",
    kind: "potential",
    title: "Yapı potansiyeli",
    value: constructionM2 > 0 ? `${constructionM2.toLocaleString("tr-TR")} m²` : "Kısıtlı",
    detail: `TAKS ${parcel.taks.toFixed(2)} · KAKS ${parcel.kaks.toFixed(2)} · ${parcel.katSiniri || "—"} kat`,
    tone: constructionM2 > 2500 ? "good" : constructionM2 > 0 ? "info" : "warning",
    provenance: "derived",
    bullets: [
      `Yaklaşık taban alanı ${footprintM2.toLocaleString("tr-TR")} m²`,
      `95 m² ortalama ile ~${units.toLocaleString("tr-TR")} bağımsız bölüm senaryosu`,
      "Resmi ruhsat veya mimari avan proje hesabı değildir."
    ]
  };
}

function riskInsight(
  parcel: ParcelProps | null,
  risk?: { severity: number; near: string; distanceM: number }
): PlaceInsightCard {
  const parcelRisk = parcel?.riskler;
  const severity = Math.max(parcelRisk?.deprem ?? 0, risk?.severity ?? 0);
  return {
    id: "risk",
    kind: "risk",
    title: "Risk sinyali",
    value: severity ? `Seviye ${severity}/5` : "Bilinmiyor",
    detail: risk ? `${risk.near} gridine ~${formatDistance(risk.distanceM)}` : "Grid eşleşmesi yok",
    tone: severity >= 4 ? "danger" : severity >= 3 ? "warning" : severity > 0 ? "info" : "muted",
    provenance: parcelRisk ? "demo" : risk ? "derived" : "unavailable",
    bullets: [
      parcelRisk ? `Parsel riskleri: deprem ${parcelRisk.deprem}, sel ${parcelRisk.sel}, heyelan ${parcelRisk.heyelan}` : "Parsel bazlı risk kaydı yok.",
      risk ? "AFAD benzeri örnek gridinden türetilmiş bölgesel sinyal." : "Risk grid kapsaması dışında."
    ]
  };
}

function mobilityInsight(
  parcel: ParcelProps | null,
  transport?: { name: string; kind: string; distanceM: number }
): PlaceInsightCard {
  const score = parcel?.cevre.ulasimSkoru;
  return {
    id: "mobility",
    kind: "mobility",
    title: "Erişilebilirlik",
    value: score != null ? `${Math.round(score)}/100` : transport ? formatDistance(transport.distanceM) : "Bilinmiyor",
    detail: transport ? `${transport.name} · ${transport.kind}` : "Yakın raylı sistem örnek hattı bulunamadı",
    tone: (score ?? 0) >= 75 || (transport?.distanceM ?? Infinity) < 700 ? "good" : (score ?? 0) >= 50 || (transport?.distanceM ?? Infinity) < 1500 ? "info" : "warning",
    provenance: parcel ? "demo" : transport ? "derived" : "unavailable",
    bullets: [
      parcel ? `Metro ${Math.round(parcel.cevre.metroM).toLocaleString("tr-TR")} m · park ${Math.round(parcel.cevre.parkM).toLocaleString("tr-TR")} m` : "Parsel çevre metrikleri yok.",
      transport ? `En yakın örnek koridor: ${formatDistance(transport.distanceM)}` : "Ulaşım koridoru eşleşmedi."
    ]
  };
}

function opportunityInsight(
  parcel: ParcelProps | null,
  nearest: NearbyParcelSuggestion | undefined,
  transport?: { distanceM: number }
): PlaceInsightCard {
  const constraints = parcel?.constraints ?? [];
  const opportunity = parcel ? parcel.yatirimSkoru : transport ? Math.max(30, 85 - transport.distanceM / 80) : 0;
  return {
    id: "opportunity",
    kind: "opportunity",
    title: "Fırsat / kısıt",
    value: parcel ? `${Math.round(opportunity)}/100` : nearest ? "Yakın parsel var" : "Sınırlı veri",
    detail: constraints.length ? constraints.slice(0, 2).join(" · ") : "Belirgin örnek kısıt sinyali yok",
    tone: constraints.length >= 2 ? "warning" : opportunity >= 70 ? "good" : "info",
    provenance: parcel ? "demo" : nearest ? "derived" : "unavailable",
    bullets: [
      nearest ? `En yakın parsel ${formatDistance(nearest.distanceM)} mesafede.` : "Parsel önerisi yok.",
      parcel?.planNotlari[0] ?? "Nokta bazlı fırsat okuması yalnızca yerel/örnek katmanlardan türetildi."
    ]
  };
}

function confidenceInsight(
  metadata: ReturnType<typeof getParcelSourceMetadata>,
  parcel: ParcelProps | null,
  point: SelectedPoint
): PlaceInsightCard {
  const hasLive = metadata.official || parcel?.sourceStatus === "live";
  return {
    id: "confidence",
    kind: "confidence",
    title: "Veri güveni",
    value: hasLive ? "Canlı + türetilmiş" : "Örnek/türetilmiş",
    detail: metadata.label,
    tone: hasLive ? "good" : "warning",
    provenance: hasLive ? "live" : "demo",
    bullets: [
      `Seçim kaynağı: ${sourceLabel(point.source)}`,
      metadata.official ? "Kaynak resmi akış olarak işaretli." : "Resmi olmayan örnek veriler ve yerel registry yüzeyleri kullanıldı.",
      ...(metadata.fallbackReason ? [metadata.fallbackReason] : metadata.notes.slice(0, 1))
    ]
  };
}

function pointFromParcel(parcel: ParcelProps | null): SelectedPoint | null {
  if (!parcel?.centroid) return null;
  return { lng: parcel.centroid[0], lat: parcel.centroid[1], source: "parcel", nearestParcelId: parcel.id };
}

function nearestRiskCell(lng: number, lat: number) {
  let best: { severity: number; near: string; distanceM: number } | undefined;
  for (const feature of riskGrid.features) {
    const [cellLng, cellLat] = feature.geometry.coordinates;
    const distanceM = haversineMeters([lng, lat], [cellLng, cellLat]);
    if (!best || distanceM < best.distanceM) {
      best = { severity: feature.properties.severity, near: feature.properties.near, distanceM };
    }
  }
  return best && best.distanceM < 65000 ? best : undefined;
}

function nearestTransport(lng: number, lat: number) {
  let best: { name: string; kind: string; distanceM: number } | undefined;
  for (const feature of transportLines.features) {
    const props = feature.properties as { name?: string; kind?: string };
    for (const coordinate of feature.geometry.coordinates) {
      const distanceM = haversineMeters([lng, lat], coordinate as [number, number]);
      if (!best || distanceM < best.distanceM) {
        best = { name: props.name ?? "Ulaşım koridoru", kind: props.kind ?? "Hat", distanceM };
      }
    }
  }
  return best && best.distanceM < 6000 ? best : undefined;
}

function polygonCentroid(feature: ParcelFeature): [number, number] | null {
  const ring = feature.geometry.coordinates[0];
  if (!ring?.length) return null;
  const total = ring.reduce(
    (acc, coord) => ({ lng: acc.lng + coord[0], lat: acc.lat + coord[1] }),
    { lng: 0, lat: 0 }
  );
  return [total.lng / ring.length, total.lat / ring.length];
}

function haversineMeters(a: [number, number], b: [number, number]) {
  const earth = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km`
    : `${Math.round(meters).toLocaleString("tr-TR")} m`;
}

function sourceLabel(source: SelectionSource) {
  switch (source) {
    case "parcel":
      return "Parsel seçimi";
    case "search":
      return "Arama sonucu";
    case "system":
      return "Sistem odağı";
    case "map":
    default:
      return "Harita tıklaması";
  }
}
