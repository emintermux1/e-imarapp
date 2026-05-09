import { DEMO_PARCEL_CLUSTERS } from "./parcel-seeds";
import { generateDemoParcels, getDemoParcelMetadata } from "./parcel-generator";
import type { ParcelFeatureCollection } from "@/types/parcel";

export type ParcelDataMode = "demo" | "api" | "vector-tile";

export interface ParcelSourceMetadata {
  mode: ParcelDataMode;
  requestedMode: ParcelDataMode;
  label: string;
  featureCount: number;
  askidaCount: number;
  lastUpdated: string;
  official: boolean;
  coverageCities: string[];
  notes: string[];
  endpoint?: string;
  fallbackReason?: string;
}

export interface ParcelSourceSnapshot {
  collection: ParcelFeatureCollection;
  metadata: ParcelSourceMetadata;
}

function readMode(): ParcelDataMode {
  const value = process.env.NEXT_PUBLIC_EIMAR_DATA_MODE;
  if (value === "api" || value === "vector-tile" || value === "demo") return value;
  return "demo";
}

function coverageCities() {
  return Array.from(new Set(DEMO_PARCEL_CLUSTERS.map((cluster) => cluster.il)));
}

export function getParcelSourceSnapshot(): ParcelSourceSnapshot {
  const requestedMode = readMode();
  const apiBase = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL;
  const vectorTileUrl = process.env.NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL;
  const fallbackReason =
    requestedMode === "api" && !apiBase
      ? "API modu seçildi ancak NEXT_PUBLIC_EIMAR_API_BASE_URL tanımlı değil."
      : requestedMode === "vector-tile" && !vectorTileUrl
      ? "Vector tile modu seçildi ancak NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL tanımlı değil."
      : undefined;

  const collection = generateDemoParcels();
  const counts = getDemoParcelMetadata();
  return {
    collection,
    metadata: {
      mode: fallbackReason ? "demo" : requestedMode,
      requestedMode,
      label: fallbackReason ? "Sentetik demo veri · canlı kaynak bekleniyor" : requestedMode === "demo" ? "Sentetik demo veri" : requestedMode === "api" ? "API parsel kaynağı" : "Vector tile parsel kaynağı",
      featureCount: counts.featureCount,
      askidaCount: counts.askidaCount,
      lastUpdated: "2026-05-08",
      official: false,
      coverageCities: coverageCities(),
      notes: [
        "Bu veri resmi TKGM/belediye kadastro kaydı değildir.",
        "Backend hazır olduğunda API, PostGIS veya vector tile katmanları bu adaptör üzerinden devreye alınır.",
        ...(fallbackReason ? [fallbackReason] : [])
      ],
      endpoint: requestedMode === "api" ? apiBase : requestedMode === "vector-tile" ? vectorTileUrl : undefined,
      fallbackReason
    }
  };
}

export function getParcelSourceMetadata(): ParcelSourceMetadata {
  return getParcelSourceSnapshot().metadata;
}
