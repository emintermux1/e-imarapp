"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SidebarMode = "expanded" | "collapsed" | "hidden";

interface UIState {
  sidebarMode: SidebarMode;
  rightPanelOpen: boolean;
  searchOpen: boolean;
  mobileSheetSnap: "peek" | "half" | "full";
  layerOpacity: Record<string, number>;
  layerVisibility: Record<string, boolean>;
  legendCollapsed: boolean;
  setSidebarMode: (m: SidebarMode) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileSheetSnap: (s: "peek" | "half" | "full") => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLegendCollapsed: (v: boolean) => void;
}

import { LAYER_DESCRIPTORS } from "@/lib/maplibre/layers";

const initialOpacity: Record<string, number> = {};
const initialVisibility: Record<string, boolean> = {};
LAYER_DESCRIPTORS.forEach((l) => {
  initialOpacity[l.id] = l.defaultOpacity;
  initialVisibility[l.id] = l.defaultVisible;
});

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
      setLegendCollapsed: (v) => set({ legendCollapsed: v })
    }),
    {
      name: "eimar:ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sidebarMode: s.sidebarMode,
        layerOpacity: s.layerOpacity,
        layerVisibility: s.layerVisibility,
        legendCollapsed: s.legendCollapsed
      })
    }
  )
);
