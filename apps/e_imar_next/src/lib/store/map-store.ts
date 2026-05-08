'use client';

import { create } from 'zustand';
import { DEFAULT_LAYER_CATALOG } from '@/lib/map/layer-defs';
import type { LayerCatalogItem, MapStyleName } from '@/types/map';

const DEFAULT_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_DEFAULT_CENTER_LON ?? 35),
  Number(process.env.NEXT_PUBLIC_DEFAULT_CENTER_LAT ?? 39),
];
const DEFAULT_ZOOM = Number(process.env.NEXT_PUBLIC_DEFAULT_ZOOM ?? 6);

export interface CameraView {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapState extends CameraView {
  mapStyle: MapStyleName;
  is3D: boolean;
  selectedParcelId: string | null;
  layers: LayerCatalogItem[];
  /** Last cache key for the parcel-workflow result associated with the selected parcel. */
  selectedWorkflowKey: string | null;
  setView: (view: Partial<CameraView>) => void;
  setMapStyle: (style: MapStyleName) => void;
  toggle3D: () => void;
  set3D: (value: boolean) => void;
  selectParcel: (id: string | null, workflowKey?: string | null) => void;
  toggleLayer: (id: string, enabled?: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;
  resetMap: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  bearing: 0,
  pitch: 0,
  mapStyle: 'streets',
  is3D: false,
  selectedParcelId: null,
  selectedWorkflowKey: null,
  layers: DEFAULT_LAYER_CATALOG,
  setView: (view) => set((state) => ({ ...state, ...view })),
  setMapStyle: (style) => set({ mapStyle: style }),
  toggle3D: () => set((state) => ({ is3D: !state.is3D })),
  set3D: (value) => set({ is3D: value }),
  selectParcel: (id, workflowKey = null) =>
    set({ selectedParcelId: id, selectedWorkflowKey: workflowKey }),
  toggleLayer: (id, enabled) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, enabled: enabled ?? !layer.enabled } : layer,
      ),
    })),
  setOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) } : layer,
      ),
    })),
  resetMap: () =>
    set({
      selectedParcelId: null,
      selectedWorkflowKey: null,
      layers: DEFAULT_LAYER_CATALOG,
      bearing: 0,
      pitch: 0,
      is3D: false,
    }),
}));
