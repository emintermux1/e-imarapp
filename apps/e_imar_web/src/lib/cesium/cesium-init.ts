"use client";

/**
 * Cesium client-side bootstrap.
 *
 *   import { initCesium } from "./cesium-init";
 *   const Cesium = await initCesium();
 *
 * The function is idempotent and SSR-safe (falls back to a stable promise).
 *
 * Why this shape:
 * - Cesium reads `window.CESIUM_BASE_URL` *eagerly* on import. We MUST set
 *   it before importing the package; we use a dynamic import so the
 *   bootstrap runs in client land only.
 * - The `cesium/Build/Cesium/Widgets/widgets.css` stylesheet must be loaded
 *   for the Viewer chrome (timeline/animation containers, even when hidden
 *   they still receive class-driven layout). We inject it once via a
 *   `<link>` tag rather than relying on CSS imports — that keeps Next.js's
 *   server bundle pristine.
 */

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
    /** Test hook so we can spot multiple init attempts in dev. */
    __cesiumInitPromise?: Promise<typeof import("cesium")>;
  }
}

const BASE_URL = "/cesium/";
const CSS_HREF = `${BASE_URL}Widgets/widgets.css`;

function injectStylesheet() {
  if (typeof document === "undefined") return;
  if (document.head.querySelector(`link[data-cesium-widgets="1"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_HREF;
  link.setAttribute("data-cesium-widgets", "1");
  document.head.appendChild(link);
}

/** Lazy-loads Cesium and returns the module. */
export function initCesium(): Promise<typeof import("cesium")> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("[cesium] initCesium must run in the browser")
    );
  }
  if (window.__cesiumInitPromise) return window.__cesiumInitPromise;

  // Setting the global before the dynamic import is critical.
  if (!window.CESIUM_BASE_URL) {
    window.CESIUM_BASE_URL = BASE_URL;
  }
  injectStylesheet();

  window.__cesiumInitPromise = import("cesium").then((mod) => {
    // Some bundles re-export through a default; normalise.
    return (mod as unknown as { default?: typeof import("cesium") }).default ??
      mod;
  });
  return window.__cesiumInitPromise;
}
