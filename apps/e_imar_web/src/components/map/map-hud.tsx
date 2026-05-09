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
  Map as MapIcon,
  Info,
  Ruler,
  Pentagon,
  CircleDot,
  Trash2,
  Camera,
  Share2,
  Check,
  MousePointer2,
  GitCompareArrows
} from "lucide-react";
import { motion } from "framer-motion";
import { IconButton } from "@/components/ui/icon-button";
import { useUIStore } from "@/stores/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BASEMAPS } from "@/lib/maplibre/styles";
import { LocationExplorerPopover } from "@/components/map/location-explorer-popover";
import { useMapStore } from "@/stores/map-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
import { useDrawingStore, type DrawingTool } from "@/stores/drawing-store";
import { buildShareMapUrl } from "@/lib/map/share-link";

export function MapHud({
  cursorReadoutRef,
  zoomReadoutRef
}: {
  cursorReadoutRef: React.RefObject<HTMLSpanElement>;
  zoomReadoutRef: React.RefObject<HTMLSpanElement>;
}) {
  const basemap = useMapStore((s) => s.basemap);
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const bearing = useMapStore((s) => s.bearing);
  const selectedLatestRegion = useLatestRegionsStore((s) => s.selectedRegion);
  const multiSelectedParcelIds = useMapStore((s) => s.multiSelectedParcelIds);
  const selectionNotice = useMapStore((s) => s.selectionNotice);
  const clearMultiSelection = useMapStore((s) => s.clearMultiSelection);
  const zoom = useMapStore((s) => s.zoom);
  const cursorLngLat = useMapStore((s) => s.cursorLngLat);
  const activeTool = useDrawingStore((s) => s.activeTool);
  const setActiveTool = useDrawingStore((s) => s.setActiveTool);
  const finishDraft = useDrawingStore((s) => s.finishDraft);
  const clearDrawings = useDrawingStore((s) => s.clearDrawings);
  const drawingMessage = useDrawingStore((s) => s.lastMessage);
  const setDrawingMessage = useDrawingStore((s) => s.setMessage);
  const mapMode = useUIStore((s) => s.mapMode);
  const askiMode = useUIStore((s) => s.askiMode);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const setTimelineYear = useUIStore((s) => s.setTimelineYear);
  const setTimelineCompareYear = useUIStore((s) => s.setTimelineCompareYear);
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

  async function copyShareLink() {
    const map = (window as Window & { __mlMap?: { getCenter: () => { lng: number; lat: number }; getZoom: () => number } }).__mlMap;
    const center = map?.getCenter();
    const ids = [...multiSelectedParcelIds];
    if (selectedParcelId && !ids.includes(selectedParcelId)) ids.unshift(selectedParcelId);
    const url = buildShareMapUrl(
      {
        center: center ? [center.lng, center.lat] : cursorLngLat ?? [35, 39],
        zoom: map?.getZoom() ?? zoom,
        basemap,
        selectedParcelIds: ids
      },
      window.location.href
    );
    try {
      await navigator.clipboard.writeText(url);
      setDrawingMessage("Paylaşılabilir harita bağlantısı kopyalandı.");
    } catch {
      setDrawingMessage(url);
    }
  }

  function captureScreenshot() {
    const map = (window as Window & { __mlMap?: { getCanvas: () => HTMLCanvasElement } }).__mlMap;
    const canvas = map?.getCanvas();
    if (!canvas) {
      setDrawingMessage("Ekran görüntüsü not_ready: MapLibre canvas bulunamadı.");
      return;
    }
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `e-imar-harita-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      setDrawingMessage("Harita ekran görüntüsü indirildi.");
    } catch {
      setDrawingMessage("Ekran görüntüsü not_ready: MapLibre canvas capture için preserveDrawingBuffer gerekir.");
    }
  }

  function toolButton(tool: Exclude<DrawingTool, "idle">, label: string, icon: React.ReactNode) {
    const active = activeTool === tool;
    return (
      <Tooltip delayDuration={250} key={tool}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => setActiveTool(active ? "idle" : tool)}
            className={cn(
              "h-11 w-11 inline-flex items-center justify-center border-b border-border-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-blue))]",
              active ? "bg-[rgb(var(--accent-blue)/0.12)] text-[rgb(var(--accent-blue))]" : "bg-surface-2 text-fg-secondary hover:bg-surface-3"
            )}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    );
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
        <MapContextHint
          selectedParcelId={selectedParcelId}
          latestRegionLabel={selectedLatestRegion?.label}
          latestRegionHasGeometry={selectedLatestRegion?.has_geometry}
          askiMode={askiMode}
        />
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
        <div className="flex flex-col rounded-md border border-border-strong bg-surface-2 shadow-card overflow-hidden">
          {toolButton("distance", "Mesafe ölç", <Ruler className="h-4 w-4" />)}
          {toolButton("area", "Alan poligonu ölç", <Pentagon className="h-4 w-4" />)}
          {toolButton("radius", "Yarıçap çiz", <CircleDot className="h-4 w-4" />)}
          {toolButton("marker", "Koordinat işaretçisi", <MapPin className="h-4 w-4" />)}
          <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Çizimi bitir" onClick={finishDraft} className="h-11 w-11 inline-flex items-center justify-center border-b border-border-subtle bg-surface-2 text-fg-secondary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-blue))]">
                <Check className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Aktif ölçümü bitir</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Çizimleri temizle" onClick={clearDrawings} className="h-11 w-11 inline-flex items-center justify-center bg-surface-2 text-fg-secondary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-blue))]">
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Çizimleri temizle</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col rounded-md border border-border-strong bg-surface-2 shadow-card overflow-hidden">
          <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Ekran görüntüsü indir" onClick={captureScreenshot} className="h-11 w-11 inline-flex items-center justify-center border-b border-border-subtle bg-surface-2 text-fg-secondary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-blue))]">
                <Camera className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Canvas görüntüsü indir</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Harita bağlantısı kopyala" onClick={copyShareLink} className="h-11 w-11 inline-flex items-center justify-center bg-surface-2 text-fg-secondary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-blue))]">
                <Share2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Merkez/zoom/basemap/seçimler ile link kopyala</TooltipContent>
          </Tooltip>
        </div>
        {(drawingMessage || selectionNotice || multiSelectedParcelIds.length > 0 || activeTool !== "idle") && (
          <div className="max-w-[240px] rounded-md border border-border-strong bg-surface-2/95 px-3 py-2 text-[11px] text-fg-secondary shadow-sheet backdrop-blur-[3px]">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-fg-muted"><MousePointer2 className="h-3 w-3" /> Seçim/ölçüm</span>
              {multiSelectedParcelIds.length > 0 && <button type="button" onClick={clearMultiSelection} className="text-[10px] font-medium text-fg-primary underline underline-offset-2">Temizle</button>}
            </div>
            <div className="mt-1 tabular-nums text-fg-primary">{multiSelectedParcelIds.length} parsel seçili</div>
            <p className="mt-1 leading-relaxed">{selectionNotice ?? drawingMessage ?? (activeTool !== "idle" ? "Haritada nokta seçin. Ölçümler yaklaşık WGS84 hesabıdır." : "Shift+sürükle ile dikdörtgen seçim yapın.")}</p>
            <button
              type="button"
              disabled={multiSelectedParcelIds.length < 2}
              onClick={() => {
                setTimelineYear(2017);
                setTimelineCompareYear(2026);
                setCompareMode("timeMachine");
              }}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-sm border border-border-subtle bg-surface-1 px-2 py-1 text-[10px] uppercase tracking-wider text-fg-muted hover:text-fg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Karşılaştırmayı başlat
            </button>
          </div>
        )}
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

function MapContextHint({
  selectedParcelId,
  latestRegionLabel,
  latestRegionHasGeometry,
  askiMode
}: {
  selectedParcelId: string | null;
  latestRegionLabel?: string;
  latestRegionHasGeometry?: boolean;
  askiMode: boolean;
}) {
  const copy = selectedParcelId
    ? "Seçili parsel vurgulanıyor; sağ panel resmi/veri kaynağı durumunu gösterir."
    : latestRegionLabel
    ? latestRegionHasGeometry
      ? "Yalnız seçili yeni imar bölgesi çiziliyor; listeyi değiştirerek geometriyi yenileyin."
      : "Seçili yeni bölgenin geometrisi yok; kayıt panelde kalır, harita kirletilmez."
    : askiMode
    ? "Askı modu açık; aktif askı poligonları tıklanabilir."
    : "Arama yapın, askı modunu açın veya tek bir yeni imar bölgesi seçin.";
  return (
    <div className="pointer-events-none hidden max-w-[360px] items-start gap-2 rounded-md border border-border-subtle bg-surface-2/95 px-2.5 py-2 text-[11px] leading-snug text-fg-secondary shadow-pop backdrop-blur-[2px] md:flex">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--accent-blue))]" />
      <span className="line-clamp-2">{copy}</span>
    </div>
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
