"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { GISLegend } from "../domain/Cards";

export function MapViewport() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [29.05, 41.0],
      zoom: 10.5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3">
        <GISLegend />
      </div>
    </div>
  );
}
