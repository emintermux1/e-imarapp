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
import { useActiveAskiGeoJSON } from "@/lib/api/hooks";
import { getStyleForBasemap, type BasemapId } from "@/lib/maplibre/styles";
import {
  PARCEL_SOURCE,
  MUNICIPALITY_SOURCE,
  MUNICIPALITY_COVERAGE_SOURCE,
  buildParcelFillLayer,
  buildParcelLineLayer,
  buildParcelLabelLayer,
  buildParcelSelectedAccentLayer,
  buildParcelHoverDotLayer,
  buildMunicipalityBoundaryLayer,
  buildMunicipalityCoverageCircleLayer,
  buildMunicipalityCoverageLabelLayer
} from "@/lib/maplibre/layers";
import { fetchMunicipalityCoverage } from "@/lib/api/eimar";
import { BELEDIYE_LIST } from "@/data/belediye";
import { PROVINCES } from "@/data/provinces";

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const INITIAL_ZOOM = 5.5;

interface MapCanvasProps {
  className?: string;
  cursorReadoutRef?: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef?: React.RefObject<HTMLSpanElement>;
  onAskiClick?: (
    feature: import("@/data/aski-polygons").AskiPolygonFeature,
    pos: { x: number; y: number }
  ) => void;
}

export function MapCanvas({
  className,
  cursorReadoutRef,
  zoomReadoutRef
}: MapCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<Map | null>(null);
  const lastHoveredRef = React.useRef<string | number | null>(null);
  const lastSelectedMapIdRef = React.useRef<string | number | null>(null);
  const [initError, setInitError] = React.useState<string | null>(null);

  const basemap = useMapStore((s) => s.basemap);
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const flyTarget = useMapStore((s) => s.flyTarget);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setHoveredParcelId = useMapStore((s) => s.setHoveredParcelId);
  const setCursorLngLat = useMapStore((s) => s.setCursorLngLat);
  const setViewState = useMapStore((s) => s.setViewState);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  const layerVisibility = useUIStore((s) => s.layerVisibility);
  const layerOpacity = useUIStore((s) => s.layerOpacity);
  const askiGeoJsonQuery = useActiveAskiGeoJSON();
  const [municipalityGeoJson, setMunicipalityGeoJson] = React.useState<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchMunicipalityCoverage()
      .then((result) => {
        if (!mounted) return;
        const municipalities = result.ok ? result.data.municipalities : buildFallbackMunicipalityPoints();
        setMunicipalityGeoJson(buildMunicipalityCoverageCollection(municipalities));
      })
      .catch(() => {
        if (!mounted) return;
        setMunicipalityGeoJson(buildMunicipalityCoverageCollection(buildFallbackMunicipalityPoints()));
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Lazy import: ensure CSS is present (already imported in globals).
  // Initialize the map once.
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

    // Wire up HUD events
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

    // Synchronous source/layer setup. MapLibre queues these internally
    // until the style finishes loading. This avoids losing the load event
    // because of React 18 StrictMode double-mount in dev.
    const ensureParcels = () => {
      if (!map.getSource(PARCEL_SOURCE)) {
        registerParcelLayers(map);
      }
      if (!map.getSource(MUNICIPALITY_SOURCE)) {
        registerMunicipalityCoverageLayers(map);
      }
      registerAskiLayers(map);
      applyVisibilityAndOpacity(map);
    };
    if (map.isStyleLoaded()) {
      ensureParcels();
    } else {
      map.once("load", ensureParcels);
    }

    map.on("styledata", () => {
      // After basemap change (setStyle), the parcel source/layers are
      // wiped. Re-register them.
      if (!map.isStyleLoaded()) return;
      if (!map.getSource(PARCEL_SOURCE)) {
        registerParcelLayers(map);
      }
      if (!map.getSource(MUNICIPALITY_SOURCE)) {
        registerMunicipalityCoverageLayers(map);
      }
      registerAskiLayers(map);
      // Re-apply selection state on style swap
      if (lastSelectedMapIdRef.current != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastSelectedMapIdRef.current },
          { selected: true }
        );
      }
      applyVisibilityAndOpacity(map);
    });

    // mousemove — write coords directly to DOM (avoid React re-renders)
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

    // hover/click handlers on parcel-fill layer
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
      // also push cursor coords store occasionally for UI uses
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

  // Basemap change → setStyle (the styledata handler re-adds custom sources/layers)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getStyleForBasemap(basemap));
  }, [basemap]);

  // Selection state syncing
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.getSource(PARCEL_SOURCE)) return;
      // Find the numeric mapId for the selected (string) parcel id
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

  // FlyTo target
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
    if (!map || !map.isStyleLoaded()) return;
    updateAskiSource(map, askiGeoJsonQuery.data?.ok ? askiGeoJsonQuery.data.data : null);
  }, [askiGeoJsonQuery.data]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateMunicipalitySource(map, municipalityGeoJson);
  }, [municipalityGeoJson]);

  const applyVisibilityAndOpacity = React.useCallback((map: Map) => {
    Object.entries(layerVisibility).forEach(([id, vis]) => {
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
      }
    }
    setOpacityIfExists(map, "parcels-line", "line-opacity", layerOpacity["parcels-line"]);
    setOpacityIfExists(map, "parcels-label", "text-opacity", layerOpacity["parcels-label"]);
    setOpacityIfExists(map, "aski-overlay-fill", "fill-opacity", layerOpacity["askida-overlay"] ?? 0.2);
    setOpacityIfExists(map, "aski-overlay-line", "line-opacity", layerOpacity["askida-overlay"] ?? 0.85);
  }, [layerOpacity, layerVisibility]);

  // Layer visibility / opacity sync
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => applyVisibilityAndOpacity(map);
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [applyVisibilityAndOpacity]);

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
      // Tile generation hints — empirically these settings produce visible
      // tiles for our small (~20m) parcel polygons across zoom 5..19.
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
    /* swallow paint property errors during style transitions */
  }
}

function registerAskiLayers(map: Map) {
  if (!map.getSource("aski-overlay-source")) {
    map.addSource("aski-overlay-source", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  if (!map.getLayer("aski-overlay-fill")) {
    map.addLayer({
      id: "aski-overlay-fill",
      type: "fill",
      source: "aski-overlay-source",
      paint: {
        "fill-color": "#C8102E",
        "fill-opacity": 0.2
      }
    } as never);
  }
  if (!map.getLayer("aski-overlay-line")) {
    map.addLayer({
      id: "aski-overlay-line",
      type: "line",
      source: "aski-overlay-source",
      paint: {
        "line-color": "#C8102E",
        "line-width": 1.5,
        "line-opacity": 0.9
      }
    } as never);
  }
}

function registerMunicipalityCoverageLayers(map: Map) {
  if (!map.getSource(MUNICIPALITY_SOURCE)) {
    map.addSource(MUNICIPALITY_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  if (!map.getSource(MUNICIPALITY_COVERAGE_SOURCE)) {
    map.addSource(MUNICIPALITY_COVERAGE_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  if (!map.getLayer("municipality-coverage-circles")) {
    map.addLayer(buildMunicipalityCoverageCircleLayer("municipality-coverage-circles", MUNICIPALITY_COVERAGE_SOURCE));
  }
  if (!map.getLayer("municipality-coverage-labels")) {
    map.addLayer(buildMunicipalityCoverageLabelLayer("municipality-coverage-labels", MUNICIPALITY_COVERAGE_SOURCE));
  }
  if (!map.getLayer("belediye-sinirlari")) {
    map.addLayer(buildMunicipalityBoundaryLayer("belediye-sinirlari"));
  }
}

function updateMunicipalitySource(
  map: Map,
  payload: GeoJSON.FeatureCollection<GeoJSON.Point> | null
) {
  const source = map.getSource(MUNICIPALITY_COVERAGE_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData(payload ?? { type: "FeatureCollection", features: [] });
}

function buildMunicipalityCoverageCollection(
  entries: Array<{ id: string; name: string; province?: string; district?: string; municipalitySlug?: string; capability?: { registered?: boolean; publicCandidate?: boolean; protected?: boolean; imarQuerySupport?: string } }>
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features = entries.map((entry) => {
    const fallback = municipalityCentroid(entry.name, entry.province, entry.district, entry.municipalitySlug);
    return {
      type: "Feature" as const,
      properties: {
        id: entry.id,
        name: entry.name,
        label: `${entry.name} · ${coverageStatusLabel(entry.capability)}`,
        coverageStatus: coverageStatus(entry.capability),
        registered: entry.capability?.registered ?? true,
        publicCandidate: entry.capability?.publicCandidate ?? false,
        protected: entry.capability?.protected ?? false,
        imarQuerySupport: entry.capability?.imarQuerySupport ?? "unknown"
      },
      geometry: {
        type: "Point" as const,
        coordinates: fallback
      }
    };
  });
  return { type: "FeatureCollection", features };
}

function buildFallbackMunicipalityPoints() {
  return BELEDIYE_LIST.map((entry) => ({
    id: entry.id,
    name: entry.ad,
    province: PROVINCES.find((province) => province.slug === entry.ilSlug)?.name ?? entry.ilSlug,
    district: "",
    municipalitySlug: entry.id,
    capability: {
      registered: true,
      publicCandidate: false,
      protected: false,
      imarQuerySupport: "unknown"
    }
  }));
}

function coverageStatus(capability?: { registered?: boolean; publicCandidate?: boolean; protected?: boolean; imarQuerySupport?: string }) {
  if (capability?.protected) return "protected";
  if (capability?.imarQuerySupport === "method_contract_required") return "method_contract_required";
  if (capability?.publicCandidate) return "public_candidate";
  if (capability?.registered) return "registered";
  return "unknown";
}

function coverageStatusLabel(capability?: { registered?: boolean; publicCandidate?: boolean; protected?: boolean; imarQuerySupport?: string }) {
  if (capability?.protected) return "korumalı";
  if (capability?.imarQuerySupport === "method_contract_required") return "method contract";
  if (capability?.publicCandidate) return "public aday";
  if (capability?.registered) return "kayıtlı";
  return "bilinmiyor";
}

function municipalityCentroid(name: string, province?: string, district?: string, municipalitySlug?: string): [number, number] {
  const normalized = [name, province, district, municipalitySlug].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
  const entry = [
    ...BELEDIYE_LIST.map((record) => [record.id, record.ad] as const),
    ...PROVINCES.map((record) => [record.slug, record.name] as const)
  ].find(([, label]) => normalized.includes(label.toLocaleLowerCase("tr-TR")));
  const hit = entry?.[0];
  const provinceMatch = PROVINCES.find((record) =>
    normalized.includes(record.slug) || normalized.includes(record.name.toLocaleLowerCase("tr-TR"))
  );
  return provinceMatch?.centroid ?? [35.0, 39.0];
}

function updateAskiSource(map: Map, payload: { type: "FeatureCollection"; features: GeoJSON.Feature[] } | null) {
  const source = map.getSource("aski-overlay-source") as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData(payload && Array.isArray(payload.features) ? payload : { type: "FeatureCollection", features: [] });
}

export function setMapBasemap(_id: BasemapId) {
  /* placeholder kept for symmetry — the map listens to the store */
}
