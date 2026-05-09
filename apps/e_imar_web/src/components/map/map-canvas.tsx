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
import {
  buildFlyTargetFromLocationTarget,
  findBestLocationTarget,
  getMapLabelTargets
} from "@/data/location-navigation";
import { fetchMunicipalityCoverage } from "@/lib/api/eimar";
import { BELEDIYE_LIST } from "@/data/belediye";
import { PROVINCES } from "@/data/provinces";
import { getStyleForBasemap, type BasemapId } from "@/lib/maplibre/styles";
import {
  PARCEL_SOURCE,
  ASKI_SOURCE,
  RISK_GRID_SOURCE,
  LIVE_SOURCE_REGISTRY_SOURCE,
  LOCATION_LABEL_SOURCE,
  MUNICIPALITY_SOURCE,
  MUNICIPALITY_COVERAGE_SOURCE,
  buildParcelFillLayer,
  buildParcelLineLayer,
  buildParcelLabelLayer,
  buildParcelSelectedAccentLayer,
  buildParcelHoverDotLayer,
  buildAskiFillLayer,
  buildAskiLineLayer,
  buildAskiHatchedLayer,
  buildRiskGridLayer,
  buildLocationCityLabelLayer,
  buildLocationDistrictLabelLayer,
  buildLocationNeighborhoodLabelLayer,
  buildPlanConstraintLineLayer,
  buildMunicipalityBoundaryLayer,
  buildMunicipalityCoverageCircleLayer,
  buildMunicipalityCoverageLabelLayer
} from "@/lib/maplibre/layers";
import { describeSemanticFocus } from "@/lib/maplibre/semantic-focus";
import { getAskiCollection } from "@/data/aski-polygons";
import type { AskiPolygonFeature } from "@/data/aski-polygons";
import { getRiskGridCollection } from "@/data/risk-grid";
import { ZONING_PRESETS } from "@/data/zoning";
import { getSnapshotForYear } from "@/data/historical-snapshots";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useSourceStore } from "@/stores/source-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
import { parseBackendParcelId } from "@/lib/api/parcel-normalizer";
import { geoJsonBounds, geoJsonCentroid, toFeatureCollection } from "@/lib/geojson";

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const INITIAL_ZOOM = 5.5;
const BACKEND_SELECTED_SOURCE = "backend-selected-parcel";
const LIVE_PLAN_REGIONS_SOURCE = "live-plan-regions";

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
  const liveLayers = useSourceStore((s) => s.liveLayers);
  const loadLiveLayers = useSourceStore((s) => s.loadLiveLayers);
  const selectedLatestRegion = useLatestRegionsStore((s) => s.selectedRegion);
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
  const activeConstraintFilter = useUIStore((s) => s.activeConstraintFilter);
  const activePlanNoteFilter = useUIStore((s) => s.activePlanNoteFilter);
  const activeRiskFocus = useUIStore((s) => s.activeRiskFocus);
  const clearSemanticFocus = useUIStore((s) => s.clearSemanticFocus);

  const semanticFocus = React.useMemo(
    () =>
      describeSemanticFocus({
        activeConstraintFilter,
        activePlanNoteFilter,
        activeRiskFocus
      }),
    [activeConstraintFilter, activePlanNoteFilter, activeRiskFocus]
  );

  const [municipalityGeoJson, setMunicipalityGeoJson] =
    React.useState<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(null);

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
          clearSemanticFocus();
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
      registerSemanticLayers(map);
      if (!map.getSource(LOCATION_LABEL_SOURCE)) {
        registerLocationLayers(map);
      }
      if (!map.getSource(MUNICIPALITY_SOURCE)) {
        registerMunicipalityCoverageLayers(map);
      }
      ensureLiveSourceLayers(map);
      ensureBackendSelectedLayer(map);
      ensureLatestRegionsLayer(map);
      applyLocationLabelTheme(map, basemap);
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
      registerSemanticLayers(map);
      if (!map.getSource(LOCATION_LABEL_SOURCE)) {
        registerLocationLayers(map);
      }
      if (!map.getSource(MUNICIPALITY_SOURCE)) {
        registerMunicipalityCoverageLayers(map);
      }
      ensureLiveSourceLayers(map);
      ensureBackendSelectedLayer(map);
      ensureLatestRegionsLayer(map);
      applyLocationLabelTheme(map, basemap);
      if (lastSelectedMapIdRef.current != null) {
        map.setFeatureState(
          { source: PARCEL_SOURCE, id: lastSelectedMapIdRef.current },
          { selected: true }
        );
      }
      applyVisibilityAndOpacity(map);
      applySemanticFocusStyles(map, semanticFocus);
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

    const onLocationMouseMove = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLocationMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    const onLocationClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const props = feature?.properties as
        | {
            il?: string;
            ilce?: string;
            mahalle?: string;
            centerLng?: number;
            centerLat?: number;
            zoom?: number;
            kind?: string;
          }
        | undefined;
      if (!props) return;
      const target = findBestLocationTarget({ il: props.il, ilce: props.ilce, mahalle: props.mahalle });
      if (!target) return;
      setSelectedParcelId(null);
      setRightPanelOpen(false);
      const { center, zoom, bearing, pitch } = buildFlyTargetFromLocationTarget(target, { zoom: props.zoom });
      map.flyTo({
        center,
        zoom,
        bearing,
        pitch,
        duration: 650,
        essential: true,
        padding:
          window.innerWidth >= 1280
            ? { top: 40, bottom: 40, left: 320, right: 440 }
            : { top: 40, bottom: 40, left: 24, right: 24 }
      });
    };

    map.on("mousemove", "parcels-fill", onParcelMouseMove);
    map.on("mouseleave", "parcels-fill", onParcelMouseLeave);
    map.on("click", "parcels-fill", onParcelClick);
    for (const layerId of ["location-label-city", "location-label-district", "location-label-neighborhood"]) {
      map.on("mousemove", layerId, onLocationMouseMove);
      map.on("mouseleave", layerId, onLocationMouseLeave);
      map.on("click", layerId, onLocationClick);
    }

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

    const onSourceClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const props = f.properties as Record<string, string | undefined>;
      const homepage = props.homepage_url;
      new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(`<div style="font:12px sans-serif;min-width:190px"><strong>${props.name ?? "Veri kaynağı"}</strong><br/><span>${props.status ?? "external_only"}</span>${homepage ? `<br/><a href="${homepage}" target="_blank" rel="noreferrer">Resmi portalı aç</a>` : ""}</div>`)
        .addTo(map);
    };
    const onSourceEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onSourceLeave = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", "live-source-markers", onSourceClick);
    map.on("mouseenter", "live-source-markers", onSourceEnter);
    map.on("mouseleave", "live-source-markers", onSourceLeave);

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
      map.off("click", "live-source-markers", onSourceClick);
      map.off("mouseenter", "live-source-markers", onSourceEnter);
      map.off("mouseleave", "live-source-markers", onSourceLeave);
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
    applyLocationLabelTheme(map, basemap);
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
      source?.setData(toFeatureCollection(feature as unknown as GeoJSON.Feature | null));
      if (feature) {
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
    if (!map) return;
    const apply = () => {
      ensureLatestRegionsLayer(map);
      const source = map.getSource(LIVE_PLAN_REGIONS_SOURCE) as maplibregl.GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(selectedLatestRegion?.has_geometry ? selectedLatestRegion.geom_geojson ?? null : null));
      if (selectedLatestRegion?.has_geometry) {
        const padding = window.innerWidth >= 1280 ? { top: 72, bottom: 72, left: 320, right: 440 } : { top: 56, bottom: 56, left: 24, right: 24 };
        const bounds = geometryBounds(selectedLatestRegion.geom_geojson ?? null);
        if (bounds) {
          map.fitBounds(bounds, { padding, duration: 700, maxZoom: 15 });
          return;
        }
        const centroid = geoJsonCentroid(selectedLatestRegion.geom_geojson ?? null);
        if (centroid) {
          map.flyTo({ center: centroid, zoom: Math.max(map.getZoom(), 14), padding, duration: 700 });
        }
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [selectedLatestRegion]);

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
    void loadLiveLayers();
  }, [loadLiveLayers]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensureLiveSourceLayers(map);
      const source = map.getSource(LIVE_SOURCE_REGISTRY_SOURCE) as maplibregl.GeoJSONSource | undefined;
      source?.setData(buildLiveSourceFeatureCollection(liveLayers));
      applyVisibilityAndOpacity(map);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [liveLayers]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => applyVisibilityAndOpacity(map);
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [layerVisibility, layerOpacity, askiMode, semanticFocus]);

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

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateMunicipalitySource(map, municipalityGeoJson);
  }, [municipalityGeoJson]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => applySemanticFocusStyles(map, semanticFocus);
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [semanticFocus]);

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
      if (id === "live-source-markers") {
        ["live-source-markers", "live-source-labels"].forEach((layerId) => {
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", vis ? "visible" : "none");
        });
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
    setOpacityIfExists(map, "live-source-markers", "circle-opacity", layerOpacity["live-source-markers"]);
    applySemanticFocusStyles(map, semanticFocus);
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
      {semanticFocus && (
        <div className="absolute left-3 top-14 z-10 pointer-events-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface-2/95 px-3 py-1.5 shadow-card">
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">
              {semanticFocus.label}
            </span>
            <span className="text-[11px] text-fg-secondary">{semanticFocus.status}</span>
            <button
              type="button"
              onClick={() => clearSemanticFocus()}
              className="rounded-sm border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted hover:text-fg-primary"
            >
              Odak Temizle
            </button>
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

function registerLocationLayers(map: Map) {
  if (!map.getSource(LOCATION_LABEL_SOURCE)) {
    map.addSource(LOCATION_LABEL_SOURCE, {
      type: "geojson",
      data: buildLocationLabelCollection() as unknown as GeoJSON.FeatureCollection,
      generateId: false
    });
  } else {
    const source = map.getSource(LOCATION_LABEL_SOURCE) as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildLocationLabelCollection() as unknown as GeoJSON.FeatureCollection);
  }
  if (!map.getLayer("location-label-city")) {
    map.addLayer(buildLocationCityLabelLayer("location-label-city"));
  }
  if (!map.getLayer("location-label-district")) {
    map.addLayer(buildLocationDistrictLabelLayer("location-label-district"));
  }
  if (!map.getLayer("location-label-neighborhood")) {
    map.addLayer(buildLocationNeighborhoodLabelLayer("location-label-neighborhood"));
  }
}

function registerSemanticLayers(map: Map) {
  if (!map.getSource(RISK_GRID_SOURCE)) {
    map.addSource(RISK_GRID_SOURCE, {
      type: "geojson",
      data: getRiskGridCollection() as unknown as GeoJSON.FeatureCollection,
      generateId: false
    });
  } else {
    const source = map.getSource(RISK_GRID_SOURCE) as maplibregl.GeoJSONSource | undefined;
    source?.setData(getRiskGridCollection() as unknown as GeoJSON.FeatureCollection);
  }
  const beforeId = map.getLayer("parcels-fill") ? "parcels-fill" : undefined;
  if (!map.getLayer("deprem-risk-grid")) {
    map.addLayer(buildRiskGridLayer("deprem-risk-grid"), beforeId);
  }
  if (!map.getLayer("plan-constraint-line")) {
    map.addLayer(buildPlanConstraintLineLayer("plan-constraint-line"));
  }
}

function applyLocationLabelTheme(map: Map, basemapId: BasemapId) {
  const dark = basemapId === "dark";
  const labelColor = dark ? "#F8FAFC" : "#0F172A";
  const labelSecondary = dark ? "#E2E8F0" : "#102A4C";
  const haloColor = dark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)";

  for (const layerId of ["location-label-city", "location-label-district", "location-label-neighborhood"]) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.setPaintProperty(layerId, "text-color", layerId === "location-label-city" ? labelColor : labelSecondary);
      map.setPaintProperty(layerId, "text-halo-color", haloColor);
    } catch {
      /* ignore style transition errors */
    }
  }
}

function buildLocationLabelCollection(): GeoJSON.FeatureCollection {
  const features = getMapLabelTargets().map((target) => ({
    type: "Feature" as const,
    id: target.sourceId,
    properties: {
      label: target.label,
      kind: target.kind,
      count: target.count,
      il: target.il,
      ilce: target.ilce,
      mahalle: target.mahalle,
      centerLng: target.center[0],
      centerLat: target.center[1],
      zoom: target.zoom
    },
    geometry: {
      type: "Point" as const,
      coordinates: target.center
    }
  }));
  return { type: "FeatureCollection", features };
}

function applySemanticFocusStyles(
  map: Map,
  focus: { key: string; label: string; status: string } | null
) {
  if (!map.getLayer("parcels-fill")) return;
  try {
    map.setPaintProperty(
      "parcels-fill",
      "fill-opacity",
      focus
        ? [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.86,
            ["boolean", ["feature-state", "hover"], false],
            0.72,
            0.34
          ]
        : [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.78,
            ["boolean", ["feature-state", "hover"], false],
            0.62,
            0.45
          ]
    );
  } catch {
    /* ignore */
  }

  if (map.getLayer("parcels-selected-accent")) {
    try {
      map.setPaintProperty(
        "parcels-selected-accent",
        "line-color",
        focus?.key.startsWith("risk:")
          ? "#DC2626"
          : focus?.key.startsWith("constraint:")
            ? "#0F766E"
            : focus?.key === "aski"
              ? "#D97706"
              : "#C8102E"
      );
      map.setPaintProperty(
        "parcels-selected-accent",
        "line-width",
        focus
          ? ["case", ["boolean", ["feature-state", "selected"], false], 4.2, 0]
          : ["case", ["boolean", ["feature-state", "selected"], false], 2.6, 0]
      );
    } catch {
      /* ignore */
    }
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
  const beforeId = map.getLayer("parcels-label") ? "parcels-label" : undefined;
  if (!map.getLayer("municipality-coverage-circles")) {
    map.addLayer(buildMunicipalityCoverageCircleLayer("municipality-coverage-circles"), beforeId);
  }
  if (!map.getLayer("municipality-coverage-labels")) {
    map.addLayer(buildMunicipalityCoverageLabelLayer("municipality-coverage-labels"), beforeId);
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
  entries: Array<{
    id: string;
    name: string;
    province?: string;
    district?: string;
    municipalitySlug?: string;
    capability?: {
      registered?: boolean;
      publicCandidate?: boolean;
      protected?: boolean;
      imarQuerySupport?: string;
    };
  }>
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

function coverageStatus(capability?: {
  registered?: boolean;
  publicCandidate?: boolean;
  protected?: boolean;
  imarQuerySupport?: string;
}) {
  if (capability?.protected) return "protected";
  if (capability?.imarQuerySupport === "method_contract_required") return "method_contract_required";
  if (capability?.publicCandidate) return "public_candidate";
  if (capability?.registered) return "registered";
  return "unknown";
}

function coverageStatusLabel(capability?: {
  registered?: boolean;
  publicCandidate?: boolean;
  protected?: boolean;
  imarQuerySupport?: string;
}) {
  if (capability?.protected) return "korumalı";
  if (capability?.imarQuerySupport === "method_contract_required") return "method contract";
  if (capability?.publicCandidate) return "public aday";
  if (capability?.registered) return "kayıtlı";
  return "bilinmiyor";
}

function municipalityCentroid(
  name: string,
  province?: string,
  district?: string,
  municipalitySlug?: string
): [number, number] {
  const normalized = [name, province, district, municipalitySlug].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
  const provinceMatch = PROVINCES.find(
    (record) =>
      normalized.includes(record.slug) || normalized.includes(record.name.toLocaleLowerCase("tr-TR"))
  );
  return provinceMatch?.centroid ?? [35.0, 39.0];
}

function ensureLiveSourceLayers(map: Map) {
  if (!map.getSource(LIVE_SOURCE_REGISTRY_SOURCE)) {
    map.addSource(LIVE_SOURCE_REGISTRY_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  const beforeId = map.getLayer("parcels-label") ? "parcels-label" : undefined;
  if (!map.getLayer("live-source-markers")) {
    map.addLayer(
      {
        id: "live-source-markers",
        type: "circle",
        source: LIVE_SOURCE_REGISTRY_SOURCE,
        paint: {
          "circle-color": [
            "match",
            ["get", "status"],
            "live", "#10B981",
            "timeout", "#F59E0B",
            "blocked", "#EF4444",
            "requires_auth", "#EF4444",
            "requires_approval", "#EF4444",
            "#0EA5E9"
          ] as never,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 8, 8, 12, 12] as never,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.9
        }
      },
      beforeId
    );
  }
  if (!map.getLayer("live-source-labels")) {
    map.addLayer({
      id: "live-source-labels",
      type: "symbol",
      source: LIVE_SOURCE_REGISTRY_SOURCE,
      minzoom: 6,
      layout: {
        "text-field": ["get", "short_name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 10,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": "#0F172A",
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1.2
      }
    });
  }
}

function buildLiveSourceFeatureCollection(layers: Array<{ id: string | number; source_id?: string; name?: string; title?: string; status?: string; homepage_url?: string; center?: [number, number]; province?: string; district?: string; kind?: string }>): GeoJSON.FeatureCollection {
  const seen = new Set<string>();
  const features = layers
    .filter((layer) => Array.isArray(layer.center) && layer.center.length === 2)
    .filter((layer) => {
      const key = layer.source_id ?? String(layer.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((layer) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: layer.center as [number, number] },
      properties: {
        id: String(layer.id),
        source_id: layer.source_id ?? String(layer.id),
        name: layer.name ?? layer.title ?? "Veri kaynağı",
        short_name: (layer.name ?? layer.title ?? "Kaynak").replace(/ (KEOS|WebGIS|İmar Durumu|CBS|Portalı).*/i, ""),
        status: layer.status ?? "external_only",
        homepage_url: layer.homepage_url ?? "",
        province: layer.province ?? "",
        district: layer.district ?? "",
        kind: layer.kind ?? ""
      }
    }));
  return { type: "FeatureCollection", features };
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

function ensureLatestRegionsLayer(map: Map) {
  if (!map.getSource(LIVE_PLAN_REGIONS_SOURCE)) {
    map.addSource(LIVE_PLAN_REGIONS_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  const beforeId = map.getLayer("parcels-label") ? "parcels-label" : undefined;
  if (!map.getLayer("live-plan-regions-fill")) {
    map.addLayer(
      {
        id: "live-plan-regions-fill",
        type: "fill",
        source: LIVE_PLAN_REGIONS_SOURCE,
        paint: {
          "fill-color": "#8B5CF6",
          "fill-opacity": 0.18
        }
      },
      beforeId
    );
  }
  if (!map.getLayer("live-plan-regions-outline")) {
    map.addLayer(
      {
        id: "live-plan-regions-outline",
        type: "line",
        source: LIVE_PLAN_REGIONS_SOURCE,
        paint: {
          "line-color": "#A78BFA",
          "line-width": 2.5,
          "line-opacity": 0.95
        }
      },
      beforeId
    );
  }
}

function geometryBounds(geometry: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection | Record<string, unknown> | null): maplibregl.LngLatBoundsLike | null {
  return geoJsonBounds(geometry);
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
