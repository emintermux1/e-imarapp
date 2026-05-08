import parcelsRaw from "./parcels.geo.json";
import type { ParcelFeature, ParcelFeatureCollection, ParcelProps } from "@/types/parcel";
import { adaParselText, adaParselSlug } from "@/lib/format";

const parcels = parcelsRaw as unknown as ParcelFeatureCollection;

export function getAllParcels(): ParcelFeature[] {
  return parcels.features;
}

export function getParcelsCollection(): ParcelFeatureCollection {
  return parcels;
}

export function getParcelById(id: string): ParcelFeature | undefined {
  return parcels.features.find((f) => f.properties.id === id);
}

export function getParcelByMapId(
  mapId: string | number
): ParcelFeature | undefined {
  if (mapId == null) return undefined;
  const numeric = typeof mapId === "string" ? Number(mapId) : mapId;
  return parcels.features.find(
    (f) => (f as ParcelFeature & { id?: string | number }).id === numeric
  );
}

export function findParcelByAdaParselSlug(
  slug: string,
  ilSlug?: string,
  ilceSlug?: string
): ParcelFeature | undefined {
  const cleaned = slug.trim().replace(/\s+/g, "").replace("/", "-");
  const [adaPart, parselPart] = cleaned.split("-");
  if (!adaPart || !parselPart) return undefined;
  const candidates = parcels.features.filter(
    (f) => f.properties.ada === adaPart && f.properties.parsel === parselPart
  );
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
  return parcels.features
    .filter((f) => {
      const p = f.properties;
      const text = `${p.id} ${adaParselText(p.ada, p.parsel)} ${adaParselSlug(p.ada, p.parsel)} ${p.mahalle} ${p.ilce} ${p.il} ${p.zoningType}`.toLocaleLowerCase("tr-TR");
      return text.includes(q) || text.includes(adaParselNorm);
    })
    .slice(0, limit);
}

export function getInitialParcels(): ParcelProps[] {
  return parcels.features.map((f) => f.properties);
}
