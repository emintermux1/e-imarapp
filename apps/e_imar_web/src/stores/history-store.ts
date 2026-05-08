"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  query: string;
  mode: "Hepsi" | "AdaParsel" | "Koordinat" | "Adres" | "Belediye";
  ts: string;
  resultCount: number;
}

interface HistoryState {
  items: HistoryEntry[];
  push: (entry: Omit<HistoryEntry, "id" | "ts">) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      push: (entry) =>
        set((s) => {
          const filtered = s.items.filter(
            (i) => !(i.query === entry.query && i.mode === entry.mode)
          );
          const next: HistoryEntry = {
            ...entry,
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ts: new Date().toISOString()
          };
          return { items: [next, ...filtered].slice(0, 10) };
        }),
      clear: () => set({ items: [] })
    }),
    {
      name: "eimar:history",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
