import type { StyleSpecification } from 'maplibre-gl';
import type { MapStyleName } from '@/types/map';

const RASTER_STYLES: Record<MapStyleName, { tiles: string[]; attribution: string; maxzoom: number }> = {
  streets: {
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenStreetMap contributors',
    maxzoom: 19,
  },
  satellite: {
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxzoom: 19,
  },
  terrain: {
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    maxzoom: 17,
  },
};

function rasterStyle(styleName: MapStyleName): StyleSpecification {
  const cfg = RASTER_STYLES[styleName];
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      basemap: {
        type: 'raster',
        tiles: cfg.tiles,
        tileSize: 256,
        attribution: cfg.attribution,
        maxzoom: cfg.maxzoom,
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
        minzoom: 0,
      },
    ],
  };
}

/**
 * Resolve the MapLibre style for the requested style name.
 *
 * Priority:
 *  1. `NEXT_PUBLIC_MAP_STYLE_URL` (explicit override)
 *  2. `NEXT_PUBLIC_MAPTILER_KEY` (vector style)
 *  3. Hardcoded raster fallback (OSM / Esri imagery / OpenTopoMap)
 *
 * The function returns either a string URL (MapLibre will fetch the JSON) or
 * a `StyleSpecification` literal. Both shapes are valid inputs to
 * `new maplibregl.Map({ style })`.
 */
export function resolveMapStyle(styleName: MapStyleName): string | StyleSpecification {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (styleUrl) return styleUrl;

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  if (maptilerKey) {
    const map = {
      streets: 'streets-v2',
      satellite: 'hybrid',
      terrain: 'topo-v2',
    } as const;
    return `https://api.maptiler.com/maps/${map[styleName]}/style.json?key=${encodeURIComponent(maptilerKey)}`;
  }

  return rasterStyle(styleName);
}
