import type { ParcelResponse } from "@/types/api";
import type { ParcelFeature, ParcelProps, TapuTipi } from "@/types/parcel";
import { extractGeoJsonGeometry, geoJsonCentroid } from "@/lib/geojson";

export type AnyGeoJson =
  | GeoJSON.Geometry
  | GeoJSON.Feature
  | GeoJSON.FeatureCollection
  | Record<string, unknown>
  | undefined
  | null;

export function backendParcelId(id: number) {
  return `backend:${id}`;
}

export function parseBackendParcelId(id: string | null | undefined) {
  if (!id?.startsWith("backend:")) return null;
  const numeric = Number(id.slice("backend:".length));
  return Number.isFinite(numeric) ? numeric : null;
}

export function extractGeometry(input: AnyGeoJson): GeoJSON.Geometry | null {
  return extractGeoJsonGeometry(input);
}

export function geometryCentroid(input: AnyGeoJson): [number, number] | undefined {
  return geoJsonCentroid(input);
}

function tapuTipiFromBackend(value?: string): TapuTipi {
  const normalized = value?.toLocaleLowerCase("tr-TR") ?? "";
  if (normalized.includes("tarla")) return "Tarla";
  if (normalized.includes("bağ") || normalized.includes("bag")) return "Bag";
  if (normalized.includes("bahçe") || normalized.includes("bahce")) return "Bahce";
  if (normalized.includes("bina")) return "Bina";
  return "Arsa";
}

export function normalizeBackendParcel(response: ParcelResponse): ParcelProps {
  const centroid = geometryCentroid(response.geometri);
  return {
    id: backendParcelId(response.id),
    backendId: response.id,
    sourceStatus: "live",
    sourceNote: "Canlı API parsel kaydı; imar parametreleri plan servisiyle doğrulanmalıdır.",
    mapId: 1_000_000 + response.id,
    ada: response.ada,
    parsel: response.parsel,
    il: response.il || "—",
    ilce: response.ilce || "—",
    mahalle: response.mahalle || response.mevkii || "—",
    pafta: response.pafta,
    yuzolcumuM2: response.alan_m2 || 0,
    tapuTipi: tapuTipiFromBackend(response.tapu_durumu || response.nitelik),
    zoningType: "Konut",
    yapilasmaSekli: "Ayrik",
    taks: 0,
    kaks: 0,
    gabariM: 0,
    katSiniri: 0,
    yolCephesiM: 0,
    planAdi: "Canlı API parseli — imar planı eşleşmesi bekleniyor",
    planOnayTarihi: "",
    yatirimSkoru: 0,
    riskler: { deprem: 1, heyelan: 0, sel: 0, yangin: 0 },
    cevre: { metroM: 0, hastaneKm: 0, okulKm: 0, parkM: 0, ulasimSkoru: 0, gurultuSkoru: 0 },
    planNotlari: [
      "Bu parsel canlı API'den geldi; imar parametreleri resmi plan servisi bağlanana kadar bilinmiyor."
    ],
    centroid
  };
}

export function backendParcelToFeature(response: ParcelResponse): ParcelFeature {
  const props = normalizeBackendParcel(response);
  const geometry = extractGeometry(response.geometri);
  const polygonCoordinates =
    geometry?.type === "Polygon"
      ? geometry.coordinates
      : geometry?.type === "MultiPolygon"
      ? geometry.coordinates[0] ?? []
      : [];
  return {
    type: "Feature",
    id: props.mapId,
    properties: props,
    geometry: { type: "Polygon", coordinates: polygonCoordinates }
  };
}
