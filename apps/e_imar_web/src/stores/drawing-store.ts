"use client";

import { create } from "zustand";
import { circlePolygon, closeRing, haversineDistanceMeters, pathDistanceMeters, polygonAreaSquareMeters, radiusAreaSquareMeters, type LngLatTuple } from "@/lib/geo/measure";

export type DrawingTool = "idle" | "distance" | "area" | "radius" | "marker";
export type DrawingGeometryKind = "distance" | "area" | "radius" | "marker";

export interface DrawingFeatureProps {
  id: string;
  kind: DrawingGeometryKind;
  label: string;
  detail: string;
}

export type DrawingFeature = GeoJSON.Feature<GeoJSON.LineString | GeoJSON.Polygon | GeoJSON.Point, DrawingFeatureProps>;

interface DraftDrawing {
  tool: Exclude<DrawingTool, "idle">;
  points: LngLatTuple[];
  cursor?: LngLatTuple | null;
}

interface DrawingState {
  activeTool: DrawingTool;
  draft: DraftDrawing | null;
  features: DrawingFeature[];
  lastMessage: string | null;
  setActiveTool: (tool: DrawingTool) => void;
  addPoint: (point: LngLatTuple) => void;
  setDraftCursor: (point: LngLatTuple | null) => void;
  undoDraftPoint: () => void;
  finishDraft: () => void;
  clearDrawings: () => void;
  setMessage: (message: string | null) => void;
}

export const DRAWING_SOURCE = "drawings-source";

export const useDrawingStore = create<DrawingState>((set, get) => ({
  activeTool: "idle",
  draft: null,
  features: [],
  lastMessage: null,
  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      draft: tool === "idle" ? null : { tool, points: [] },
      lastMessage: tool === "idle" ? null : toolHint(tool)
    }),
  addPoint: (point) => {
    const state = get();
    if (state.activeTool === "idle") return;
    if (state.activeTool === "marker") {
      const feature = createMarkerFeature(point);
      set((s) => ({
        features: [...s.features, feature],
        draft: { tool: "marker", points: [] },
        lastMessage: "Koordinat işaretçisi eklendi."
      }));
      return;
    }
    set((s) => ({
      draft: {
        tool: s.activeTool as Exclude<DrawingTool, "idle">,
        points: [...(s.draft?.points ?? []), point],
        cursor: null
      },
      lastMessage: s.activeTool === "radius" && (s.draft?.points.length ?? 0) === 0 ? "Yarıçapı belirlemek için ikinci noktayı seçin." : toolHint(s.activeTool)
    }));
    const next = get();
    if (next.activeTool === "radius" && (next.draft?.points.length ?? 0) >= 2) next.finishDraft();
  },
  setDraftCursor: (point) =>
    set((s) => (s.draft ? { draft: { ...s.draft, cursor: point } } : s)),
  undoDraftPoint: () =>
    set((s) => s.draft ? { draft: { ...s.draft, points: s.draft.points.slice(0, -1), cursor: null } } : s),
  finishDraft: () => {
    const draft = get().draft;
    if (!draft) return;
    const feature = createDraftFeature(draft);
    if (!feature) {
      set({ lastMessage: minimumPointMessage(draft.tool) });
      return;
    }
    set((s) => ({
      features: [...s.features, feature],
      draft: { tool: draft.tool, points: [] },
      lastMessage: `${feature.properties.label} kaydedildi · ${feature.properties.detail}`
    }));
  },
  clearDrawings: () => set({ features: [], draft: null, activeTool: "idle", lastMessage: "Çizimler temizlendi." }),
  setMessage: (message) => set({ lastMessage: message })
}));

export function drawingFeatureCollection(features: DrawingFeature[], draft: DraftDrawing | null): GeoJSON.FeatureCollection {
  const draftFeature = draft ? createDraftFeature(draft, true) : null;
  return {
    type: "FeatureCollection",
    features: draftFeature ? [...features, draftFeature] : features
  };
}

function createDraftFeature(draft: DraftDrawing, includeCursor = false): DrawingFeature | null {
  const points = includeCursor && draft.cursor ? [...draft.points, draft.cursor] : draft.points;
  if (draft.tool === "distance") {
    if (points.length < 2) return null;
    const meters = pathDistanceMeters(points);
    return {
      type: "Feature",
      geometry: { type: "LineString", coordinates: points },
      properties: { id: cryptoSafeId(), kind: "distance", label: "Mesafe", detail: `${meters.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} m · yaklaşık WGS84` }
    };
  }
  if (draft.tool === "area") {
    if (points.length < 3) return null;
    const area = polygonAreaSquareMeters(points);
    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [closeRing(points)] },
      properties: { id: cryptoSafeId(), kind: "area", label: "Alan", detail: `${area.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m² · yaklaşık WGS84` }
    };
  }
  if (draft.tool === "radius") {
    if (points.length < 2) return null;
    const radius = haversineDistanceMeters(points[0], points[1]);
    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [circlePolygon(points[0], radius)] },
      properties: { id: cryptoSafeId(), kind: "radius", label: "Yarıçap", detail: `${radius.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} m · ${radiusAreaSquareMeters(radius).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m²` }
    };
  }
  if (draft.tool === "marker" && points[0]) return createMarkerFeature(points[0]);
  return null;
}

function createMarkerFeature(point: LngLatTuple): DrawingFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: point },
    properties: {
      id: cryptoSafeId(),
      kind: "marker",
      label: "Koordinat",
      detail: `${point[1].toFixed(6)}, ${point[0].toFixed(6)}`
    }
  };
}

function toolHint(tool: DrawingTool): string | null {
  if (tool === "distance") return "Mesafe için en az iki nokta seçin; bitirmek için Enter veya Bitir.";
  if (tool === "area") return "Alan için en az üç köşe seçin; bitirmek için Enter veya Bitir.";
  if (tool === "radius") return "Merkez noktasını seçin.";
  if (tool === "marker") return "İşaretçi koymak için haritada bir noktaya tıklayın.";
  return null;
}

function minimumPointMessage(tool: DrawingTool): string {
  if (tool === "distance") return "Mesafe ölçümü için en az iki nokta gerekli.";
  if (tool === "area") return "Alan ölçümü için en az üç köşe gerekli.";
  if (tool === "radius") return "Yarıçap için merkez ve kenar noktası gerekli.";
  return "Çizim tamamlanamadı.";
}

function cryptoSafeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `draw-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}
