import { getAllParcels, slugify } from "@/data/parcels";
import { inTurkey } from "@/lib/geo/turkey";
import type { ParcelFeature } from "@/types/parcel";

export interface StructuredParcelQuery {
  il?: string;
  ilce?: string;
  mahalle?: string;
  ada: string;
  parsel: string;
}

export interface CoordinateQuery {
  lat: number;
  lng: number;
}

export function findStructuredParcel(query: StructuredParcelQuery): ParcelFeature | null {
  const ada = query.ada.trim();
  const parsel = query.parsel.trim();
  if (!ada || !parsel) return null;
  const il = query.il ? slugify(query.il) : undefined;
  const ilce = query.ilce ? slugify(query.ilce) : undefined;
  const mahalle = query.mahalle ? slugify(query.mahalle) : undefined;
  return getAllParcels().find((feature) => {
    const props = feature.properties;
    if (props.ada !== ada || props.parsel !== parsel) return false;
    if (il && slugify(props.il) !== il) return false;
    if (ilce && slugify(props.ilce) !== ilce) return false;
    if (mahalle && slugify(props.mahalle) !== mahalle) return false;
    return true;
  }) ?? null;
}

export function parseCoordinateQuery(input: string): CoordinateQuery | null {
  const match = input.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!match) return null;
  const first = parseCoordinateNumber(match[1]);
  const second = parseCoordinateNumber(match[2]);
  if (first == null || second == null) return null;
  if (inTurkey(second, first)) return { lat: first, lng: second };
  if (inTurkey(first, second)) return { lat: second, lng: first };
  return null;
}

function parseCoordinateNumber(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function structuredParcelLabel(query: StructuredParcelQuery) {
  return [query.il, query.ilce, query.mahalle, `${query.ada}/${query.parsel}`]
    .filter((item): item is string => Boolean(item && item.trim()))
    .join(" · ");
}
