"use client";

import { useMemo } from "react";
import { getAllParcels, slugify } from "@/data/parcels";
import { PROVINCES } from "@/data/provinces";
import { DISTRICTS } from "@/data/districts";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { BELEDIYE_LIST } from "@/data/belediye";
import { adaParselText, adaParselSlug } from "@/lib/format";
import { TURKEY_BOUNDS, inTurkey, safeParseFloat } from "@/lib/utils";
import type { SearchResult } from "@/types/geo";

export type SearchMode = "Hepsi" | "AdaParsel" | "Koordinat" | "Adres" | "Belediye";

interface SearchOptions {
  query: string;
  mode: SearchMode;
  limit?: number;
}

const COORD_REGEX = /^\s*(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/;
const ADA_PARSEL_REGEX = /^\s*(\d{1,5})\s*[\/\-\s]\s*(\d{1,5})\s*$/;

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
  return getAllParcels()
    .filter((f) => {
      const p = f.properties;
      if (adaParselMatch) {
        return (
          p.ada === adaParselMatch[1] && p.parsel === adaParselMatch[2]
        );
      }
      const text = `${adaParselText(p.ada, p.parsel)} ${adaParselSlug(p.ada, p.parsel)} ${p.mahalle} ${p.ilce} ${p.il} ${p.zoningType} ${p.id}`.toLocaleLowerCase("tr-TR");
      return text.includes(q);
    })
    .slice(0, limit)
    .map<SearchResult>((f) => {
      const p = f.properties;
      return {
        id: p.id,
        type: "parcel",
        primary: `Ada/Parsel ${adaParselText(p.ada, p.parsel)}`,
        secondary: `${p.mahalle}, ${p.ilce} / ${p.il}`,
        meta: p.zoningType,
        parcelId: p.id,
        zoningType: p.zoningType,
        centroid: p.centroid
      };
    });
}

function searchAddressResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const out: SearchResult[] = [];
  PROVINCES.forEach((il) => {
    if (il.name.toLocaleLowerCase("tr-TR").includes(q) || il.slug.includes(q)) {
      out.push({
        id: `prov:${il.slug}`,
        type: "address",
        primary: `${il.name} (İl)`,
        secondary: `Plaka ${il.code}`,
        il: il.slug,
        ilce: "",
        centroid: il.centroid
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
      out.push({
        id: `dist:${d.ilSlug}-${d.slug}`,
        type: "address",
        primary: `${d.name}, ${prov?.name ?? d.ilSlug}`,
        secondary: "İlçe",
        il: d.ilSlug,
        ilce: d.slug,
        centroid: d.centroid
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
      out.push({
        id: `nh:${n.ilSlug}-${n.ilceSlug}-${n.slug}`,
        type: "address",
        primary: `${n.name} Mahallesi`,
        secondary: `${dist?.name ?? n.ilceSlug}, ${prov?.name ?? n.ilSlug}`,
        il: n.ilSlug,
        ilce: n.ilceSlug,
        mahalle: n.slug,
        centroid: n.centroid
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
    if (opts.mode === "Adres") return searchAddressResults(opts.query, limit);
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
    results.push(...searchAddressResults(opts.query, 4));
    results.push(...searchBelediyeResults(opts.query, 3));
    return results.slice(0, 12);
  }, [opts.query, opts.mode, limit]);
}

export const TURKEY_BBOX = TURKEY_BOUNDS;
