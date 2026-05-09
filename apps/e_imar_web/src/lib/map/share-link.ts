import type { BasemapId } from "@/lib/maplibre/styles";

export interface ShareMapState {
  center: [number, number];
  zoom: number;
  basemap: BasemapId;
  selectedParcelIds?: string[];
}

export function serializeShareMapParams(state: ShareMapState): string {
  const params = new URLSearchParams();
  params.set("lat", trimCoord(state.center[1]));
  params.set("lng", trimCoord(state.center[0]));
  params.set("z", trimZoom(state.zoom));
  params.set("basemap", state.basemap);
  const selected = [...new Set(state.selectedParcelIds ?? [])].filter(Boolean);
  if (selected.length > 0) params.set("parcels", selected.join(","));
  return params.toString();
}

export function buildShareMapUrl(state: ShareMapState, baseUrl: string): string {
  const url = new URL(baseUrl);
  const serialized = serializeShareMapParams(state);
  const params = new URLSearchParams(serialized);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return url.toString();
}

function trimCoord(value: number): string {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function trimZoom(value: number): string {
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
