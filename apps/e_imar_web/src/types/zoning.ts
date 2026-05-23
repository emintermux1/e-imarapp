import type { ZoningType } from "./parcel";

export interface ZoningPreset {
  type: ZoningType;
  label: string;
  shortLabel?: string;
  subcategories?: string[];
  commonConstraints?: string[];
  /** Hex without alpha, used for fills */
  fill: string;
  /** Hex without alpha, used for strokes */
  stroke: string;
  /** Tailwind class names if needed in JSX */
  fillVar: string;
  strokeVar: string;
  /** Default emsal range used when generating mock data */
  defaultKaks: [number, number];
  defaultTaks: [number, number];
}
