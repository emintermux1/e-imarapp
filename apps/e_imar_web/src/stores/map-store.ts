"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BasemapId } from "@/lib/maplibre/styles";

export interface FlyTarget {
  center: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  parcelId?: string;
  /** ETag-like seq increment forces effect re-trigger even on identical center */
  seq: number;
}

interface MapState {
  basemap: BasemapId;
  hoveredParcelId: string | null;
  selectedParcelId: string | null;
  flyTarget: FlyTarget | null;
  cursorLngLat: [number, number] | null;
  zoom: number;
  bearing: number;
  pitch: number;
  setBasemap: (b: BasemapId) => void;
  setHoveredParcelId: (id: string | null) => void;
  setSelectedParcelId: (id: string | null) => void;
  flyTo: (target: Omit<FlyTarget, "seq">) => void;
  setCursorLngLat: (v: [number, number] | null) => void;
  setViewState: (v: { zoom?: number; bearing?: number; pitch?: number }) => void;
}

let seqCounter = 0;

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      basemap: "voyager",
      hoveredParcelId: null,
      selectedParcelId: null,
      flyTarget: null,
      cursorLngLat: null,
      zoom: 5.5,
      bearing: 0,
      pitch: 0,
      setBasemap: (b) => set({ basemap: b }),
      setHoveredParcelId: (id) => set({ hoveredParcelId: id }),
      setSelectedParcelId: (id) => set({ selectedParcelId: id }),
      flyTo: (target) =>
        set({ flyTarget: { ...target, seq: ++seqCounter } }),
      setCursorLngLat: (v) => set({ cursorLngLat: v }),
      setViewState: (v) =>
        set((s) => ({
          zoom: v.zoom ?? s.zoom,
          bearing: v.bearing ?? s.bearing,
          pitch: v.pitch ?? s.pitch
        }))
    }),
    {
      name: "eimar:map",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        basemap: s.basemap,
        zoom: s.zoom
      })
    }
  )
);
