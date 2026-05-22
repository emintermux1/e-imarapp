import { DEMO_PARCEL_CLUSTERS } from "./parcel-seeds";
import { generateDemoParcels, getDemoParcelMetadata } from "./parcel-generator";
import { readPublicBackendBase } from "@/lib/public-config";
import type { ParcelFeatureCollection } from "@/types/parcel";

export type ParcelDataMode = "demo" | "api" | "vector-tile" | "unavailable";
export type RequestedParcelDataMode = Exclude<ParcelDataMode, "unavailable">;
export type ParcelSourceAvailability = "ready" | "development_sample_fallback" | "production_unavailable";

export interface ParcelSourceMetadata {
  mode: ParcelDataMode;
  requestedMode: RequestedParcelDataMode;
  availability: ParcelSourceAvailability;
  label: string;
  featureCount: number;
  askidaCount: number;
  lastUpdated: string;
  official: boolean;
  coverageCities: string[];
  notes: string[];
  isProduction: boolean;
  demoFallbackAllowed: boolean;
  endpoint?: string;
  fallbackReason?: string;
  unavailableReason?: string;
}

export interface ParcelSourceSnapshot {
  collection: ParcelFeatureCollection;
  metadata: ParcelSourceMetadata;
}

const EMPTY_COLLECTION: ParcelFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

function isTruthyEnv(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

function readMode(): RequestedParcelDataMode {
  const value = process.env.NEXT_PUBLIC_EIMAR_DATA_MODE;
  if (value === "api" || value === "vector-tile" || value === "demo") return value;
  return isProductionRuntime() ? "api" : "demo";
}

function readApiEndpoint() {
  const explicitEndpoint = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  return explicitEndpoint ? readPublicBackendBase() : undefined;
}

function readDemoFallbackAllowed() {
  return (
    !isProductionRuntime() ||
    isTruthyEnv(process.env.NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK) ||
    isTruthyEnv(process.env.NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA)
  );
}

function coverageCities() {
  return Array.from(new Set(DEMO_PARCEL_CLUSTERS.map((cluster) => cluster.il)));
}

export function getParcelSourceSnapshot(): ParcelSourceSnapshot {
  const requestedMode = readMode();
  const isProduction = isProductionRuntime();
  const allowDemoFallback = readDemoFallbackAllowed();
  const apiBase = readApiEndpoint();
  const vectorTileUrl = process.env.NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL;
  const missingConfigReason =
    requestedMode === "api" && !apiBase
      ? "API modu seçildi ancak NEXT_PUBLIC_EIMAR_API_BASE_URL veya NEXT_PUBLIC_API_BASE_URL tanımlı değil."
      : requestedMode === "vector-tile" && !vectorTileUrl
      ? "Vector tile modu seçildi ancak NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL tanımlı değil."
      : undefined;
  const demoBlockedReason =
    requestedMode === "demo" && !allowDemoFallback
      ? "Production ortamında örnek parsel verisi yalnızca NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=true ile açılabilir."
      : undefined;
  const unavailableReason =
    missingConfigReason && !allowDemoFallback
      ? `${missingConfigReason} Production ortamında örnek veri fallback kapalı olduğu için parsel katmanı unavailable.`
      : demoBlockedReason;
  const fallbackReason =
    missingConfigReason && allowDemoFallback
      ? `${missingConfigReason} Development örnek veri fallback açık; haritada resmi olmayan örnek parsel katmanı gösteriliyor.`
      : undefined;
  const activeMode: ParcelDataMode = unavailableReason ? "unavailable" : fallbackReason ? "demo" : requestedMode;
  const availability: ParcelSourceAvailability = unavailableReason
    ? "production_unavailable"
    : fallbackReason
    ? "development_sample_fallback"
    : "ready";

  const collection = activeMode === "unavailable" ? EMPTY_COLLECTION : generateDemoParcels();
  const counts = getDemoParcelMetadata();
  return {
    collection,
    metadata: {
      mode: activeMode,
      requestedMode,
      availability,
      label: unavailableReason
        ? "Production unavailable · canlı parsel kaynağı yapılandırılmadı"
        : fallbackReason
        ? "Development örnek veri fallback · canlı kaynak bekleniyor"
        : requestedMode === "demo"
        ? "Resmi olmayan örnek veri"
        : requestedMode === "api"
        ? "API parsel kaynağı"
        : "Vector tile parsel kaynağı",
      featureCount: activeMode === "unavailable" ? 0 : counts.featureCount,
      askidaCount: activeMode === "unavailable" ? 0 : counts.askidaCount,
      lastUpdated: "2026-05-08",
      official: false,
      coverageCities: coverageCities(),
      notes: [
        activeMode === "unavailable"
          ? "Production build resmi API veya vector tile yapılandırması olmadan örnek parsele düşmez."
          : "Bu veri resmi TKGM/belediye kadastro kaydı değildir.",
        "Backend hazır olduğunda API, PostGIS veya vector tile katmanları bu adaptör üzerinden devreye alınır.",
        ...(fallbackReason ? [fallbackReason] : []),
        ...(unavailableReason ? [unavailableReason] : [])
      ],
      isProduction,
      demoFallbackAllowed: allowDemoFallback,
      endpoint: requestedMode === "api" ? apiBase : requestedMode === "vector-tile" ? vectorTileUrl : undefined,
      fallbackReason,
      unavailableReason
    }
  };
}

export function getParcelSourceMetadata(): ParcelSourceMetadata {
  return getParcelSourceSnapshot().metadata;
}
