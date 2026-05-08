import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function safeParseFloat(value: string): number | null {
  const v = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

export const TURKEY_BOUNDS = {
  west: 25.5,
  east: 45.0,
  south: 35.5,
  north: 42.5
};

export function inTurkey(lng: number, lat: number) {
  return (
    lng >= TURKEY_BOUNDS.west &&
    lng <= TURKEY_BOUNDS.east &&
    lat >= TURKEY_BOUNDS.south &&
    lat <= TURKEY_BOUNDS.north
  );
}

export function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 200
) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
