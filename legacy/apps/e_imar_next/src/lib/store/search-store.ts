'use client';

import { create } from 'zustand';
import type { ParcelWorkflowPayload, ParcelWorkflowResponse } from '@/lib/api/types';

interface SearchState {
  lastQuery: ParcelWorkflowPayload | null;
  lastResponse: ParcelWorkflowResponse | null;
  lastResponseKey: string | null;
  userReference: string;
  setLastQuery: (payload: ParcelWorkflowPayload | null) => void;
  setLastResponse: (response: ParcelWorkflowResponse | null, key: string | null) => void;
  setUserReference: (reference: string) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  lastQuery: null,
  lastResponse: null,
  lastResponseKey: null,
  userReference: '',
  setLastQuery: (payload) => set({ lastQuery: payload }),
  setLastResponse: (response, key) => set({ lastResponse: response, lastResponseKey: key }),
  setUserReference: (reference) => set({ userReference: reference }),
  reset: () => set({ lastQuery: null, lastResponse: null, lastResponseKey: null }),
}));
