import type { ParcelResponse } from "@/types/api";
import type { ParcelFeature, ParcelProps, TapuTipi } from "@/types/parcel";
import type { BBox, SearchResult } from "@/types/geo";
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
  const value = id.slice("backend:".length);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function municipalParcelId(
  municipalityId: string,
  ada: string,
  parsel: string,
) {
  return `municipal:${municipalityId}:${ada}:${parsel}`;
}

export function parseMunicipalParcelId(id: string | null | undefined) {
  if (!id?.startsWith("municipal:")) return null;
  const parts = id.slice("municipal:".length).split(":");
  if (parts.length < 3) return null;
  const [municipalityId, ada, parsel] = parts;
  return { municipalityId, ada, parsel };
}

function bboxRing(
  bbox: BBox | [number, number, number, number],
): GeoJSON.Position[] {
  const west = Array.isArray(bbox) ? bbox[0] : bbox.west;
  const south = Array.isArray(bbox) ? bbox[1] : bbox.south;
  const east = Array.isArray(bbox) ? bbox[2] : bbox.east;
  const north = Array.isArray(bbox) ? bbox[3] : bbox.north;
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function centroidBufferRing(
  centroid: [number, number],
  delta = 0.00045,
): GeoJSON.Position[] {
  const [lng, lat] = centroid;
  return [
    [lng - delta, lat - delta],
    [lng + delta, lat - delta],
    [lng + delta, lat + delta],
    [lng - delta, lat + delta],
    [lng - delta, lat - delta],
  ];
}

function geometryToPolygon(
  geometry: GeoJSON.Geometry | null,
): GeoJSON.Polygon | null {
  if (!geometry) return null;
  if (geometry.type === "Polygon" && geometry.coordinates.length > 0) {
    return geometry;
  }
  if (geometry.type === "MultiPolygon" && geometry.coordinates[0]?.length) {
    return { type: "Polygon", coordinates: geometry.coordinates[0] };
  }
  return null;
}

function overlayMapId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 2_000_000 + (hash % 900_000);
}

export function searchResultToOverlayFeature(
  result: SearchResult,
): ParcelFeature | null {
  if (result.type !== "parcel") return null;
  if (parseBackendParcelId(result.parcelId) != null) return null;

  const municipal = parseMunicipalParcelId(result.parcelId);
  const adaParselMatch = result.primary.match(/(\d+)\s*\/\s*(\d+)/);
  const ada = municipal?.ada ?? adaParselMatch?.[1] ?? "—";
  const parsel = municipal?.parsel ?? adaParselMatch?.[2] ?? "—";
  const ring = result.bbox
    ? bboxRing(result.bbox)
    : result.centroid
      ? centroidBufferRing(result.centroid)
      : null;
  if (!ring) return null;

  const location = result.secondary?.split(",") ?? [];
  const props: ParcelProps = {
    id: result.parcelId,
    mapId: overlayMapId(result.parcelId),
    ada,
    parsel,
    il: location[2]?.trim() || "—",
    ilce: location[1]?.trim() || "—",
    mahalle: location[0]?.trim() || "—",
    yuzolcumuM2: 0,
    tapuTipi: "Arsa",
    zoningType: result.zoningType ?? "Konut",
    yapilasmaSekli: "Ayrik",
    taks: 0,
    kaks: 0,
    gabariM: 0,
    katSiniri: 0,
    yolCephesiM: 0,
    planAdi: result.meta ?? "Belediye canlı sorgu",
    planOnayTarihi: "",
    yatirimSkoru: 0,
    riskler: { deprem: 1, heyelan: 0, sel: 0, yangin: 0 },
    cevre: { metroM: 0, hastaneKm: 0, okulKm: 0, parkM: 0, ulasimSkoru: 0, gurultuSkoru: 0 },
    planNotlari: [
      result.bbox
        ? "Belediye sorgusu bbox ile haritada gösteriliyor."
        : "Kesin parsel geometrisi yok; yaklaşık konum kutusu gösteriliyor.",
    ],
    centroid: result.centroid,
    sourceStatus: result.sourceStatus ?? "live",
    sourceNote: result.meta,
  };

  return {
    type: "Feature",
    id: props.mapId,
    properties: props,
    geometry: { type: "Polygon", coordinates: [ring] },
  };
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
  const geometry =
    geometryToPolygon(extractGeometry(response.geometri)) ??
    (props.centroid
      ? { type: "Polygon" as const, coordinates: [centroidBufferRing(props.centroid)] }
      : { type: "Polygon" as const, coordinates: [] as GeoJSON.Position[][] });
  return {
    type: "Feature",
    id: props.mapId,
    properties: props,
    geometry,
  };
}
