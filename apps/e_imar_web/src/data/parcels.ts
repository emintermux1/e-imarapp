import type { ParcelFeature, ParcelFeatureCollection, ParcelProps } from "@/types/parcel";
import { adaParselText, adaParselSlug } from "@/lib/format";
import { getParcelSourceMetadata, getParcelSourceSnapshot } from "./parcel-source";

const source = getParcelSourceSnapshot();
const parcels = source.collection;

const byId = new Map<string, ParcelFeature>();
const byMapId = new Map<number, ParcelFeature>();
const byAdaParsel = new Map<string, ParcelFeature[]>();
const searchIndex: Array<{ feature: ParcelFeature; text: string; adaParsel: string }> = [];

for (const feature of parcels.features) {
  const p = feature.properties;
  byId.set(p.id, feature);
  byMapId.set(Number(feature.id), feature);
  byMapId.set(p.mapId, feature);
  const adaKey = `${p.ada}-${p.parsel}`;
  const list = byAdaParsel.get(adaKey) ?? [];
  list.push(feature);
  byAdaParsel.set(adaKey, list);
  searchIndex.push({
    feature,
    adaParsel: adaKey,
    text: `${p.id} ${adaParselText(p.ada, p.parsel)} ${adaParselSlug(p.ada, p.parsel)} ${p.mahalle} ${p.ilce} ${p.il} ${p.zoningType} ${p.planAdi}`.toLocaleLowerCase("tr-TR")
  });
}

export function getAllParcels(): ParcelFeature[] {
  return parcels.features;
}

export function getParcelsCollection(): ParcelFeatureCollection {
  return parcels;
}

export function getParcelById(id: string): ParcelFeature | undefined {
  return byId.get(id);
}

export function getParcelByMapId(
  mapId: string | number
): ParcelFeature | undefined {
  if (mapId == null) return undefined;
  const numeric = typeof mapId === "string" ? Number(mapId) : mapId;
  if (!Number.isFinite(numeric)) return undefined;
  return byMapId.get(numeric);
}

export function findParcelByAdaParselSlug(
  slug: string,
  ilSlug?: string,
  ilceSlug?: string
): ParcelFeature | undefined {
  const cleaned = slug.trim().replace(/\s+/g, "").replace("/", "-");
  const [adaPart, parselPart] = cleaned.split("-");
  if (!adaPart || !parselPart) return undefined;
  const candidates = byAdaParsel.get(`${adaPart}-${parselPart}`) ?? [];
  if (candidates.length === 0) return undefined;
  if (ilSlug) {
    const il = candidates.find((f) =>
      slugify(f.properties.il) === ilSlug ||
      slugify(f.properties.ilce) === ilceSlug
    );
    if (il) return il;
  }
  return candidates[0];
}

export function slugify(value: string) {
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

export function searchParcels(query: string, limit = 8): ParcelFeature[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const cleaned = q.replace(/\s+/g, "");
  const adaParselNorm = cleaned.replace("/", "-");
  const results: ParcelFeature[] = [];
  for (const item of searchIndex) {
    if (item.text.includes(q) || item.text.includes(adaParselNorm) || item.adaParsel === adaParselNorm) {
      results.push(item.feature);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function getInitialParcels(): ParcelProps[] {
  return parcels.features.map((f) => f.properties);
}

export { getParcelSourceMetadata };
