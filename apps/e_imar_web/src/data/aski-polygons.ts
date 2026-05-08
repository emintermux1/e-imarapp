/**
 * Askı haritası overlay'i için poligonlar — her giriş, gerçek askı plan
 * sınırlarını temsil eden basitleştirilmiş bir kapsama alanıdır. Mock veriyi
 * `aski-list.ts`'teki kayıtlarla aynı `id` üzerinden eşleştiriyoruz, böylece
 * popover detayı ve sidebar listesi tutarlı kalıyor.
 */

import type { AskiOzet } from "./aski-list";
import { ASKI_LIST } from "./aski-list";

export type AskiPolygonStatus = "askida" | "onaylandi" | "reddedildi" | "donusum";

export interface AskiPolygonFeature {
  id: string;
  label: string;
  durum: AskiPolygonStatus;
  baslangic: string;
  bitis: string;
  belediye: string;
  ilSlug: string;
  ilceSlug: string;
  /** GeoJSON polygon (closed ring of [lng, lat]) */
  ring: [number, number][];
  /** Optional matched parsel id so the popover can deep-link */
  matchedParcelId?: string;
  /** Plan adı / sebep */
  planAdi?: string;
}

/**
 * Build polygons centered around realistic Turkish coordinates, sized
 * sufficiently to be visible at city zoom levels (~zoom 10-13).
 */
function ringFromCenter(
  lng: number,
  lat: number,
  widthDeg = 0.005,
  heightDeg = 0.0035
): [number, number][] {
  const w = widthDeg / 2;
  const h = heightDeg / 2;
  return [
    [lng - w, lat - h],
    [lng + w, lat - h],
    [lng + w, lat + h],
    [lng - w, lat + h],
    [lng - w, lat - h]
  ];
}

interface PolygonSeed {
  id: string;
  baslik: string;
  belediye: string;
  baslangic: string;
  bitis: string;
  ilSlug: string;
  ilceSlug: string;
  lng: number;
  lat: number;
  durum: AskiPolygonStatus;
  matchedParcelId?: string;
  planAdi?: string;
}

function fromAskiOzet(
  base: AskiOzet,
  extras: {
    lng: number;
    lat: number;
    durum: AskiPolygonStatus;
    matchedParcelId?: string;
    planAdi?: string;
  }
): PolygonSeed {
  return {
    id: base.id,
    baslik: base.baslik,
    belediye: base.belediye,
    baslangic: base.baslangic,
    bitis: base.bitis,
    ilSlug: base.ilSlug,
    ilceSlug: base.ilceSlug,
    ...extras
  };
}

const sourceList: PolygonSeed[] = [
  fromAskiOzet(ASKI_LIST[0], {
    lng: 29.018,
    lat: 41.0876,
    durum: "askida",
    matchedParcelId: "TR-34-BES-1234-2",
    planAdi: "Beşiktaş Levent 1/1000 UİP Revizyonu"
  }),
  fromAskiOzet(ASKI_LIST[1], {
    lng: 32.811,
    lat: 39.9075,
    durum: "askida",
    matchedParcelId: "TR-06-CAN-2104-3",
    planAdi: "Çankaya Çukurambar 1/1000 UİP Tadilatı"
  }),
  fromAskiOzet(ASKI_LIST[2], {
    lng: 27.144,
    lat: 38.4295,
    durum: "askida",
    matchedParcelId: "TR-35-KON-7102-1",
    planAdi: "Konak Alsancak 7102 Ada UİP Tadilatı"
  }),
  fromAskiOzet(ASKI_LIST[3], {
    lng: 28.853,
    lat: 40.222,
    durum: "onaylandi",
    matchedParcelId: "TR-16-NIL-1308-1",
    planAdi: "Nilüfer Görükle 1308 Ada UİP Onayı"
  }),
  fromAskiOzet(ASKI_LIST[4], {
    lng: 30.766,
    lat: 36.8595,
    durum: "reddedildi",
    matchedParcelId: "TR-07-MUR-4502-1",
    planAdi: "Muratpaşa Lara 4502 Ada Tadilat Reddi"
  }),
  // Bonus: kentsel dönüşüm bölgesi (hatched)
  {
    id: "donusum-istanbul-fatih",
    baslik: "Fatih Tarihi Yarımada Kentsel Dönüşüm",
    belediye: "Fatih Belediyesi",
    baslangic: "2025-12-01",
    bitis: "2027-12-31",
    durum: "donusum",
    ilSlug: "istanbul",
    ilceSlug: "fatih",
    lng: 28.967,
    lat: 41.018,
    planAdi: "Tarihi Yarımada Kentsel Dönüşüm Master Planı"
  },
  // Approved: Ankara Çankaya
  {
    id: "onaylandi-ankara-cankaya-park",
    baslik: "Çankaya Park Aktarması",
    belediye: "Çankaya Belediyesi",
    baslangic: "2024-05-10",
    bitis: "2024-07-09",
    durum: "onaylandi",
    ilSlug: "ankara",
    ilceSlug: "cankaya",
    lng: 32.857,
    lat: 39.92,
    planAdi: "Çankaya Park Aktarma Tadilatı"
  }
];

export const ASKI_POLYGONS: AskiPolygonFeature[] = sourceList.map((entry) => {
  const ring = ringFromCenter(entry.lng, entry.lat, 0.0065, 0.0045);
  return {
    id: entry.id,
    label: entry.baslik,
    durum: entry.durum,
    baslangic: entry.baslangic,
    bitis: entry.bitis,
    belediye: entry.belediye,
    ilSlug: entry.ilSlug,
    ilceSlug: entry.ilceSlug,
    ring,
    matchedParcelId: entry.matchedParcelId,
    planAdi: entry.planAdi
  };
});

/** Status → visual descriptor. Used by both MapLibre + the side popover. */
export const ASKI_STATUS_STYLE: Record<
  AskiPolygonStatus,
  {
    label: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    /** "solid" | "dashed" */
    strokeStyle: "solid" | "dashed";
    /** When true, render an additional hatched pattern overlay */
    hatched?: boolean;
    /** RGB triplet for chart references */
    rgb: string;
  }
> = {
  askida: {
    label: "Askıda",
    fill: "rgb(16,42,76)", // lacivert
    fillOpacity: 0.25,
    stroke: "rgb(16,42,76)",
    strokeOpacity: 0.95,
    strokeStyle: "dashed",
    rgb: "16 42 76"
  },
  onaylandi: {
    label: "Onaylandı",
    fill: "rgb(5,150,105)", // emerald
    fillOpacity: 0.18,
    stroke: "rgb(5,150,105)",
    strokeOpacity: 0.95,
    strokeStyle: "solid",
    rgb: "5 150 105"
  },
  reddedildi: {
    label: "Reddedildi",
    fill: "rgb(185,28,28)", // danger
    fillOpacity: 0.18,
    stroke: "rgb(185,28,28)",
    strokeOpacity: 0.95,
    strokeStyle: "solid",
    rgb: "185 28 28"
  },
  donusum: {
    label: "Dönüşüm Bölgesi",
    fill: "rgb(217,119,6)", // hatched orange
    fillOpacity: 0.22,
    stroke: "rgb(180,83,9)",
    strokeOpacity: 0.85,
    strokeStyle: "solid",
    hatched: true,
    rgb: "217 119 6"
  }
};

export const ASKI_POLYGON_SOURCE_ID = "aski-overlay";

/**
 * Returns a GeoJSON FeatureCollection ready for `map.addSource()`.
 */
export function getAskiCollection(): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  AskiPolygonFeature & { askiStatus: AskiPolygonStatus }
> {
  return {
    type: "FeatureCollection",
    features: ASKI_POLYGONS.map((p, i) => ({
      type: "Feature",
      id: i + 1,
      properties: { ...p, askiStatus: p.durum },
      geometry: {
        type: "Polygon",
        coordinates: [p.ring]
      }
    }))
  };
}

/** Kalan gün — hızlı erişim için. */
export function askiRemainingDays(p: AskiPolygonFeature): number {
  const now = Date.now();
  const target = new Date(p.bitis).getTime();
  if (Number.isNaN(target)) return 0;
  const diff = target - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Aktif askı sayısı. */
export function activeAskiCount(): number {
  return ASKI_POLYGONS.filter((p) => p.durum === "askida").length;
}
