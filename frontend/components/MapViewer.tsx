"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewerProps {
  center?: [number, number];
  zoom?: number;
  geojson?: Record<string, unknown>;
  wmsUrl?: string;
  wmsLayer?: string;
  basemap?: "osm" | "light" | "dark";
  nearbyFeatures?: Array<{
    id: number;
    lon: number;
    lat: number;
    title: string;
    subtitle?: string;
  }>;
  measurementGeojson?: Record<string, unknown>;
  onMapClick?: (coords: { lon: number; lat: number }) => void;
  onMapReady?: (map: maplibregl.Map) => void;
}

const basemapTileUrls: Record<NonNullable<MapViewerProps["basemap"]>, string> = {
  osm: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  light: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  dark: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
};

export function MapViewer({
  center = [28.9784, 41.0082],
  zoom = 12,
  geojson,
  wmsUrl,
  wmsLayer,
  basemap = "light",
  nearbyFeatures = [],
  measurementGeojson,
  onMapClick,
  onMapReady,
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: [basemapTileUrls[basemap]],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "basemap",
            type: "raster",
            source: "basemap",
          },
        ],
      },
      center: [center[0], center[1]],
      zoom,
    });

    map.on("load", () => {
      setLoaded(true);
      onMapReady?.(map);
      if (geojson) {
        map.addSource("parcel", { type: "geojson", data: geojson as unknown as GeoJSON.GeoJSON });
        map.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: { "fill-color": "#00e5ff", "fill-opacity": 0.3 },
        });
        map.addLayer({
          id: "parcel-line",
          type: "line",
          source: "parcel",
          paint: { "line-color": "#00e5ff", "line-width": 2 },
        });
      }
      if (wmsUrl && wmsLayer) {
        map.addSource("wms", {
          type: "raster",
          tiles: [`${wmsUrl}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=${wmsLayer}&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`],
          tileSize: 256,
        });
        map.addLayer({ id: "wms-layer", type: "raster", source: "wms", paint: { "raster-opacity": 0.7 } });
      }

      map.addSource("nearby-results", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "nearby-results-circle",
        type: "circle",
        source: "nearby-results",
        paint: {
          "circle-radius": 6,
          "circle-color": "#06b6d4",
          "circle-stroke-color": "#0f172a",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("click", "nearby-results-circle", (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const coords = feature.geometry.coordinates as [number, number];
        const title = String(feature.properties?.title || "Sonuç");
        const subtitle = feature.properties?.subtitle ? `<br/>${String(feature.properties.subtitle)}` : "";
        new maplibregl.Popup({ closeButton: true }).setLngLat(coords).setHTML(`<strong>${title}</strong>${subtitle}`).addTo(map);
      });

      map.addSource("measurement", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "measurement-line",
        type: "line",
        source: "measurement",
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#f59e0b", "line-width": 3 },
      });
      map.addLayer({
        id: "measurement-fill",
        type: "fill",
        source: "measurement",
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "measurement-point",
        type: "circle",
        source: "measurement",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#f59e0b",
          "circle-stroke-color": "#111827",
          "circle-stroke-width": 1.25,
        },
      });
    });

    map.on("click", (event) => {
      onMapClick?.({ lon: event.lngLat.lng, lat: event.lngLat.lat });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapClick, onMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([center[0], center[1]]);
    map.setZoom(zoom);
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("basemap") as maplibregl.RasterTileSource | undefined;
    if (!source) return;
    source.setTiles([basemapTileUrls[basemap]]);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("nearby-results") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: nearbyFeatures.map((feature) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [feature.lon, feature.lat],
        },
        properties: {
          title: feature.title,
          subtitle: feature.subtitle ?? "",
        },
      })),
    });
  }, [nearbyFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("measurement") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(((measurementGeojson as unknown) as GeoJSON.GeoJSON) || { type: "FeatureCollection", features: [] });
  }, [measurementGeojson]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border-subtle)]">
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]">
          <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
