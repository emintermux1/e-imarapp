"use client";

import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import { useCesiumViewer } from "@/lib/cesium/use-cesium-viewer";
import {
  upsertParcelEntities,
  ringBounds,
  type ParcelEntityHandles
} from "@/lib/cesium/build-extrusion";
import { getParcelById } from "@/data/parcels";

interface MiniProps {
  parcel: ParcelProps;
  /** Show the emsal envelope wireframe overlay. */
  emsalWireframe?: boolean;
  className?: string;
}

/**
 * A small (e.g. 320×220) Cesium scene rendered inside the right info panel.
 * Reuses the same parcel extrusion helpers but only renders the *selected*
 * parcel and immediate context for performance.
 */
export function CesiumMiniCanvas({
  parcel,
  emsalWireframe = true,
  className
}: MiniProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const handlesRef = React.useRef<Map<string, ParcelEntityHandles>>(new Map());
  const { Cesium, viewer, status } = useCesiumViewer(containerRef, {
    minimal: true,
    initialCamera: parcel.centroid
      ? {
          position: [parcel.centroid[0], parcel.centroid[1] - 0.0008, 220],
          orientation: [25, -45, 0]
        }
      : undefined
  });

  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    // Disable interaction (we want a tiny preview, not a full 3D playground)
    try {
      const c = viewer.scene.screenSpaceCameraController;
      c.enableTranslate = false;
      c.enableZoom = true;
      c.enableTilt = false;
      c.enableLook = false;
      c.enableRotate = true;
    } catch {
      /* ignore */
    }
    const f = getParcelById(parcel.id);
    if (!f) return;
    upsertParcelEntities(Cesium, viewer, f, handlesRef.current, {
      selected: true,
      emsalWireframe
    });
    const ring = f.geometry.coordinates[0];
    const b = ringBounds(ring);
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(
        b.west - 0.0006,
        b.south - 0.0006,
        b.east + 0.0006,
        b.north + 0.0006
      ),
      duration: 0.6,
      orientation: {
        heading: Cesium.Math.toRadians(20),
        pitch: Cesium.Math.toRadians(-50),
        roll: 0
      }
    });
  }, [viewer, Cesium, parcel.id, emsalWireframe]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "rgb(11 15 20)",
        overflow: "hidden",
        borderRadius: 4
      }}
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-[1] grid place-items-center text-[10px] uppercase tracking-wider text-fg-muted">
          3D yükleniyor…
        </div>
      )}
    </div>
  );
}
