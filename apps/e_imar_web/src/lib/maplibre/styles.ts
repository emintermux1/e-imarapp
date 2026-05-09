import type { StyleSpecification } from "maplibre-gl";
import { TURKEY_RASTER_BOUNDS } from "@/lib/geo/turkey";

/**
 * Carto Voyager (no API key required) — clean, neutral basemap. We compose
 * a JSON style so the app starts even if external style URLs are blocked.
 */
export const cartoVoyagerStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      bounds: TURKEY_RASTER_BOUNDS,
      attribution:
        '© <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 22
    }
  ]
});

export const cartoDarkStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    },
    "carto-labels": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      bounds: TURKEY_RASTER_BOUNDS,
      attribution:
        '© <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 22
    },
    {
      id: "carto-labels-layer",
      type: "raster",
      source: "carto-labels",
      minzoom: 0,
      maxzoom: 22,
      paint: {
        "raster-opacity": 0.82,
        "raster-brightness-min": 0.12,
        "raster-brightness-max": 1
      }
    }
  ]
});

/** Esri World Imagery — public, no token required */
export const esriSatelliteStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      bounds: TURKEY_RASTER_BOUNDS,
      attribution:
        "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
    }
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 22
    }
  ]
});

/** OpenTopoMap — public topographic basemap */
export const topographicStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "opentopo": {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      bounds: TURKEY_RASTER_BOUNDS,
      attribution:
        "© <a href=\"https://opentopomap.org\" target=\"_blank\" rel=\"noreferrer\">OpenTopoMap</a> (CC-BY-SA), Map data: © <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noreferrer\">OpenStreetMap</a> contributors"
    }
  },
  layers: [
    {
      id: "opentopo-layer",
      type: "raster",
      source: "opentopo",
      minzoom: 0,
      maxzoom: 17
    }
  ]
});

export type BasemapId = "voyager" | "dark" | "satellite" | "topographic";

export const BASEMAPS: Record<BasemapId, { id: BasemapId; label: string; description: string }> = {
  voyager: { id: "voyager", label: "Vektör", description: "Temiz sokak ve etiket zemini" },
  dark: { id: "dark", label: "Karanlık", description: "Kontrastlı koyu zemin" },
  satellite: { id: "satellite", label: "Uydu", description: "Gerçek görüntü / arazi izi" },
  topographic: { id: "topographic", label: "Topografik", description: "Eğim, yükselti ve topoğrafya" }
};

export function getStyleForBasemap(id: BasemapId): StyleSpecification {
  switch (id) {
    case "dark":
      return cartoDarkStyle();
    case "satellite":
      return esriSatelliteStyle();
    case "topographic":
      return topographicStyle();
    default:
      return cartoVoyagerStyle();
  }
}
