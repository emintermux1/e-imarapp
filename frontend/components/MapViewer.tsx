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
}

export function MapViewer({ center = [28.9784, 41.0082], zoom = 12, geojson, wmsUrl, wmsLayer }: MapViewerProps) {
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
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [center[0], center[1]],
      zoom,
    });

    map.on("load", () => {
      setLoaded(true);
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
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([center[0], center[1]]);
    map.setZoom(zoom);
  }, [center, zoom]);

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
