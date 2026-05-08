"use client";

import * as React from "react";
import type { Viewer as ViewerT, Entity as EntityT } from "cesium";
import { useCesiumViewer } from "@/lib/cesium/use-cesium-viewer";
import {
  upsertParcelEntities,
  buildViewCorridor,
  buildJulianDateForLocalSun,
  ringBounds,
  type ParcelEntityHandles
} from "@/lib/cesium/build-extrusion";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import {
  getParcelsCollection,
  getParcelById
} from "@/data/parcels";
import { getSnapshotForYear } from "@/data/historical-snapshots";
import { TURKEY_CENTER } from "@/lib/geo/turkey";

interface CesiumCanvasProps {
  className?: string;
}

/**
 * Main 3D viewer for the workspace. Subscribes to:
 * - selected parcel (camera flyTo + accent)
 * - timeline year (rebuild extrusion materials)
 * - shadow toggle / hour / month
 * - emsal wireframe toggle
 * - view corridor toggle
 *
 * The viewer is created once. Subsequent state updates only mutate entities.
 */
export function CesiumCanvas({ className }: CesiumCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const handlesRef = React.useRef<Map<string, ParcelEntityHandles>>(new Map());
  const corridorRef = React.useRef<EntityT | null>(null);

  const { status, error, Cesium, viewer } = useCesiumViewer(containerRef, {
    minimal: true,
    initialCamera: {
      position: [TURKEY_CENTER[0], TURKEY_CENTER[1] - 0.3, 1_350_000],
      orientation: [0, -65, 0]
    }
  });

  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setHoveredParcelId = useMapStore((s) => s.setHoveredParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const timelineYear = useUIStore((s) => s.timelineYear);
  const shadowEnabled = useUIStore((s) => s.shadowEnabled);
  const sunHour = useUIStore((s) => s.sunHour);
  const sunMonth = useUIStore((s) => s.sunMonth);
  const emsalWireframe = useUIStore((s) => s.emsalWireframe);
  const viewCorridor = useUIStore((s) => s.viewCorridor);

  // Render parcels whenever viewer/year/selection/wireframe change
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    const fc = getParcelsCollection();
    const visibleFeatures = selectedParcelId
      ? fc.features.filter((feature) => {
          const [lng, lat] = feature.properties.centroid ?? [0, 0];
          const selected = getParcelById(selectedParcelId);
          const [slng, slat] = selected?.properties.centroid ?? [lng, lat];
          return Math.abs(lng - slng) < 0.018 && Math.abs(lat - slat) < 0.014;
        })
      : fc.features.slice(0, 700);
    const handles = handlesRef.current;
    const seen = new Set<string>();
    for (const feature of visibleFeatures) {
      const props = feature.properties;
      seen.add(props.id);
      const snapshot = timelineYear
        ? getSnapshotForYear(props.id, timelineYear)
        : null;
      upsertParcelEntities(Cesium, viewer, feature, handles, {
        selected: props.id === selectedParcelId,
        snapshot,
        emsalWireframe: props.id === selectedParcelId && emsalWireframe
      });
    }
    // Remove stale handles (none should occur in mock data, but safe)
    for (const [id, h] of handles) {
      if (!seen.has(id)) {
        viewer.entities.remove(h.baseEntity);
        viewer.entities.remove(h.buildingEntity);
        if (h.emsalEntity) viewer.entities.remove(h.emsalEntity);
        handles.delete(id);
      }
    }
  }, [viewer, Cesium, selectedParcelId, timelineYear, emsalWireframe]);

  // Camera flyTo on selection
  React.useEffect(() => {
    if (!viewer || !Cesium || !selectedParcelId) return;
    const f = getParcelById(selectedParcelId);
    if (!f) return;
    const ring = f.geometry.coordinates[0];
    const b = ringBounds(ring);
    const rectangle = Cesium.Rectangle.fromDegrees(
      b.west - 0.001,
      b.south - 0.001,
      b.east + 0.001,
      b.north + 0.001
    );
    viewer.camera.flyTo({
      destination: rectangle,
      duration: 1.2,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    });
  }, [viewer, Cesium, selectedParcelId]);

  // Sun / shadow analysis
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    viewer.shadows = shadowEnabled;
    viewer.scene.globe.enableLighting = shadowEnabled;
    if (shadowEnabled) {
      const center = selectedParcelId
        ? getParcelById(selectedParcelId)?.properties.centroid
        : null;
      const lng = center?.[0] ?? 35;
      const julian = buildJulianDateForLocalSun(
        Cesium,
        lng,
        sunMonth,
        sunHour,
        2026
      );
      viewer.clock.currentTime = julian;
      viewer.clock.shouldAnimate = false;
    }
  }, [viewer, Cesium, shadowEnabled, sunHour, sunMonth, selectedParcelId]);

  // View corridor
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    if (corridorRef.current) {
      viewer.entities.remove(corridorRef.current);
      corridorRef.current = null;
    }
    if (viewCorridor && selectedParcelId) {
      const p = getParcelById(selectedParcelId);
      if (p?.properties.centroid) {
        corridorRef.current = buildViewCorridor(
          Cesium,
          viewer,
          p.properties.centroid,
          35,
          280,
          50,
          80
        );
      }
    }
  }, [viewer, Cesium, viewCorridor, selectedParcelId]);

  // Mouse hover + click handlers
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    const handler = new Cesium.ScreenSpaceEventHandler(
      viewer.scene.canvas as HTMLCanvasElement
    );
    let activeLabel: EntityT | null = null;

    handler.setInputAction((m: { endPosition: import("cesium").Cartesian2 }) => {
      const picked = viewer.scene.pick(m.endPosition);
      const entity = picked && (picked.id as EntityT | undefined);
      if (entity && entity.properties && entity.properties.parcelId) {
        const id = entity.properties.parcelId.getValue() as string;
        const parcel = getParcelById(id);
        if (parcel) {
          setHoveredParcelId(id);
          if (!activeLabel || activeLabel.id !== `${id}::label`) {
            if (activeLabel) viewer.entities.remove(activeLabel);
            const c = parcel.properties.centroid ?? [0, 0];
            activeLabel = viewer.entities.add({
              id: `${id}::label`,
              position: Cesium.Cartesian3.fromDegrees(c[0], c[1], 80),
              label: {
                text: `${parcel.properties.ada}/${parcel.properties.parsel} · ${parcel.properties.detailedUse?.includes("TİCK") ? "TİCK" : parcel.properties.detailedUse?.includes("MİA") ? "MİA" : parcel.properties.zoningType}`,
                font: "12px Inter, sans-serif",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString(
                  "#102A4C"
                ).withAlpha(0.85),
                backgroundPadding: new Cesium.Cartesian2(7, 4),
                pixelOffset: new Cesium.Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.NONE
              }
            });
          }
        }
        viewer.scene.canvas.style.cursor = "pointer";
      } else {
        if (activeLabel) {
          viewer.entities.remove(activeLabel);
          activeLabel = null;
        }
        viewer.scene.canvas.style.cursor = "";
        setHoveredParcelId(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((m: { position: import("cesium").Cartesian2 }) => {
      const picked = viewer.scene.pick(m.position);
      const entity = picked && (picked.id as EntityT | undefined);
      if (entity && entity.properties && entity.properties.parcelId) {
        const id = entity.properties.parcelId.getValue() as string;
        setSelectedParcelId(id);
        setRightPanelOpen(true);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (activeLabel) {
        try {
          viewer.entities.remove(activeLabel);
        } catch {
          /* ignore */
        }
      }
    };
  }, [viewer, Cesium, setHoveredParcelId, setSelectedParcelId, setRightPanelOpen]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", background: "rgb(11 15 20)" }}
      role="application"
      aria-label="3D GIS sahne"
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-[1] grid place-items-center pointer-events-none">
          <CesiumLoader />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-[1] grid place-items-center p-4">
          <div className="max-w-md w-full bg-surface-2 border border-status-error rounded-md shadow-card p-4 text-center">
            <h2 className="text-sm font-semibold text-status-error">
              3D modu başlatılamadı
            </h2>
            <p className="mt-1 text-[12px] text-fg-secondary">
              {error ?? "WebGL desteğini doğrulayın."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CesiumLoader() {
  return (
    <div className="flex flex-col items-center gap-2 text-fg-muted">
      <div className="h-1 w-48 overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full bg-brand-blue/80"
          style={{
            width: "40%",
            animation: "cesium-loader 1.4s ease-in-out infinite"
          }}
        />
      </div>
      <span className="text-[11px] uppercase tracking-wider">
        3D motoru yükleniyor…
      </span>
      <style>{`@keyframes cesium-loader {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(260%); }
      }`}</style>
    </div>
  );
}
