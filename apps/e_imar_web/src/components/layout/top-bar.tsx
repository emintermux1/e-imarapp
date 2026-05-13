"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  HelpCircle,
  UserCircle2,
  Box,
  Database,
  Activity,
  GitCompareArrows,
  AlertTriangle,
  Map as MapIcon,
  RefreshCw,
  Loader2,
  MapPinned
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
import { activeAskiCount as fallbackAskiCount, ASKI_POLYGONS } from "@/data/aski-polygons";
import { ASKI_LIST } from "@/data/aski-list";
import { useAskiStore } from "@/stores/aski-store";
import { useActiveAski, useSourceHealth } from "@/lib/api/hooks";
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
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const askiRefresh = useAskiStore((s) => s.refresh);
  const askiApiStatus = useAskiStore((s) => s.status);
  const askiApiMessage = useAskiStore((s) => s.message);
  const liveAskiCount = useAskiStore((s) => s.plans.length);
  const askiQuery = useActiveAski();
  const healthQuery = useSourceHealth();
  const backendAskiCount = askiQuery.data?.ok ? askiQuery.data.data.count : null;
  const backendAskiOffline = !askiQuery.data?.ok || askiQuery.data.data.status !== "ok";
  const healthRollup = healthQuery.data?.ok ? healthQuery.data.data.rollup : null;
  const okSources = healthRollup?.ok ?? 0;
  const totalSources = healthQuery.data?.ok ? healthQuery.data.data.total : 0;
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const latestRegionsRefresh = useLatestRegionsStore((s) => s.refresh);
  const latestRegionsStatus = useLatestRegionsStore((s) => s.status);
  const latestRegionsCount = useLatestRegionsStore((s) => s.total);
  const latestRegionsMessage = useLatestRegionsStore((s) => s.message);
  const setLatestRegionsPanelOpen = useLatestRegionsStore((s) => s.setPanelOpen);

  const aktifAski = askiApiStatus === "live"
    ? liveAskiCount
    : backendAskiCount ?? fallbackAskiCount();

  function focusNearestAski() {
    const next = ASKI_POLYGONS.find((p) => p.durum === "askida");
    if (!next) return;
    flyTo({ center: midRing(next.ring), zoom: 14 });
  }

  return (
    <header
      className="fixed left-3 right-3 top-3 z-40 flex h-12 items-stretch overflow-hidden rounded-xl border border-border-strong/80 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.75)_inset,0_18px_44px_-28px_rgb(18_52_82/0.45)] backdrop-blur-md"
      role="banner"
    >
      <div className="flex min-w-[220px] items-center gap-2 border-r border-border-subtle/80 bg-surface-3/65 px-3 lg:min-w-[280px]">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={onOpenMobileMenu ?? toggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-1 hover:text-fg-primary lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <BrandMark />
      </div>

      <div className="hidden min-w-0 items-center gap-3 border-r border-border-subtle/80 px-4 md:flex">
        <HeaderBreadcrumb />
      </div>

      <div className="flex min-w-[180px] flex-1 items-center justify-center px-2 sm:px-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-l border-border-subtle/80 bg-surface-3/35 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/kaynaklar"
              className="hidden h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-subtle bg-surface-2 px-2 text-[11px] text-fg-secondary transition-colors hover:border-border-strong hover:bg-surface-3 md:inline-flex"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="font-medium text-fg-primary">{okSources}/{totalSources || Object.keys(ASKI_LIST).length} kaynak aktif</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Canlı kaynak sağlık özeti</TooltipContent>
        </Tooltip>

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
                "hidden h-8 items-center gap-1 whitespace-nowrap rounded-lg border px-2 text-[11px] font-medium tabular-nums transition-colors md:inline-flex",
                askiMode
                  ? "border-status-warning text-fg-primary bg-[rgb(var(--status-warning)/0.10)]"
                  : "border-border-subtle bg-surface-1 text-fg-secondary hover:bg-surface-2 hover:text-fg-primary"
              )}
            >
              <AlertTriangle className={cn("h-3.5 w-3.5", askiMode ? "text-status-warning" : "text-fg-muted")} />
              {aktifAski} aktif askı
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs space-y-2">
              <p>{askiApiMessage ?? (backendAskiOffline ? "Backend offline; sayaç fallback gösteriyor" : askiMode ? "Askı modunu kapat" : "Askı haritasını aç ve en yakın askıya yakınlaş")}</p>
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
            <Link
              href="/kaynaklar"
              className="hidden h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-subtle bg-surface-2 px-2 text-[11px] text-fg-secondary transition-colors hover:border-border-strong hover:bg-surface-3 sm:inline-flex"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="font-medium text-fg-primary">Kaynaklar</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Kaynak registry ekranını aç</TooltipContent>
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
              aria-label="En yeni imar bölgelerini aç"
              className={cn(
                "hidden h-9 min-w-max items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-semibold tabular-nums transition-colors lg:inline-flex",
                latestRegionsStatus === "loading"
                  ? "border-brand-blue/60 bg-[rgb(var(--accent-blue)/0.12)] text-fg-primary"
                  : "border-brand-blue/35 bg-[rgb(var(--accent-blue)/0.07)] text-fg-secondary hover:border-brand-blue/60 hover:bg-[rgb(var(--accent-blue)/0.12)] hover:text-fg-primary"
              )}
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-sm border border-brand-blue/30 bg-[rgb(var(--accent-blue)/0.12)] text-[rgb(var(--accent-blue))]">
                {latestRegionsStatus === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPinned className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="hidden xl:inline">En Yeni İmar Bölgeleri</span>
              <span className="xl:hidden">Yeni Bölgeler</span>
              {latestRegionsCount > 0 && (
                <span className="rounded-full border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-primary">
                  {latestRegionsCount}
                </span>
              )}
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
                setCompareMode(compareMode === "satellite" ? "off" : "satellite");
              }}
              disabled={mapMode === "3d"}
              aria-pressed={compareMode === "satellite"}
              className={cn(
                "hidden h-8 items-center gap-1 whitespace-nowrap rounded-lg border px-2 text-xs transition-colors sm:inline-flex",
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
            {mapMode === "3d" ? "Karşılaştırma için 2D moduna geçin" : "Eski/Güncel uydu karşılaştırma sürgüsü"}
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
              aria-label="En yeni imar bölgelerini aç"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden",
                latestRegionsStatus === "loading"
                  ? "border-brand-blue/60 bg-[rgb(var(--accent-blue)/0.12)] text-[rgb(var(--accent-blue))]"
                  : "border-border-subtle bg-surface-1 text-fg-secondary hover:bg-surface-2 hover:text-fg-primary"
              )}
            >
              {latestRegionsStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">En yeni imar bölgeleri</TooltipContent>
        </Tooltip>
        <ModeToggle mapMode={mapMode} setMapMode={setMapMode} />
        <span className="hidden sm:inline-flex"><BasemapSwitcher /></span>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton label="Yardım" variant="ghost"><HelpCircle className="h-4 w-4" /></IconButton>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Yardım & Klavye Kısayolları</TooltipContent>
        </Tooltip>
        <IconButton label="Profil" variant="ghost"><UserCircle2 className="h-4 w-4" /></IconButton>
      </div>
    </header>
  );
}

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

function ModeToggle({
  mapMode,
  setMapMode
}: {
  mapMode: "2d" | "3d";
  setMapMode: (m: "2d" | "3d") => void;
}) {
  return (
    <div className="relative hidden h-8 items-center rounded-lg border border-border-subtle bg-surface-1 p-0.5 sm:inline-flex">
      <ToggleSegment active={mapMode === "2d"} onClick={() => setMapMode("2d")} label="2D" icon={<MapIcon className="h-3.5 w-3.5" />} />
      <ToggleSegment active={mapMode === "3d"} onClick={() => setMapMode("3d")} label="3D" icon={<Box className="h-3.5 w-3.5" />} />
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
        "relative inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-colors",
        active ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary"
      )}
      aria-pressed={active}
      aria-label={`${label} modu`}
    >
      {active && (
        <motion.span
          layoutId="modeToggleIndicator"
          aria-hidden
          className="absolute inset-0 rounded-md border border-border-subtle bg-surface-2 shadow-card"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative inline-flex items-center gap-1">{icon}{label}</span>
    </button>
  );
}
