import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification
} from "maplibre-gl";
import { ZONING_PRESETS } from "@/data/zoning";

export const PARCEL_SOURCE = "parcels";
export const TURKEY_GRID_SOURCE = "turkey-grid";
export const ASKI_SOURCE = "aski-overlay";
export const RISK_GRID_SOURCE = "risk-grid";
export const TURKEY_FOCUS_SOURCE = "turkey-focus";

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

export const buildParcelFillLayer = (id = "parcels-fill"): FillLayerSpecification => ({
  id,
  type: "fill",
  source: PARCEL_SOURCE,
  paint: {
    "fill-color": zoningFillExpression,
    "fill-opacity": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      0.78,
      ["boolean", ["feature-state", "hover"], false],
      0.62,
      0.45
    ]
  }
});

export const buildParcelLineLayer = (id = "parcels-line"): LineLayerSpecification => ({
  id,
  type: "line",
  source: PARCEL_SOURCE,
  paint: {
    "line-color": zoningStrokeExpression,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10, 0.6,
      14, 1.2,
      17, 1.8,
      19, 2.4
    ] as never,
    "line-opacity": 0.95
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
      0
    ],
    "line-blur": 0.3,
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      1,
      0
    ]
  }
});

export const buildParcelLabelLayer = (
  id = "parcels-label"
): SymbolLayerSpecification => ({
  id,
  type: "symbol",
  source: PARCEL_SOURCE,
  minzoom: 15.5,
  layout: {
    "text-field": [
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
    ],
    "text-font": ["Noto Sans Regular"],
    "text-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15.5,
      8,
      18,
      12
    ],
    "text-allow-overlap": false,
    "text-padding": 4
  },
  paint: {
    "text-color": "#0F172A",
    "text-halo-color": "rgba(255,255,255,0.85)",
    "text-halo-width": 1.4,
    "text-halo-blur": 0.4
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
    "line-dasharray": [
      "case",
      ["any", ["in", "Dönüşüm", ["coalesce", ["get", "detailedUse"], ""]], ["in", "Rezerv", ["coalesce", ["get", "detailedUse"], ""]]],
      ["literal", [2, 1.4]] as unknown as never,
      ["literal", [1, 0]] as unknown as never
    ] as never
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
    "line-dasharray": [
      "match",
      ["get", "askiStatus"],
      "askida", ["literal", [3, 2]] as unknown as never,
      ["literal", [1, 0]] as unknown as never
    ] as never
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

export interface LayerDescriptor {
  id: string;
  label: string;
  description: string;
  defaultVisible: boolean;
  defaultOpacity: number;
  group: "Parsel" | "Plan" | "Risk" | "Çevre" | "İdari";
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
    group: "Parsel"
  },
  {
    id: "parcels-line",
    label: "Parsel Sınırları",
    description: "Parsel kenar çizgileri",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "Parsel"
  },
  {
    id: "parcels-label",
    label: "Ada/Parsel Etiketleri",
    description: "Yüksek zoom seviyelerinde ada/parsel numaraları",
    defaultVisible: true,
    defaultOpacity: 1,
    group: "Parsel"
  },
  {
    id: "askida-overlay",
    label: "Askı Planları",
    description: "Askıdaki, onaylanmış ve reddedilmiş plan kapsamları",
    defaultVisible: false,
    defaultOpacity: 0.85,
    group: "Plan"
  },
  {
    id: "deprem-risk-grid",
    label: "Risk Haritası",
    description: "AFAD bazlı bölgesel risk dağılımı (mock grid)",
    defaultVisible: false,
    defaultOpacity: 0.55,
    group: "Risk"
  },
  {
    id: "metro-hatti",
    label: "Metro / Raylı Sistem",
    description: "Yakınlık çizgileri (mock)",
    defaultVisible: false,
    defaultOpacity: 0.9,
    group: "Çevre"
  },
  {
    id: "belediye-sinirlari",
    label: "İlçe / Belediye Sınırları",
    description: "İdari sınırlar (mock)",
    defaultVisible: false,
    defaultOpacity: 0.75,
    group: "İdari"
  }
];
