"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  getParcelsCollection
} from "@/data/parcels";
import {
  PARCEL_SOURCE,
  buildParcelFillLayer,
  buildParcelLineLayer
} from "@/lib/maplibre/layers";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";
import { getStyleForBasemap } from "@/lib/maplibre/styles";
import { getSnapshotForYear } from "@/data/historical-snapshots";
import { ZONING_PRESETS } from "@/data/zoning";

interface CompareMapPairProps {
  cursorReadoutRef: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef: React.RefObject<HTMLSpanElement>;
}

/**
 * Side-by-side time-compare maps. Both panes share basemap + camera; only
 * parcel coloring differs based on the assigned year snapshot.
 *
 * Camera sync is implemented via a shared `move` event broadcast: whichever
 * map is being interacted with becomes "leader" and the other follows
 * `easeTo` in lockstep, but only when not already animating.
 */
export function CompareMapPair({
  cursorReadoutRef,
  zoomReadoutRef
}: CompareMapPairProps) {
  const yearA = useUIStore((s) => s.timelineYear) ?? 2014;
  const yearB = useUIStore((s) => s.timelineCompareYear) ?? 2024;
  const basemap = useMapStore((s) => s.basemap);

  const containerARef = React.useRef<HTMLDivElement | null>(null);
  const containerBRef = React.useRef<HTMLDivElement | null>(null);
  const mapARef = React.useRef<MapLibreMap | null>(null);
  const mapBRef = React.useRef<MapLibreMap | null>(null);

  React.useEffect(() => {
    if (!containerARef.current || !containerBRef.current) return;
    const styleA = getStyleForBasemap(basemap);
    const styleB = getStyleForBasemap(basemap);

    const a = new maplibregl.Map({
      container: containerARef.current,
      style: styleA,
      center: [35, 39],
      zoom: 5.5,
      attributionControl: false
    });
    const b = new maplibregl.Map({
      container: containerBRef.current,
      style: styleB,
      center: [35, 39],
      zoom: 5.5,
      attributionControl: false
    });

    mapARef.current = a;
    mapBRef.current = b;

    let syncing = false;
    function syncFrom(src: MapLibreMap, dst: MapLibreMap) {
      if (syncing) return;
      syncing = true;
      dst.jumpTo({
        center: src.getCenter(),
        zoom: src.getZoom(),
        bearing: src.getBearing(),
        pitch: src.getPitch()
      });
      syncing = false;
    }
    a.on("move", () => syncFrom(a, b));
    b.on("move", () => syncFrom(b, a));

    function ensureSource(map: MapLibreMap, year: number) {
      const fc = getParcelsCollection() as unknown as GeoJSON.FeatureCollection<
        GeoJSON.Polygon,
        Record<string, unknown>
      >;
      // Decorate each feature with the year snapshot's effective zoning so the
      // parcel-fill expression colors correctly.
      const decorated: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: fc.features.map((f) => {
          const props = f.properties as Record<string, unknown> & {
            id?: string;
            zoningType?: string;
          };
          const id = (props.id as string) ?? "";
          const snapshot = getSnapshotForYear(id, year);
          const zoning = snapshot?.zoningType ?? props.zoningType;
          const color = ZONING_PRESETS[zoning as keyof typeof ZONING_PRESETS]
            ?.fill ?? ZONING_PRESETS.Konut.fill;
          return {
            ...f,
            properties: {
              ...props,
              effectiveZoning: zoning,
              effectiveFill: color,
              snapshotYear: year
            }
          };
        })
      };
      if (!map.getSource(PARCEL_SOURCE)) {
        map.addSource(PARCEL_SOURCE, {
          type: "geojson",
          data: decorated as never,
          tolerance: 0,
          buffer: 256
        });
      } else {
        const src = map.getSource(PARCEL_SOURCE);
        if (src && "setData" in src) {
          (src as maplibregl.GeoJSONSource).setData(decorated as never);
        }
      }
      if (!map.getLayer("parcels-fill")) {
        const layer = buildParcelFillLayer("parcels-fill");
        layer.paint = {
          "fill-color": ["get", "effectiveFill"] as never,
          "fill-opacity": 0.55
        };
        map.addLayer(layer);
      }
      if (!map.getLayer("parcels-line")) {
        map.addLayer(buildParcelLineLayer("parcels-line"));
      }
    }

    a.once("load", () => ensureSource(a, yearA));
    b.once("load", () => ensureSource(b, yearB));

    a.on("mousemove", (e) => {
      if (cursorReadoutRef.current) {
        cursorReadoutRef.current.textContent = `${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`;
      }
    });
    a.on("zoomend", () => {
      if (zoomReadoutRef.current) {
        zoomReadoutRef.current.textContent = a.getZoom().toFixed(2);
      }
    });

    return () => {
      a.remove();
      b.remove();
      mapARef.current = null;
      mapBRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap]);

  // When years change, refresh source data on each pane
  React.useEffect(() => {
    const a = mapARef.current;
    const b = mapBRef.current;
    function refresh(map: MapLibreMap | null, year: number) {
      if (!map) return;
      if (!map.isStyleLoaded()) {
        map.once("load", () => refresh(map, year));
        return;
      }
      const fc = getParcelsCollection() as unknown as GeoJSON.FeatureCollection<
        GeoJSON.Polygon,
        Record<string, unknown>
      >;
      const decorated: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: fc.features.map((f) => {
          const props = f.properties as Record<string, unknown> & {
            id?: string;
            zoningType?: string;
          };
          const id = (props.id as string) ?? "";
          const snapshot = getSnapshotForYear(id, year);
          const zoning = snapshot?.zoningType ?? props.zoningType;
          const color = ZONING_PRESETS[zoning as keyof typeof ZONING_PRESETS]
            ?.fill ?? ZONING_PRESETS.Konut.fill;
          return {
            ...f,
            properties: {
              ...props,
              effectiveZoning: zoning,
              effectiveFill: color,
              snapshotYear: year
            }
          };
        })
      };
      const src = map.getSource(PARCEL_SOURCE);
      if (src && "setData" in src) {
        (src as maplibregl.GeoJSONSource).setData(decorated as never);
      }
    }
    refresh(a, yearA);
    refresh(b, yearB);
  }, [yearA, yearB]);

  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-px bg-border-strong">
      <div className="relative">
        <div ref={containerARef} className="absolute inset-0" />
        <YearChip label="Sol" year={yearA} side="left" />
      </div>
      <div className="relative">
        <div ref={containerBRef} className="absolute inset-0" />
        <YearChip label="Sağ" year={yearB} side="right" />
      </div>
    </div>
  );
}

function YearChip({
  year,
  side,
  label
}: {
  year: number;
  side: "left" | "right";
  label: string;
}) {
  return (
    <div
      className={`absolute top-3 ${side === "left" ? "left-3" : "right-3"} z-10`}
    >
      <div className="inline-flex items-center gap-1.5 px-2 h-7 rounded-sm border border-border-strong bg-surface-2/95 shadow-card text-[11px] tabular-nums text-fg-secondary">
        <span className="text-fg-muted uppercase tracking-wider text-[10px]">
          {label}
        </span>
        <span className="font-semibold text-fg-primary">{year}</span>
      </div>
    </div>
  );
}
