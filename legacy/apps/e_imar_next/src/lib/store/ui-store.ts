'use client';

import { create } from 'zustand';

export type LeftSidebarTab = 'layers' | 'saved' | 'watchlist' | 'history' | 'filters';
export type BottomSheetSnap = 'collapsed' | 'half' | 'full';

interface UIState {
  leftSidebarTab: LeftSidebarTab;
  leftSidebarOpen: boolean;
  leftSidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  bottomSheetSnap: BottomSheetSnap;
  searchOverlayOpen: boolean;
  setLeftSidebarTab: (tab: LeftSidebarTab) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setBottomSheetSnap: (snap: BottomSheetSnap) => void;
  cycleBottomSheetSnap: () => void;
  setSearchOverlayOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarTab: 'layers',
  leftSidebarOpen: false,
  leftSidebarCollapsed: false,
  rightPanelOpen: false,
  bottomSheetSnap: 'collapsed',
  searchOverlayOpen: false,
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setBottomSheetSnap: (snap) => set({ bottomSheetSnap: snap }),
  cycleBottomSheetSnap: () =>
    set((state) => ({
      bottomSheetSnap:
        state.bottomSheetSnap === 'collapsed'
          ? 'half'
          : state.bottomSheetSnap === 'half'
          ? 'full'
          : 'collapsed',
    })),
  setSearchOverlayOpen: (open) => set({ searchOverlayOpen: open }),
}));
