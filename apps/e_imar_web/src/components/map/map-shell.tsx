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
 * The 2D MapLibre canvas always exists once mounted (so React keeps its DOM
 * & MapLibre instance alive); we toggle pointer/visibility instead of
 * unmounting. The 3D Cesium canvas is lazy-loaded the first time the user
 * switches into 3D and remains in the tree thereafter (still tucked behind
 * the active pane when in 2D).
 */
export function MapShell({
  cursorReadoutRef,
  zoomReadoutRef,
  onAskiClick
}: MapShellProps) {
  const mapMode = useUIStore((s) => s.mapMode);
  const compareMode = useUIStore((s) => s.compareMode);

  const [hasMounted3D, setHasMounted3D] = React.useState(false);
  React.useEffect(() => {
    if (mapMode === "3d") setHasMounted3D(true);
  }, [mapMode]);

  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: mapMode === "2d" ? 1 : 0,
          pointerEvents: mapMode === "2d" ? "auto" : "none"
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ visibility: mapMode === "2d" ? "visible" : "hidden" }}
        aria-hidden={mapMode !== "2d"}
      >
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
      </motion.div>

      <AnimatePresence>
        {mapMode === "3d" && hasMounted3D && (
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
