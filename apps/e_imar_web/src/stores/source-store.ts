"use client";

import { create } from "zustand";
import {
  discoverSource as discoverSourceApi,
  discoverMunicipalityGis,
  getLiveMapLayers,
  getSourceHealth,
  getSourceQuality,
  humanizeApiError,
  listSources
} from "@/lib/api/backend-client";
import type {
  BackendMapLayerResponse,
  MunicipalGISDiscoveryResponse,
  SourceHealthRecord,
  SourceQualityResponse,
  SourceRegistryRecord
} from "@/types/api";

interface SourceState {
  sources: SourceRegistryRecord[];
  health: Record<string, SourceHealthRecord>;
  liveLayers: BackendMapLayerResponse[];
  quality?: SourceQualityResponse;
  discoveries: Record<string, MunicipalGISDiscoveryResponse | Record<string, unknown>>;
  loading: boolean;
  healthLoading: boolean;
  qualityLoading: boolean;
  error?: string;
  lastChecked?: string;
  loadSources: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  refreshQuality: (params?: { limit?: number; live_check?: boolean; capability?: string }) => Promise<void>;
  discover: (sourceId: string) => Promise<void>;
  discoverMunicipalityGis: (slug: string, force?: boolean) => Promise<void>;
  loadLiveLayers: () => Promise<void>;
}

export const useSourceStore = create<SourceState>()((set, get) => ({
  sources: [],
  health: {},
  liveLayers: [],
  discoveries: {},
  loading: false,
  healthLoading: false,
  qualityLoading: false,
  loadSources: async () => {
    set({ loading: true, error: undefined });
    try {
      const sources = await listSources();
      set({ sources: Array.isArray(sources) ? sources : [], loading: false });
    } catch (error) {
      set({ loading: false, error: humanizeApiError(error, "Veri kaynakları yüklenemedi; yerel/demo katmanlar korunuyor.") });
    }
  },
  refreshHealth: async () => {
    set({ healthLoading: true, error: undefined });
    try {
      const records = await getSourceHealth();
      const health = Object.fromEntries((Array.isArray(records) ? records : []).map((record) => [record.source_id, record]));
      set({ health, healthLoading: false, lastChecked: new Date().toISOString() });
    } catch (error) {
      set({ healthLoading: false, error: `${humanizeApiError(error)} Canlı durum alınamadı; portal bağlantıları açık kalır.`, lastChecked: new Date().toISOString() });
    }
  },
  refreshQuality: async (params = {}) => {
    set({ qualityLoading: true, error: undefined });
    try {
      const quality = await getSourceQuality({ limit: 12, ...params });
      set({ quality, qualityLoading: false, lastChecked: quality.fetched_at ?? new Date().toISOString() });
    } catch (error) {
      set({ qualityLoading: false, error: `${humanizeApiError(error, "Canlı veri kalite paneli alınamadı.")} Neden veri yok sorusu için sağlık/portal etiketleri korunuyor.`, lastChecked: new Date().toISOString() });
    }
  },
  discover: async (sourceId: string) => {
    set({ error: undefined });
    try {
      const discovery = await discoverSourceApi(sourceId);
      set((state) => ({ discoveries: { ...state.discoveries, [sourceId]: discovery }, lastChecked: new Date().toISOString() }));
      await get().loadLiveLayers();
    } catch (error) {
      set({ error: humanizeApiError(error, "Kaynak keşfi tamamlanamadı; portalı yeni sekmede açabilirsiniz.") });
    }
  },
  discoverMunicipalityGis: async (slug: string, force = false) => {
    set({ error: undefined });
    try {
      const discovery = await discoverMunicipalityGis(slug, force);
      set((state) => ({ discoveries: { ...state.discoveries, [slug]: discovery }, lastChecked: new Date().toISOString() }));
      await get().loadLiveLayers();
    } catch (error) {
      set({ error: humanizeApiError(error, "Belediye OGC keşfi tamamlanamadı.") });
    }
  },
  loadLiveLayers: async () => {
    try {
      const liveLayers = await getLiveMapLayers();
      set({ liveLayers: Array.isArray(liveLayers) ? liveLayers : liveLayers.layers ?? [] });
    } catch (error) {
      set({ error: `${humanizeApiError(error)} Haritada kaynak işaretleri için yerel kayıt kullanılacak.` });
    }
  }
}));

export function summarizeSourceStatuses(sources: SourceRegistryRecord[], health: Record<string, SourceHealthRecord>) {
  return sources.reduce(
    (acc, source) => {
      const status = health[source.id]?.status ?? (source.requires_approval || source.requires_credentials || source.auth === "requires_credentials" ? "requires_approval" : "external_only");
      if (status === "live") acc.live += 1;
      else if (status === "timeout") acc.timeout += 1;
      else if (["blocked", "requires_auth", "requires_approval"].includes(status)) acc.blocked += 1;
      else acc.externalOnly += 1;
      return acc;
    },
    { live: 0, blocked: 0, timeout: 0, externalOnly: 0 }
  );
}
