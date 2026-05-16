import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification
} from "maplibre-gl";
import { ZONING_PRESETS } from "@/data/zoning";

export const PARCEL_SOURCE = "parcels";
export const SELECTED_POINT_SOURCE = "selected-point";
export const TURKEY_GRID_SOURCE = "turkey-grid";
export const ASKI_SOURCE = "aski-overlay";
export const ACTIVE_PLAN_SOURCE = "active-plan-overlay";
export const RISK_GRID_SOURCE = "risk-grid";
export const LIVE_SOURCE_REGISTRY_SOURCE = "live-source-registry";
export const TRANSPORT_SOURCE = "transport-lines";
export const MUNICIPALITY_SOURCE = "municipality-boundaries";
export const MUNICIPALITY_COVERAGE_SOURCE = "municipality-coverage";
export const TURKEY_FOCUS_SOURCE = "turkey-focus";
export const LOCATION_LABEL_SOURCE = "location-labels";
export const DRAWING_SOURCE = "drawings-source";
export const SELECTED_AREA_SOURCE = "selected-area";

const zoningCases: (string | string[])[] = ["match", ["get", "zoningType"]];
Object.values(ZONING_PRESETS).forEach((preset) => {
  zoningCases.push(preset.type as string, preset.fill as string);
});
zoningCases.push("#FFE9A8"); // fallback to konut

const strokeCases: (string | string[])[] = ["match", ["get", "zoningType"]];
Object.values(ZONING_PRESETS).forEach((preset) => {
  strokeCases.push(preset.type as string, preset.stroke as string);
});
strokeCases.push("#C39A2B");

export const zoningFillExpression = zoningCases as never;
export const zoningStrokeExpression = strokeCases as never;

export const buildSelectedAreaFillLayer = (
  id = "selected-area-fill"
): FillLayerSpecification => ({
  id,
  type: "fill",
  source: SELECTED_AREA_SOURCE,
  paint: {
    "fill-color": "#EF4444",
    "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.1, 12, 0.16, 16, 0.12] as never
  }
});

export const buildSelectedAreaLineLayer = (
  id = "selected-area-line"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: SELECTED_AREA_SOURCE,
  paint: {
    "line-color": "#EF0000",
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.6, 12, 2.8, 16, 4.2] as never,
    "line-opacity": 0.92
  }
});

export const buildParcelFillLayer = (id = "parcels-fill"): FillLayerSpecification => ({
  id,
  type: "fill",
  source: PARCEL_SOURCE,
  minzoom: 11.4,
  paint: {
    "fill-color": zoningFillExpression,
    "fill-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      11.4,
      [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.78,
        ["boolean", ["feature-state", "multiSelected"], false],
        0.64,
        ["boolean", ["feature-state", "hover"], false],
        0.62,
        0.12
      ],
      13.5,
      [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.78,
        ["boolean", ["feature-state", "multiSelected"], false],
        0.64,
        ["boolean", ["feature-state", "hover"], false],
        0.62,
        0.34
      ],
      16,
      [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.78,
        ["boolean", ["feature-state", "multiSelected"], false],
        0.64,
        ["boolean", ["feature-state", "hover"], false],
        0.62,
        0.45
      ]
    ]
  }
});

export const buildParcelLineLayer = (id = "parcels-line"): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  minzoom: 11.2,
  paint: {
    "line-color": zoningStrokeExpression,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      11.2, 0.25,
      13, 0.7,
      15.5, 1.35,
      17.5, 2.2,
      19, 3.1
    ] as never,
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 11.2, 0.18, 13, 0.58, 15, 0.86, 17, 0.98] as never
  }
});

export const buildParcelHoverHaloLayer = (
  id = "parcels-hover-halo"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  minzoom: 12,
  paint: {
    "line-color": "#C8102E",
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      12,
      ["case", ["boolean", ["feature-state", "hover"], false], 2.4, 0],
      16,
      ["case", ["boolean", ["feature-state", "hover"], false], 5.2, 0],
      19,
      ["case", ["boolean", ["feature-state", "hover"], false], 7.4, 0]
    ] as never,
    "line-blur": 1.4,
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      0.34,
      0
    ] as never
  }
});

export const buildParcelSelectedAccentLayer = (
  id = "parcels-selected-accent"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  paint: {
    "line-color": "#C8102E",
    "line-width": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      2.6,
      ["boolean", ["feature-state", "multiSelected"], false],
      2.1,
      0
    ],
    "line-blur": 0.3,
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      1,
      ["boolean", ["feature-state", "multiSelected"], false],
      0.86,
      0
    ]
  }
});

export const buildParcelSelectedPulseLayer = (
  id = "parcels-selected-pulse"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  minzoom: 12,
  paint: {
    "line-color": [
      "case",
      ["boolean", ["feature-state", "multiSelected"], false],
      "#102A4C",
      "#C8102E"
    ] as never,
    "line-width": [
      "case",
      ["any", ["boolean", ["feature-state", "selected"], false], ["boolean", ["feature-state", "multiSelected"], false]],
      4,
      0
    ] as never,
    "line-blur": 1.2,
    "line-opacity": [
      "case",
      ["any", ["boolean", ["feature-state", "selected"], false], ["boolean", ["feature-state", "multiSelected"], false]],
      0.2,
      0
    ] as never
  }
});


export const buildSelectedPointHaloLayer = (
  id = "selected-point-halo"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: SELECTED_POINT_SOURCE,
  paint: {
    "circle-color": "#38BDF8",
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 18, 12, 26, 17, 34] as never,
    "circle-blur": 0.62,
    "circle-opacity": 0.32,
    "circle-stroke-color": "#E0F2FE",
    "circle-stroke-width": 1,
    "circle-stroke-opacity": 0.24
  }
});

export const buildSelectedPointCoreLayer = (
  id = "selected-point-core"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: SELECTED_POINT_SOURCE,
  paint: {
    "circle-color": "#0EA5E9",
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 12, 7, 17, 9] as never,
    "circle-stroke-color": "#F8FAFC",
    "circle-stroke-width": 2,
    "circle-opacity": 0.98,
    "circle-stroke-opacity": 0.95
  }
});

export const buildParcelLabelLayer = (
  id = "parcels-label"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: PARCEL_SOURCE,
  minzoom: 14.6,
  layout: {
    "text-field": [
      "step",
      ["zoom"],
      ["concat", ["get", "ada"], "/", ["get", "parsel"]],
      16.7,
      [
        "concat",
        ["get", "ada"],
        "/",
        ["get", "parsel"],
        " · ",
        [
          "case",
          ["in", "TİCK", ["coalesce", ["get", "detailedUse"], ""]],
          "TİCK",
          ["in", "MİA", ["coalesce", ["get", "detailedUse"], ""]],
          "MİA",
          ["==", ["get", "zoningType"], "Kamu"],
          "Donatı",
          ["==", ["get", "zoningType"], "Yesil"],
          "Park",
          ["get", "zoningType"]
        ]
      ]
    ],
    "text-font": ["Noto Sans Regular"],
    "text-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      14.6,
      7.5,
      16.5,
      9.5,
      18,
      12.5
    ],
    "text-allow-overlap": false,
    "text-ignore-placement": false,
    "text-padding": ["interpolate", ["linear"], ["zoom"], 14.6, 2, 17, 5] as never,
    "symbol-sort-key": ["get", "yuzolcumuM2"] as never
  },
  paint: {
    "text-color": "#0F172A",
    "text-halo-color": "rgba(255,255,255,0.85)",
    "text-halo-width": 1.4,
    "text-halo-blur": 0.4
  }
});

export const buildLocationCityLabelLayer = (
  id = "location-label-city"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: LOCATION_LABEL_SOURCE,
  minzoom: 4.2,
  maxzoom: 8.6,
  filter: ["==", ["get", "kind"], "il"],
  layout: {
    "text-field": ["get", "label"],
    "text-font": ["Noto Sans SemiBold"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 4.2, 11, 8.5, 14],
    "text-allow-overlap": false,
    "text-padding": 4,
    "text-optional": false
  },
  paint: {
    "text-color": "#0F172A",
    "text-halo-color": "rgba(255,255,255,0.95)",
    "text-halo-width": 1.6,
    "text-halo-blur": 0.35
  }
});

export const buildLocationDistrictLabelLayer = (
  id = "location-label-district"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: LOCATION_LABEL_SOURCE,
  minzoom: 7.2,
  maxzoom: 12.7,
  filter: ["==", ["get", "kind"], "ilce"],
  layout: {
    "text-field": [
      "concat",
      ["get", "label"],
      " · ",
      ["to-string", ["get", "count"]]
    ],
    "text-font": ["Noto Sans Medium"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 7.2, 10.5, 12.6, 13.2],
    "text-allow-overlap": false,
    "text-padding": 4
  },
  paint: {
    "text-color": "#102A4C",
    "text-halo-color": "rgba(255,255,255,0.95)",
    "text-halo-width": 1.5,
    "text-halo-blur": 0.4
  }
});

export const buildLocationNeighborhoodLabelLayer = (
  id = "location-label-neighborhood"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: LOCATION_LABEL_SOURCE,
  minzoom: 11,
  filter: ["==", ["get", "kind"], "mahalle"],
  layout: {
    "text-field": [
      "concat",
      ["get", "label"],
      " · ",
      ["to-string", ["get", "count"]]
    ],
    "text-font": ["Noto Sans Regular"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9.5, 15.8, 12.6],
    "text-allow-overlap": false,
    "text-padding": 3
  },
  paint: {
    "text-color": "#334155",
    "text-halo-color": "rgba(255,255,255,0.96)",
    "text-halo-width": 1.4,
    "text-halo-blur": 0.35
  }
});

export const buildPlanConstraintLineLayer = (
  id = "plan-constraint-line"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  filter: [
    "any",
    ["in", "Koruma", ["coalesce", ["get", "detailedUse"], ""]],
    ["in", "Sit", ["coalesce", ["get", "detailedUse"], ""]],
    ["in", "Dönüşüm", ["coalesce", ["get", "detailedUse"], ""]],
    ["in", "Rezerv", ["coalesce", ["get", "detailedUse"], ""]]
  ],
  paint: {
    "line-color": [
      "case",
      ["in", "Dönüşüm", ["coalesce", ["get", "detailedUse"], ""]],
      "#D97706",
      ["in", "Rezerv", ["coalesce", ["get", "detailedUse"], ""]],
      "#D97706",
      "#0F766E"
    ] as never,
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 16, 2.4] as never,
    "line-opacity": 0.9,
    "line-dasharray": [2, 1.4] as never
  }
});

export const buildPlanDonatiLabelLayer = (
  id = "plan-donati-label"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: PARCEL_SOURCE,
  minzoom: 16.2,
  filter: ["==", ["get", "zoningType"], "Kamu"],
  layout: {
    "text-field": [
      "case",
      ["in", "Eğitim", ["coalesce", ["get", "detailedUse"], ""]],
      "EĞT",
      ["in", "Sağlık", ["coalesce", ["get", "detailedUse"], ""]],
      "SAĞ",
      ["in", "Belediye", ["coalesce", ["get", "detailedUse"], ""]],
      "BLD",
      ["in", "Dini", ["coalesce", ["get", "detailedUse"], ""]],
      "DİN",
      "DON"
    ],
    "text-font": ["Noto Sans Bold"],
    "text-size": 10,
    "text-allow-overlap": false,
    "text-padding": 6
  },
  paint: {
    "text-color": "#102A4C",
    "text-halo-color": "rgba(255,255,255,0.9)",
    "text-halo-width": 1.2
  }
});

export const buildTurkeyFrameLayer = (
  id = "turkey-frame"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: TURKEY_FOCUS_SOURCE,
  minzoom: 4,
  paint: {
    "line-color": "rgb(16,42,76)",
    "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 7, 1.8] as never,
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.7, 8, 0.18] as never,
    "line-dasharray": [2, 2] as never
  }
});

export const buildParcelHoverDotLayer = (
  id = "parcels-hover-dot"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: PARCEL_SOURCE,
  paint: {
    "circle-color": "#C8102E",
    "circle-radius": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      4,
      0
    ],
    "circle-opacity": 0.0
  }
});

export const buildDrawingLineLayer = (
  id = "drawings-line"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: DRAWING_SOURCE,
  filter: ["==", ["geometry-type"], "LineString"],
  layout: {
    "line-cap": "round",
    "line-join": "round"
  },
  paint: {
    "line-color": "#102A4C",
    "line-width": 3,
    "line-opacity": 0.95,
    "line-dasharray": [1, 0.8] as never
  }
});

export const buildDrawingPolygonLayer = (
  id = "drawings-polygon"
): FillLayerSpecification => ({
  id,
  type: "fill",
  source: DRAWING_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: {
    "fill-color": ["case", ["==", ["get", "kind"], "radius"], "#102A4C", "#C8102E"] as never,
    "fill-opacity": 0.12
  }
});

export const buildDrawingPolygonOutlineLayer = (
  id = "drawings-polygon-outline"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: DRAWING_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: {
    "line-color": ["case", ["==", ["get", "kind"], "radius"], "#102A4C", "#C8102E"] as never,
    "line-width": 2.5,
    "line-opacity": 0.95
  }
});

export const buildDrawingPointLayer = (
  id = "drawings-point"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: DRAWING_SOURCE,
  filter: ["==", ["geometry-type"], "Point"],
  paint: {
    "circle-color": "#C8102E",
    "circle-radius": 5,
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": 2,
    "circle-opacity": 0.95
  }
});

export const buildDrawingLabelLayer = (
  id = "drawings-label"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: DRAWING_SOURCE,
  layout: {
    "text-field": ["concat", ["get", "label"], " · ", ["get", "detail"]],
    "text-font": ["Noto Sans Medium"],
    "text-size": 11,
    "text-offset": [0, 1.25],
    "text-anchor": "top",
    "text-allow-overlap": false,
    "text-padding": 4
  },
  paint: {
    "text-color": "#102A4C",
    "text-halo-color": "rgba(255,255,255,0.96)",
    "text-halo-width": 1.5
  }
});

/**
 * Askı overlay — fills colored by status, with a separate dashed-line layer
 * and a hatched pattern overlay for "donusum" status.
 */
export const buildAskiFillLayer = (
  id = "askida-overlay-fill"
): FillLayerSpecification => ({
  id,
  type: "fill",
  source: ASKI_SOURCE,
  paint: {
    "fill-color": [
      "match",
      ["get", "askiStatus"],
      "askida", "rgb(16,42,76)",
      "onaylandi", "rgb(5,150,105)",
      "reddedildi", "rgb(185,28,28)",
      "donusum", "rgb(217,119,6)",
      "rgb(16,42,76)"
    ] as never,
    "fill-opacity": [
      "match",
      ["get", "askiStatus"],
      "askida", 0.25,
      "onaylandi", 0.18,
      "reddedildi", 0.18,
      "donusum", 0.22,
      0.2
    ] as never
  }
});

export const buildAskiLineLayer = (
  id = "askida-overlay-line"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: ASKI_SOURCE,
  paint: {
    "line-color": [
      "match",
      ["get", "askiStatus"],
      "askida", "rgb(16,42,76)",
      "onaylandi", "rgb(5,150,105)",
      "reddedildi", "rgb(185,28,28)",
      "donusum", "rgb(180,83,9)",
      "rgb(16,42,76)"
    ] as never,
    "line-width": 2.2,
    "line-opacity": 0.95,
    "line-dasharray": [3, 2] as never
  }
});

/**
 * Hatched overlay for "donusum" status — drawn as a thin pattern of diagonal
 * line segments. We use a `pattern` PNG we generate in CSS… actually MapLibre
 * doesn't support inline data URIs in line patterns easily, so we simulate
 * hatching with a second translucent fill layer that uses a diagonal
 * `fill-pattern` only when supported. Fallback: a +6% opacity diagonal lines
 * effect via fill-color stippling. To keep this portable, we instead just
 * lift the donusum opacity slightly and rely on the strong outline.
 *
 * For now we add an additional polygon-outline layer with a wider stroke
 * dashed pattern only for the "donusum" features.
 */
export const buildAskiHatchedLayer = (
  id = "askida-overlay-hatched"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: ASKI_SOURCE,
  filter: ["==", ["get", "askiStatus"], "donusum"],
  paint: {
    "line-color": "rgb(180,83,9)",
    "line-width": 5,
    "line-opacity": 0.35,
    "line-dasharray": [1.5, 2] as never
  }
});

export const buildActivePlanPointLayer = (
  id = "yururlukte-plan-points"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: ACTIVE_PLAN_SOURCE,
  paint: {
    "circle-color": "#D20A11",
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3.2, 8, 4.8, 13, 6.4] as never,
    "circle-opacity": 0.92,
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 10, 1.4] as never,
    "circle-stroke-opacity": 0.95
  }
});

export const buildActivePlanHaloLayer = (
  id = "yururlukte-plan-halo"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: ACTIVE_PLAN_SOURCE,
  paint: {
    "circle-color": "#D20A11",
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 7, 8, 10, 13, 14] as never,
    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.18, 10, 0.1] as never
  }
});

/**
 * Risk grid heatmap-ish circle layer. Source data is a synthesised circle
 * grid built client-side (see `data/risk-grid.ts`).
 */
export const buildRiskGridLayer = (
  id = "deprem-risk-grid"
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source: RISK_GRID_SOURCE,
  paint: {
    "circle-color": [
      "match",
      ["get", "severity"],
      5, "#9F1239",
      4, "#DC2626",
      3, "#F97316",
      2, "#FACC15",
      1, "#86EFAC",
      "#94A3B8"
    ] as never,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4, ["+", ["*", ["get", "severity"], 4], 4],
      8, ["+", ["*", ["get", "severity"], 8], 6],
      12, ["+", ["*", ["get", "severity"], 14], 8]
    ] as never,
    "circle-opacity": 0.28,
    "circle-blur": 0.65
  }
});

export const buildTransportLineLayer = (
  id = "metro-hatti"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: TRANSPORT_SOURCE,
  layout: {
    "line-cap": "round",
    "line-join": "round"
  },
  paint: {
    "line-color": "#2563EB",
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6, 1.4,
      11, 2.4,
      15, 4.2
    ] as never,
    "line-opacity": 0.82,
    "line-blur": 0.15
  }
});

export const buildMunicipalityBoundaryLayer = (
  id = "belediye-sinirlari"
): LineLayerSpecification => ({
  id,
  type: "line",
  source: MUNICIPALITY_SOURCE,
  paint: {
    "line-color": "#0F766E",
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6, 1,
      12, 1.6,
      16, 2.2
    ] as never,
    "line-opacity": 0.75,
    "line-dasharray": [3, 2] as never
  }
});

export const buildMunicipalityCoverageCircleLayer = (
  id = "municipality-coverage-circles",
  source = MUNICIPALITY_COVERAGE_SOURCE
): CircleLayerSpecification => ({
  id,
  type: "circle",
  source,
  minzoom: 5,
  maxzoom: 11.2,
  paint: {
    "circle-color": [
      "match",
      ["get", "coverageStatus"],
      "public_source", "#0EA5E9",
      "protected", "#F59E0B",
      "registered", "#0F766E",
      "#64748B"
    ] as never,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      5, 4,
      8, 6,
      11, 9
    ] as never,
    "circle-opacity": 0.85,
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": 1.25
  }
});

export const buildMunicipalityCoverageLabelLayer = (
  id = "municipality-coverage-labels",
  source = MUNICIPALITY_COVERAGE_SOURCE
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source,
  minzoom: 6,
  maxzoom: 11.5,
  layout: {
    "text-field": ["coalesce", ["get", "label"], ["get", "name"]],
    "text-font": ["Noto Sans Regular"],
    "text-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6, 9,
      11, 12
    ] as never,
    "text-offset": [0, 1.0] as never,
    "text-anchor": "top",
    "text-allow-overlap": false
  },
  paint: {
    "text-color": "#0F172A",
    "text-halo-color": "rgba(255,255,255,0.92)",
    "text-halo-width": 1.6
  }
});

export interface LayerDescriptor {
  id: string;
  label: string;
  description: string;
  defaultVisible: boolean;
  defaultOpacity: number;
  group: "İmar" | "Risk" | "Uydu / Hibrit" | "Tarihsel" | "Belediye" | "Çevre" | "Altyapı" | "İdari";
  status: "official" | "public_metadata" | "demo" | "derived" | "not_ready";
  emptyReason?: string;
}

/** UI-side layer descriptors. The map canvas reacts to visibility/opacity
 * changes by toggling matching layer ids. */
export const LAYER_DESCRIPTORS: LayerDescriptor[] = [
  {
    id: "parcels-fill",
    label: "Parsel Dolgu",
    description: "Plan kullanım rengiyle parsel dolgu yüzeyi",
    defaultVisible: true,
    defaultOpacity: 0.55,
    group: "İmar",
    status: "demo",
    emptyReason: "Canlı belediye/TKGM parsel akışı bağlı değilse yerel örnek parsel geometrisi ayrı etiketle gösterilir."
  },
  {
    id: "parcels-line",
    label: "Parsel Sınırları",
    description: "Parsel kenar çizgileri",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "İmar",
    status: "demo"
  },
  {
    id: "parcels-selected-accent",
    label: "Seçim Vurgusu",
    description: "Tekil ve çoklu parsel seçimi için kurumsal sınır vurgusu",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "İmar",
    status: "derived"
  },
  {
    id: "parcels-label",
    label: "Ada/Parsel Etiketleri",
    description: "Yüksek zoom seviyelerinde ada/parsel numaraları",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "İmar",
    status: "derived"
  },
  {
    id: "drawings-line",
    label: "Ölçüm Çizimleri",
    description: "Mesafe, alan, yarıçap ve koordinat işaretleme çizimleri",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "İmar",
    status: "derived"
  },
  {
    id: "yururlukte-plan-points",
    label: "Yürürlükteki Planlar",
    description: "Türkiye genelindeki yürürlükteki NİP/UİP kayıt noktaları",
    defaultVisible: true,
    defaultOpacity: 0.95,
    group: "Belediye",
    status: "public_metadata"
  },
  {
    id: "askida-overlay",
    label: "Askı Planları",
    description: "Askıdaki, onaylanmış ve reddedilmiş plan kapsamları",
    defaultVisible: false,
    defaultOpacity: 0.85,
    group: "Belediye",
    status: "demo",
    emptyReason: "Canlı askı servisi yoksa yalnızca public kayıt/türetilmiş askı kapsamları görünür."
  },
  {
    id: "plan-constraint-line",
    label: "Plan Kısıtları",
    description: "Koruma, sit, dönüşüm ve rezerv sınır çizgileri",
    defaultVisible: true,
    defaultOpacity: 0.9,
    group: "İmar",
    status: "derived"
  },
  {
    id: "plan-donati-label",
    label: "Donatı Kısaltmaları",
    description: "Eğitim, sağlık, belediye gibi donatı etiketleri",
    defaultVisible: true,
    defaultOpacity: 0.85,
    group: "İmar",
    status: "derived"
  },
  {
    id: "deprem-risk-grid",
    label: "Deprem Risk Haritası",
    description: "AFAD referanslı örnek grid üzerinden türetilmiş deprem risk dağılımı",
    defaultVisible: false,
    defaultOpacity: 0.55,
    group: "Risk",
    status: "derived"
  },
  {
    id: "metro-hatti",
    label: "Metro / Raylı Sistem",
    description: "Örnek metro ve raylı sistem koridorları",
    defaultVisible: true,
    defaultOpacity: 0.9,
    group: "Altyapı",
    status: "demo"
  },
  {
    id: "belediye-sinirlari",
    label: "İlçe / Belediye Sınırları",
    description: "Örnek ilçe ve belediye sınır çizgileri",
    defaultVisible: true,
    defaultOpacity: 0.75,
    group: "İdari",
    status: "public_metadata"
  },
  {
    id: "live-source-markers",
    label: "Canlı Kaynak Noktaları",
    description: "Seed edilen gerçek belediye/TKGM/e-Plan/TUCBS portal işaretleri",
    defaultVisible: true,
    defaultOpacity: 0.9,
    group: "İdari",
    status: "public_metadata"
  },
  {
    id: "turkey-frame",
    label: "Türkiye Çalışma Çerçevesi",
    description: "Ulusal odak sınırı ve çalışma alanı kılavuzu",
    defaultVisible: true,
    defaultOpacity: 0.7,
    group: "İdari",
    status: "derived"
  },
  {
    id: "flood-risk",
    label: "Sel / Taşkın Riski",
    description: "DSİ taşkın veri servisi bağlanmadı; parsel detayında örnek risk alanı ayrı etiketlenir.",
    defaultVisible: false,
    defaultOpacity: 0.5,
    group: "Risk",
    status: "not_ready",
    emptyReason: "DSİ taşkın WMS/WFS kaynağı bu ortamda bağlı değil. Veri hazır olmadan katman çizilmez."
  },
  {
    id: "slope-analysis",
    label: "Eğim Analizi",
    description: "Sayısal yükseklik modeli bağlanınca eğim yüzdesi raster/vektör olarak açılır.",
    defaultVisible: false,
    defaultOpacity: 0.6,
    group: "Risk",
    status: "not_ready",
    emptyReason: "DEM/eğim servisi yok; uydurma eğim rasterı üretilmedi."
  },
  {
    id: "satellite-hybrid",
    label: "Uydu / Hibrit Altlık",
    description: "Uydu karşılaştırma sürgüsü üzerinden kontrollü açılır; lisanslı tile akışı bekleniyor.",
    defaultVisible: false,
    defaultOpacity: 0.85,
    group: "Uydu / Hibrit",
    status: "not_ready",
    emptyReason: "Lisanslı uydu tile endpoint'i bağlı değil. Mevcut karşılaştırma yüzeyi placeholder olarak çalışır."
  },
  {
    id: "historical-plan-snapshots",
    label: "Tarihsel Plan Snapshot",
    description: "Timeline yılına göre örnek snapshot renkleri; resmi arşiv katmanı değildir.",
    defaultVisible: false,
    defaultOpacity: 0.75,
    group: "Tarihsel",
    status: "demo",
    emptyReason: "Timeline açıldığında örnek snapshot renklendirmesi parsel dolgusuna uygulanır."
  },
  {
    id: "municipal-projects",
    label: "Belediye Projeleri",
    description: "Yakın yatırım/proje kayıtları için belediye proje akışı bekleniyor.",
    defaultVisible: false,
    defaultOpacity: 0.7,
    group: "Belediye",
    status: "not_ready",
    emptyReason: "Belediye proje registry kaynağı bağlı değil; yakın proje uydurulmaz."
  },
  {
    id: "urban-transformation",
    label: "Kentsel Dönüşüm / Rezerv",
    description: "Plan kısıt çizgilerinden türetilen dönüşüm/rezerv sinyalleri.",
    defaultVisible: true,
    defaultOpacity: 0.9,
    group: "Belediye",
    status: "derived"
  },
  {
    id: "infrastructure-corridors",
    label: "Altyapı Koridorları",
    description: "İSKİ/AYEDAŞ/BOTAŞ vb. resmi altyapı koridorları için entegrasyon bekleniyor.",
    defaultVisible: false,
    defaultOpacity: 0.7,
    group: "Altyapı",
    status: "not_ready",
    emptyReason: "Resmi altyapı servisleri bağlı değil; güvenlik açısından uydurma çizgi üretilmedi."
  },
  {
    id: "road-width",
    label: "Yol Genişliği / Cephe",
    description: "Parseldeki yol cephesi mevcut kayıt alanından gösterilir; yol genişliği kaynağı bekleniyor.",
    defaultVisible: false,
    defaultOpacity: 0.7,
    group: "Altyapı",
    status: "derived",
    emptyReason: "Yol genişliği vektörü yok; yalnızca parsel detayındaki yol cephesi alanı gösterilir."
  },
  {
    id: "noise-traffic",
    label: "Gürültü / Trafik",
    description: "Çevresel gürültü ve trafik yoğunluğu katmanı resmi kaynak bağlanınca açılır.",
    defaultVisible: false,
    defaultOpacity: 0.55,
    group: "Çevre",
    status: "not_ready",
    emptyReason: "Gürültü/trafik servisi yok; parselde örnek skor varsa ayrıca örnek veri etiketiyle gösterilir."
  },
  {
    id: "solar-shadow",
    label: "Güneş / Gölge",
    description: "3D Cesium güneş saatiyle hesaplanan analiz; 2D katman olarak hazır değil.",
    defaultVisible: false,
    defaultOpacity: 0.6,
    group: "Çevre",
    status: "derived",
    emptyReason: "2D gölge rasterı yok; 3D modda güneş/gölge kontrolleri kullanılabilir."
  },
  {
    id: "green-space",
    label: "Yeşil Alan",
    description: "Plan kullanım sınıfı ve çevre mesafelerinden örnek/türetilmiş yeşil alan görünümü.",
    defaultVisible: false,
    defaultOpacity: 0.65,
    group: "Çevre",
    status: "derived",
    emptyReason: "Resmi park/yeşil alan katmanı bağlı değil; yalnızca parsel sınıfı ve örnek mesafe alanları mevcut."
  }
];
