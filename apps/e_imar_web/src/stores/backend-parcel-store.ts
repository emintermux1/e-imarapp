"use client";

import { create } from "zustand";
import type { ParcelResponse } from "@/types/api";
import type { SearchResult } from "@/types/geo";
import type { ParcelFeature } from "@/types/parcel";
import {
  backendParcelToFeature,
  extractGeometry,
  parseBackendParcelId,
  searchResultToOverlayFeature,
} from "@/lib/api/parcel-normalizer";

interface BackendParcelState {
  parcels: Record<number, ParcelResponse>;
  overlays: Record<string, ParcelFeature>;
  upsertParcel: (parcel: ParcelResponse) => void;
  upsertParcels: (parcels: ParcelResponse[]) => void;
  upsertOverlayFromSearch: (result: SearchResult) => void;
  upsertOverlaysFromSearch: (results: SearchResult[]) => void;
  getFeature: (id: string | null | undefined) => ParcelFeature | null;
  getResponse: (id: string | null | undefined) => ParcelResponse | null;
  getGeometry: (id: string | null | undefined) => GeoJSON.Geometry | null;
  getVisibleLiveFeatures: () => ParcelFeature[];
}

export const useBackendParcelStore = create<BackendParcelState>()((set, get) => ({
  parcels: {},
  overlays: {},
  upsertParcel: (parcel) =>
    set((state) => ({ parcels: { ...state.parcels, [parcel.id]: parcel } })),
  upsertParcels: (parcels) =>
    set((state) => {
      const next = { ...state.parcels };
      parcels.forEach((parcel) => {
        next[parcel.id] = parcel;
      });
      return { parcels: next };
    }),
  upsertOverlayFromSearch: (result) => {
    const feature = searchResultToOverlayFeature(result);
    if (!feature) return;
    set((state) => ({
      overlays: { ...state.overlays, [feature.properties.id]: feature },
    }));
  },
  upsertOverlaysFromSearch: (results) => {
    const next = { ...get().overlays };
    let changed = false;
    results.forEach((result) => {
      const feature = searchResultToOverlayFeature(result);
      if (!feature) return;
      next[feature.properties.id] = feature;
      changed = true;
    });
    if (changed) set({ overlays: next });
  },
  getFeature: (id) => {
    if (!id) return null;
    const numeric = parseBackendParcelId(id);
    if (numeric != null) {
      const parcel = get().parcels[numeric];
      return parcel ? backendParcelToFeature(parcel) : null;
    }
    return get().overlays[id] ?? null;
  },
  getResponse: (id) => {
    const numeric = parseBackendParcelId(id);
    return numeric == null ? null : get().parcels[numeric] ?? null;
  },
  getGeometry: (id) => {
    const feature = get().getFeature(id);
    if (feature?.geometry?.coordinates?.length) return feature.geometry;
    const numeric = parseBackendParcelId(id);
    if (numeric == null) return null;
    const parcel = get().parcels[numeric];
    return parcel ? extractGeometry(parcel.geometri) : null;
  },
  getVisibleLiveFeatures: () => {
    const features: ParcelFeature[] = [];
    const seen = new Set<string>();
    Object.values(get().parcels).forEach((parcel) => {
      const feature = backendParcelToFeature(parcel);
      if (!feature.geometry.coordinates.length) return;
      seen.add(feature.properties.id);
      features.push(feature);
    });
    Object.values(get().overlays).forEach((feature) => {
      if (seen.has(feature.properties.id)) return;
      if (!feature.geometry.coordinates.length) return;
      features.push(feature);
    });
    return features;
  },
}));
