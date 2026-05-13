"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BasemapId } from "@/lib/maplibre/styles";
import type { LocationBoundary } from "@/data/location-boundaries";
import { mergeMultiSelection, toggleMultiSelection } from "@/lib/map/multi-select";

export interface SelectedArea extends Pick<LocationBoundary, "id" | "kind" | "label" | "il" | "ilce" | "mahalle" | "feature"> {}

export interface FlyTarget {
  center: [number, number];
  bounds?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  zoom?: number;
  bearing?: number;
  pitch?: number;
  parcelId?: string;
  /** ETag-like seq increment forces effect re-trigger even on identical center */
  seq: number;
}

export interface SelectedPointState {
  lng: number;
  lat: number;
  source: "map" | "parcel" | "search" | "system";
  nearestParcelId?: string;
}

interface MapState {
  basemap: BasemapId;
  hoveredParcelId: string | null;
  selectedParcelId: string | null;
  selectedArea: SelectedArea | null;
  selectedPoint: SelectedPointState | null;
  multiSelectedParcelIds: string[];
  selectionNotice: string | null;
  flyTarget: FlyTarget | null;
  cursorLngLat: [number, number] | null;
  zoom: number;
  bearing: number;
  pitch: number;
  setBasemap: (b: BasemapId) => void;
  setHoveredParcelId: (id: string | null) => void;
  setSelectedParcelId: (id: string | null) => void;
  setSelectedArea: (area: SelectedArea | null) => void;
  setSelectedPoint: (point: SelectedPointState | null) => void;
  toggleMultiSelectedParcelId: (id: string) => void;
  addMultiSelectedParcelIds: (ids: string[], limit?: number) => void;
  clearMultiSelection: () => void;
  setSelectionNotice: (notice: string | null) => void;
  clearSelection: () => void;
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
      selectedArea: null,
      selectedPoint: null,
      multiSelectedParcelIds: [],
      selectionNotice: null,
      flyTarget: null,
      cursorLngLat: null,
      zoom: 5.5,
      bearing: 0,
      pitch: 0,
      setBasemap: (b) => set({ basemap: b }),
      setHoveredParcelId: (id) => set({ hoveredParcelId: id }),
      setSelectedParcelId: (id) =>
        set(id ? { selectedParcelId: id, selectedPoint: null } : { selectedParcelId: null }),
      setSelectedArea: (area) => set({ selectedArea: area }),
      setSelectedPoint: (point) =>
        set(point ? { selectedPoint: point, selectedParcelId: null } : { selectedPoint: null }),
      toggleMultiSelectedParcelId: (id) =>
        set((s) => ({
          multiSelectedParcelIds: toggleMultiSelection(s.multiSelectedParcelIds, id),
          selectionNotice: null
        })),
      addMultiSelectedParcelIds: (ids, limit = 250) =>
        set((s) => {
          const result = mergeMultiSelection(s.multiSelectedParcelIds, ids, limit);
          return {
            multiSelectedParcelIds: result.ids,
            selectionNotice: result.truncated ? `Yoğun seçim: ilk ${limit} parsel seçildi.` : `${ids.length} parsel seçime eklendi.`
          };
        }),
      clearMultiSelection: () => set({ multiSelectedParcelIds: [], selectionNotice: null }),
      setSelectionNotice: (notice) => set({ selectionNotice: notice }),
      clearSelection: () => set({ selectedParcelId: null, selectedPoint: null, hoveredParcelId: null, multiSelectedParcelIds: [], selectionNotice: null }),
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
