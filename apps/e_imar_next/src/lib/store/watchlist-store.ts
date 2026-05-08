'use client';

import { create } from 'zustand';
import type { WatchlistRule } from '@/lib/api/types';

interface WatchlistState {
  selectedEntityId: string | null;
  builderOpen: boolean;
  builderDraft: WatchlistRule | null;
  selectEntity: (id: string | null) => void;
  openBuilder: (draft?: Partial<WatchlistRule>) => void;
  closeBuilder: () => void;
  patchDraft: (patch: Partial<WatchlistRule>) => void;
}

const EMPTY_DRAFT: WatchlistRule = {
  entityType: 'parcel',
  entityRef: '',
  events: [],
  severityFloor: 'medium',
  channels: ['push'],
  label: '',
};

export const useWatchlistStore = create<WatchlistState>((set) => ({
  selectedEntityId: null,
  builderOpen: false,
  builderDraft: null,
  selectEntity: (id) => set({ selectedEntityId: id }),
  openBuilder: (draft) =>
    set({
      builderOpen: true,
      builderDraft: { ...EMPTY_DRAFT, ...(draft ?? {}) },
    }),
  closeBuilder: () => set({ builderOpen: false, builderDraft: null }),
  patchDraft: (patch) =>
    set((state) => ({
      builderDraft: { ...(state.builderDraft ?? EMPTY_DRAFT), ...patch },
    })),
}));
