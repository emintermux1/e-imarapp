"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getBackendWatchlist } from "@/lib/api/backend-client";
import type { MarketProviderId } from "@/types/api";
import { DEFAULT_WATCHLIST_ALERT_INTENTS, type AskiAlertIntent, type ProvenanceKind } from "../lib/aski-tracking";

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  }
};

function resolveStorage() {
  if (typeof window === "undefined") return noopStorage;
  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

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
  trackingMode: "local_only" | "backend";
  backendId?: string | number | null;
  backendParcelId?: string | number | null;
  backendPlanId?: string | number | null;
}

export interface ListingFavorite {
  listingId: string;
  providerId: string;
  savedAt: string;
}

export interface MarketFiltersState {
  providerIds: MarketProviderId[];
  listingType: "all" | "sale" | "rent" | "lease";
  sortBy: "freshness" | "price_low" | "price_high" | "match";
}

type WatchlistAddEntry = Omit<WatchlistEntry, "addedAt" | "alertIntents" | "trackingMode" | "provenance"> & {
  provenance?: ProvenanceKind;
  alertIntents?: AskiAlertIntent[];
  trackingMode?: "local_only" | "backend";
};

interface WatchlistState {
  items: WatchlistEntry[];
  listingFavorites: string[];
  marketFilters: MarketFiltersState;
  add: (entry: WatchlistAddEntry) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  hydrateBackend: () => Promise<void>;
  clear: () => void;
  updateAlertIntents: (id: string, alertIntents: AskiAlertIntent[]) => void;
  toggleAlertIntent: (id: string, intent: AskiAlertIntent) => void;
  toggleListingFavorite: (listingId: string) => void;
  setMarketFilters: (filters: MarketFiltersState) => void;
}

function normalizeEntry(entry: Partial<WatchlistEntry> & Pick<WatchlistEntry, "id" | "ada" | "parsel" | "il" | "ilce" | "mahalle" | "zoningType" | "yuzolcumuM2" | "centroid">): WatchlistEntry {
  return {
    ...entry,
    addedAt: entry.addedAt ?? new Date().toISOString(),
    provenance: entry.provenance ?? "demo",
    alertIntents: entry.alertIntents ?? DEFAULT_WATCHLIST_ALERT_INTENTS,
    trackingMode: entry.trackingMode ?? "local_only"
  };
}

function normalizeBackendWatchlistItem(item: Record<string, unknown>): WatchlistEntry | null {
  const backendId = item.id;
  const parcelId = item.parcel_id ?? item.parcelId ?? null;
  const planId = item.plan_id ?? item.planId ?? null;
  const id = parcelId ? `backend:${String(parcelId)}` : planId ? `plan:${String(planId)}` : backendId ? `watchlist:${String(backendId)}` : null;
  if (!id) return null;
  const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : id;
  const parts = label.split(/\s+/);
  const adaParsel = parts.find((part) => /^\d+\/\d+/.test(part));
  const [ada = "—", parsel = "—"] = adaParsel?.split("/") ?? [];
  const location = parts.find((part) => part.includes("/"));
  const [ilce = "—", il = "—"] = location && location !== adaParsel ? location.split("/") : ["—", "—"];
  return normalizeEntry({
    id,
    ada,
    parsel,
    il,
    ilce,
    mahalle: typeof item.mahalle === "string" ? item.mahalle : "Backend kayıt",
    zoningType: "Backend alarm",
    yuzolcumuM2: Number(item.area_m2 ?? item.alan_m2 ?? 0),
    centroid: [0, 0],
    addedAt: typeof item.created_at === "string" ? item.created_at : undefined,
    provenance: "official",
    trackingMode: "backend",
    backendId: backendId as string | number | null,
    backendParcelId: parcelId as string | number | null,
    backendPlanId: planId as string | number | null
  });
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      listingFavorites: [],
      marketFilters: {
        providerIds: [],
        listingType: "all",
        sortBy: "freshness"
      },
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
          const items = await getBackendWatchlist();
          const backendItems = items
            .map((item) => normalizeBackendWatchlistItem(item))
            .filter((item): item is WatchlistEntry => Boolean(item));
          if (backendItems.length === 0) return;
          set((state) => {
            const localOnly = state.items.filter((item) => !backendItems.some((backendItem) => backendItem.id === item.id));
            return { items: [...backendItems, ...localOnly] };
          });
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
        })),
      toggleListingFavorite: (listingId) =>
        set((s) => ({
          listingFavorites: s.listingFavorites.includes(listingId)
            ? s.listingFavorites.filter((id) => id !== listingId)
            : [...s.listingFavorites, listingId]
        })),
      setMarketFilters: (filters) => set({ marketFilters: filters })
    }),
    {
      name: "eimar:watchlist",
      version: 3,
      storage: createJSONStorage(resolveStorage),
      migrate: (persistedState) => normalizePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState),
        listingFavorites: normalizePersistedState(persistedState).listingFavorites ?? [],
        marketFilters: normalizePersistedState(persistedState).marketFilters ?? currentState.marketFilters
      })
    }
  )
);

function normalizePersistedState(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== "object") return { items: [] as WatchlistEntry[], listingFavorites: [] as string[], marketFilters: { providerIds: [] as MarketProviderId[], listingType: "all" as const, sortBy: "freshness" as const } };
  const record = persistedState as { items?: Partial<WatchlistEntry>[]; listingFavorites?: string[]; marketFilters?: Partial<MarketFiltersState> };
  return {
    items: Array.isArray(record.items)
      ? record.items
          .filter((item): item is Partial<WatchlistEntry> & Pick<WatchlistEntry, "id" | "ada" | "parsel" | "il" | "ilce" | "mahalle" | "zoningType" | "yuzolcumuM2" | "centroid"> => Boolean(item && item.id && item.ada && item.parsel))
          .map((item) => normalizeEntry(item))
      : [],
    listingFavorites: Array.isArray(record.listingFavorites) ? record.listingFavorites.filter((value): value is string => typeof value === "string" && value.length > 0) : [],
    marketFilters: {
      providerIds: Array.isArray(record.marketFilters?.providerIds)
        ? (record.marketFilters.providerIds.filter((value): value is MarketProviderId => ["sahibinden", "emlakjet", "hepsiemlak", "zingat"].includes(String(value))) as MarketProviderId[])
        : [],
      listingType: (record.marketFilters?.listingType === "sale" || record.marketFilters?.listingType === "rent" || record.marketFilters?.listingType === "lease" ? record.marketFilters.listingType : "all") as MarketFiltersState["listingType"],
      sortBy: (record.marketFilters?.sortBy === "price_low" || record.marketFilters?.sortBy === "price_high" || record.marketFilters?.sortBy === "match" ? record.marketFilters.sortBy : "freshness") as MarketFiltersState["sortBy"]
    }
  };
}
