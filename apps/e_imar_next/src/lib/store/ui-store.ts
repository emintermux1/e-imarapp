'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LeftSidebarTab = 'layers' | 'saved' | 'watchlist' | 'history' | 'filters';
export type BottomSheetSnap = 'collapsed' | 'half' | 'full';

interface UIState {
  leftSidebarTab: LeftSidebarTab;
  leftSidebarOpen: boolean;
  leftSidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  bottomSheetSnap: BottomSheetSnap;
  searchOverlayOpen: boolean;
  /**
   * Workspace user reference. Persisted to localStorage so the watchlist /
   * plan-explain routes can find the user identity across reloads. The same
   * value is mirrored into `useSearchStore.userReference` for parcel queries.
   */
  userReference: string | null;
  /**
   * One-shot field used to pre-fill the plan-explain form when navigating
   * from the parcel detail accordion. Cleared after consumption on the
   * `/plan-explain` page mount.
   */
  pendingPlanNote: string | null;
  setLeftSidebarTab: (tab: LeftSidebarTab) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setBottomSheetSnap: (snap: BottomSheetSnap) => void;
  cycleBottomSheetSnap: () => void;
  setSearchOverlayOpen: (open: boolean) => void;
  setUserReference: (ref: string | null) => void;
  setPendingPlanNote: (note: string | null) => void;
  consumePendingPlanNote: () => string | null;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      leftSidebarTab: 'layers',
      leftSidebarOpen: false,
      leftSidebarCollapsed: false,
      rightPanelOpen: false,
      bottomSheetSnap: 'collapsed',
      searchOverlayOpen: false,
      userReference: null,
      pendingPlanNote: null,
      setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
      setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      toggleRightPanel: () =>
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
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
      setUserReference: (ref) => {
        const value = ref?.trim() ? ref.trim() : null;
        set({ userReference: value });
      },
      setPendingPlanNote: (note) =>
        set({ pendingPlanNote: note && note.trim() ? note : null }),
      consumePendingPlanNote: () => {
        const value = get().pendingPlanNote;
        if (value) set({ pendingPlanNote: null });
        return value;
      },
    }),
    {
      name: 'eimar-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist user identity + cross-route handoff payload; the rest
      // of the UI state is session-scoped (drawers, sheets, overlay).
      partialize: (state) => ({
        userReference: state.userReference,
        pendingPlanNote: state.pendingPlanNote,
      }),
      // Skip auto-hydration to avoid React 18 SSR/CSR mismatches; the
      // `Providers` component calls `useUIStore.persist.rehydrate()` after
      // mount.
      skipHydration: true,
      version: 1,
    },
  ),
);
