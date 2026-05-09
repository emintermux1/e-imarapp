"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getBackendWatchlist } from "@/lib/api/backend-client";
import type { AskiAlertIntent, ProvenanceKind } from "../lib/aski-tracking";

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
  provenance: ProvenanceKind;
  alertIntents: AskiAlertIntent[];
  trackingMode: "local_only";
}

type WatchlistAddEntry = Omit<WatchlistEntry, "addedAt" | "alertIntents" | "trackingMode" | "provenance"> & {
  provenance?: ProvenanceKind;
  alertIntents?: AskiAlertIntent[];
  trackingMode?: "local_only";
};

interface WatchlistState {
  items: WatchlistEntry[];
  add: (entry: WatchlistAddEntry) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  hydrateBackend: () => Promise<void>;
  clear: () => void;
  updateAlertIntents: (id: string, alertIntents: AskiAlertIntent[]) => void;
  toggleAlertIntent: (id: string, intent: AskiAlertIntent) => void;
}

function normalizeEntry(entry: Partial<WatchlistEntry> & Pick<WatchlistEntry, "id" | "ada" | "parsel" | "il" | "ilce" | "mahalle" | "zoningType" | "yuzolcumuM2" | "centroid">): WatchlistEntry {
  return {
    ...entry,
    addedAt: entry.addedAt ?? new Date().toISOString(),
    provenance: entry.provenance ?? "demo",
    alertIntents: entry.alertIntents ?? ["imar_change", "aski_plan", "cevre_plan", "source_access_status_change"],
    trackingMode: entry.trackingMode ?? "local_only"
  };
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
              normalizeEntry(entry),
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
      clear: () => set({ items: [] }),
      updateAlertIntents: (id, alertIntents) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, alertIntents: [...alertIntents] } : item
          )
        })),
      toggleAlertIntent: (id, intent) =>
        set((s) => ({
          items: s.items.map((item) => {
            if (item.id !== id) return item;
            const exists = item.alertIntents.includes(intent);
            return {
              ...item,
              alertIntents: exists
                ? item.alertIntents.filter((value) => value !== intent)
                : [...item.alertIntents, intent]
            };
          })
        }))
    }),
    {
      name: "eimar:watchlist",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => normalizePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState)
      })
    }
  )
);

function normalizePersistedState(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== "object") return { items: [] as WatchlistEntry[] };
  const record = persistedState as { items?: Partial<WatchlistEntry>[] };
  return {
    items: Array.isArray(record.items)
      ? record.items
          .filter((item): item is Partial<WatchlistEntry> & Pick<WatchlistEntry, "id" | "ada" | "parsel" | "il" | "ilce" | "mahalle" | "zoningType" | "yuzolcumuM2" | "centroid"> => Boolean(item && item.id && item.ada && item.parsel))
          .map((item) => normalizeEntry(item))
      : []
  };
}
