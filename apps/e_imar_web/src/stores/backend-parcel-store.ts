"use client";

import { create } from "zustand";
import type { ParcelResponse } from "@/types/api";
import { backendParcelToFeature, parseBackendParcelId } from "@/lib/api/parcel-normalizer";
import type { ParcelFeature } from "@/types/parcel";

interface BackendParcelState {
  parcels: Record<number, ParcelResponse>;
  upsertParcel: (parcel: ParcelResponse) => void;
  upsertParcels: (parcels: ParcelResponse[]) => void;
  getFeature: (id: string | null | undefined) => ParcelFeature | null;
  getResponse: (id: string | null | undefined) => ParcelResponse | null;
  getGeometry: (id: string | null | undefined) => GeoJSON.Geometry | null;
}

export const useBackendParcelStore = create<BackendParcelState>()((set, get) => ({
  parcels: {},
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
  getFeature: (id) => {
    const numeric = parseBackendParcelId(id);
    if (numeric == null) return null;
    const parcel = get().parcels[numeric];
    return parcel ? backendParcelToFeature(parcel) : null;
  },
  getResponse: (id) => {
    const numeric = parseBackendParcelId(id);
    return numeric == null ? null : get().parcels[numeric] ?? null;
  },
  getGeometry: (id) => {
    const feature = get().getFeature(id);
    return feature?.geometry?.coordinates.length ? feature.geometry : null;
  }
}));
