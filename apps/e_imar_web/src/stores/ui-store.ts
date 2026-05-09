"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SidebarMode = "expanded" | "collapsed" | "hidden";
export type MapMode = "2d" | "3d";
export type CompareMode = "off" | "timeMachine" | "satellite";

interface UIState {
  sidebarMode: SidebarMode;
  rightPanelOpen: boolean;
  searchOpen: boolean;
  mobileSheetSnap: "peek" | "half" | "full";
  layerOpacity: Record<string, number>;
  layerVisibility: Record<string, boolean>;
  legendCollapsed: boolean;

  /** 2D MapLibre vs 3D Cesium. */
  mapMode: MapMode;

  /** Currently selected year for the Zaman Çizelgesi timeline (null = current). */
  timelineYear: number | null;
  /** When in compare mode, the year displayed on the right pane. */
  timelineCompareYear: number | null;

  /** When non-"off", a comparison overlay is active in the map area. */
  compareMode: CompareMode;

  /** Askı modu: when true, askı layer is forcibly visible and styled. */
  askiMode: boolean;

  activeConstraintFilter: string | null;
  activePlanNoteFilter: string | null;
  activeRiskFocus: "deprem" | "heyelan" | "sel" | "yangin" | null;

  /** 3D analysis controls (only meaningful when mapMode === "3d"). */
  shadowEnabled: boolean;
  sunHour: number; // 0..23
  sunMonth: number; // 1..12
  emsalWireframe: boolean;
  viewCorridor: boolean;

  setSidebarMode: (m: SidebarMode) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileSheetSnap: (s: "peek" | "half" | "full") => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLegendCollapsed: (v: boolean) => void;

  setMapMode: (m: MapMode) => void;
  setTimelineYear: (y: number | null) => void;
  setTimelineCompareYear: (y: number | null) => void;
  setCompareMode: (m: CompareMode) => void;
  setAskiMode: (v: boolean) => void;
  setActiveConstraintFilter: (value: string | null) => void;
  setActivePlanNoteFilter: (value: string | null) => void;
  setActiveRiskFocus: (value: "deprem" | "heyelan" | "sel" | "yangin" | null) => void;
  clearSemanticFocus: () => void;

  setShadowEnabled: (v: boolean) => void;
  setSunHour: (h: number) => void;
  setSunMonth: (m: number) => void;
  setEmsalWireframe: (v: boolean) => void;
  setViewCorridor: (v: boolean) => void;
}

import { LAYER_DESCRIPTORS } from "@/lib/maplibre/layers";

const initialOpacity: Record<string, number> = {};
const initialVisibility: Record<string, boolean> = {};
LAYER_DESCRIPTORS.forEach((l) => {
  initialOpacity[l.id] = l.defaultOpacity;
  initialVisibility[l.id] = l.defaultVisible;
});

const CORE_VISIBLE_LAYERS = [
  "parcels-fill",
  "parcels-line",
  "parcels-label",
  "metro-hatti",
  "belediye-sinirlari"
] as const;

function reconcileLayerOpacity(value: unknown): Record<string, number> {
  return { ...initialOpacity, ...(isRecord(value) ? value : {}) };
}

function reconcileLayerVisibility(value: unknown): Record<string, boolean> {
  const restored = { ...initialVisibility, ...(isRecord(value) ? value : {}) };
  for (const id of CORE_VISIBLE_LAYERS) {
    restored[id] = true;
  }
  return restored;
}

function isRecord(value: unknown): value is Record<string, never> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarMode: "expanded",
      rightPanelOpen: false,
      searchOpen: false,
      mobileSheetSnap: "peek",
      layerOpacity: initialOpacity,
      layerVisibility: initialVisibility,
      legendCollapsed: false,

      mapMode: "2d",
      timelineYear: null,
      timelineCompareYear: null,
      compareMode: "off",
      askiMode: false,
      activeConstraintFilter: null,
      activePlanNoteFilter: null,
      activeRiskFocus: null,
      shadowEnabled: false,
      sunHour: 12,
      sunMonth: 6,
      emsalWireframe: true,
      viewCorridor: false,

      setSidebarMode: (m) => set({ sidebarMode: m }),
      toggleSidebar: () =>
        set((s) => ({
          sidebarMode: s.sidebarMode === "expanded" ? "collapsed" : "expanded"
        })),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setMobileSheetSnap: (s) => set({ mobileSheetSnap: s }),
      setLayerOpacity: (id, opacity) =>
        set((s) => ({ layerOpacity: { ...s.layerOpacity, [id]: opacity } })),
      setLayerVisibility: (id, visible) =>
        set((s) => ({
          layerVisibility: { ...s.layerVisibility, [id]: visible }
        })),
      setLegendCollapsed: (v) => set({ legendCollapsed: v }),

      setMapMode: (m) => set({ mapMode: m }),
      setTimelineYear: (y) => set({ timelineYear: y }),
      setTimelineCompareYear: (y) => set({ timelineCompareYear: y }),
      setCompareMode: (m) => set({ compareMode: m }),
      setAskiMode: (v) =>
        set((s) => ({
          askiMode: v,
          // ensure the askı layer is visible while askı mode is on
          layerVisibility: v
            ? { ...s.layerVisibility, "askida-overlay": true }
            : s.layerVisibility
        })),
      setActiveConstraintFilter: (value) => set({ activeConstraintFilter: value }),
      setActivePlanNoteFilter: (value) => set({ activePlanNoteFilter: value }),
      setActiveRiskFocus: (value) => set({ activeRiskFocus: value }),
      clearSemanticFocus: () =>
        set((s) => ({
          activeConstraintFilter: null,
          activePlanNoteFilter: null,
          activeRiskFocus: null,
          askiMode: false
        })),
      setShadowEnabled: (v) => set({ shadowEnabled: v }),
      setSunHour: (h) =>
        set({ sunHour: Math.max(0, Math.min(23, Math.round(h))) }),
      setSunMonth: (m) =>
        set({ sunMonth: Math.max(1, Math.min(12, Math.round(m))) }),
      setEmsalWireframe: (v) => set({ emsalWireframe: v }),
      setViewCorridor: (v) => set({ viewCorridor: v })
    }),
    {
      name: "eimar:ui",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        if (!isRecord(persistedState)) return persistedState;
        return {
          ...persistedState,
          layerOpacity: reconcileLayerOpacity(persistedState.layerOpacity),
          layerVisibility: reconcileLayerVisibility(persistedState.layerVisibility)
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        return {
          ...currentState,
          ...persisted,
          layerOpacity: reconcileLayerOpacity(persisted.layerOpacity),
          layerVisibility: reconcileLayerVisibility(persisted.layerVisibility)
        };
      },
      partialize: (s) => ({
        sidebarMode: s.sidebarMode,
        layerOpacity: s.layerOpacity,
        layerVisibility: s.layerVisibility,
        legendCollapsed: s.legendCollapsed,
        mapMode: s.mapMode,
        emsalWireframe: s.emsalWireframe,
        sunHour: s.sunHour,
        sunMonth: s.sunMonth
      })
    }
  )
);
