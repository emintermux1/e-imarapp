import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification
} from "maplibre-gl";
import { ZONING_PRESETS } from "@/data/zoning";

export const PARCEL_SOURCE = "parcels";
export const TURKEY_GRID_SOURCE = "turkey-grid";

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
  minzoom: 14.5,
  layout: {
    "text-field": [
      "concat",
      ["get", "ada"],
      "/",
      ["get", "parsel"]
    ],
    "text-font": ["Noto Sans Regular"],
    "text-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      14.5,
      9,
      18,
      13
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
    label: "Askıdaki Planlar",
    description: "Şu anda askıda olan plan parselleri",
    defaultVisible: false,
    defaultOpacity: 0.85,
    group: "Plan"
  },
  {
    id: "deprem-risk",
    label: "Deprem Risk Katmanı",
    description: "AFAD bazlı parsel deprem risk gradyanı",
    defaultVisible: false,
    defaultOpacity: 0.65,
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
