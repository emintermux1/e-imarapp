"use client";

import dynamic from "next/dynamic";
import * as React from "react";

/**
 * Dynamic Cesium loader — keeps the entire Cesium bundle (~2MB minified)
 * out of the initial page chunk. Loaded only when the user toggles 3D
 * mode in the TopBar.
 */
export const CesiumCanvasLazy = dynamic(
  () => import("./cesium-canvas").then((m) => m.CesiumCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-[1] grid place-items-center bg-[#0B0F14] text-fg-muted">
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-48 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full bg-brand-blue/80"
              style={{
                width: "40%",
                animation: "cesium-loader 1.4s ease-in-out infinite"
              }}
            />
          </div>
          <span className="text-[11px] uppercase tracking-wider">
            3D sahne hazırlanıyor…
          </span>
          <style>{`@keyframes cesium-loader {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(260%); }
          }`}</style>
        </div>
      </div>
    )
  }
);

export const CesiumMiniLazy = dynamic(
  () =>
    import("./cesium-mini-canvas").then((m) => m.CesiumMiniCanvas),
  { ssr: false }
);
