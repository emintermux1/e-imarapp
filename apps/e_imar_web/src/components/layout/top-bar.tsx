"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  HelpCircle,
  UserCircle2,
  Box,
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
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
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
    setSelectedArea(null);
    flyTo({ center: midRing(next.ring), zoom: 14 });
  }

  return (
    <header
      className="pointer-events-none fixed left-4 right-4 top-4 z-40 flex h-14 items-center gap-2"
      role="banner"
    >
      <div className="pointer-events-auto flex h-14 min-w-[64px] items-center gap-2 rounded-full border border-white/12 bg-[linear-gradient(135deg,rgb(var(--accent-navy)/0.98),rgb(var(--accent-green)/0.86))] px-3 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_24px_70px_-48px_rgb(var(--accent-navy)/0.92)] md:min-w-[178px] lg:min-w-[228px]">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={onOpenMobileMenu ?? toggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/12 hover:text-white lg:hidden soft-press"
        >
          <Menu className="h-4 w-4" />
        </button>
        <BrandMark />
      </div>

      <div className="pointer-events-auto hidden h-12 min-w-0 items-center gap-3 rounded-full border border-white/50 bg-surface-2/88 px-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.78),0_18px_54px_-42px_rgb(var(--accent-navy)/0.72)] backdrop-blur-md xl:flex">
        <HeaderBreadcrumb />
      </div>

      <div className="pointer-events-none flex min-w-0 flex-1" />

      <div className="pointer-events-auto flex h-12 items-center gap-1 overflow-x-auto rounded-full border border-white/50 bg-surface-2/88 px-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.78),0_18px_54px_-42px_rgb(var(--accent-navy)/0.72)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/kaynaklar"
              className="hidden h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-green/20 bg-brand-green/10 px-2.5 text-[11px] text-fg-secondary transition-colors hover:border-brand-green/40 hover:bg-brand-green/15 xl:inline-flex soft-press"
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
                "hidden h-8 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold tabular-nums transition-colors lg:inline-flex soft-press",
                askiMode
                  ? "border-brand-amber text-fg-primary bg-[rgb(var(--accent-amber)/0.16)]"
                  : "border-border-subtle bg-surface-1 text-fg-secondary hover:bg-surface-2 hover:text-fg-primary"
              )}
            >
              <AlertTriangle className={cn("h-3.5 w-3.5", askiMode ? "text-status-warning" : "text-fg-muted")} />
              {aktifAski} aktif askı
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs space-y-2">
              <p>{askiApiMessage ?? (backendAskiOffline ? "Backend offline; sayaç yerel/public kayıt gösteriyor" : askiMode ? "Askı modunu kapat" : "Askı haritasını aç ve en yakın askıya yakınlaş")}</p>
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
                setSelectedArea(null);
                setSelectedParcelId(null);
                setRightPanelOpen(true);
                setLatestRegionsPanelOpen(true);
                void latestRegionsRefresh({ limit: 20 });
              }}
              aria-label="En yeni imar bölgelerini aç"
              className={cn(
                "hidden h-9 min-w-max items-center gap-2 whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold tabular-nums transition-colors 2xl:inline-flex soft-press",
                latestRegionsStatus === "loading"
                  ? "border-brand-green/60 bg-[rgb(var(--accent-green)/0.14)] text-fg-primary"
                  : "border-brand-green/35 bg-[rgb(var(--accent-green)/0.08)] text-fg-secondary hover:border-brand-green/60 hover:bg-[rgb(var(--accent-green)/0.14)] hover:text-fg-primary"
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

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                setSelectedArea(null);
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
        <CompareIconButton
          mapMode={mapMode}
          compareMode={compareMode}
          setCompareMode={setCompareMode}
        />
        <ModeToggle mapMode={mapMode} setMapMode={setMapMode} />
        <span className="hidden md:inline-flex"><BasemapSwitcher /></span>
        <span className="hidden lg:inline-flex"><ThemeToggle /></span>
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

function CompareIconButton({
  mapMode,
  compareMode,
  setCompareMode
}: {
  mapMode: "2d" | "3d";
  compareMode: "off" | "timeMachine" | "satellite";
  setCompareMode: (m: "off" | "timeMachine" | "satellite") => void;
}) {
  return (
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
            "hidden h-9 w-9 items-center justify-center rounded-full border transition-colors sm:inline-flex soft-press",
            compareMode === "satellite"
              ? "border-brand-blue/65 bg-[rgb(var(--accent-blue)/0.10)] text-fg-primary"
              : "border-border-subtle bg-surface-2 text-fg-secondary hover:bg-surface-1 hover:text-fg-primary",
            mapMode === "3d" && "cursor-not-allowed opacity-50"
          )}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {mapMode === "3d" ? "Karşılaştırma için 2D moduna geçin" : "Eski/Güncel uydu karşılaştırma"}
      </TooltipContent>
    </Tooltip>
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
