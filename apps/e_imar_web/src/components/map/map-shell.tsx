"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";
import { MapCanvas } from "@/components/map/map-canvas";
import { CesiumCanvasLazy } from "@/components/cesium/cesium-canvas-lazy";
import { CompareMapPair } from "@/components/map/compare-map-pair";
import { SatelliteCompareOverlay } from "@/components/map/satellite-compare-overlay";
import type { AskiPolygonFeature } from "@/data/aski-polygons";

interface MapShellProps {
  cursorReadoutRef: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef: React.RefObject<HTMLSpanElement>;
  onAskiClick?: (
    feature: AskiPolygonFeature,
    pos: { x: number; y: number }
  ) => void;
}

/**
 * Visual orchestrator for the workspace canvas. Handles:
 * - 2D ↔ 3D crossfade (220ms)
 * - Zaman Çizelgesi compare-mode (split-pane synced 2D maps; placeholder in 3D)
 * - Satellite Compare slider overlay
 *
 * Only one WebGL map engine is mounted at a time. Keeping MapLibre alive
 * underneath Cesium can exhaust the browser's WebGL context budget on weaker
 * devices, so the 2D canvas is released before the 3D scene boots.
 */
export function MapShell({
  cursorReadoutRef,
  zoomReadoutRef,
  onAskiClick
}: MapShellProps) {
  const mapMode = useUIStore((s) => s.mapMode);
  const compareMode = useUIStore((s) => s.compareMode);
  const setCompareMode = useUIStore((s) => s.setCompareMode);

  const [renderMode, setRenderMode] = React.useState<"2d" | "3d" | null>(
    mapMode
  );

  React.useEffect(() => {
    if (renderMode === mapMode) return;
    setRenderMode(null);
    const timeoutId = window.setTimeout(() => {
      setRenderMode(mapMode);
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [mapMode, renderMode]);

  React.useEffect(() => {
    if (mapMode === "3d" && compareMode !== "off") {
      setCompareMode("off");
    }
  }, [compareMode, mapMode, setCompareMode]);

  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: renderMode === "2d" ? 1 : 0,
          pointerEvents: renderMode === "2d" ? "auto" : "none"
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ visibility: renderMode === "2d" ? "visible" : "hidden" }}
        aria-hidden={renderMode !== "2d"}
      >
        {renderMode === "2d" && (
          <>
            {compareMode === "timeMachine" ? (
              <CompareMapPair
                cursorReadoutRef={cursorReadoutRef}
                zoomReadoutRef={zoomReadoutRef}
              />
            ) : (
              <MapCanvas
                cursorReadoutRef={cursorReadoutRef}
                zoomReadoutRef={zoomReadoutRef}
                onAskiClick={onAskiClick}
                className="absolute inset-0"
              />
            )}
            {compareMode === "satellite" && <SatelliteCompareOverlay />}
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {renderMode === null && (
          <motion.div
            key="map-engine-switch"
            className="pointer-events-none absolute inset-0 z-[1] grid place-items-center bg-[#0B0F14]/92 text-white/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="rounded-full border border-white/15 bg-slate-950/72 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.9)] backdrop-blur-sm">
              Harita motoru değiştiriliyor…
            </div>
          </motion.div>
        )}
        {renderMode === "3d" && (
          <motion.div
            key="cesium"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <CesiumCanvasLazy />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
