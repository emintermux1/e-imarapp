"use client";

import * as React from "react";
import { Database, Info } from "lucide-react";
import { getParcelSourceMetadata } from "@/data/parcels";
import { useMapStore } from "@/stores/map-store";

const metadata = getParcelSourceMetadata();
const clusterCenters: [number, number][] = [
  [29.018, 41.0876], [29.0086, 41.0671], [29.0648, 40.9673], [29.015, 41.0267], [28.979, 41.0245], [29.106, 40.991], [28.857, 40.977], [28.806, 41.093],
  [32.858, 39.9105], [32.811, 39.9075], [32.79, 39.9705], [32.858, 39.986], [32.64, 39.969],
  [27.144, 38.4295], [27.096, 38.458], [27.218, 38.463], [27.166, 38.462], [27.045, 38.393],
  [28.853, 40.222], [29.061, 40.184], [29.104, 40.188], [30.766, 36.8595], [30.653, 36.861], [30.742, 36.943],
  [35.321, 36.993], [34.595, 36.787], [32.484, 37.949], [35.485, 38.722], [36.286, 41.344], [39.72, 41.004], [37.378, 37.083], [30.516, 39.779], [29.965, 40.766]
];

function isNearDemoCoverage(center: [number, number] | null, zoom: number) {
  if (!center || zoom < 8.5) return true;
  return clusterCenters.some(([lng, lat]) => Math.abs(center[0] - lng) < 0.18 && Math.abs(center[1] - lat) < 0.14);
}

export function DataCoverageBadge() {
  const cursorLngLat = useMapStore((s) => s.cursorLngLat);
  const zoom = useMapStore((s) => s.zoom);
  const sparse = !isNearDemoCoverage(cursorLngLat, zoom);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[min(520px,calc(100vw-2rem))] flex-col gap-2">
      <div className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md border border-border-subtle bg-surface-2/95 px-2.5 py-1.5 shadow-card backdrop-blur-sm">
        <Database className="h-3.5 w-3.5 text-fg-muted" />
        <span className="text-[11px] text-fg-secondary">
          <span className="font-medium text-fg-primary">Demo veri:</span>{" "}
          <span className="tabular-nums">{metadata.featureCount.toLocaleString("tr-TR")}</span> parsel ·{" "}
          <span className="tabular-nums">{metadata.askidaCount.toLocaleString("tr-TR")}</span> askı bölgesi · canlı kaynak bekleniyor
        </span>
      </div>
      {metadata.fallbackReason && (
        <div className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md border border-status-warning/30 bg-surface-2/95 px-2.5 py-1.5 shadow-card">
          <Info className="h-3.5 w-3.5 text-status-warning" />
          <span className="text-[11px] text-fg-secondary">{metadata.fallbackReason} Demo katman gösteriliyor.</span>
        </div>
      )}
      {sparse && (
        <div className="pointer-events-auto max-w-[360px] rounded-md border border-border-subtle bg-surface-2/92 px-2.5 py-2 text-[11px] leading-relaxed text-fg-secondary shadow-card">
          Bu bölgede demo veri seyrek. Canlı belediye/TKGM kaynağı bağlandığında katman dolacak.
        </div>
      )}
    </div>
  );
}
