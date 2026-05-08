"use client";

import { create } from "zustand";
import type { AskiDurum, ZoningType } from "@/types/parcel";

export interface ParcelFilters {
  belediyeler: string[];
  planTipi: string[];
  durum: AskiDurum[];
  zoning: ZoningType[];
  yapilasma: string[];
}

interface FilterState {
  parcelFilters: ParcelFilters;
  setParcelFilters: (next: ParcelFilters) => void;
  resetParcelFilters: () => void;
}

export const DEFAULT_PARCEL_FILTERS: ParcelFilters = {
  belediyeler: [],
  planTipi: [],
  durum: [],
  zoning: [],
  yapilasma: []
};

export const useFilterStore = create<FilterState>((set) => ({
  parcelFilters: DEFAULT_PARCEL_FILTERS,
  setParcelFilters: (next) => set({ parcelFilters: next }),
  resetParcelFilters: () => set({ parcelFilters: DEFAULT_PARCEL_FILTERS })
}));
