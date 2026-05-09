"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Ruler, ScanLine, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { validateAndRepairGeoJson } from "@/lib/geo-validation";

interface MapViewerProps {
  center?: [number, number];
  zoom?: number;
  geojson?: GeoJSON.FeatureCollection | GeoJSON.Feature;
  wmsUrl?: string;
  wmsLayers?: string[];
}

type DrawMode = "none" | "measure-distance" | "radius" | "polygon";
type TooltipState = { x: number; y: number; title: string; subtitle: string } | null;
type PopupState = { x: number; y: number; title: string; properties: Record<string, unknown> } | null;

const PARCEL_SOURCE = "parcel";
const PARCEL_FILL_LAYER = "parcel-fill";
const PARCEL_LINE_LAYER = "parcel-line";
const PARCEL_GLOW_LAYER = "parcel-glow";
const PARCEL_SELECTED_LAYER = "parcel-selected";
const PARCEL_LABEL_LAYER = "parcel-label";
const PARCEL_CLUSTER_SOURCE = "parcel-centroids";

export function MapViewer({
  center = [28.9784, 41.0082],
  zoom = 12,
  geojson,
  wmsUrl,
  wmsLayers = []
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>("none");
  const [distanceValue, setDistanceValue] = useState(0);
  const [radiusValue, setRadiusValue] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [parcelOpacity, setParcelOpacity] = useState(0.45);
  const [wmsOpacity, setWmsOpacity] = useState(0.65);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const drawPointsRef = useRef<[number, number][]>([]);
  const animatedBorderRef = useRef<number | null>(null);
  const pulseRef = useRef<number | null>(null);

  const validatedGeo = useMemo(() => validateAndRepairGeoJson(geojson), [geojson]);

  /* MapLibre: mount once. Sync center/zoom/geojson/opacity/WMS via dedicated effects below. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors"
          }
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }]
      },
      center: [center[0], center[1]],
      zoom
    });

    map.on("load", () => {
      setLoaded(true);
      map.addSource(PARCEL_SOURCE, {
        type: "geojson",
        data: validatedGeo.repairedGeoJson,
        tolerance: 0,
        generateId: true
      });
      map.addLayer({
        id: PARCEL_FILL_LAYER,
        type: "fill",
        source: PARCEL_SOURCE,
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#C8102E",
            ["boolean", ["feature-state", "hover"], false],
            "#F87171",
            "#FDEBEC"
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            ["+", parcelOpacity, 0.22],
            ["boolean", ["feature-state", "hover"], false],
            ["+", parcelOpacity, 0.12],
            parcelOpacity
          ]
        }
      });
      map.addLayer({
        id: PARCEL_GLOW_LAYER,
        type: "line",
        source: PARCEL_SOURCE,
        paint: {
          "line-color": "#DC2626",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            ["interpolate", ["linear"], ["zoom"], 12, 3, 18, 7],
            0
          ],
          "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0],
          "line-blur": 1.6
        }
      });
      map.addLayer({
        id: PARCEL_LINE_LAYER,
        type: "line",
        source: PARCEL_SOURCE,
        paint: {
          "line-color": "#7F1D1D",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 1.5, 19, 2.4],
          "line-opacity": 0.95
        }
      });
      map.addLayer({
        id: PARCEL_SELECTED_LAYER,
        type: "line",
        source: PARCEL_SOURCE,
        paint: {
          "line-color": "#EF4444",
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.8, 0],
          "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0],
          "line-dasharray": [3, 1.4]
        }
      });
      map.addLayer({
        id: PARCEL_LABEL_LAYER,
        type: "symbol",
        source: PARCEL_SOURCE,
        minzoom: 14,
        layout: {
          "text-field": ["concat", ["coalesce", ["get", "ada"], "?"], "/", ["coalesce", ["get", "parsel"], "?"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 19, 16],
          "text-font": ["Noto Sans Bold"]
        },
        paint: {
          "text-color": "#7F1D1D",
          "text-halo-color": "#fff",
          "text-halo-width": 1.4
        }
      });

      map.addSource(PARCEL_CLUSTER_SOURCE, {
        type: "geojson",
        data: buildCentroidCollection(validatedGeo.repairedGeoJson),
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 48
      });
      map.addLayer({
        id: "parcel-cluster",
        type: "circle",
        source: PARCEL_CLUSTER_SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#B91C1C",
          "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 5, 14, 100, 22],
          "circle-opacity": 0.85
        }
      });
      map.addLayer({
        id: "parcel-cluster-count",
        type: "symbol",
        source: PARCEL_CLUSTER_SOURCE,
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#fff" }
      });

      if (wmsUrl && wmsLayers.length > 0) {
        wmsLayers.forEach((layerName) => {
          const sourceId = `wms-${layerName}`;
          const layerId = `wms-layer-${layerName}`;
          map.addSource(sourceId, {
            type: "raster",
            tiles: [`${wmsUrl}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=${layerName}&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`],
            tileSize: 256
          });
          map.addLayer({
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: { "raster-opacity": wmsOpacity },
            layout: { visibility: "none" }
          });
        });
      }

      bindInteractions(map);
      bindShiftDragSelection(map);
      startAnimations(map);
    });

    mapRef.current = map;
    return () => {
      if (animatedBorderRef.current) window.clearInterval(animatedBorderRef.current);
      if (pulseRef.current) window.clearInterval(pulseRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single mount; props synced below
  }, []);

  function bindInteractions(map: maplibregl.Map) {
    let lastHoverId: string | number | undefined;
    map.on("mousemove", PARCEL_FILL_LAYER, (event) => {
      const feature = event.features?.[0];
      if (!feature?.id) return;
      if (lastHoverId != null && lastHoverId !== feature.id) {
        map.setFeatureState({ source: PARCEL_SOURCE, id: lastHoverId }, { hover: false });
      }
      lastHoverId = feature.id;
      map.setFeatureState({ source: PARCEL_SOURCE, id: feature.id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
      const props = feature.properties ?? {};
      setTooltip({
        x: event.point.x,
        y: event.point.y,
        title: `Ada ${String(props.ada ?? "-")} / Parsel ${String(props.parsel ?? "-")}`,
        subtitle: `${String(props.ilce ?? "")} ${String(props.il ?? "")}`.trim() || "Parsel önizleme"
      });
    });
    map.on("mouseleave", PARCEL_FILL_LAYER, () => {
      if (lastHoverId != null) {
        map.setFeatureState({ source: PARCEL_SOURCE, id: lastHoverId }, { hover: false });
      }
      map.getCanvas().style.cursor = "";
      setTooltip(null);
    });
    map.on("click", PARCEL_FILL_LAYER, (event) => {
      const feature = event.features?.[0];
      if (!feature?.id) return;
      const featureId = String(feature.id);
      const appendMode = event.originalEvent.shiftKey;
      setSelectedIds((prev) => {
        const next = new Set(appendMode ? prev : []);
        if (appendMode && next.has(featureId)) next.delete(featureId);
        else next.add(featureId);
        return next;
      });
      const props = feature.properties ?? {};
      setPopup({
        x: event.point.x,
        y: event.point.y,
        title: `Ada ${String(props.ada ?? "-")} / Parsel ${String(props.parsel ?? "-")}`,
        properties: props as Record<string, unknown>
      });
    });
  }

  function bindShiftDragSelection(map: maplibregl.Map) {
    map.on("mousedown", (event) => {
      if (!event.originalEvent.shiftKey) return;
      draggingRef.current = { x: event.point.x, y: event.point.y };
      map.dragPan.disable();
      if (!selectionBoxRef.current) {
        const box = document.createElement("div");
        box.className = "absolute border-2 border-red-500/90 bg-red-500/15 pointer-events-none z-20";
        selectionBoxRef.current = box;
        containerRef.current?.appendChild(box);
      }
    });
    map.on("mousemove", (event) => {
      if (!draggingRef.current || !selectionBoxRef.current) return;
      const minX = Math.min(draggingRef.current.x, event.point.x);
      const maxX = Math.max(draggingRef.current.x, event.point.x);
      const minY = Math.min(draggingRef.current.y, event.point.y);
      const maxY = Math.max(draggingRef.current.y, event.point.y);
      Object.assign(selectionBoxRef.current.style, {
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${maxX - minX}px`,
        height: `${maxY - minY}px`
      });
    });
    map.on("mouseup", (event) => {
      if (!draggingRef.current) return;
      const a = draggingRef.current;
      const b = event.point;
      draggingRef.current = null;
      map.dragPan.enable();
      selectionBoxRef.current?.remove();
      selectionBoxRef.current = null;
      const selected = map.queryRenderedFeatures(
        [
          [Math.min(a.x, b.x), Math.min(a.y, b.y)],
          [Math.max(a.x, b.x), Math.max(a.y, b.y)]
        ],
        { layers: [PARCEL_FILL_LAYER] }
      );
      if (selected.length === 0) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selected.forEach((feature) => {
          if (feature.id != null) next.add(String(feature.id));
        });
        return next;
      });
    });
  }

  function startAnimations(map: maplibregl.Map) {
    let dashPhase = 0;
    animatedBorderRef.current = window.setInterval(() => {
      dashPhase = (dashPhase + 0.35) % 4;
      if (map.getLayer(PARCEL_SELECTED_LAYER)) {
        map.setPaintProperty(PARCEL_SELECTED_LAYER, "line-dasharray", [3, 1.4 + dashPhase * 0.1]);
      }
    }, 120);
    let pulse = 0;
    pulseRef.current = window.setInterval(() => {
      pulse = (pulse + 1) % 20;
      if (map.getLayer(PARCEL_SELECTED_LAYER)) {
        const width = 2.4 + Math.sin(pulse / 2) * 0.7;
        map.setPaintProperty(
          PARCEL_SELECTED_LAYER,
          "line-width",
          ["case", ["boolean", ["feature-state", "selected"], false], width, 0]
        );
      }
    }, 130);
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(PARCEL_SOURCE)) return;
    (map.getSource(PARCEL_SOURCE) as maplibregl.GeoJSONSource).setData(validatedGeo.repairedGeoJson);
    if (map.getSource(PARCEL_CLUSTER_SOURCE)) {
      (map.getSource(PARCEL_CLUSTER_SOURCE) as maplibregl.GeoJSONSource).setData(
        buildCentroidCollection(validatedGeo.repairedGeoJson)
      );
    }
  }, [validatedGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([center[0], center[1]]);
    map.setZoom(zoom);
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(PARCEL_FILL_LAYER)) return;
    map.setPaintProperty(PARCEL_FILL_LAYER, "fill-opacity", [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      Math.min(parcelOpacity + 0.22, 1),
      ["boolean", ["feature-state", "hover"], false],
      Math.min(parcelOpacity + 0.12, 1),
      parcelOpacity
    ]);
  }, [parcelOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    wmsLayers.forEach((layerName) => {
      const layerId = `wms-layer-${layerName}`;
      if (!map.getLayer(layerId)) return;
      map.setPaintProperty(layerId, "raster-opacity", wmsOpacity);
      map.setLayoutProperty(layerId, "visibility", activeLayers.includes(layerName) ? "visible" : "none");
    });
  }, [activeLayers, wmsLayers, wmsOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const features = map.querySourceFeatures(PARCEL_SOURCE);
    features.forEach((feature) => {
      if (feature.id == null) return;
      const fid = String(feature.id);
      map.setFeatureState(
        { source: PARCEL_SOURCE, id: Number.isNaN(+fid) ? fid : +fid },
        { selected: selectedIds.has(fid) }
      );
    });
  }, [selectedIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const clickHandler = (event: maplibregl.MapMouseEvent) => {
      if (drawMode === "none") return;
      drawPointsRef.current.push([event.lngLat.lng, event.lngLat.lat]);
      if (drawMode === "measure-distance" && drawPointsRef.current.length >= 2) {
        setDistanceValue(totalDistance(drawPointsRef.current));
      }
      if (drawMode === "radius" && drawPointsRef.current.length === 2) {
        setRadiusValue(totalDistance(drawPointsRef.current));
      }
      if (drawMode === "polygon" && drawPointsRef.current.length >= 3) {
        setDistanceValue(calculateArea(drawPointsRef.current));
      }
    };
    map.on("click", clickHandler);
    return () => {
      map.off("click", clickHandler);
    };
  }, [drawMode]);

  const validationSummaryClass =
    validatedGeo.confidenceScore >= 90
      ? "text-emerald-300 border-emerald-600/50 bg-emerald-900/30"
      : validatedGeo.confidenceScore >= 70
        ? "text-amber-300 border-amber-600/50 bg-amber-900/30"
        : "text-red-200 border-red-700/70 bg-red-900/35";

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-red-950/40 shadow-[0_20px_80px_rgba(127,29,29,0.38)]">
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <button className="px-3 py-2 text-xs rounded-lg border border-red-700/70 bg-black/60 hover:bg-red-950/70" onClick={() => setDrawMode((v) => (v === "measure-distance" ? "none" : "measure-distance"))}>
          <Ruler className="inline h-3.5 w-3.5 mr-1" /> Mesafe
        </button>
        <button className="px-3 py-2 text-xs rounded-lg border border-red-700/70 bg-black/60 hover:bg-red-950/70" onClick={() => setDrawMode((v) => (v === "radius" ? "none" : "radius"))}>
          <ScanLine className="inline h-3.5 w-3.5 mr-1" /> Radius
        </button>
        <button className="px-3 py-2 text-xs rounded-lg border border-red-700/70 bg-black/60 hover:bg-red-950/70" onClick={() => setDrawMode((v) => (v === "polygon" ? "none" : "polygon"))}>
          <Sparkles className="inline h-3.5 w-3.5 mr-1" /> Polygon
        </button>
      </div>
      <div className="absolute top-3 right-3 z-10 w-72 rounded-xl border border-red-900/80 bg-black/70 p-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-red-100 mb-2">
          <span><Layers className="inline h-3.5 w-3.5 mr-1" /> Katman Kontrol</span>
          <span className="opacity-80">{selectedIds.size} seçili</span>
        </div>
        <label className="block text-[11px] text-red-200/80 mb-1">Parsel Opacity</label>
        <input type="range" min={0.1} max={0.9} step={0.05} value={parcelOpacity} onChange={(e) => setParcelOpacity(Number(e.target.value))} className="w-full accent-red-500" />
        <label className="block text-[11px] text-red-200/80 mt-2 mb-1">WMS Opacity</label>
        <input type="range" min={0.1} max={1} step={0.05} value={wmsOpacity} onChange={(e) => setWmsOpacity(Number(e.target.value))} className="w-full accent-red-500" />
        {wmsLayers.length > 0 && (
          <div className="mt-2 max-h-32 overflow-auto space-y-1 pr-1">
            {wmsLayers.map((layer) => (
              <label key={layer} className="flex items-center gap-2 text-[11px] text-red-100/90">
                <input
                  type="checkbox"
                  checked={activeLayers.includes(layer)}
                  onChange={(e) => setActiveLayers((prev) => (e.target.checked ? [...prev, layer] : prev.filter((v) => v !== layer)))}
                  className="accent-red-500"
                />
                <span className="truncate">{layer}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <button type="button" className={`absolute bottom-3 left-3 z-10 rounded-lg border px-3 py-2 text-xs ${validationSummaryClass}`} onClick={() => setValidationPanelOpen((s) => !s)}>
        <ShieldAlert className="inline h-3.5 w-3.5 mr-1" />
        Veri güven skoru: {validatedGeo.confidenceScore}/100
      </button>
      {validationPanelOpen && (
        <div className="absolute bottom-14 left-3 z-10 w-[min(34rem,calc(100%-1.5rem))] rounded-xl border border-red-900/80 bg-black/80 p-3 text-xs">
          <p className="text-red-100 font-medium mb-2">Integrity Scan Sonuçları</p>
          <div className="space-y-1 max-h-40 overflow-auto pr-1">
            {validatedGeo.issues.length === 0 ? (
              <p className="text-emerald-200">Kritik validation hatası tespit edilmedi.</p>
            ) : (
              validatedGeo.issues.map((issue, index) => (
                <p key={`${issue.code}-${index}`} className="text-red-100/90">
                  <span className="font-semibold">{issue.code}:</span> {issue.message}
                </p>
              ))
            )}
          </div>
        </div>
      )}
      {tooltip && (
        <div className="absolute z-10 pointer-events-none rounded-lg border border-red-900/80 bg-black/85 px-3 py-2 text-xs text-red-50" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <p className="font-semibold">{tooltip.title}</p>
          <p className="opacity-80">{tooltip.subtitle}</p>
        </div>
      )}
      {popup && (
        <div className="absolute z-10 w-72 rounded-xl border border-red-900/90 bg-black/90 p-3 text-xs" style={{ left: Math.min(popup.x + 12, 620), top: Math.min(popup.y + 12, 420) }}>
          <p className="text-red-100 text-sm font-semibold mb-1">{popup.title}</p>
          <div className="animate-pulse h-1.5 w-20 rounded bg-red-500/40 mb-2" />
          <div className="grid grid-cols-2 gap-1 text-red-100/90">
            <StatRow label="TAKS" value={popup.properties.taks} />
            <StatRow label="KAKS" value={popup.properties.kaks} />
            <StatRow label="Kat" value={popup.properties.kat_siniri} />
            <StatRow label="İmar" value={popup.properties.imar_tipi} />
            <StatRow label="Risk" value={popup.properties.risk_skoru} />
            <StatRow label="Güncelleme" value={popup.properties.updatedAt ?? popup.properties.updated_at} />
          </div>
        </div>
      )}
      {(drawMode !== "none" || distanceValue > 0 || radiusValue > 0) && (
        <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-red-900/80 bg-black/75 px-3 py-2 text-xs text-red-100">
          <p>Mod: {drawMode}</p>
          {distanceValue > 0 && <p>Ölçüm: {distanceValue.toFixed(1)} {drawMode === "polygon" ? "m²" : "m"}</p>}
          {radiusValue > 0 && <p>Yarıçap: {radiusValue.toFixed(1)} m</p>}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: unknown }) {
  return (
    <>
      <span className="opacity-65">{label}</span>
      <span className="text-right font-medium">{value == null ? "—" : String(value)}</span>
    </>
  );
}

function buildCentroidCollection(fc: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const feature of fc.features) {
    if (!feature.geometry) continue;
    const centroid = roughCentroid(feature.geometry);
    if (!centroid) continue;
    features.push({
      type: "Feature",
      properties: (feature.properties ?? {}) as GeoJSON.GeoJsonProperties,
      geometry: { type: "Point", coordinates: centroid }
    });
  }
  return {
    type: "FeatureCollection",
    features
  };
}

function roughCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  if (geometry.type === "Polygon") return averagePoint(geometry.coordinates[0] ?? []);
  if (geometry.type === "MultiPolygon") return averagePoint(geometry.coordinates[0]?.[0] ?? []);
  return null;
}

function averagePoint(points: GeoJSON.Position[]): [number, number] | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function totalDistance(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
  return total;
}

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function calculateArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const scale = 111_320;
  const projected = points.map(([lng, lat]) => [lng * scale * Math.cos((lat * Math.PI) / 180), lat * scale]);
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}
