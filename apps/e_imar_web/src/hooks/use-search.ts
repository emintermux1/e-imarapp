"use client";

import { useMemo } from "react";
import { kindLabel, searchLocationTargets } from "@/data/location-navigation";
import { getLocationBoundary } from "@/data/location-boundaries";
import { getAllParcels, searchParcels, slugify } from "@/data/parcels";
import { PROVINCES } from "@/data/provinces";
import { DISTRICTS } from "@/data/districts";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { BELEDIYE_LIST } from "@/data/belediye";
import { adaParselText } from "@/lib/format";
import { TURKEY_BOUNDS, inTurkey, safeParseFloat } from "@/lib/utils";
import type { LocationSearchResult, SearchResult } from "@/types/geo";
import type { ParcelFeature } from "@/types/parcel";

export type SearchMode = "Hepsi" | "AdaParsel" | "Koordinat" | "Adres" | "Belediye";

interface SearchOptions {
  query: string;
  mode: SearchMode;
  limit?: number;
}

const COORD_REGEX = /^\s*(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/;
const ADA_PARSEL_REGEX = /^\s*(\d{1,5})\s*[\/\-\s]\s*(\d{1,5})\s*$/;
const ADA_PARSEL_TOKEN_REGEX = /(\d{1,5})\s*[\/\-]\s*(\d{1,5})/;
const PARCEL_SEARCH_INDEX = getAllParcels().map((feature) => ({
  feature,
  text: buildParcelSearchText(feature)
}));

function parseCoord(q: string): { lng: number; lat: number } | null {
  const m = q.match(COORD_REGEX);
  if (!m) return null;
  const a = safeParseFloat(m[1]);
  const b = safeParseFloat(m[2]);
  if (a == null || b == null) return null;
  // Try lat,lng first
  if (inTurkey(b, a)) return { lng: b, lat: a };
  // Fallback lng,lat
  if (inTurkey(a, b)) return { lng: a, lat: b };
  return null;
}

function searchParcelResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const adaParselMatch = q.match(ADA_PARSEL_REGEX);
  const direct = searchParcels(query, limit)
    .filter((f) => {
      if (!adaParselMatch) return true;
      const p = f.properties;
      return p.ada === adaParselMatch[1] && p.parsel === adaParselMatch[2];
    })
    .slice(0, limit);
  const scored = detailedParcelSearch(query, limit);
  const merged = new Map<string, ParcelFeature>();
  [...direct, ...scored].forEach((f) => merged.set(f.properties.id, f));
  return [...merged.values()].slice(0, limit).map(parcelToResult);
}

function detailedParcelSearch(query: string, limit: number): ParcelFeature[] {
  const normalized = normalizeSearchText(query);
  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
  if (tokens.length === 0) return [];
  const adaParsel = normalized.match(ADA_PARSEL_TOKEN_REGEX);
  const scored = PARCEL_SEARCH_INDEX
    .map((feature) => ({
      feature: feature.feature,
      score: scoreParcel(feature.feature, feature.text, tokens, adaParsel)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.feature);
}

function scoreParcel(
  feature: ParcelFeature,
  haystack: string,
  tokens: string[],
  adaParsel: RegExpMatchArray | null
) {
  const p = feature.properties;
  let score = 0;
  let matched = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      matched += 1;
      score += token.includes("/") || token.includes("-") ? 6 : 1;
    }
  }
  if (adaParsel && p.ada === adaParsel[1] && p.parsel === adaParsel[2]) {
    score += 14;
  }
  if (matched >= Math.max(1, Math.ceil(tokens.length * 0.55))) {
    score += matched * 2;
  } else if (!adaParsel) {
    score = 0;
  }
  return score;
}

function buildParcelSearchText(feature: ParcelFeature) {
  const p = feature.properties;
  return normalizeSearchText(
    [
      p.id,
      p.ada,
      p.parsel,
      adaParselText(p.ada, p.parsel),
      `${p.ada}/${p.parsel}`,
      `${p.ada}-${p.parsel}`,
      p.mahalle,
      p.ilce,
      p.il,
      p.zoningType,
      p.detailedUse ?? "",
      p.planScale ?? "",
      p.planStatus ?? "",
      p.planLayer ?? "",
      ...(p.constraints ?? []),
      p.planAdi,
      p.tapuTipi
    ].join(" ")
  );
}

function parcelToResult(f: ParcelFeature): SearchResult {
  const p = f.properties;
  const ring = f.geometry.coordinates[0] ?? [];
  const bbox = ring.reduce(
    (acc, [lng, lat]) => ({
      west: Math.min(acc.west, lng),
      south: Math.min(acc.south, lat),
      east: Math.max(acc.east, lng),
      north: Math.max(acc.north, lat)
    }),
    { west: Number.POSITIVE_INFINITY, south: Number.POSITIVE_INFINITY, east: Number.NEGATIVE_INFINITY, north: Number.NEGATIVE_INFINITY }
  );
  const hasBbox = Number.isFinite(bbox.west);
  return {
    id: p.id,
    type: "parcel",
    primary: `Ada/Parsel ${adaParselText(p.ada, p.parsel)}`,
    secondary: `${p.detailedUse ?? p.mahalle} · ${p.mahalle}, ${p.ilce} / ${p.il} · ${p.yuzolcumuM2.toLocaleString("tr-TR")} m²`,
    meta: p.planScale ? `${p.planScale} · ${p.planStatus ?? p.zoningType}` : p.zoningType,
    parcelId: p.id,
    zoningType: p.zoningType,
    centroid: p.centroid,
    bbox: hasBbox ? bbox : undefined
  };
}

function normalizeSearchText(value: string) {
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
    .replace(/[^\w/\-\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchLocationResults(query: string, limit: number): SearchResult[] {
  const results: LocationSearchResult[] = [];
  for (const target of searchLocationTargets(query, limit)) {
    if (target.kind === "parcel") continue;
    results.push({
      id: `loc:${target.kind}:${target.il ?? ""}:${target.ilce ?? ""}:${target.mahalle ?? ""}`,
      type: "location",
      primary: target.kind === "mahalle" ? `${target.label} Mahallesi` : target.label,
      secondary: [target.il, target.ilce].filter((value) => value && value !== target.label).join(" / "),
      meta: kindLabel(target.kind),
      centroid: target.center,
      zoom: target.zoom,
      bbox: target.bounds,
      kind: target.kind,
      il: target.il,
      ilce: target.ilce,
      mahalle: target.mahalle
    });
  }
  return results;
}

function searchAddressResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const out: SearchResult[] = [];
  PROVINCES.forEach((il) => {
    if (il.name.toLocaleLowerCase("tr-TR").includes(q) || il.slug.includes(q)) {
      const boundary = getLocationBoundary({ il: il.name });
      out.push({
        id: `prov:${il.slug}`,
        type: "address",
        primary: `${il.name} (İl)`,
        secondary: `Plaka ${il.code}`,
        il: il.name,
        ilce: "",
        centroid: il.centroid,
        bbox: boundary?.bounds
      });
    }
  });
  DISTRICTS.forEach((d) => {
    if (
      d.name.toLocaleLowerCase("tr-TR").includes(q) ||
      d.slug.includes(q) ||
      d.ilSlug.includes(q)
    ) {
      const prov = PROVINCES.find((p) => p.slug === d.ilSlug);
      const ilName = prov?.name ?? d.ilSlug;
      const boundary = getLocationBoundary({ il: ilName, ilce: d.name });
      out.push({
        id: `dist:${d.ilSlug}-${d.slug}`,
        type: "address",
        primary: `${d.name}, ${ilName}`,
        secondary: "İlçe",
        il: ilName,
        ilce: d.name,
        centroid: d.centroid,
        bbox: boundary?.bounds
      });
    }
  });
  NEIGHBORHOODS.forEach((n) => {
    if (
      n.name.toLocaleLowerCase("tr-TR").includes(q) ||
      n.slug.includes(q)
    ) {
      const prov = PROVINCES.find((p) => p.slug === n.ilSlug);
      const dist = DISTRICTS.find(
        (d) => d.slug === n.ilceSlug && d.ilSlug === n.ilSlug
      );
      const ilName = prov?.name ?? n.ilSlug;
      const ilceName = dist?.name ?? n.ilceSlug;
      const boundary = getLocationBoundary({ il: ilName, ilce: ilceName, mahalle: n.name });
      out.push({
        id: `nh:${n.ilSlug}-${n.ilceSlug}-${n.slug}`,
        type: "address",
        primary: `${n.name} Mahallesi`,
        secondary: `${ilceName}, ${ilName}`,
        il: ilName,
        ilce: ilceName,
        mahalle: n.name,
        centroid: n.centroid,
        bbox: boundary?.bounds
      });
    }
  });
  return out.slice(0, limit);
}

function searchBelediyeResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  return BELEDIYE_LIST.filter((b) => {
    if (!q) return true;
    return (
      b.ad.toLocaleLowerCase("tr-TR").includes(q) ||
      slugify(b.ad).includes(q) ||
      b.ilSlug.includes(q)
    );
  })
    .slice(0, limit)
    .map<SearchResult>((b) => {
      const prov = PROVINCES.find((p) => p.slug === b.ilSlug);
      return {
        id: `bel:${b.id}`,
        type: "belediye",
        primary: b.ad,
        secondary: prov?.name ?? b.ilSlug,
        il: b.ilSlug,
        centroid: prov?.centroid
      };
    });
}

function coordToResult(query: string): SearchResult | null {
  const c = parseCoord(query);
  if (!c) return null;
  return {
    id: `coord:${c.lat.toFixed(5)},${c.lng.toFixed(5)}`,
    type: "coordinate",
    primary: `${c.lat.toFixed(5)}° K, ${c.lng.toFixed(5)}° D`,
    secondary: "WGS84 / EPSG:4326",
    meta: "Konum",
    lng: c.lng,
    lat: c.lat,
    centroid: [c.lng, c.lat]
  };
}

export function useSearch(opts: SearchOptions) {
  const limit = opts.limit ?? 8;
  return useMemo(() => {
    if (opts.mode === "AdaParsel") return searchParcelResults(opts.query, limit);
    if (opts.mode === "Adres") {
      return [...searchLocationResults(opts.query, 4), ...searchAddressResults(opts.query, limit)].slice(0, limit);
    }
    if (opts.mode === "Belediye") return searchBelediyeResults(opts.query, limit);
    if (opts.mode === "Koordinat") {
      const r = coordToResult(opts.query);
      return r ? [r] : [];
    }
    // Hepsi
    const results: SearchResult[] = [];
    const coord = coordToResult(opts.query);
    if (coord) results.push(coord);
    results.push(...searchParcelResults(opts.query, 5));
    results.push(...searchLocationResults(opts.query, 4));
    results.push(...searchAddressResults(opts.query, 4));
    results.push(...searchBelediyeResults(opts.query, 3));
    return results.slice(0, 12);
  }, [opts.query, opts.mode, limit]);
}

export const TURKEY_BBOX = TURKEY_BOUNDS;
