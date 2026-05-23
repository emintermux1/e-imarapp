"use client";

import { create } from "zustand";

interface UiState {
  selectedParcelId: string | null;
  rightPanelOpen: boolean;
  is3DMode: boolean;
  layerOpacity: number;
  setSelectedParcelId: (id: string | null) => void;
  toggleRightPanel: (next?: boolean) => void;
  toggle3DMode: (next?: boolean) => void;
  setLayerOpacity: (value: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedParcelId: null,
  rightPanelOpen: true,
  is3DMode: false,
  layerOpacity: 0.7,
  setSelectedParcelId: (id) => set({ selectedParcelId: id }),
  toggleRightPanel: (next) =>
    set((state) => ({ rightPanelOpen: next ?? !state.rightPanelOpen })),
  toggle3DMode: (next) => set((state) => ({ is3DMode: next ?? !state.is3DMode })),
  setLayerOpacity: (value) => set({ layerOpacity: Math.max(0, Math.min(1, value)) }),
}));
