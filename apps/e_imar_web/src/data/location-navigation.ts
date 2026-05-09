import { adaParselText } from "@/lib/format";
import type { ParcelFeature } from "@/types/parcel";
import type { FlyTarget } from "@/stores/map-store";
import { DEMO_PARCEL_CLUSTERS, type ParcelClusterSeed } from "./parcel-seeds";
import { slugify, getAllParcels } from "./parcels";

export type LocationLevel = "il" | "ilce" | "mahalle" | "parcel";
export type LocationTargetKind = LocationLevel;

export interface LocationTarget {
  label: string;
  center: [number, number];
  zoom: number;
  kind: LocationTargetKind;
  il?: string;
  ilce?: string;
  mahalle?: string;
  parcelId?: string;
}

export interface LocationExplorerTarget extends LocationTarget {
  count: number;
}

export interface MapLabelTarget extends LocationExplorerTarget {
  sourceId: string;
  minzoom: number;
  maxzoom: number;
}

export interface LocationTargetQuery {
  il?: string;
  ilce?: string;
  mahalle?: string;
}

export interface LocationJumpOptions {
  zoom?: number;
  bounds?: FlyTarget["bounds"];
  parcelId?: string;
}

interface ClusterGroup {
  label: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  clusters: ParcelClusterSeed[];
  count: number;
}

const cityGroups = new Map<string, ClusterGroup>();
const districtGroups = new Map<string, ClusterGroup>();
const neighborhoodGroups = new Map<string, ClusterGroup>();
const parcelFallbackGroups = buildParcelFallbackGroups();

for (const cluster of DEMO_PARCEL_CLUSTERS) {
  addCluster(cityGroups, cityKey(cluster.il), cluster.il, { il: cluster.il }, cluster);
  addCluster(
    districtGroups,
    districtKey(cluster.il, cluster.ilce),
    cluster.ilce,
    { il: cluster.il, ilce: cluster.ilce },
    cluster
  );
  addCluster(
    neighborhoodGroups,
    neighborhoodKey(cluster.il, cluster.ilce, cluster.mahalle),
    cluster.mahalle,
    { il: cluster.il, ilce: cluster.ilce, mahalle: cluster.mahalle },
    cluster
  );
}

const coveredCities = buildCoveredCities();
const districtTargetsByCity = buildDistrictTargetsByCity();
const neighborhoodTargetsByDistrict = buildNeighborhoodTargetsByDistrict();
const mapLabelTargets = buildMapLabelTargets();
const searchableTargets = buildSearchableTargets();

export function getLocationTargetForParcel(
  parcel: ParcelFeature | undefined | null,
  level: LocationLevel
): LocationTarget | undefined {
  if (!parcel) return undefined;
  const p = parcel.properties;
  if (level === "parcel") {
    const center = p.centroid ?? getPolygonCentroid(parcel);
    if (!center) return undefined;
    return {
      label: adaParselText(p.ada, p.parsel),
      center,
      zoom: 17,
      kind: "parcel",
      il: p.il,
      ilce: p.ilce,
      mahalle: p.mahalle,
      parcelId: p.id
    };
  }
  if (level === "mahalle") {
    return findBestLocationTarget({ il: p.il, ilce: p.ilce, mahalle: p.mahalle });
  }
  if (level === "ilce") {
    return findBestLocationTarget({ il: p.il, ilce: p.ilce });
  }
  return findBestLocationTarget({ il: p.il });
}

export function buildFlyTargetFromLocationTarget(
  target: LocationTarget,
  options: LocationJumpOptions = {}
): Omit<FlyTarget, "seq"> {
  return {
    center: target.center,
    zoom: options.zoom ?? target.zoom,
    bounds: options.bounds,
    parcelId: options.parcelId ?? target.parcelId
  };
}

export function findBestLocationTarget({
  il,
  ilce,
  mahalle
}: LocationTargetQuery): LocationTarget | undefined {
  if (il && ilce && mahalle) {
    const target = targetFromGroup(neighborhoodGroups.get(neighborhoodKey(il, ilce, mahalle)), "mahalle", 14.5);
    if (target) return target;
  }
  if (il && ilce) {
    const target = targetFromGroup(districtGroups.get(districtKey(il, ilce)), "ilce", 12.5);
    if (target) return target;
  }
  if (il) {
    const target = targetFromGroup(cityGroups.get(cityKey(il)), "il", cityZoom(il));
    if (target) return target;
  }
  return findParcelFallbackTarget({ il, ilce, mahalle });
}

export function searchLocationTargets(query: string, limit = 6): LocationTarget[] {
  const normalized = normalize(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ").filter(Boolean);
  return searchableTargets
    .map((target) => ({ target, score: scoreTarget(target, normalized, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || kindRank(a.target.kind) - kindRank(b.target.kind))
    .slice(0, limit)
    .map((item) => item.target);
}

export function getCoveredCities(): LocationExplorerTarget[] {
  return coveredCities;
}

export function getDistrictTargets(il: string): LocationExplorerTarget[] {
  return districtTargetsByCity.get(cityKey(il)) ?? [];
}

export function getNeighborhoodTargets(il: string, ilce: string): LocationExplorerTarget[] {
  return neighborhoodTargetsByDistrict.get(districtKey(il, ilce)) ?? [];
}

export function getMapLabelTargets(zoom?: number): MapLabelTarget[] {
  if (zoom == null) return mapLabelTargets;
  return mapLabelTargets.filter((target) => zoom >= target.minzoom && zoom <= target.maxzoom);
}

function addCluster(
  map: Map<string, ClusterGroup>,
  key: string,
  label: string,
  location: Omit<ClusterGroup, "label" | "clusters" | "count">,
  cluster: ParcelClusterSeed
) {
  const existing = map.get(key);
  if (existing) {
    existing.clusters.push(cluster);
    existing.count += cluster.count;
    return;
  }
  map.set(key, { label, ...location, clusters: [cluster], count: cluster.count });
}

function targetFromGroup(
  group: ClusterGroup | undefined,
  kind: Exclude<LocationTargetKind, "parcel">,
  zoom: number
): LocationTarget | undefined {
  if (!group || group.clusters.length === 0) return undefined;
  return {
    label: group.label,
    center: averageCenters(group.clusters.map((c) => c.center)),
    zoom,
    kind,
    il: group.il,
    ilce: group.ilce,
    mahalle: group.mahalle
  };
}

function explorerTargetFromGroup(
  group: ClusterGroup | undefined,
  kind: Exclude<LocationTargetKind, "parcel">,
  zoom: number
): LocationExplorerTarget | undefined {
  const target = targetFromGroup(group, kind, zoom);
  if (!target || !group) return undefined;
  return { ...target, count: group.count };
}

function findParcelFallbackTarget({ il, ilce, mahalle }: LocationTargetQuery): LocationTarget | undefined {
  if (il && ilce && mahalle) {
    const target = parcelFallbackGroups.neighborhood.get(neighborhoodKey(il, ilce, mahalle));
    if (target) return target;
  }
  if (il && ilce) {
    const target = parcelFallbackGroups.district.get(districtKey(il, ilce));
    if (target) return target;
  }
  if (il) return parcelFallbackGroups.city.get(cityKey(il));
  return undefined;
}

function buildParcelFallbackGroups() {
  const city = new Map<string, Array<{ label: string; center: [number, number]; il: string }>>();
  const district = new Map<string, Array<{ label: string; center: [number, number]; il: string; ilce: string }>>();
  const neighborhood = new Map<string, Array<{ label: string; center: [number, number]; il: string; ilce: string; mahalle: string }>>();

  for (const parcel of getAllParcels()) {
    const p = parcel.properties;
    const center = p.centroid ?? getPolygonCentroid(parcel);
    if (!center) continue;
    pushGroup(city, cityKey(p.il), { label: p.il, center, il: p.il });
    pushGroup(district, districtKey(p.il, p.ilce), { label: p.ilce, center, il: p.il, ilce: p.ilce });
    pushGroup(neighborhood, neighborhoodKey(p.il, p.ilce, p.mahalle), {
      label: p.mahalle,
      center,
      il: p.il,
      ilce: p.ilce,
      mahalle: p.mahalle
    });
  }

  return {
    city: collapseFallback(city, "il", 10.2),
    district: collapseFallback(district, "ilce", 12.5),
    neighborhood: collapseFallback(neighborhood, "mahalle", 14.5)
  };
}

function pushGroup<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key) ?? [];
  list.push(value);
  map.set(key, list);
}

function collapseFallback<T extends { label: string; center: [number, number]; il?: string; ilce?: string; mahalle?: string }>(
  map: Map<string, T[]>,
  kind: Exclude<LocationTargetKind, "parcel">,
  zoom: number
) {
  const out = new Map<string, LocationTarget>();
  for (const [key, items] of map.entries()) {
    const first = items[0];
    out.set(key, {
      label: first.label,
      center: averageCenters(items.map((item) => item.center)),
      zoom: kind === "il" ? cityZoom(first.il ?? first.label) : zoom,
      kind,
      il: first.il,
      ilce: first.ilce,
      mahalle: first.mahalle
    });
  }
  return out;
}

function buildCoveredCities() {
  return [...cityGroups.values()]
    .map((group) => explorerTargetFromGroup(group, "il", cityZoom(group.il ?? group.label)))
    .filter((target): target is LocationExplorerTarget => Boolean(target))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"));
}

function buildDistrictTargetsByCity() {
  const out = new Map<string, LocationExplorerTarget[]>();
  for (const group of districtGroups.values()) {
    if (!group.il) continue;
    const target = explorerTargetFromGroup(group, "ilce", 12.5);
    if (!target) continue;
    const key = cityKey(group.il);
    const list = out.get(key) ?? [];
    list.push(target);
    out.set(key, list);
  }
  for (const [key, list] of out.entries()) {
    list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"));
    out.set(key, list);
  }
  return out;
}

function buildNeighborhoodTargetsByDistrict() {
  const out = new Map<string, LocationExplorerTarget[]>();
  for (const group of neighborhoodGroups.values()) {
    if (!group.il || !group.ilce) continue;
    const target = explorerTargetFromGroup(group, "mahalle", 14.5);
    if (!target) continue;
    const key = districtKey(group.il, group.ilce);
    const list = out.get(key) ?? [];
    list.push(target);
    out.set(key, list);
  }
  for (const [key, list] of out.entries()) {
    list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"));
    out.set(key, list);
  }
  return out;
}

function buildMapLabelTargets(): MapLabelTarget[] {
  const targets: MapLabelTarget[] = [];
  for (const city of coveredCities) {
    targets.push({
      ...city,
      sourceId: `city:${city.il ?? city.label}`,
      minzoom: 4.2,
      maxzoom: 8.5
    });
  }
  for (const list of districtTargetsByCity.values()) {
    for (const district of list) {
      targets.push({
        ...district,
        sourceId: `district:${district.il}:${district.ilce}`,
        minzoom: 7.2,
        maxzoom: 12.6
      });
    }
  }
  for (const list of neighborhoodTargetsByDistrict.values()) {
    for (const neighborhood of list) {
      targets.push({
        ...neighborhood,
        sourceId: `neighborhood:${neighborhood.il}:${neighborhood.ilce}:${neighborhood.mahalle}`,
        minzoom: 11.0,
        maxzoom: 15.8
      });
    }
  }
  return targets;
}

function buildSearchableTargets() {
  const targets = new Map<string, LocationTarget>();
  for (const group of neighborhoodGroups.values()) {
    const target = targetFromGroup(group, "mahalle", 14.5);
    if (target) targets.set(`mahalle:${target.il}:${target.ilce}:${target.mahalle}`, target);
  }
  for (const group of districtGroups.values()) {
    const target = targetFromGroup(group, "ilce", 12.5);
    if (target) targets.set(`ilce:${target.il}:${target.ilce}`, target);
  }
  for (const group of cityGroups.values()) {
    const target = targetFromGroup(group, "il", cityZoom(group.il ?? group.label));
    if (target) targets.set(`il:${target.il}`, target);
  }
  for (const target of parcelFallbackGroups.neighborhood.values()) {
    targets.set(`mahalle:${target.il}:${target.ilce}:${target.mahalle}`, target);
  }
  for (const target of parcelFallbackGroups.district.values()) {
    targets.set(`ilce:${target.il}:${target.ilce}`, target);
  }
  for (const target of parcelFallbackGroups.city.values()) {
    targets.set(`il:${target.il}`, target);
  }
  return [...targets.values()].map((target) => ({
    ...target,
    searchText: normalize([target.label, target.mahalle, target.ilce, target.il, kindLabel(target.kind)].filter(Boolean).join(" "))
  }));
}

function scoreTarget(
  target: LocationTarget & { searchText: string },
  normalized: string,
  tokens: string[]
) {
  const label = normalize(target.label);
  if (label === normalized) return 100;
  if (target.searchText.startsWith(normalized)) return 70;
  if (target.searchText.includes(normalized)) return 45;
  let score = 0;
  for (const token of tokens) {
    if (target.searchText.includes(token)) score += 10;
  }
  return tokens.length > 0 && score >= tokens.length * 8 ? score : 0;
}

function averageCenters(centers: Array<[number, number]>): [number, number] {
  const [lng, lat] = centers.reduce(
    (sum, center) => [sum[0] + center[0], sum[1] + center[1]],
    [0, 0]
  );
  return [lng / centers.length, lat / centers.length];
}

export function getPolygonCentroid(parcel: ParcelFeature): [number, number] | undefined {
  const ring = parcel.geometry.coordinates[0];
  if (!ring || ring.length === 0) return undefined;
  return averageCenters(ring as Array<[number, number]>);
}

export function getRingCentroid(ring: Array<[number, number]>): [number, number] | undefined {
  if (!ring || ring.length === 0) return undefined;
  return averageCenters(ring);
}

export function getRingBounds(ring: Array<[number, number]>) {
  if (!ring || ring.length === 0) return undefined;
  let west = 180;
  let east = -180;
  let south = 90;
  let north = -90;
  for (const [lng, lat] of ring) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { west, east, south, north };
}

function cityZoom(il: string) {
  const key = slugify(il);
  return key === "istanbul" || key === "ankara" ? 9.8 : 10.2;
}

function cityKey(il: string) {
  return slugify(il);
}

function districtKey(il: string, ilce: string) {
  return `${slugify(il)}:${slugify(ilce)}`;
}

function neighborhoodKey(il: string, ilce: string, mahalle: string) {
  return `${districtKey(il, ilce)}:${slugify(mahalle)}`;
}

function normalize(value: string) {
  return slugify(value).replace(/-/g, " ").trim();
}

function kindRank(kind: LocationTargetKind) {
  if (kind === "mahalle") return 0;
  if (kind === "ilce") return 1;
  if (kind === "il") return 2;
  return 3;
}

export function kindLabel(kind: LocationTargetKind) {
  if (kind === "mahalle") return "Mahalle";
  if (kind === "ilce") return "İlçe";
  if (kind === "il") return "İl";
  return "Parsel";
}
