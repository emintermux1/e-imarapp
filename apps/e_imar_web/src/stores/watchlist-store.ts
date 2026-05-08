"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getBackendWatchlist } from "@/lib/api/backend-client";

export interface WatchlistEntry {
  id: string;
  ada: string;
  parsel: string;
  il: string;
  ilce: string;
  mahalle: string;
  zoningType: string;
  yuzolcumuM2: number;
  centroid: [number, number];
  addedAt: string;
}

interface WatchlistState {
  items: WatchlistEntry[];
  add: (entry: Omit<WatchlistEntry, "addedAt">) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  hydrateBackend: () => Promise<void>;
  clear: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (entry) =>
        set((s) => {
          if (s.items.some((i) => i.id === entry.id)) return s;
          return {
            items: [
              { ...entry, addedAt: new Date().toISOString() },
              ...s.items
            ]
          };
        }),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      hydrateBackend: async () => {
        try {
          await getBackendWatchlist();
        } catch {
          // Local watchlist must stay non-blocking when backend is unavailable.
        }
      },
      clear: () => set({ items: [] })
    }),
    {
      name: "eimar:watchlist",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
