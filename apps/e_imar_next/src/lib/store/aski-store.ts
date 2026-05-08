'use client';

import { create } from 'zustand';
import type { SuspensionPlanType } from '@/lib/api/types';

export interface AskiFilters {
  dateFrom: string | null; // ISO date (yyyy-MM-dd)
  dateTo: string | null;
  municipalityIds: string[];
  planTypes: SuspensionPlanType[];
}

interface AskiState {
  filters: AskiFilters;
  selectedPlanId: string | null;
  setFilters: (patch: Partial<AskiFilters>) => void;
  selectPlan: (id: string | null) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: AskiFilters = {
  dateFrom: null,
  dateTo: null,
  municipalityIds: [],
  planTypes: [],
};

export const useAskiStore = create<AskiState>((set) => ({
  filters: DEFAULT_FILTERS,
  selectedPlanId: null,
  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  selectPlan: (id) => set({ selectedPlanId: id }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS, selectedPlanId: null }),
}));
