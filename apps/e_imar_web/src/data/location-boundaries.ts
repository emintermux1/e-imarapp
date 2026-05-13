import { getAllParcels, slugify } from "./parcels";
import type { ParcelFeature } from "@/types/parcel";

export interface LocationBoundaryQuery {
  il?: string;
  ilce?: string;
  mahalle?: string;
}

export interface LocationBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface LocationBoundary {
  id: string;
  kind: "il" | "ilce" | "mahalle";
  label: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  bounds: LocationBounds;
  feature: GeoJSON.Feature<GeoJSON.Polygon>;
}

const boundaries = buildBoundaries();

export function getLocationBoundary({ il, ilce, mahalle }: LocationBoundaryQuery) {
  if (il && ilce && mahalle) {
    const boundary = boundaries.get(neighborhoodKey(il, ilce, mahalle));
    if (boundary) return boundary;
  }
  if (il && ilce) {
    const boundary = boundaries.get(districtKey(il, ilce));
    if (boundary) return boundary;
  }
  if (il) return boundaries.get(cityKey(il));
  return undefined;
}

export function emptySelectedAreaCollection(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return { type: "FeatureCollection", features: [] };
}

function buildBoundaries() {
  const groups = new Map<string, { kind: LocationBoundary["kind"]; label: string; il?: string; ilce?: string; mahalle?: string; points: Array<[number, number]> }>();

  for (const parcel of getAllParcels()) {
    const p = parcel.properties;
    addParcel(groups, cityKey(p.il), "il", p.il, { il: p.il }, parcel);
    addParcel(groups, districtKey(p.il, p.ilce), "ilce", p.ilce, { il: p.il, ilce: p.ilce }, parcel);
    addParcel(groups, neighborhoodKey(p.il, p.ilce, p.mahalle), "mahalle", p.mahalle, { il: p.il, ilce: p.ilce, mahalle: p.mahalle }, parcel);
  }

  const out = new Map<string, LocationBoundary>();
  for (const [id, group] of groups.entries()) {
    const hull = convexHull(group.points);
    const ring = padRing(hull.length >= 3 ? hull : bboxRing(group.points), group.kind);
    const bounds = boundsForRing(ring);
    out.set(id, {
      id,
      kind: group.kind,
      label: group.label,
      il: group.il,
      ilce: group.ilce,
      mahalle: group.mahalle,
      bounds,
      feature: {
        type: "Feature",
        properties: {
          id,
          kind: group.kind,
          label: group.label,
          il: group.il,
          ilce: group.ilce,
          mahalle: group.mahalle
        },
        geometry: { type: "Polygon", coordinates: [ring] }
      }
    });
  }
  return out;
}

function addParcel(
  groups: Map<string, { kind: LocationBoundary["kind"]; label: string; il?: string; ilce?: string; mahalle?: string; points: Array<[number, number]> }>,
  key: string,
  kind: LocationBoundary["kind"],
  label: string,
  location: Pick<LocationBoundary, "il" | "ilce" | "mahalle">,
  parcel: ParcelFeature
) {
  const group = groups.get(key) ?? { kind, label, ...location, points: [] };
  const ring = parcel.geometry.coordinates[0] ?? [];
  ring.forEach(([lng, lat]) => group.points.push([lng, lat]));
  groups.set(key, group);
}

function convexHull(points: Array<[number, number]>) {
  const unique = [...new Map(points.map((p) => [`${p[0].toFixed(7)},${p[1].toFixed(7)}`, p])).values()].sort(
    (a, b) => a[0] - b[0] || a[1] - b[1]
  );
  if (unique.length <= 1) return unique;

  const lower: Array<[number, number]> = [];
  for (const p of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }

  const upper: Array<[number, number]> = [];
  for (let i = unique.length - 1; i >= 0; i -= 1) {
    const p = unique[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }

  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function cross(o: [number, number], a: [number, number], b: [number, number]) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function bboxRing(points: Array<[number, number]>) {
  const bounds = boundsForRing(points);
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.south],
    [bounds.east, bounds.north],
    [bounds.west, bounds.north]
  ] as Array<[number, number]>;
}

function padRing(ring: Array<[number, number]>, kind: LocationBoundary["kind"]): Array<[number, number]> {
  const bounds = boundsForRing(ring);
  const cx = (bounds.west + bounds.east) / 2;
  const cy = (bounds.south + bounds.north) / 2;
  const minPad = kind === "mahalle" ? 0.002 : kind === "ilce" ? 0.006 : 0.014;
  const scale = kind === "mahalle" ? 1.18 : kind === "ilce" ? 1.14 : 1.1;
  const closed = ring.map(([lng, lat]) => {
    const dx = lng - cx;
    const dy = lat - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [cx + dx * scale + (dx / len) * minPad, cy + dy * scale + (dy / len) * minPad] as [number, number];
  });
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) closed.push(first);
  return closed;
}

function boundsForRing(ring: Array<[number, number]>): LocationBounds {
  return ring.reduce(
    (acc, [lng, lat]) => ({
      west: Math.min(acc.west, lng),
      south: Math.min(acc.south, lat),
      east: Math.max(acc.east, lng),
      north: Math.max(acc.north, lat)
    }),
    { west: Number.POSITIVE_INFINITY, south: Number.POSITIVE_INFINITY, east: Number.NEGATIVE_INFINITY, north: Number.NEGATIVE_INFINITY }
  );
}

function cityKey(il: string) {
  return `il:${slugify(il)}`;
}

function districtKey(il: string, ilce: string) {
  return `ilce:${slugify(il)}:${slugify(ilce)}`;
}

function neighborhoodKey(il: string, ilce: string, mahalle: string) {
  return `mahalle:${slugify(il)}:${slugify(ilce)}:${slugify(mahalle)}`;
}
