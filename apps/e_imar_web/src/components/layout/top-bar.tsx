"use client";

import * as React from "react";
import {
  Menu,
  HelpCircle,
  UserCircle2,
  Box,
  Layers,
  GitCompareArrows,
  AlertTriangle,
  Map as MapIcon,
  RefreshCw,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/layout/brand-mark";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BasemapSwitcher } from "@/components/map/basemap-switcher";
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb";
import { IconButton } from "@/components/ui/icon-button";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { activeAskiCount, ASKI_POLYGONS } from "@/data/aski-polygons";
import { useAskiStore } from "@/stores/aski-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
import { cn } from "@/lib/utils";

export function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const compareMode = useUIStore((s) => s.compareMode);
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const askiMode = useUIStore((s) => s.askiMode);
  const setAskiMode = useUIStore((s) => s.setAskiMode);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const askiRefresh = useAskiStore((s) => s.refresh);
  const askiApiStatus = useAskiStore((s) => s.status);
  const askiApiMessage = useAskiStore((s) => s.message);
  const liveAskiCount = useAskiStore((s) => s.plans.length);
  const latestRegionsRefresh = useLatestRegionsStore((s) => s.refresh);
  const latestRegionsStatus = useLatestRegionsStore((s) => s.status);
  const latestRegionsCount = useLatestRegionsStore((s) => s.total);
  const latestRegionsMessage = useLatestRegionsStore((s) => s.message);
  const setLatestRegionsPanelOpen = useLatestRegionsStore((s) => s.setPanelOpen);

  const aktifAski = activeAskiCount();

  function focusNearestAski() {
    const next = ASKI_POLYGONS.find((p) => p.durum === "askida");
    if (!next) return;
    const center = midRing(next.ring);
    flyTo({ center, zoom: 14 });
  }

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-14 flex items-stretch bg-surface-2 border-b border-border-subtle"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 min-w-[280px] border-r border-border-subtle">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={onOpenMobileMenu ?? toggleSidebar}
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-1"
        >
          <Menu className="h-4 w-4" />
        </button>
        <BrandMark />
      </div>

      <div className="hidden md:flex items-center gap-3 px-4 border-r border-border-subtle min-w-0">
        <HeaderBreadcrumb />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 px-2 border-l border-border-subtle">
        {/* Live aski pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                setAskiMode(!askiMode);
                if (!askiMode) focusNearestAski();
              }}
              aria-pressed={askiMode}
              className={cn(
                "hidden md:inline-flex items-center gap-1 h-7 px-2 rounded-sm border text-[11px] font-medium transition-colors tabular-nums",
                askiMode
                  ? "border-status-warning text-fg-primary bg-[rgb(var(--status-warning)/0.10)]"
                  : "border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-3.5 w-3.5",
                  askiMode ? "text-status-warning" : "text-fg-muted"
                )}
              />
	              {askiApiStatus === "live" ? liveAskiCount : aktifAski} aktif askı
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
	            <div className="max-w-xs space-y-2">
	              <p>{askiApiMessage ?? (askiMode ? "Askı modunu kapat" : "Askı haritasını aç ve en yakın askıya yakınlaş")}</p>
	              <button
	                type="button"
	                onClick={(event) => {
	                  event.stopPropagation();
	                  void askiRefresh();
	                }}
	                className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-1 text-[11px]"
	              >
	                {askiApiStatus === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
	                Askı planlarını yenile
	              </button>
	            </div>
	          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                setSelectedParcelId(null);
                setRightPanelOpen(true);
                setLatestRegionsPanelOpen(true);
                void latestRegionsRefresh({ limit: 20 });
              }}
              className={cn(
                "hidden md:inline-flex items-center gap-1 h-7 px-2 rounded-sm border text-[11px] font-medium transition-colors",
                latestRegionsStatus === "loading"
                  ? "border-brand-blue/50 bg-[rgb(var(--accent-blue)/0.10)] text-fg-primary"
                  : "border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
              )}
            >
              {latestRegionsStatus === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--accent-blue))]" />
              )}
              En Yeni İmar Bölgeleri
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs space-y-1">
              <p>
                {latestRegionsMessage ?? "Son plan/imar bölgesi kayıtlarını getir ve geometri varsa haritada çiz."}
              </p>
              <p className="text-[11px] text-fg-muted">
                {latestRegionsCount > 0 ? `${latestRegionsCount} kayıt hazır` : "Henüz liste yüklenmedi"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Compare button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                if (mapMode === "3d") return;
                setCompareMode(
                  compareMode === "satellite" ? "off" : "satellite"
                );
              }}
              disabled={mapMode === "3d"}
              aria-pressed={compareMode === "satellite"}
              className={cn(
                "hidden sm:inline-flex items-center gap-1 h-8 px-2 rounded-md border transition-colors text-xs",
                compareMode === "satellite"
                  ? "border-brand-blue/65 bg-[rgb(var(--accent-blue)/0.10)] text-fg-primary"
                  : "border-border-subtle bg-surface-2 text-fg-secondary hover:bg-surface-1 hover:text-fg-primary",
                mapMode === "3d" && "opacity-50 cursor-not-allowed"
              )}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Karşılaştır
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {mapMode === "3d"
              ? "Karşılaştırma için 2D moduna geçin"
              : "Eski/Güncel uydu karşılaştırma sürgüsü"}
          </TooltipContent>
        </Tooltip>

        {/* 2D/3D segmented toggle */}
        <ModeToggle mapMode={mapMode} setMapMode={setMapMode} />

        <span className="hidden sm:inline-flex">
          <BasemapSwitcher />
        </span>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton label="Yardım" variant="ghost">
                <HelpCircle className="h-4 w-4" />
              </IconButton>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Yardım & Klavye Kısayolları</TooltipContent>
        </Tooltip>
        <IconButton label="Profil" variant="ghost">
          <UserCircle2 className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );

  function midRing(ring: [number, number][]): [number, number] {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const [a, b] of ring) {
      sx += a;
      sy += b;
      n += 1;
    }
    return [sx / Math.max(1, n), sy / Math.max(1, n)];
  }
}

function ModeToggle({
  mapMode,
  setMapMode
}: {
  mapMode: "2d" | "3d";
  setMapMode: (m: "2d" | "3d") => void;
}) {
  return (
    <div className="hidden sm:inline-flex relative items-center h-8 rounded-md border border-border-subtle bg-surface-1 p-0.5">
      <ToggleSegment
        active={mapMode === "2d"}
        onClick={() => setMapMode("2d")}
        label="2D"
        icon={<MapIcon className="h-3.5 w-3.5" />}
      />
      <ToggleSegment
        active={mapMode === "3d"}
        onClick={() => setMapMode("3d")}
        label="3D"
        icon={<Box className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function ToggleSegment({
  active,
  onClick,
  label,
  icon
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-7 px-2.5 inline-flex items-center gap-1 rounded-sm text-[11px] font-medium transition-colors",
        active ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary"
      )}
      aria-pressed={active}
      aria-label={`${label} modu`}
    >
      {active && (
        <motion.span
          layoutId="modeToggleIndicator"
          aria-hidden
          className="absolute inset-0 rounded-sm bg-surface-2 shadow-card border border-border-subtle"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
    </button>
  );
}
