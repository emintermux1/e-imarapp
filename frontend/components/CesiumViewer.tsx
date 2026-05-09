"use client";

import { useEffect, useRef } from "react";

interface CesiumViewerProps {
  tilesetJson?: Record<string, unknown>;
  center?: [number, number, number];
}

export function CesiumViewer({ tilesetJson, center }: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!containerRef.current) return;
      const Cesium = await import("cesium");
      if (destroyed) return;

      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWVlNy05M2I2LTRkZDQtYjM2Yi0wYjA2M2Y4OTkyM2YiLCJpZCI6NTYwODUsImlhdCI6MTY5NDA1MjA2OH0.MmK0RXva9E8Z7aW3F9zTJu5XZqqQJdPQP1c9uVLBIXQ";

      const viewer = new Cesium.Viewer(containerRef.current!, {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
      });
      (viewer as unknown as Record<string, unknown>).imageryProvider = new Cesium.OpenStreetMapImageryProvider({ url: "https://a.tile.openstreetmap.org/" });

      if (center) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], center[2] || 500),
          orientation: { heading: 0, pitch: -45, roll: 0 },
        });
      }

      if (tilesetJson) {
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            URL.createObjectURL(
              new Blob([JSON.stringify(tilesetJson)], { type: "application/json" })
            )
          );
          viewer.scene.primitives.add(tileset);
        } catch {
          // ignore tileset errors in demo mode
        }
      }

      viewerRef.current = viewer;
    }

    init();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        try {
          (viewerRef.current as { destroy: () => void }).destroy();
        } catch { /* ignore */ }
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border-subtle)]">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
