"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import type { Map, MapMouseEvent } from "maplibre-gl";
import { Layers } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import {
  getParcelsCollection,
  getParcelById,
  getParcelByMapId
} from "@/data/parcels";
import { getStyleForBasemap, type BasemapId } from "@/lib/maplibre/styles";
import {
  PARCEL_SOURCE,
  ASKI_SOURCE,
  RISK_GRID_SOURCE,
  buildParcelFillLayer,
  buildParcelLineLayer,
  buildParcelLabelLayer,
  buildParcelSelectedAccentLayer,
  buildParcelHoverDotLayer,
  buildAskiFillLayer,
  buildAskiLineLayer,
  buildAskiHatchedLayer,
  buildRiskGridLayer
} from "@/lib/maplibre/layers";
import { getAskiCollection } from "@/data/aski-polygons";
import type { AskiPolygonFeature } from "@/data/aski-polygons";
import { getRiskGridCollection } from "@/data/risk-grid";
import { ZONING_PRESETS } from "@/data/zoning";
import { getSnapshotForYear } from "@/data/historical-snapshots";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { parseBackendParcelId } from "@/lib/api/parcel-normalizer";

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const INITIAL_ZOOM = 5.5;
const BACKEND_SELECTED_SOURCE = "backend-selected-parcel";

interface MapCanvasProps {
  className?: string;
  cursorReadoutRef?: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef?: React.RefObject<HTMLSpanElement>;
  /**
   * Callback fired when an askı polygon is clicked. Hosts can render a side
   * popover with details. Position is screen-space relative to the document.
   */
  onAskiClick?: (
    feature: AskiPolygonFeature,
    pos: { x: number; y: number }
  ) => void;
}

export function MapCanvas({
  className,
  cursorReadoutRef,
  zoomReadoutRef,
  onAskiClick
}: MapCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<Map | null>(null);
  const lastHoveredRef = React.useRef<string | number | null>(null);
  const lastSelectedMapIdRef = React.useRef<string | number | null>(null);
  const [initError, setInitError] = React.useState<string | null>(null);

  const basemap = useMapStore((s) => s.basemap);
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const selectedBackendFeature = useBackendParcelStore((s) => s.getFeature(selectedParcelId));
  const flyTarget = useMapStore((s) => s.flyTarget);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setHoveredParcelId = useMapStore((s) => s.setHoveredParcelId);
  const setCursorLngLat = useMapStore((s) => s.setCursorLngLat);
  const setViewState = useMapStore((s) => s.setViewState);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  const layerVisibility = useUIStore((s) => s.layerVisibility);
  const layerOpacity = useUIStore((s) => s.layerOpacity);
  const askiMode = useUIStore((s) => s.askiMode);
  const timelineYear = useUIStore((s) => s.timelineYear);

  const onAskiClickRef = React.useRef(onAskiClick);
  React.useEffect(() => {
    onAskiClickRef.current = onAskiClick;
  }, [onAskiClick]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: getStyleForBasemap(basemap),
        center: TURKEY_CENTER,
        zoom: INITIAL_ZOOM,
        attributionControl: false,
        cooperativeGestures: false,
        maxZoom: 19,
        minZoom: 3,
        hash: false,
        fadeDuration: 200
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Harita başlatılamadı.";
      setInitError(message);
      return;
    }
    mapRef.current = map;
    (window as Window & { __mlMap?: Map }).__mlMap = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const onControl = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      if (!detail) return;
      switch (detail.action) {
        case "in":
          map.zoomIn({ duration: 200 });
          break;
        case "out":
          map.zoomOut({ duration: 200 });
          break;
        case "north":
          map.rotateTo(0, { duration: 300 });
          break;
        case "reset":
          map.flyTo({
            center: TURKEY_CENTER,
            zoom: INITIAL_ZOOM,
            bearing: 0,
            pitch: 0,
            duration: 700
          });
          break;
      }
    };
    window.addEventListener("eimar:map:control", onControl);

    const ensureLayers = () => {
      if (!map.getSource(PARCEL_SOURCE)) {
        registerParcelLayers(map);
      }
      ensureAskiLayers(map);
      ensureRiskGridLayer(map);
      ensureBackendSelectedLayer(map);
      applyVisibilityAndOpacity(map);
    };
    if (map.isStyleLoaded()) {
      ensureLayers();
    } else {
      map.once("load", ensureLayers);
    }

    map.on("styledata", () => {
      if (!map.isStyleLoaded()) return;
      if (!map.getSource(PARCEL_SOURCE)) registerParcelLayers(map);
      ensureAskiLayers(map);
      ensureRiskGridLayer(map);
      ensureBackendSelectedLayer(map);
      if (lastSelectedMapIdRef.current != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastSelectedMapIdRef.current },
          { selected: true }
        );
      }
      applyVisibilityAndOpacity(map);
    });

    let rafId: number | null = null;
    let pendingLngLat: { lng: number; lat: number } | null = null;
    const onMouseMove = (e: MapMouseEvent) => {
      pendingLngLat = e.lngLat;
      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          if (pendingLngLat && cursorReadoutRef?.current) {
            cursorReadoutRef.current.textContent = `${pendingLngLat.lat.toFixed(5)}, ${pendingLngLat.lng.toFixed(5)}`;
          }
          rafId = null;
        });
      }
    };
    const onMouseLeave = () => {
      if (cursorReadoutRef?.current) {
        cursorReadoutRef.current.textContent = "—";
      }
    };
    map.on("mousemove", onMouseMove);
    map.on("mouseout", onMouseLeave);

    const onParcelMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.length) return;
      const id = e.features[0].id as string | number | undefined;
      if (id == null || id === lastHoveredRef.current) return;
      if (lastHoveredRef.current != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastHoveredRef.current },
          { hover: false }
        );
      }
      lastHoveredRef.current = id;
      map.setFeatureState({ source: PARCEL_SOURCE, id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
      const parcel = getParcelByMapId(id);
      if (parcel) setHoveredParcelId(parcel.properties.id);
    };
    const onParcelMouseLeave = () => {
      if (lastHoveredRef.current != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastHoveredRef.current },
          { hover: false }
        );
      }
      lastHoveredRef.current = null;
      map.getCanvas().style.cursor = "";
      setHoveredParcelId(null);
    };
    const onParcelClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const mapId = f.id as string | number;
      const parcel = getParcelByMapId(mapId);
      if (!parcel) return;
      setSelectedParcelId(parcel.properties.id);
      setRightPanelOpen(true);
      if (parcel.properties.centroid) {
        const [lng, lat] = parcel.properties.centroid;
        const padding = window.innerWidth >= 1280 ? { top: 40, bottom: 40, left: 320, right: 440 } : { top: 40, bottom: 40, left: 24, right: 24 };
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 16),
          duration: 600,
          padding
        });
      }
    };

    map.on("mousemove", "parcels-fill", onParcelMouseMove);
    map.on("mouseleave", "parcels-fill", onParcelMouseLeave);
    map.on("click", "parcels-fill", onParcelClick);

    // Askı polygon click — open side popover
    const onAskiInteract = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const props = f.properties as Record<string, unknown> & {
        id?: string;
        durum?: string;
        belediye?: string;
        baslangic?: string;
        bitis?: string;
        label?: string;
        matchedParcelId?: string;
        planAdi?: string;
      };
      onAskiClickRef.current?.(
        {
          id: String(props.id ?? ""),
          label: String(props.label ?? "Askı kaydı"),
          durum: (props.durum as AskiPolygonFeature["durum"]) ?? "askida",
          baslangic: String(props.baslangic ?? ""),
          bitis: String(props.bitis ?? ""),
          belediye: String(props.belediye ?? ""),
          ilSlug: String(
            (props as { ilSlug?: string }).ilSlug ?? ""
          ),
          ilceSlug: String(
            (props as { ilceSlug?: string }).ilceSlug ?? ""
          ),
          ring: [],
          matchedParcelId: props.matchedParcelId as string | undefined,
          planAdi: props.planAdi as string | undefined
        },
        { x: e.point.x, y: e.point.y }
      );
    };
    const onAskiHover = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onAskiLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", "askida-overlay-fill", onAskiInteract);
    map.on("mouseenter", "askida-overlay-fill", onAskiHover);
    map.on("mouseleave", "askida-overlay-fill", onAskiLeave);

    map.on("zoomend", () => {
      const z = map.getZoom();
      if (zoomReadoutRef?.current) {
        zoomReadoutRef.current.textContent = z.toFixed(2);
      }
      setViewState({
        zoom: +z.toFixed(2),
        bearing: +map.getBearing().toFixed(1),
        pitch: +map.getPitch().toFixed(1)
      });
    });
    map.on("rotateend", () => setViewState({ bearing: +map.getBearing().toFixed(1) }));
    map.on("pitchend", () => setViewState({ pitch: +map.getPitch().toFixed(1) }));
    map.on("moveend", () => {
      const c = map.getCenter();
      setCursorLngLat([c.lng, c.lat]);
    });

    return () => {
      window.removeEventListener("eimar:map:control", onControl);
      map.remove();
      mapRef.current = null;
      (window as Window & { __mlMap?: Map }).__mlMap = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getStyleForBasemap(basemap));
  }, [basemap]);

  // Selection sync
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getSource(PARCEL_SOURCE)) return;
      const newMapId = selectedParcelId
        ? getParcelById(selectedParcelId)?.properties.mapId ?? null
        : null;
      if (
        lastSelectedMapIdRef.current != null &&
        lastSelectedMapIdRef.current !== newMapId
      ) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastSelectedMapIdRef.current },
          { selected: false }
        );
      }
      lastSelectedMapIdRef.current = newMapId;
      if (newMapId != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: newMapId },
          { selected: true }
        );
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [selectedParcelId]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensureBackendSelectedLayer(map);
      const source = map.getSource(BACKEND_SELECTED_SOURCE) as maplibregl.GeoJSONSource | undefined;
      const feature =
        selectedParcelId && parseBackendParcelId(selectedParcelId) != null
          ? selectedBackendFeature
          : null;
      source?.setData({
        type: "FeatureCollection",
        features: feature?.geometry.coordinates.length ? [feature as unknown as GeoJSON.Feature] : []
      });
      if (feature?.geometry.coordinates.length) {
        const bounds = geometryBounds(feature.geometry);
        const padding = window.innerWidth >= 1280 ? { top: 72, bottom: 72, left: 320, right: 440 } : { top: 56, bottom: 56, left: 24, right: 24 };
        if (bounds) {
          map.fitBounds(bounds, { padding, duration: 700, maxZoom: 17 });
        } else if (feature.properties.centroid) {
          map.flyTo({ center: feature.properties.centroid, zoom: Math.max(map.getZoom(), 16), padding, duration: 700 });
        }
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [selectedBackendFeature, selectedParcelId]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    const padding = window.innerWidth >= 1280 ? { top: 40, bottom: 40, left: 320, right: 440 } : { top: 40, bottom: 40, left: 24, right: 24 };
    map.flyTo({
      center: flyTarget.center,
      zoom: flyTarget.zoom ?? Math.max(map.getZoom(), 14),
      bearing: flyTarget.bearing,
      pitch: flyTarget.pitch,
      padding,
      duration: 700,
      essential: true
    });
  }, [flyTarget]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => applyVisibilityAndOpacity(map);
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerVisibility, layerOpacity, askiMode]);

  // Timeline year → re-color parcel fill expression by historical snapshot
  // We don't replace the source; instead we toggle a `historicalColor`
  // expression by rebuilding fill-color paint property.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.isStyleLoaded() || !map.getLayer("parcels-fill")) return;
      if (timelineYear == null) {
        try {
          map.setPaintProperty(
            "parcels-fill",
            "fill-color",
            buildParcelFillLayer().paint!["fill-color"] as never
          );
        } catch {
          /* swallow */
        }
        return;
      }
      // Build a per-feature historical zoning lookup. We can't use feature
      // expressions to read a JS map at paint time, so we build a `match`
      // expression keyed on parcel id.
      const fc = getParcelsCollection();
      const matchExpr: (string | string[] | number)[] = [
        "match",
        ["get", "id"]
      ];
      for (const f of fc.features) {
        const parcelId = f.properties.id;
        const snap = getSnapshotForYear(parcelId, timelineYear);
        const zoning = snap?.zoningType ?? f.properties.zoningType;
        const fill =
          ZONING_PRESETS[zoning as keyof typeof ZONING_PRESETS]?.fill ??
          ZONING_PRESETS.Konut.fill;
        matchExpr.push(parcelId, fill);
      }
      matchExpr.push("#FFE9A8");
      try {
        map.setPaintProperty(
          "parcels-fill",
          "fill-color",
          matchExpr as unknown as never
        );
      } catch {
        /* swallow */
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [timelineYear]);

  function applyVisibilityAndOpacity(map: Map) {
    Object.entries(layerVisibility).forEach(([id, vis]) => {
      // The askida-overlay descriptor maps to two MapLibre layers
      if (id === "askida-overlay") {
        const reallyVisible = askiMode || vis;
        ["askida-overlay-fill", "askida-overlay-line", "askida-overlay-hatched"].forEach(
          (layerId) => {
            if (!map.getLayer(layerId)) return;
            map.setLayoutProperty(
              layerId,
              "visibility",
              reallyVisible ? "visible" : "none"
            );
          }
        );
        return;
      }
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, "visibility", vis ? "visible" : "none");
    });

    const fillOpacity = layerOpacity["parcels-fill"];
    if (fillOpacity != null && map.getLayer("parcels-fill")) {
      try {
        map.setPaintProperty("parcels-fill", "fill-opacity", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          Math.min(1, fillOpacity + 0.3),
          ["boolean", ["feature-state", "hover"], false],
          Math.min(1, fillOpacity + 0.18),
          fillOpacity
        ] as never);
      } catch {
        /* swallow */
      }
    }
    setOpacityIfExists(map, "parcels-line", "line-opacity", layerOpacity["parcels-line"]);
    setOpacityIfExists(map, "parcels-label", "text-opacity", layerOpacity["parcels-label"]);
    setOpacityIfExists(
      map,
      "deprem-risk-grid",
      "circle-opacity",
      layerOpacity["deprem-risk-grid"] != null
        ? Math.min(0.5, layerOpacity["deprem-risk-grid"] * 0.5)
        : undefined
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
      aria-label="GIS Harita"
      role="application"
    >
      {initError && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none p-6 z-[1]">
          <div className="pointer-events-auto max-w-md w-full bg-surface-2 border border-border-strong rounded-md shadow-card p-5 text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-surface-1 border border-border-subtle text-fg-secondary mx-auto">
              <Layers className="h-4 w-4" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-fg-primary">
              Harita motoru başlatılamadı
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-fg-secondary">
              Tarayıcınızda WebGL desteği bulunmadığından MapLibre GL motoru
              çalıştırılamadı. Lütfen tarayıcı ayarlarınızı doğrulayın veya
              donanım hızlandırmayı etkinleştirin.
            </p>
            <p className="mt-2 text-[11px] text-fg-muted tabular-nums">
              {initError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function registerParcelLayers(map: Map) {
  if (!map.getSource(PARCEL_SOURCE)) {
    const fc = getParcelsCollection() as unknown as GeoJSON.FeatureCollection;
    map.addSource(PARCEL_SOURCE, {
      type: "geojson",
      data: fc,
      tolerance: 0,
      buffer: 256,
      maxzoom: 20,
      generateId: false
    });
  }
  if (!map.getLayer("parcels-fill")) {
    map.addLayer(buildParcelFillLayer("parcels-fill"));
  }
  if (!map.getLayer("parcels-line")) {
    map.addLayer(buildParcelLineLayer("parcels-line"));
  }
  if (!map.getLayer("parcels-selected-accent")) {
    map.addLayer(buildParcelSelectedAccentLayer("parcels-selected-accent"));
  }
  if (!map.getLayer("parcels-hover-dot")) {
    map.addLayer(buildParcelHoverDotLayer("parcels-hover-dot"));
  }
  if (!map.getLayer("parcels-label")) {
    map.addLayer(buildParcelLabelLayer("parcels-label"));
  }
}

function ensureAskiLayers(map: Map) {
  if (!map.getSource(ASKI_SOURCE)) {
    map.addSource(ASKI_SOURCE, {
      type: "geojson",
      data: getAskiCollection() as never
    });
  }
  // Add layers below the parcel-label so labels stay on top
  const beforeId = map.getLayer("parcels-label") ? "parcels-label" : undefined;
  if (!map.getLayer("askida-overlay-fill")) {
    map.addLayer(buildAskiFillLayer(), beforeId);
  }
  if (!map.getLayer("askida-overlay-line")) {
    map.addLayer(buildAskiLineLayer(), beforeId);
  }
  if (!map.getLayer("askida-overlay-hatched")) {
    map.addLayer(buildAskiHatchedLayer(), beforeId);
  }
}

function ensureRiskGridLayer(map: Map) {
  if (!map.getSource(RISK_GRID_SOURCE)) {
    map.addSource(RISK_GRID_SOURCE, {
      type: "geojson",
      data: getRiskGridCollection() as never
    });
  }
  const beforeId = map.getLayer("parcels-fill") ? "parcels-fill" : undefined;
  if (!map.getLayer("deprem-risk-grid")) {
    map.addLayer(buildRiskGridLayer(), beforeId);
  }
}

function ensureBackendSelectedLayer(map: Map) {
  if (!map.getSource(BACKEND_SELECTED_SOURCE)) {
    map.addSource(BACKEND_SELECTED_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  const beforeId = map.getLayer("parcels-label") ? "parcels-label" : undefined;
  if (!map.getLayer("backend-selected-fill")) {
    map.addLayer(
      {
        id: "backend-selected-fill",
        type: "fill",
        source: BACKEND_SELECTED_SOURCE,
        paint: {
          "fill-color": "#0EA5E9",
          "fill-opacity": 0.34
        }
      },
      beforeId
    );
  }
  if (!map.getLayer("backend-selected-outline")) {
    map.addLayer(
      {
        id: "backend-selected-outline",
        type: "line",
        source: BACKEND_SELECTED_SOURCE,
        paint: {
          "line-color": "#38BDF8",
          "line-width": 3,
          "line-opacity": 1
        }
      },
      beforeId
    );
  }
}

function geometryBounds(geometry: GeoJSON.Geometry): maplibregl.LngLatBoundsLike | null {
  const coords: Array<[number, number]> = [];
  function collect(input: unknown): void {
    if (!Array.isArray(input)) return;
    if (input.length >= 2 && typeof input[0] === "number" && typeof input[1] === "number") {
      coords.push([input[0], input[1]]);
      return;
    }
    input.forEach(collect);
  }
  collect((geometry as { coordinates?: unknown }).coordinates);
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  coords.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  return [[minLng, minLat], [maxLng, maxLat]];
}

function setOpacityIfExists(
  map: Map,
  layerId: string,
  prop: string,
  value: number | undefined
) {
  if (value == null) return;
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty(layerId, prop as never, value as never);
  } catch {
    /* swallow */
  }
}

export function setMapBasemap(_id: BasemapId) {
  /* placeholder kept for symmetry — the map listens to the store */
}
