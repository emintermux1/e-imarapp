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
import { resolveParcelFeature } from "@/lib/parcel-resolver";
import { getSnapshotForYear } from "@/data/historical-snapshots";
import { TURKEY_CENTER } from "@/lib/geo/turkey";
import { findNearestParcel } from "@/lib/analysis/selected-place-analysis";

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
  const flyTarget = useMapStore((s) => s.flyTarget);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);
  const setHoveredParcelId = useMapStore((s) => s.setHoveredParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const timelineYear = useUIStore((s) => s.timelineYear);
  const shadowEnabled = useUIStore((s) => s.shadowEnabled);
  const sunHour = useUIStore((s) => s.sunHour);
  const sunMonth = useUIStore((s) => s.sunMonth);
  const emsalWireframe = useUIStore((s) => s.emsalWireframe);
  const viewCorridor = useUIStore((s) => s.viewCorridor);
  const setMapMode = useUIStore((s) => s.setMapMode);

  // Render parcels whenever viewer/year/selection/wireframe change
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    const fc = getParcelsCollection();
    const visibleFeatures = selectedParcelId
      ? fc.features.filter((feature) => {
          const [lng, lat] = feature.properties.centroid ?? [0, 0];
          const selected = resolveParcelFeature(selectedParcelId);
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
    const selectedLive = selectedParcelId
      ? resolveParcelFeature(selectedParcelId)
      : null;
    if (selectedLive && selectedParcelId && !getParcelById(selectedParcelId)) {
      upsertParcelEntities(Cesium, viewer, selectedLive, handles, {
        selected: true,
        snapshot: timelineYear
          ? getSnapshotForYear(selectedLive.properties.id, timelineYear)
          : null,
        emsalWireframe: emsalWireframe,
      });
    }
  }, [viewer, Cesium, selectedParcelId, timelineYear, emsalWireframe]);

  // Camera flyTo on selection
  React.useEffect(() => {
    if (!viewer || !Cesium || !selectedParcelId) return;
    const f = resolveParcelFeature(selectedParcelId);
    if (!f?.geometry?.coordinates?.[0]?.length) return;
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

  // Search/focus flow parity with 2D map: react to generic fly targets in 3D.
  React.useEffect(() => {
    if (!viewer || !Cesium || !flyTarget) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyTarget.center[0],
        flyTarget.center[1],
        flyTarget.zoom && flyTarget.zoom >= 15 ? 1300 : 4800
      ),
      duration: 0.95,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-52),
        roll: 0
      }
    });
  }, [viewer, Cesium, flyTarget]);

  // Sun / shadow analysis
  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    viewer.shadows = shadowEnabled;
    viewer.scene.globe.enableLighting = shadowEnabled;
    if (shadowEnabled) {
      const center = selectedParcelId
        ? resolveParcelFeature(selectedParcelId)?.properties.centroid
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
      const p = resolveParcelFeature(selectedParcelId);
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

  React.useEffect(() => {
    if (!viewer || !Cesium) return;
    const onControl = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string }>).detail;
      switch (detail?.action) {
        case "in":
          viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.45);
          break;
        case "out":
          viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.75);
          break;
        case "north":
          viewer.camera.setView({
            orientation: {
              heading: 0,
              pitch: viewer.camera.pitch,
              roll: 0
            }
          });
          break;
        case "reset":
          setSelectedParcelId(null);
          setSelectedPoint(null);
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(TURKEY_CENTER[0], TURKEY_CENTER[1] - 0.3, 1_350_000),
            duration: 0.8,
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-65),
              roll: 0
            }
          });
          break;
        case "locate":
          if (!navigator.geolocation) {
            window.dispatchEvent(new CustomEvent("eimar:map:location-status", { detail: { message: "Konum izni bu tarayıcıda yok." } }));
            break;
          }
          window.dispatchEvent(new CustomEvent("eimar:map:location-status", { detail: { message: "3D konum aranıyor…" } }));
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lng = position.coords.longitude;
              const lat = position.coords.latitude;
              const nearest = findNearestParcel(lng, lat, 2500);
              setSelectedPoint({
                lng,
                lat,
                source: "system",
                nearestParcelId: nearest?.parcel.id
              });
              setRightPanelOpen(true);
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lng, lat, 1800),
                duration: 0.8,
                orientation: {
                  heading: 0,
                  pitch: Cesium.Math.toRadians(-55),
                  roll: 0
                }
              });
              window.dispatchEvent(new CustomEvent("eimar:map:location-status", { detail: { message: "Konum 3D sahneye taşındı." } }));
            },
            () => {
              window.dispatchEvent(new CustomEvent("eimar:map:location-status", { detail: { message: "Konum izni alınamadı." } }));
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          );
          break;
      }
    };
    window.addEventListener("eimar:map:control", onControl);
    return () => window.removeEventListener("eimar:map:control", onControl);
  }, [Cesium, setRightPanelOpen, setSelectedParcelId, setSelectedPoint, viewer]);

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
        const parcel = resolveParcelFeature(id);
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
        setSelectedPoint(null);
        setSelectedParcelId(id);
        setRightPanelOpen(true);
        return;
      }
      const cartesian = viewer.camera.pickEllipsoid(
        m.position,
        viewer.scene.globe.ellipsoid
      );
      if (!cartesian) return;
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lng = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const nearest = findNearestParcel(lng, lat, 2500);
      setSelectedPoint({
        lng,
        lat,
        source: "map",
        nearestParcelId: nearest?.parcel.id
      });
      setRightPanelOpen(true);
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
  }, [viewer, Cesium, setHoveredParcelId, setSelectedParcelId, setSelectedPoint, setRightPanelOpen]);

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
      {status === "ready" && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[2] hidden -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/72 px-3 py-1.5 text-[11px] font-semibold text-white/82 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.9)] backdrop-blur-sm md:block">
          3D açık · Parsel seç, gölge/emsal analizini sağ panelden yönet
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-[1] grid place-items-center p-4">
          <div className="max-w-md w-full rounded-[1.5rem] border border-status-error/35 bg-surface-2/96 p-5 text-center shadow-card">
            <h2 className="text-base font-black text-status-error">
              3D modu başlatılamadı
            </h2>
            <p className="mt-1 text-[12px] text-fg-secondary">
              {error ?? "WebGL desteğini doğrulayın."}
            </p>
            <button
              type="button"
              onClick={() => setMapMode("2d")}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-border-subtle bg-surface-1 px-4 text-xs font-bold text-fg-primary hover:bg-surface-3"
            >
              2D haritaya dön
            </button>
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
