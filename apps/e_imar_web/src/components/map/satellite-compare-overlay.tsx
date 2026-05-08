"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  GripVertical,
  X
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const HISTORICAL_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const CURRENT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const HISTORICAL_YEAR = 2014;
const CURRENT_YEAR = 2026;

/**
 * Satellite Compare overlay — an absolutely-positioned compare slider that
 * sits *over* the active 2D map. When mounted it spawns two extra MapLibre
 * instances pinned to the main map's camera; the right pane is clipped by a
 * draggable vertical handle.
 *
 * Implementation notes:
 * - We mount our own `divs` and instantiate MapLibre on each. We sync each
 *   one's camera to the main `window.__mlMap` instance via the standard
 *   `move` event.
 * - The "old" tile source uses the same Esri imagery URL but applies a CSS
 *   `filter: sepia(0.6) saturate(0.6)` for a "vintage" tone, since we don't
 *   have a public free archive raster service. Document this in README as
 *   a placeholder.
 */
export function SatelliteCompareOverlay() {
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const containerLeftRef = React.useRef<HTMLDivElement | null>(null);
  const containerRightRef = React.useRef<HTMLDivElement | null>(null);
  const mapLeftRef = React.useRef<MapLibreMap | null>(null);
  const mapRightRef = React.useRef<MapLibreMap | null>(null);
  const [splitPercent, setSplitPercent] = React.useState(50);
  const draggingRef = React.useRef(false);

  // Camera sync to main map
  React.useEffect(() => {
    const mainMap = (window as Window & {
      __mlMap?: MapLibreMap;
    }).__mlMap;
    if (!mainMap) return;
    const apply = (target: MapLibreMap | null) => {
      if (!target) return;
      target.jumpTo({
        center: mainMap.getCenter(),
        zoom: mainMap.getZoom(),
        bearing: mainMap.getBearing(),
        pitch: mainMap.getPitch()
      });
    };
    const onMove = () => {
      apply(mapLeftRef.current);
      apply(mapRightRef.current);
    };
    mainMap.on("move", onMove);
    return () => {
      mainMap.off("move", onMove);
    };
  }, []);

  // Mount the two compare maps
  React.useEffect(() => {
    if (!containerLeftRef.current || !containerRightRef.current) return;
    const mainMap = (window as Window & {
      __mlMap?: MapLibreMap;
    }).__mlMap;
    const initialCenter = mainMap?.getCenter() ?? { lng: 35, lat: 39 };
    const initialZoom = mainMap?.getZoom() ?? 5.5;

    const leftStyle: maplibregl.StyleSpecification = {
      version: 8,
      glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      sources: {
        "compare-historical": {
          type: "raster",
          tiles: [HISTORICAL_TILE_URL],
          tileSize: 256
        }
      },
      layers: [
        {
          id: "compare-historical-layer",
          type: "raster",
          source: "compare-historical",
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
    const rightStyle: maplibregl.StyleSpecification = {
      version: 8,
      glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      sources: {
        "compare-current": {
          type: "raster",
          tiles: [CURRENT_TILE_URL],
          tileSize: 256
        }
      },
      layers: [
        {
          id: "compare-current-layer",
          type: "raster",
          source: "compare-current",
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    mapLeftRef.current = new maplibregl.Map({
      container: containerLeftRef.current,
      style: leftStyle,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: false,
      interactive: false
    });
    mapRightRef.current = new maplibregl.Map({
      container: containerRightRef.current,
      style: rightStyle,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: false,
      interactive: false
    });

    return () => {
      mapLeftRef.current?.remove();
      mapRightRef.current?.remove();
      mapLeftRef.current = null;
      mapRightRef.current = null;
    };
  }, []);

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const rect = (
      e.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(8, Math.min(92, pct)));
  };

  return (
    <div className="absolute inset-0 z-[5]">
      {/* Old layer (full-bleed; right pane clipped by inset-inline-end) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={containerLeftRef}
          className="absolute inset-0"
          style={{
            filter: "sepia(0.55) saturate(0.5) contrast(1.05) brightness(0.95)",
            clipPath: `inset(0 ${100 - splitPercent}% 0 0)`
          }}
        />
        <div
          ref={containerRightRef}
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 0 0 ${splitPercent}%)`
          }}
        />
      </div>

      {/* Year chips */}
      <div className="absolute top-3 left-3 z-10">
        <CompareChip year={HISTORICAL_YEAR} label="Eski" tone="muted" />
      </div>
      <div className="absolute top-3 right-3 z-10">
        <CompareChip year={CURRENT_YEAR} label="Güncel" tone="primary" />
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => setCompareMode("off")}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-sm border border-border-strong bg-surface-2/95 shadow-card text-[11px] text-fg-secondary hover:text-fg-primary hover:bg-surface-3"
        aria-label="Karşılaştırmayı kapat"
      >
        <X className="h-3 w-3" />
        Karşılaştırmayı Kapat
      </button>

      {/* Drag handle line + circle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: `${splitPercent}%` }}
      >
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-fg-primary/85"
        />
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={onPointerMove}
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
            "h-8 w-8 rounded-full bg-surface-2 border border-border-strong shadow-card",
            "inline-flex items-center justify-center cursor-ew-resize",
            "hover:bg-surface-3"
          )}
          aria-label="Karşılaştırma kaydırıcısı"
        >
          <GripVertical className="h-4 w-4 text-fg-secondary" />
        </button>
      </div>
    </div>
  );
}

function CompareChip({
  year,
  label,
  tone
}: {
  year: number;
  label: string;
  tone: "muted" | "primary";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 h-7 rounded-sm border bg-surface-2/95 shadow-card text-[11px] tabular-nums",
        tone === "muted"
          ? "border-border-strong text-fg-secondary"
          : "border-brand-blue/60 text-fg-primary"
      )}
    >
      <span className="text-fg-muted uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="font-semibold">{year}</span>
    </div>
  );
}
