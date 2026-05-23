/**
 * Askı haritası overlay'i için poligonlar. Bu sınırlar sentetik örnek
 * kapsamıdır; resmi belediye/TKGM askı planı geometrisi değildir.
 */

import { DEMO_PARCEL_CLUSTERS } from "./parcel-seeds";
import type { AskiOzet } from "./aski-list";
import { ASKI_LIST } from "./aski-list";
import type { ProvenanceKind } from "../lib/aski-tracking";

export type AskiPolygonStatus = "askida" | "onaylandi" | "reddedildi" | "donusum";

export interface AskiPolygonFeature {
  id: string;
  label: string;
  durum: AskiPolygonStatus;
  provenance: ProvenanceKind;
  baslangic: string;
  bitis: string;
  belediye: string;
  ilSlug: string;
  ilceSlug: string;
  ring: [number, number][];
  matchedParcelId?: string;
  planAdi?: string;
}

function ringFromCenter(
  lng: number,
  lat: number,
  widthDeg = 0.006,
  heightDeg = 0.004
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

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[ğ]/g, "g")
    .replace(/[ş]/g, "s")
    .replace(/[ç]/g, "c")
    .replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  provenance: ProvenanceKind;
  matchedParcelId?: string;
  planAdi?: string;
  size?: [number, number];
}

function fromAskiOzet(
  base: AskiOzet,
  extras: {
    lng: number;
    lat: number;
    durum: AskiPolygonStatus;
    provenance: ProvenanceKind;
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

const manualSeeds: PolygonSeed[] = [
  fromAskiOzet(ASKI_LIST[0], {
    lng: 29.018,
    lat: 41.0876,
    durum: "askida",
    matchedParcelId: "TR-34-BES-1234-2",
    planAdi: "Beşiktaş Levent 1/1000 UİP Revizyonu",
    provenance: "demo"
  }),
  fromAskiOzet(ASKI_LIST[1], {
    lng: 32.811,
    lat: 39.9075,
    durum: "askida",
    matchedParcelId: "TR-06-CAN-2104-3",
    planAdi: "Çankaya Çukurambar 1/1000 UİP Tadilatı",
    provenance: "demo"
  }),
  fromAskiOzet(ASKI_LIST[2], {
    lng: 27.144,
    lat: 38.4295,
    durum: "askida",
    matchedParcelId: "TR-35-KON-7102-1",
    planAdi: "Konak Alsancak 7102 Ada UİP Tadilatı",
    provenance: "demo"
  }),
  fromAskiOzet(ASKI_LIST[3], {
    lng: 28.853,
    lat: 40.222,
    durum: "onaylandi",
    matchedParcelId: "TR-16-NIL-1308-1",
    planAdi: "Nilüfer Görükle 1308 Ada UİP Onayı",
    provenance: "demo"
  }),
  fromAskiOzet(ASKI_LIST[4], {
    lng: 30.766,
    lat: 36.8595,
    durum: "reddedildi",
    matchedParcelId: "TR-07-MUR-4502-1",
    planAdi: "Muratpaşa Lara 4502 Ada Tadilat Reddi",
    provenance: "demo"
  }),
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
    planAdi: "Tarihi Yarımada Kentsel Dönüşüm Master Planı",
    size: [0.010, 0.006],
    provenance: "derived"
  },
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
    planAdi: "Çankaya Park Aktarma Tadilatı",
    provenance: "derived"
  }
];

const derivedSeeds: PolygonSeed[] = DEMO_PARCEL_CLUSTERS.filter((cluster, index) => index % 2 === 0 || ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"].includes(cluster.il))
  .slice(0, 34)
  .map((cluster, index) => {
    const status: AskiPolygonStatus = index % 9 === 0 ? "donusum" : index % 5 === 0 ? "onaylandi" : index % 7 === 0 ? "reddedildi" : "askida";
    const startMonth = status === "askida" ? 4 + (index % 3) : 1 + (index % 10);
    return {
      id: `sample-aski-${cluster.id}`,
      baslik: `${cluster.ilce} ${cluster.mahalle} örnek plan askı alanı`,
      belediye: `${cluster.ilce} Belediyesi`,
      baslangic: `2026-${String(startMonth).padStart(2, "0")}-${String(4 + (index % 20)).padStart(2, "0")}`,
      bitis: `2026-${String(Math.min(12, startMonth + 2)).padStart(2, "0")}-${String(8 + (index % 18)).padStart(2, "0")}`,
      durum: status,
      provenance: "derived",
      ilSlug: slugify(cluster.il),
      ilceSlug: slugify(cluster.ilce),
      lng: cluster.center[0] + ((index % 3) - 1) * 0.0022,
      lat: cluster.center[1] + ((index % 4) - 1.5) * 0.0016,
      planAdi: `${cluster.mahalle} 1/1000 Örnek UİP Tadilatı`,
      size: [0.005 + (index % 3) * 0.001, 0.0035 + (index % 2) * 0.001]
    };
  });

export const ASKI_POLYGONS: AskiPolygonFeature[] = [...manualSeeds, ...derivedSeeds].map((entry) => {
  const [w, h] = entry.size ?? [0.0065, 0.0045];
  return {
    id: entry.id,
    label: entry.baslik,
    durum: entry.durum,
    provenance: entry.provenance,
    baslangic: entry.baslangic,
    bitis: entry.bitis,
    belediye: entry.belediye,
    ilSlug: entry.ilSlug,
    ilceSlug: entry.ilceSlug,
    ring: ringFromCenter(entry.lng, entry.lat, w, h),
    matchedParcelId: entry.matchedParcelId,
    planAdi: entry.planAdi
  };
});

export const ASKI_STATUS_STYLE: Record<
  AskiPolygonStatus,
  {
    label: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeStyle: "solid" | "dashed";
    hatched?: boolean;
    rgb: string;
  }
> = {
  askida: {
    label: "Askıda",
    fill: "rgb(16,42,76)",
    fillOpacity: 0.25,
    stroke: "rgb(16,42,76)",
    strokeOpacity: 0.95,
    strokeStyle: "dashed",
    rgb: "16 42 76"
  },
  onaylandi: {
    label: "Onaylandı",
    fill: "rgb(5,150,105)",
    fillOpacity: 0.18,
    stroke: "rgb(5,150,105)",
    strokeOpacity: 0.95,
    strokeStyle: "solid",
    rgb: "5 150 105"
  },
  reddedildi: {
    label: "Reddedildi",
    fill: "rgb(185,28,28)",
    fillOpacity: 0.18,
    stroke: "rgb(185,28,28)",
    strokeOpacity: 0.95,
    strokeStyle: "solid",
    rgb: "185 28 28"
  },
  donusum: {
    label: "Dönüşüm Bölgesi",
    fill: "rgb(217,119,6)",
    fillOpacity: 0.22,
    stroke: "rgb(180,83,9)",
    strokeOpacity: 0.85,
    strokeStyle: "solid",
    hatched: true,
    rgb: "217 119 6"
  }
};

export const ASKI_POLYGON_SOURCE_ID = "aski-overlay";

export function getAskiCollection() {
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

export function askiRemainingDays(p: AskiPolygonFeature): number {
  const now = Date.now();
  const target = new Date(p.bitis).getTime();
  if (Number.isNaN(target)) return 0;
  const diff = target - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function activeAskiCount(): number {
  return ASKI_POLYGONS.filter((p) => p.durum === "askida").length;
}
