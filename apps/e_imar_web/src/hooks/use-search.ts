"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllParcels, slugify } from "@/data/parcels";
import { PROVINCES } from "@/data/provinces";
import { DISTRICTS } from "@/data/districts";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { BELEDIYE_LIST } from "@/data/belediye";
import { getLocationBoundary } from "@/data/location-boundaries";
import { adaParselText, adaParselSlug } from "@/lib/format";
import { TURKEY_BOUNDS, inTurkey, safeParseFloat } from "@/lib/utils";
import { parcelQualityMessage } from "@/lib/api/quality-labels";
import { searchWebsite } from "@/lib/api/eimar";
import {
  getBackendParcelGeometry,
  humanizeApiError,
  lookupBackendParcel,
  searchBackendParcels,
} from "@/lib/api/backend-client";
import { backendParcelId, geometryCentroid } from "@/lib/api/parcel-normalizer";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import type { SearchResult } from "@/types/geo";
import type { ParcelResponse } from "@/types/api";

export type SearchMode =
  | "Hepsi"
  | "AdaParsel"
  | "Koordinat"
  | "Adres"
  | "Belediye";

interface SearchOptions {
  query: string;
  mode: SearchMode;
  limit?: number;
}

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  backendUnavailable: boolean;
  usedFallback: boolean;
  message?: string;
}

const EMPTY_STATE: SearchState = {
  results: [],
  loading: false,
  backendUnavailable: false,
  usedFallback: false,
};

const COORD_REGEX =
  /^\s*(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/;
const ADA_PARSEL_REGEX = /^\s*(\d{1,5})\s*[\/\-\s]\s*(\d{1,5})\s*$/;
const ADA_PARSEL_WORD_REGEX = /(\d+)\s*ada\s*(\d+)\s*parsel/i;

function parseCoord(q: string): { lng: number; lat: number } | null {
  const m = q.match(COORD_REGEX);
  if (!m) return null;
  const a = safeParseFloat(m[1]);
  const b = safeParseFloat(m[2]);
  if (a == null || b == null) return null;
  if (inTurkey(b, a)) return { lng: b, lat: a };
  if (inTurkey(a, b)) return { lng: a, lat: b };
  return null;
}

function toSearchBBox(bbox: [number, number, number, number] | undefined) {
  return bbox
    ? { west: bbox[0], south: bbox[1], east: bbox[2], north: bbox[3] }
    : undefined;
}

function searchParcelResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const adaParselMatch =
    q.match(ADA_PARSEL_WORD_REGEX) ?? q.match(ADA_PARSEL_REGEX);
  return getAllParcels()
    .filter((f) => {
      const p = f.properties;
      if (adaParselMatch) {
        return p.ada === adaParselMatch[1] && p.parsel === adaParselMatch[2];
      }
      const text =
        `${adaParselText(p.ada, p.parsel)} ${adaParselSlug(p.ada, p.parsel)} ${p.mahalle} ${p.ilce} ${p.il} ${p.zoningType} ${p.id}`.toLocaleLowerCase(
          "tr-TR",
        );
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
        centroid: p.centroid,
        sourceStatus: "demo",
      };
    });
}

function backendParcelToResult(
  parcel: ParcelResponse,
  ambiguityCount = 1,
): SearchResult | null {
  if (!parcel.id || !parcel.ada || !parcel.parsel) return null;
  const local = getAllParcels().find(
    (feature) =>
      feature.properties.ada === parcel.ada &&
      feature.properties.parsel === parcel.parsel &&
      (!parcel.ilce ||
        feature.properties.ilce.toLocaleLowerCase("tr-TR") ===
          parcel.ilce.toLocaleLowerCase("tr-TR")),
  );
  const centroid =
    geometryCentroid(parcel.geometri) ?? local?.properties.centroid;
  const quality = parcel.quality;
  const geometryAvailable =
    parcel.geometry_available ??
    quality?.geometry_available ??
    Boolean(centroid || geometryCentroid(parcel.geometri));
  const sourceStatus =
    parcel.source_status ??
    parcel.source?.source_status ??
    quality?.source_status ??
    "live";
  const sourceName =
    parcel.source_name ??
    parcel.source?.source_name ??
    quality?.source_name ??
    undefined;
  const sourceProvider =
    parcel.source_provider ??
    parcel.source?.provider ??
    quality?.source_provider ??
    undefined;
  const location = [parcel.mahalle, parcel.ilce, parcel.il]
    .filter(Boolean)
    .join(", ");
  const metaBits = [
    sourceName || sourceProvider || "Canlı API",
    geometryAvailable ? "geometri var" : "geometri yok",
    ambiguityCount > 1 ? `${ambiguityCount} ilçe eşleşmesi` : null,
  ].filter(Boolean);
  return {
    id: `backend-parcel:${parcel.id}`,
    type: "parcel",
    primary: `Ada/Parsel ${adaParselText(parcel.ada, parcel.parsel)}`,
    secondary: location || "Canlı API parsel sonucu",
    meta: metaBits.join(" · "),
    parcelId: backendParcelId(parcel.id),
    zoningType: local?.properties.zoningType ?? "Konut",
    centroid,
    sourceStatus,
    sourceName,
    sourceProvider,
    geometryAvailable,
    qualityHints: [
      parcel.status_message,
      quality ? parcelQualityMessage(quality) : null,
      ...(parcel.quality_hints ?? quality?.quality_hints ?? []),
    ]
      .filter((hint): hint is string => Boolean(hint))
      .slice(0, 3),
    planMatchStatus: parcel.plan_match_status ?? quality?.plan_match_status,
    askiMatchStatus: parcel.aski_match_status ?? quality?.aski_match_status,
    imarParamsStatus: parcel.imar_params_status ?? quality?.imar_params_status,
    confidenceLabel: parcel.confidence_label ?? quality?.confidence_label,
    ambiguityKey: `${parcel.ada}/${parcel.parsel}`,
    ambiguityCount,
  };
}

async function searchBackend(
  query: string,
  limit: number,
): Promise<ParcelResponse[]> {
  const adaParselMatch =
    query.trim().match(ADA_PARSEL_WORD_REGEX) ??
    query.trim().match(ADA_PARSEL_REGEX);
  const rows = adaParselMatch
    ? await lookupBackendParcel({
        ada: adaParselMatch[1],
        parsel: adaParselMatch[2],
      })
    : await searchBackendParcels(query.trim());
  const parcels = Array.isArray(rows) ? rows.slice(0, limit) : [];
  const hydrated = await Promise.all(
    parcels.map(async (parcel) => {
      if (geometryCentroid(parcel.geometri)) return parcel;
      try {
        const geometry = await getBackendParcelGeometry(parcel.id);
        return { ...parcel, geometri: geometry };
      } catch {
        return parcel;
      }
    }),
  );
  return hydrated;
}

async function searchMunicipalBff(
  query: string,
  limit: number,
): Promise<{ results: SearchResult[]; message?: string } | null> {
  const response = await searchWebsite({ query });
  if (!response.ok) return null;
  const payload = response.data;
  const results = payload.results
    .slice(0, limit)
    .map<SearchResult>((item, index) => {
      const center: [number, number] = [
        (item.bbox[0] + item.bbox[2]) / 2,
        (item.bbox[1] + item.bbox[3]) / 2,
      ];
      if (payload.type === "coordinate") {
        return {
          id: `bff-coordinate:${index}:${item.label}`,
          type: "coordinate",
          primary: item.label,
          secondary: "WGS84 / EPSG:4326",
          lng: center[0],
          lat: center[1],
          centroid: center,
          bbox: toSearchBBox(item.bbox),
          meta: item.source,
        };
      }
      if (payload.type === "parcel") {
        const ada = item.parcelData?.ada ?? "";
        const parsel = item.parcelData?.parsel ?? "";
        return {
          id: `bff-parcel:${item.municipalityId}:${ada}/${parsel}`,
          type: "parcel",
          primary: ada && parsel ? `Ada/Parsel ${ada}/${parsel}` : item.label,
          secondary: item.label,
          meta: item.parcelData?.imarDurumu ?? "Belediye canlı sorgu",
          parcelId: `municipal:${item.municipalityId}:${ada}:${parsel}`,
          zoningType: "Konut",
          centroid: center,
          bbox: toSearchBBox(item.bbox),
          municipalityId: item.municipalityId,
          sourceUrl: item.source,
          sourceStatus: "live",
        };
      }
      if (payload.type === "municipality") {
        return {
          id: `bff-municipality:${item.municipalityId}`,
          type: "belediye",
          primary: item.label,
          secondary: "Belediye imar kaynağı",
          il: item.municipalityId,
          centroid: center,
          bbox: toSearchBBox(item.bbox),
          municipalityId: item.municipalityId,
          meta: item.source,
        };
      }
      return {
        id: `bff-address:${index}:${item.label}`,
        type: "address",
        primary: item.label,
        secondary: "Nominatim / MAKS fallback",
        il: "",
        ilce: "",
        centroid: center,
        bbox: toSearchBBox(item.bbox),
        meta: item.source,
      };
    });
  return { results, message: response.data.message };
}

function searchAddressResults(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  const out: SearchResult[] = [];
  PROVINCES.forEach((il) => {
    if (il.name.toLocaleLowerCase("tr-TR").includes(q) || il.slug.includes(q)) {
      const boundary = getLocationBoundary({ il: il.slug });
      out.push({
        id: `prov:${il.slug}`,
        type: "address",
        primary: `${il.name} (İl)`,
        secondary: `Plaka ${il.code}`,
        il: il.slug,
        ilce: "",
        centroid: il.centroid,
        bbox: boundary?.bounds,
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
      const boundary = getLocationBoundary({ il: d.ilSlug, ilce: d.slug });
      out.push({
        id: `dist:${d.ilSlug}-${d.slug}`,
        type: "address",
        primary: `${d.name}, ${prov?.name ?? d.ilSlug}`,
        secondary: "İlçe",
        il: d.ilSlug,
        ilce: d.slug,
        centroid: d.centroid,
        bbox: boundary?.bounds,
      });
    }
  });
  NEIGHBORHOODS.forEach((n) => {
    if (n.name.toLocaleLowerCase("tr-TR").includes(q) || n.slug.includes(q)) {
      const prov = PROVINCES.find((p) => p.slug === n.ilSlug);
      const dist = DISTRICTS.find(
        (d) => d.slug === n.ilceSlug && d.ilSlug === n.ilSlug,
      );
      const boundary = getLocationBoundary({
        il: n.ilSlug,
        ilce: n.ilceSlug,
        mahalle: n.slug,
      });
      out.push({
        id: `nh:${n.ilSlug}-${n.ilceSlug}-${n.slug}`,
        type: "address",
        primary: `${n.name} Mahallesi`,
        secondary: `${dist?.name ?? n.ilceSlug}, ${prov?.name ?? n.ilSlug}`,
        il: n.ilSlug,
        ilce: n.ilceSlug,
        mahalle: n.slug,
        centroid: n.centroid,
        bbox: boundary?.bounds,
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
        centroid: prov?.centroid,
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
    centroid: [c.lng, c.lat],
  };
}

function localResults(opts: SearchOptions, limit: number) {
  if (opts.mode === "AdaParsel") return searchParcelResults(opts.query, limit);
  if (opts.mode === "Adres") return searchAddressResults(opts.query, limit);
  if (opts.mode === "Belediye") return searchBelediyeResults(opts.query, limit);
  if (opts.mode === "Koordinat") {
    const r = coordToResult(opts.query);
    return r ? [r] : [];
  }
  const results: SearchResult[] = [];
  const coord = coordToResult(opts.query);
  if (coord) results.push(coord);
  results.push(...searchParcelResults(opts.query, 5));
  results.push(...searchAddressResults(opts.query, 4));
  results.push(...searchBelediyeResults(opts.query, 3));
  return results.slice(0, 12);
}

function mergeParcelSearchResults(
  bffResults: SearchResult[],
  backendResults: SearchResult[],
): SearchResult[] {
  const merged = new Map<string, SearchResult>();
  const put = (result: SearchResult) => {
    if (result.type !== "parcel") return;
    const key =
      result.ambiguityKey ??
      `${result.parcelId}:${result.secondary ?? result.primary}`;
    const existing = merged.get(key);
    if (!existing || existing.type !== "parcel") {
      merged.set(key, result);
      return;
    }
    const preferNew =
      Boolean(result.geometryAvailable && !existing.geometryAvailable) ||
      (result.parcelId.startsWith("backend:") &&
        existing.parcelId.startsWith("municipal:"));
    if (preferNew) merged.set(key, result);
  };
  bffResults.forEach(put);
  backendResults.forEach(put);
  return Array.from(merged.values());
}

function hydrateSearchMapResults(results: SearchResult[]) {
  const upsertParcels = useBackendParcelStore.getState().upsertParcels;
  const upsertOverlaysFromSearch =
    useBackendParcelStore.getState().upsertOverlaysFromSearch;
  upsertOverlaysFromSearch(results);
}

export function useSearch(opts: SearchOptions): SearchState {
  const limit = opts.limit ?? 8;
  const query = opts.query.trim();
  const mode = opts.mode;
  const rawQuery = opts.query;
  const upsertParcels = useBackendParcelStore((s) => s.upsertParcels);
  const immediateResults = useMemo(() => {
    if (!query) return [];
    if (mode === "Koordinat")
      return localResults({ query: rawQuery, mode, limit }, limit);
    if (mode === "Hepsi") {
      const coord = coordToResult(rawQuery);
      return coord ? [coord] : [];
    }
    if (mode === "Adres" || mode === "Belediye")
      return localResults({ query: rawQuery, mode, limit }, limit);
    return [];
  }, [limit, mode, query, rawQuery]);
  const [state, setState] = useState<SearchState>({
    ...EMPTY_STATE,
    results: immediateResults,
  });

  useEffect(() => {
    if (!query) {
      setState({ ...EMPTY_STATE, results: [] });
      return;
    }
    const searchOptions = { query: rawQuery, mode, limit };
    if (mode === "Koordinat" || mode === "Adres" || mode === "Belediye") {
      let cancelled = false;
      setState((current) => ({
        ...current,
        loading: true,
        backendUnavailable: false,
        message: undefined,
      }));
      const timeout = window.setTimeout(() => {
        searchMunicipalBff(query, limit)
          .then((bff) => {
            if (cancelled) return;
            const local = localResults(searchOptions, limit);
            setState({
              results: bff?.results.length ? bff.results : local,
              loading: false,
              backendUnavailable: false,
              usedFallback: !bff?.results.length && local.length > 0,
              message: bff?.message,
            });
          })
          .catch(() => {
            if (cancelled) return;
            setState({
              ...EMPTY_STATE,
              results: localResults(searchOptions, limit),
              backendUnavailable: true,
              usedFallback: true,
            });
          });
      }, 180);
      return () => {
        cancelled = true;
        window.clearTimeout(timeout);
      };
    }

    const coord = mode === "Hepsi" ? coordToResult(rawQuery) : null;
    if (coord) {
      setState({ ...EMPTY_STATE, results: [coord] });
      return;
    }

    let cancelled = false;
    setState((current) => ({
      ...current,
      loading: true,
      backendUnavailable: false,
      message: undefined,
    }));
    const timeout = window.setTimeout(() => {
      Promise.allSettled([
        searchMunicipalBff(query, limit),
        searchBackend(query, limit),
      ])
        .then((parcels) => {
          if (cancelled) return;
          const bff =
            parcels[0].status === "fulfilled" ? parcels[0].value : null;
          const backendParcels =
            parcels[1].status === "fulfilled" ? parcels[1].value : [];
          const ambiguity = backendParcels.reduce<Record<string, number>>(
            (acc, parcel) => {
              const key = `${parcel.ada}/${parcel.parsel}`;
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            },
            {},
          );
          const backendResults = backendParcels
            .map((parcel) =>
              backendParcelToResult(
                parcel,
                ambiguity[`${parcel.ada}/${parcel.parsel}`] ?? 1,
              ),
            )
            .filter((r): r is SearchResult => Boolean(r));
          if (backendResults.length > 0) {
            upsertParcels(backendParcels);
          }
          const bffResults = bff?.results ?? [];
          const mergedParcels = mergeParcelSearchResults(
            bffResults,
            backendResults,
          );
          if (mergedParcels.length > 0) {
            hydrateSearchMapResults(mergedParcels);
            const nonParcel =
              mode === "Hepsi"
                ? [
                    ...bffResults.filter((r) => r.type !== "parcel"),
                    ...searchAddressResults(query, 4),
                    ...searchBelediyeResults(query, 3),
                  ]
                : bffResults.filter((r) => r.type !== "parcel");
            setState({
              results: [...mergedParcels, ...nonParcel].slice(
                0,
                mode === "Hepsi" ? 12 : limit,
              ),
              loading: false,
              backendUnavailable: backendResults.length === 0,
              usedFallback: false,
              message:
                bff?.message ??
                (backendResults.length === 0
                  ? "Belediye canlı sonuçları haritada bbox ile gösteriliyor."
                  : undefined),
            });
            return;
          }
          if (
            bff?.results.length &&
            (bff.results[0]?.type !== "address" || mode === "Hepsi")
          ) {
            hydrateSearchMapResults(bff.results);
            setState({
              results: bff.results.slice(0, mode === "Hepsi" ? 12 : limit),
              loading: false,
              backendUnavailable: false,
              usedFallback: false,
              message: bff.message,
            });
            return;
          }
          const fallback = localResults(searchOptions, limit).map((result) =>
            result.type === "parcel"
              ? { ...result, sourceStatus: "fallback" as const }
              : result,
          );
          setState({
            results: fallback,
            loading: false,
            backendUnavailable: false,
            usedFallback: fallback.some((r) => r.type === "parcel"),
            message:
              fallback.length > 0
                ? "Canlı API sonucu yok — yerel/açık kayıt verisi gösteriliyor"
                : "Bu sorguda parsel bulunamadı. Sol panelden belediye kaynağını keşfedin veya Canlı Veri Kaynakları durumunu kontrol edin.",
          });
        })
        .catch((error) => {
          if (cancelled) return;
          const fallback = localResults(searchOptions, limit).map((result) =>
            result.type === "parcel"
              ? { ...result, sourceStatus: "fallback" as const }
              : result,
          );
          setState({
            results: fallback,
            loading: false,
            backendUnavailable: true,
            usedFallback: fallback.some((r) => r.type === "parcel"),
            message: `${humanizeApiError(error)} Yerel/açık kayıt verisi gösteriliyor.`,
          });
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [limit, mode, query, rawQuery, upsertParcels]);

  return state;
}

export const TURKEY_BBOX = TURKEY_BOUNDS;
