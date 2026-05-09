"use client";

import * as React from "react";
import {
  Plus,
  Minus,
  Compass,
  MapPin,
  Crosshair,
  Box,
  Locate,
  Map as MapIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { IconButton } from "@/components/ui/icon-button";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BASEMAPS } from "@/lib/maplibre/styles";
import { LocationExplorerPopover } from "@/components/map/location-explorer-popover";

export function MapHud({
  cursorReadoutRef,
  zoomReadoutRef
}: {
  cursorReadoutRef: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef: React.RefObject<HTMLSpanElement>;
}) {
  const basemap = useMapStore((s) => s.basemap);
  const bearing = useMapStore((s) => s.bearing);
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const [locationStatus, setLocationStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    let timeoutId: number | undefined;
    const onStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setLocationStatus(detail?.message ?? null);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setLocationStatus(null), 3200);
    };
    window.addEventListener("eimar:map:location-status", onStatus);
    return () => {
      window.removeEventListener("eimar:map:location-status", onStatus);
      window.clearTimeout(timeoutId);
    };
  }, []);

  function emitMapControl(action: "in" | "out" | "reset" | "north" | "locate") {
    const evt = new CustomEvent("eimar:map:control", { detail: { action } });
    window.dispatchEvent(evt);
  }

  return (
    <>
      {/* Top-left: mode + basemap chip */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <ChipPill>
          <span className="text-fg-muted">Mod</span>
          <span
            aria-hidden
            className={cn(
              "block h-1 w-1 rounded-full",
              mapMode === "3d" ? "bg-brand-blue" : "bg-status-success"
            )}
          />
          <span className="font-medium">
            {mapMode === "3d" ? "3D · Cesium" : "2D · Vektör"}
          </span>
        </ChipPill>
        <ChipPill>
          <span className="text-fg-muted">Çalışma alanı</span>
          <span className="font-medium">Türkiye</span>
          <span className="text-fg-muted">·</span>
          <span className="text-fg-secondary">{BASEMAPS[basemap].description}</span>
        </ChipPill>
      </div>

      {/* Top-right: zoom controls + compass + 3D toggle */}
      <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
        <div className="flex flex-col rounded-md border border-border-strong bg-surface-2 shadow-card overflow-hidden">
          <IconButton
            label="Yakınlaştır"
            variant="ghost"
            tooltipSide="left"
            onClick={() => emitMapControl("in")}
            className="rounded-none border-b border-border-subtle h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Uzaklaştır"
            variant="ghost"
            tooltipSide="left"
            onClick={() => emitMapControl("out")}
            className="rounded-none h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </IconButton>
        </div>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Kuzeye çevir"
              onClick={() => emitMapControl("north")}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border-strong bg-surface-2 shadow-card text-fg-secondary hover:bg-surface-3"
            >
              <span
                className="inline-block"
                style={{
                  transform: `rotate(${-bearing}deg)`,
                  transition: "transform 200ms ease-out"
                }}
              >
                <Compass className="h-4 w-4" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Kuzeye çevir · {bearing.toFixed(0)}°</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={mapMode === "3d" ? "2D moduna geç" : "3D moduna geç"}
              aria-pressed={mapMode === "3d"}
              onClick={() => setMapMode(mapMode === "3d" ? "2d" : "3d")}
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md border bg-surface-2 shadow-card transition-colors",
                mapMode === "3d"
                  ? "border-brand-blue/60 text-fg-primary"
                  : "border-border-strong text-fg-secondary hover:bg-surface-3"
              )}
            >
              <motion.span
                key={mapMode}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.16 }}
              >
                {mapMode === "3d" ? (
                  <MapIcon className="h-4 w-4" />
                ) : (
                  <Box className="h-4 w-4" />
                )}
              </motion.span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {mapMode === "3d" ? "2D moduna geç" : "3D moduna geç"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Bottom-right floating cluster */}
      <div className="pointer-events-auto absolute right-3 bottom-3 z-10 hidden md:flex flex-col items-end gap-1.5">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Konumum"
              onClick={() => emitMapControl("locate")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border-strong bg-surface-2 shadow-card text-fg-secondary hover:bg-surface-3"
            >
              <Locate className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">{locationStatus ?? "Mevcut konumu göster"}</TooltipContent>
        </Tooltip>
        {locationStatus && (
          <span
            role="status"
            className="max-w-[160px] rounded-md border border-border-subtle bg-surface-2/95 px-2 py-1 text-[11px] text-fg-secondary shadow-card"
          >
            {locationStatus}
          </span>
        )}
        <LocationExplorerPopover />
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Türkiye genel görünümü"
              onClick={() => emitMapControl("reset")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border-strong bg-surface-2 shadow-card text-fg-secondary hover:bg-surface-3"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Türkiye geneline dön</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Ölçü aracı (yakında)"
              disabled
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border-subtle bg-surface-1 text-fg-muted/70 cursor-not-allowed"
            >
              <MapPin className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Ölçü aracı — yakında</TooltipContent>
        </Tooltip>
      </div>

      {/* Bottom-left: scale + coords + crs */}
      <div className="pointer-events-none absolute left-3 bottom-3 z-10 flex items-end gap-2 text-[11px] tabular-nums text-fg-secondary">
        <ScaleBar />
        <ChipPill>
          <span className="text-fg-muted">İmleç</span>
          <span ref={cursorReadoutRef} className="font-medium tabular-nums text-fg-primary">
            —
          </span>
        </ChipPill>
        <ChipPill>
          <span className="text-fg-muted">Zoom</span>
          <span ref={zoomReadoutRef} className="font-medium tabular-nums text-fg-primary">
            5.50
          </span>
        </ChipPill>
        <ChipPill>
          <span className="text-fg-muted">CRS</span>
          <span className="font-medium text-fg-primary">Türkiye çalışma alanı · WGS84 / EPSG:4326</span>
        </ChipPill>
      </div>
    </>
  );

}

function ChipPill({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 h-6 rounded-sm border border-border-subtle bg-surface-2/95 backdrop-blur-[2px] text-[11px] text-fg-secondary shadow-card",
        className
      )}
    >
      {children}
    </span>
  );
}

function ScaleBar() {
  return (
    <span className="pointer-events-none inline-flex items-end gap-1 h-6">
      <span aria-hidden className="block h-2 w-12 border-l border-r border-b border-fg-secondary/70" />
      <span className="text-[10px] uppercase tracking-wider text-fg-muted leading-none translate-y-[-2px]">
        ~ ölçek
      </span>
    </span>
  );
}
