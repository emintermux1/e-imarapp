"use client";

import { useEffect, useRef } from "react";

interface CesiumViewerProps {
  tilesetJson?: Record<string, unknown>;
  center?: [number, number, number];
}

/**
 * Lazy-loads Cesium in the browser. World terrain + Ion defaults require
 * `NEXT_PUBLIC_CESIUM_ION_TOKEN`; without it, uses ellipsoid terrain only.
 */
export function CesiumViewer({ tilesetJson, center }: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import("cesium").Viewer | null>(null);
  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!containerRef.current) return;
      const Cesium = await import("cesium");
      if (destroyed) return;

      const ionToken =
        typeof process !== "undefined" ? process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN : undefined;
      if (ionToken) {
        Cesium.Ion.defaultAccessToken = ionToken;
      }

      const terrainProvider = ionToken
        ? await Cesium.createWorldTerrainAsync()
        : new Cesium.EllipsoidTerrainProvider();

      const viewer = new Cesium.Viewer(containerRef.current!, {
        terrainProvider,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false
      });
      (viewer as unknown as Record<string, unknown>).imageryProvider = new Cesium.OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/"
      });

      const c = centerRef.current;
      if (c) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(c[0], c[1], c[2] || 500),
          orientation: { heading: 0, pitch: -0.785, roll: 0 }
        });
      }

      if (tilesetJson) {
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            URL.createObjectURL(new Blob([JSON.stringify(tilesetJson)], { type: "application/json" }))
          );
          viewer.scene.primitives.add(tileset);
        } catch {
          /* demo tileset load optional */
        }
      }

      viewerRef.current = viewer;
    }

    void init();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {
          /* ignore */
        }
        viewerRef.current = null;
      }
    };
  }, [tilesetJson]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !center) return;
    void import("cesium").then((Cesium) => {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], center[2] ?? 500),
        orientation: { heading: 0, pitch: -0.785, roll: 0 }
      });
    });
  }, [center]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border-subtle)]">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
