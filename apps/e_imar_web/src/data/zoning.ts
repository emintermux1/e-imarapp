import type { ZoningPreset } from "@/types/zoning";

export const ZONING_PRESETS: Record<string, ZoningPreset> = {
  Konut: {
    type: "Konut",
    label: "Konut Alanı",
    fill: "#FFE9A8",
    stroke: "#C39A2B",
    fillVar: "var(--z-konut)",
    strokeVar: "var(--z-konut-stroke)",
    defaultKaks: [1.2, 2.4],
    defaultTaks: [0.25, 0.4]
  },
  Ticaret: {
    type: "Ticaret",
    label: "Ticaret Alanı",
    fill: "#FFCFC0",
    stroke: "#B14D2B",
    fillVar: "var(--z-ticaret)",
    strokeVar: "var(--z-ticaret-stroke)",
    defaultKaks: [2.0, 3.5],
    defaultTaks: [0.4, 0.6]
  },
  Karma: {
    type: "Karma",
    label: "Karma (Konut+Ticaret)",
    fill: "#E2D2F2",
    stroke: "#6E48A8",
    fillVar: "var(--z-karma)",
    strokeVar: "var(--z-karma-stroke)",
    defaultKaks: [1.6, 3.0],
    defaultTaks: [0.3, 0.5]
  },
  Sanayi: {
    type: "Sanayi",
    label: "Sanayi / OSB",
    fill: "#C9D6E0",
    stroke: "#44607A",
    fillVar: "var(--z-sanayi)",
    strokeVar: "var(--z-sanayi-stroke)",
    defaultKaks: [0.8, 1.5],
    defaultTaks: [0.4, 0.55]
  },
  Yesil: {
    type: "Yesil",
    label: "Yeşil Alan / Park",
    fill: "#C6E5C2",
    stroke: "#3D7A33",
    fillVar: "var(--z-yesil)",
    strokeVar: "var(--z-yesil-stroke)",
    defaultKaks: [0.05, 0.15],
    defaultTaks: [0.05, 0.1]
  },
  Tarim: {
    type: "Tarim",
    label: "Tarım Alanı",
    fill: "#E5DDB3",
    stroke: "#87772F",
    fillVar: "var(--z-tarim)",
    strokeVar: "var(--z-tarim-stroke)",
    defaultKaks: [0.05, 0.2],
    defaultTaks: [0.05, 0.15]
  },
  Kamu: {
    type: "Kamu",
    label: "Kamu / Sosyal Donatı",
    fill: "#BFD8F2",
    stroke: "#2F5C8E",
    fillVar: "var(--z-kamu)",
    strokeVar: "var(--z-kamu-stroke)",
    defaultKaks: [0.5, 1.2],
    defaultTaks: [0.25, 0.4]
  },
  Turizm: {
    type: "Turizm",
    label: "Turizm Alanı",
    fill: "#FFD9B3",
    stroke: "#B5651D",
    fillVar: "var(--z-turizm)",
    strokeVar: "var(--z-turizm-stroke)",
    defaultKaks: [1.0, 2.4],
    defaultTaks: [0.3, 0.5]
  }
};

export const ZONING_TYPES = Object.keys(ZONING_PRESETS) as Array<
  keyof typeof ZONING_PRESETS
>;

export function getZoningPreset(type: string): ZoningPreset {
  return ZONING_PRESETS[type] ?? ZONING_PRESETS.Konut;
}
