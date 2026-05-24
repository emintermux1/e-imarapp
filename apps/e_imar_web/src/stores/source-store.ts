"use client";

import { create } from "zustand";
import {
  discoverSource as discoverSourceApi,
  discoverMunicipalityGis,
  getLiveMapLayers,
  getSourceHealth,
  getSourceActivation,
  getSourceQuality,
  humanizeApiError,
  listSources,
  probeLiveMapLayer
} from "@/lib/api/backend-client";
import { buildWmsTileUrl } from "@/lib/workflow-helpers";
import type {
  BackendMapLayerResponse,
  MunicipalGISDiscoveryResponse,
  ProbedLiveMapLayer,
  SourceHealthRecord,
  SourceQualityRecord,
  SourceQualityResponse,
  SourceActivationResponse,
  SourceRegistryRecord
} from "@/types/api";

interface SourceState {
  sources: SourceRegistryRecord[];
  health: Record<string, SourceHealthRecord>;
  liveLayers: BackendMapLayerResponse[];
  quality?: SourceQualityResponse;
  activation?: SourceActivationResponse;
  qualityBySourceId: Record<string, SourceQualityRecord>;
  activeMapLayers: ProbedLiveMapLayer[];
  probedLayers: Record<string, ProbedLiveMapLayer>;
  discoveries: Record<string, MunicipalGISDiscoveryResponse | Record<string, unknown>>;
  loading: boolean;
  healthLoading: boolean;
  qualityLoading: boolean;
  error?: string;
  lastChecked?: string;
  loadSources: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  refreshQuality: (params?: { limit?: number; live_check?: boolean; capability?: string }) => Promise<void>;
  refreshActivation: (params?: { limit?: number; live_check?: boolean; force?: boolean }) => Promise<void>;
  discover: (sourceId: string) => Promise<void>;
  discoverMunicipalityGis: (slug: string, force?: boolean) => Promise<void>;
  loadLiveLayers: () => Promise<void>;
  probeLayerCatalog: (sourceId: string, endpointUrl?: string) => Promise<void>;
  activateLiveLayer: (sourceId: string, endpointUrl?: string, layerName?: string) => Promise<void>;
  activateCatalogWmsLayer: (payload: {
    sourceId: string;
    endpoint: string;
    layerName: string;
    title?: string;
  }) => void;
  deactivateLiveLayer: (layerId: string | number) => void;
}

export const useSourceStore = create<SourceState>()((set, get) => ({
  sources: [],
  health: {},
  liveLayers: [],
  activeMapLayers: [],
  qualityBySourceId: {},
  probedLayers: {},
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
      set({ loading: false, error: humanizeApiError(error, "Veri kaynakları yüklenemedi; public portal kayıtları korunuyor.") });
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
      const qualityBySourceId = Object.fromEntries((quality.sources ?? []).map((record) => [record.source_id, record]));
      set({ quality, qualityBySourceId, qualityLoading: false, lastChecked: quality.fetched_at ?? new Date().toISOString() });
    } catch (error) {
      set({ qualityLoading: false, error: `${humanizeApiError(error, "Canlı veri kalite paneli alınamadı.")} Kaynak özeti için sağlık/portal etiketleri korunuyor.`, lastChecked: new Date().toISOString() });
    }
  },
  refreshActivation: async (params = {}) => {
    set({ qualityLoading: true, error: undefined });
    try {
      const activation = await getSourceActivation({ limit: 24, ...params });
      set({ activation, qualityLoading: false, lastChecked: activation.generatedAt ?? new Date().toISOString() });
    } catch (error) {
      set({ qualityLoading: false, error: `${humanizeApiError(error, "Public kaynak aktivasyon paneli alınamadı.")} Mevcut kalite/portal etiketleri korunuyor.`, lastChecked: new Date().toISOString() });
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
  probeLayerCatalog: async (sourceId: string, endpointUrl?: string) => {
    set({ error: undefined });
    try {
      const result = await probeLiveMapLayer(sourceId, endpointUrl);
      const layer = result.layer;
      set((state) => ({ probedLayers: { ...state.probedLayers, [String(layer.id)]: layer }, lastChecked: new Date().toISOString() }));
      if (!layer.activatable || !layer.tile_url) {
        set({ error: result.message ?? "Bu kaynak doğrulandı ama haritada açılabilir public WMS katmanı bulunamadı." });
      }
    } catch (error) {
      set({ error: humanizeApiError(error, "Kaynak probe edilemedi; katman kataloğu alınamadı.") });
    }
  },
  activateLiveLayer: async (sourceId: string, endpointUrl?: string, layerName?: string) => {
    set({ error: undefined });
    try {
      const result = await probeLiveMapLayer(sourceId, endpointUrl, layerName);
      const layer = result.layer;
      set((state) => ({ probedLayers: { ...state.probedLayers, [String(layer.id)]: layer } }));
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
  },
  activateCatalogWmsLayer: ({ sourceId, endpoint, layerName, title }) => {
    const layerId = `catalog-${sourceId}-${layerName}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    const tileUrl = buildWmsTileUrl(endpoint, layerName);
    const layer: ProbedLiveMapLayer = {
      id: layerId,
      source_id: sourceId,
      name: title ?? layerName,
      title: title ?? layerName,
      tile_url: tileUrl,
      activatable: true,
      service_type: "wms",
      type: "wms",
      status: "live",
    };
    set((state) => ({
      activeMapLayers: [
        ...state.activeMapLayers.filter((item) => String(item.id) !== layerId),
        layer,
      ],
      lastChecked: new Date().toISOString(),
      error: undefined,
    }));
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
