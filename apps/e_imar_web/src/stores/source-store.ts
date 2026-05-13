"use client";

import { create } from "zustand";
import {
  discoverSource as discoverSourceApi,
  discoverMunicipalityGis,
  getLiveMapLayers,
  getSourceHealth,
  humanizeApiError,
  listSources,
  probeLiveMapLayer
} from "@/lib/api/backend-client";
import type {
  BackendMapLayerResponse,
  MunicipalGISDiscoveryResponse,
  ProbedLiveMapLayer,
  SourceHealthRecord,
  SourceRegistryRecord
} from "@/types/api";

interface SourceState {
  sources: SourceRegistryRecord[];
  health: Record<string, SourceHealthRecord>;
  liveLayers: BackendMapLayerResponse[];
  activeMapLayers: ProbedLiveMapLayer[];
  discoveries: Record<string, MunicipalGISDiscoveryResponse | Record<string, unknown>>;
  loading: boolean;
  healthLoading: boolean;
  error?: string;
  lastChecked?: string;
  loadSources: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  discover: (sourceId: string) => Promise<void>;
  discoverMunicipalityGis: (slug: string, force?: boolean) => Promise<void>;
  loadLiveLayers: () => Promise<void>;
  activateLiveLayer: (sourceId: string, endpointUrl?: string) => Promise<void>;
  deactivateLiveLayer: (layerId: string | number) => void;
}

export const useSourceStore = create<SourceState>()((set, get) => ({
  sources: [],
  health: {},
  liveLayers: [],
  activeMapLayers: [],
  discoveries: {},
  loading: false,
  healthLoading: false,
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
  },
  activateLiveLayer: async (sourceId: string, endpointUrl?: string) => {
    set({ error: undefined });
    try {
      const result = await probeLiveMapLayer(sourceId, endpointUrl);
      const layer = result.layer;
      if (!layer.activatable || !layer.tile_url) {
        set({ error: result.message ?? "Bu kaynak doğrulandı ama haritada açılabilir public WMS katmanı bulunamadı." });
        return;
      }
      set((state) => {
        const activeMapLayers = state.activeMapLayers.filter((item) => String(item.id) !== String(layer.id));
        return { activeMapLayers: [...activeMapLayers, layer], lastChecked: new Date().toISOString() };
      });
    } catch (error) {
      set({ error: humanizeApiError(error, "Kaynak probe edilemedi; katman haritaya eklenmedi.") });
    }
  },
  deactivateLiveLayer: (layerId) => {
    set((state) => ({ activeMapLayers: state.activeMapLayers.filter((layer) => String(layer.id) !== String(layerId)) }));
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
