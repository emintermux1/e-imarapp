"use client";

import { create } from "zustand";
import {
  getBackendLatestRegions,
  humanizeApiError
} from "@/lib/api/backend-client";
import { geoJsonCentroid } from "@/lib/geojson";
import type { LatestRegionResponse, LatestRegionsResponse } from "@/types/api";

interface LatestRegionsState {
  items: LatestRegionResponse[];
  status: LatestRegionsResponse["status"] | "idle" | "loading";
  message?: string;
  total: number;
  geometryCount: number;
  selectedRegion: LatestRegionResponse | null;
  selectedAt?: string;
  panelOpen: boolean;
  refresh: (filters?: {
    limit?: number;
    province?: string;
    district?: string;
    municipality_slug?: string;
    has_geometry?: boolean;
  }) => Promise<void>;
  selectRegion: (region: LatestRegionResponse | null) => void;
  setPanelOpen: (open: boolean) => void;
}

export const useLatestRegionsStore = create<LatestRegionsState>()((set) => ({
  items: [],
  status: "idle",
  total: 0,
  geometryCount: 0,
  selectedRegion: null,
  panelOpen: false,
  refresh: async (filters) => {
    set({ status: "loading", message: "En yeni imar bölgeleri getiriliyor…", panelOpen: true });
    try {
      const response = await getBackendLatestRegions({ limit: 20, ...filters });
      set({
        items: response.items,
        status: response.status,
        message: response.message,
        total: response.total,
        geometryCount: response.geometry_count,
        selectedRegion:
          response.items.find((item) => item.has_geometry) ?? response.items[0] ?? null,
        selectedAt: new Date().toISOString(),
        panelOpen: true
      });
    } catch (error) {
      set({
        items: [],
        total: 0,
        geometryCount: 0,
        selectedRegion: null,
        status: "unavailable",
        message: humanizeApiError(error, "En yeni imar bölgeleri alınamadı."),
        selectedAt: new Date().toISOString(),
        panelOpen: true
      });
    }
  },
  selectRegion: (region) =>
    set({
      selectedRegion: region,
      selectedAt: region ? new Date().toISOString() : undefined,
      panelOpen: true,
      message:
        region && !region.has_geometry
          ? `${region.label} için geometri yayınlanmamış; kayıt listede tutuldu.`
          : undefined
    }),
  setPanelOpen: (open) => set({ panelOpen: open })
}));

export function latestRegionCenter(region: LatestRegionResponse | null | undefined) {
  if (!region?.geom_geojson) return undefined;
  return geoJsonCentroid(region.geom_geojson);
}
