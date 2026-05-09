"use client";

import * as React from "react";
import { initCesium } from "./cesium-init";
import type { Viewer as ViewerT } from "cesium";

type Status = "idle" | "loading" | "ready" | "error";

interface ViewerOptions {
  /** Pull from cesium ion = false. We use only OSM imagery + ellipsoid terrain */
  imageryUrl?: string;
  /** Hide all default widgets except the canvas */
  minimal?: boolean;
  /** Optional initial camera (defaults to Türkiye) */
  initialCamera?: {
    /** [lng, lat, height(m)] */
    position: [number, number, number];
    /** [heading, pitch, roll] in degrees */
    orientation?: [number, number, number];
  };
}

const DEFAULT_OSM =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

interface CesiumViewerHandle {
  status: Status;
  error: string | null;
  /** Cesium namespace, lazily loaded */
  Cesium: typeof import("cesium") | null;
  /** Cesium Viewer instance (mounted to ref) */
  viewer: ViewerT | null;
}

/**
 * Mounts a Cesium Viewer onto `containerRef` and returns its handle. Cleans
 * up on unmount.
 *
 * The hook is intentionally pure: it does not draw parcels, manage selection,
 * or wire HUD events. Callers compose those concerns externally so the same
 * hook works for the main viewer, the mini preview viewer, and any future
 * comparison viewers.
 */
export function useCesiumViewer(
  containerRef: React.RefObject<HTMLDivElement>,
  options: ViewerOptions = {}
): CesiumViewerHandle {
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [Cesium, setCesium] = React.useState<typeof import("cesium") | null>(
    null
  );
  const viewerRef = React.useRef<ViewerT | null>(null);

  const minimal = options.minimal ?? true;
  const imagery = options.imageryUrl ?? DEFAULT_OSM;
  const cameraConfigRef = React.useRef(options.initialCamera);
  React.useEffect(() => {
    cameraConfigRef.current = options.initialCamera;
  }, [options.initialCamera]);

  React.useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    initCesium()
      .then((CesiumMod) => {
        if (cancelled || !containerRef.current) return;
        setCesium(CesiumMod);

        // Create a viewer with conservative options. We disable timeline /
        // animation / infoBox / geocoder so we can drive scene state from
        // the React side.
        const imageryProvider = new CesiumMod.UrlTemplateImageryProvider({
          url: imagery,
          credit:
            "© OpenStreetMap contributors · Tiles courtesy of OSM",
          maximumLevel: 19,
          subdomains: ["a", "b", "c"]
        });
        const baseLayer = new CesiumMod.ImageryLayer(imageryProvider);

        const viewer = new CesiumMod.Viewer(containerRef.current, {
          baseLayer,
          terrainProvider: new CesiumMod.EllipsoidTerrainProvider(),
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          navigationHelpButton: false,
          timeline: !minimal,
          animation: !minimal,
          shouldAnimate: false,
          // Prevent Cesium from spawning its own credit container which the
          // CSS hides anyway; using a `div` keeps DOM tidy.
          creditContainer: makeCreditContainer()
        });

        // Strip remaining widget chrome we don't want
        try {
          viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
          viewer.scene.globe.depthTestAgainstTerrain = true;
          if (viewer.scene.skyAtmosphere) {
            viewer.scene.skyAtmosphere.show = true;
          }
          viewer.scene.fog.enabled = true;
        } catch {
          /* swallow */
        }

        // Initial camera
        const cam = cameraConfigRef.current;
        if (cam) {
          const [lng, lat, h] = cam.position;
          const orientation = cam.orientation
            ? {
                heading: CesiumMod.Math.toRadians(cam.orientation[0]),
                pitch: CesiumMod.Math.toRadians(cam.orientation[1]),
                roll: CesiumMod.Math.toRadians(cam.orientation[2])
              }
            : undefined;
          viewer.camera.setView({
            destination: CesiumMod.Cartesian3.fromDegrees(lng, lat, h),
            orientation
          });
        } else {
          // Türkiye genel görünümü
          viewer.camera.setView({
            destination: CesiumMod.Cartesian3.fromDegrees(35, 38.5, 1_500_000),
            orientation: {
              heading: 0,
              pitch: CesiumMod.Math.toRadians(-65),
              roll: 0
            }
          });
        }

        viewerRef.current = viewer;
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[cesium] init failed", err);
        setError(
          err instanceof Error ? err.message : "Cesium başlatılamadı."
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
      const v = viewerRef.current;
      if (v && !v.isDestroyed()) {
        try {
          v.destroy();
        } catch {
          /* ignore */
        }
      }
      viewerRef.current = null;
    };
    // intentionally only run once per container
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagery, minimal]);

  return {
    status,
    error,
    Cesium,
    viewer: viewerRef.current
  };
}

function makeCreditContainer(): HTMLDivElement {
  const div =
    typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.style.display = "none";
  }
  return div as HTMLDivElement;
}
