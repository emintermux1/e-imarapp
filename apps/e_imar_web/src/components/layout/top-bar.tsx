"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  HelpCircle,
  UserCircle2,
  Box,
  Layers,
  GitCompareArrows,
  AlertTriangle,
  Map as MapIcon,
  Keyboard,
  BookOpen,
  Database,
  ShieldCheck,
  Settings,
  LogIn,
  Activity,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useActiveAski, useSourceHealth } from "@/lib/api/hooks";
import { ASKI_LIST } from "@/data/aski-list";
import { activeAskiCount, ASKI_POLYGONS } from "@/data/aski-polygons";
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
  const askiQuery = useActiveAski();
  const healthQuery = useSourceHealth();
  const activeAski = activeAskiCount();
  const activeAskiFromBackend = askiQuery.data?.ok ? askiQuery.data.data.count : ASKI_LIST.length;
  const backendAskiOffline = !askiQuery.data?.ok || askiQuery.data.data.status !== "ok";
  const healthRollup = healthQuery.data?.ok ? healthQuery.data.data.rollup : null;
  const okSources = healthRollup?.ok ?? 0;
  const totalSources = healthQuery.data?.ok ? healthQuery.data.data.total : 0;

  function focusNearestAski() {
    const next = ASKI_POLYGONS.find((p) => p.durum === "askida");
    if (!next) return;
    const center = midRing(next.ring);
    flyTo({ center, zoom: 14 });
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-stretch bg-surface-2 border-b border-border-subtle" role="banner">
      <div className="flex items-center gap-2 px-3 min-w-[280px] border-r border-border-subtle">
        <button type="button" aria-label="Menüyü aç" onClick={onOpenMobileMenu ?? toggleSidebar} className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-1">
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/kaynaklar" className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-secondary hover:bg-surface-2">
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
                "hidden md:inline-flex items-center gap-1 h-7 px-2 rounded-sm border text-[11px] font-medium transition-colors tabular-nums",
                askiMode
                  ? "border-status-warning text-fg-primary bg-[rgb(var(--status-warning)/0.10)]"
                  : "border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
              )}
            >
              <AlertTriangle className={cn("h-3.5 w-3.5", askiMode ? "text-status-warning" : "text-fg-muted")} />
              {activeAski} aktif askı
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{askiMode ? "Askı modunu kapat" : "Askı haritasını aç ve en yakın askıya yakınlaş"}</TooltipContent>
        </Tooltip>

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
          <TooltipContent side="bottom">{mapMode === "3d" ? "Karşılaştırma için 2D moduna geçin" : "Eski/Güncel uydu karşılaştırma sürgüsü"}</TooltipContent>
        </Tooltip>

        <ModeToggle mapMode={mapMode} setMapMode={setMapMode} />

        <span className="hidden sm:inline-flex">
          <BasemapSwitcher />
        </span>
        <ThemeToggle />
        <HelpMenu />
        <ProfileMenu />
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

function HelpMenu() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setTimelineYear = useUIStore((s) => s.setTimelineYear);
  const setCompareMode = useUIStore((s) => s.setCompareMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Yardım" variant="ghost">
          <HelpCircle className="h-4 w-4" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Yardım & Kısayollar</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setSearchOpen(true)}>
          <Keyboard className="h-4 w-4 text-fg-muted" />
          <span className="flex-1">Arama komut paleti</span>
          <span className="rounded-sm border border-border-subtle px-1.5 py-0.5 text-[10px] text-fg-muted">Ctrl K</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTimelineYear(2026)}>
          <BookOpen className="h-4 w-4 text-fg-muted" />
          Zaman Çizelgesi'ni aç
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setCompareMode("satellite")}>
          <GitCompareArrows className="h-4 w-4 text-fg-muted" />
          Uydu karşılaştırmayı aç
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2.5 py-2 text-[11px] leading-relaxed text-fg-secondary">
          Harita Türkiye çalışma alanına kilitlidir. Demo katmanlar sentetik veri üretir; resmi TKGM/belediye kaydı değildir.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Profil" variant="ghost">
          <UserCircle2 className="h-4 w-4" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Hesap</DropdownMenuLabel>
        <div className="px-2.5 py-2">
          <div className="text-sm font-semibold text-fg-primary">Misafir kullanıcı</div>
          <div className="mt-1 text-[11px] leading-relaxed text-fg-secondary">Kimlik doğrulama bağlanınca kayıtlı sorgular, raporlar ve watchlist hesabınıza senkronlanacak.</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogIn className="h-4 w-4 text-fg-muted" />
          Giriş yap yakında
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Database className="h-4 w-4 text-fg-muted" />
          Veri kaynakları yakında
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <ShieldCheck className="h-4 w-4 text-fg-muted" />
          Yetki / abonelik yakında
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="h-4 w-4 text-fg-muted" />
          Hesap ayarları yakında
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModeToggle({ mapMode, setMapMode }: { mapMode: "2d" | "3d"; setMapMode: (m: "2d" | "3d") => void; }) {
  return (
    <div className="hidden sm:inline-flex relative items-center h-8 rounded-md border border-border-subtle bg-surface-1 p-0.5">
      <ToggleSegment active={mapMode === "2d"} onClick={() => setMapMode("2d")} label="2D" icon={<MapIcon className="h-3.5 w-3.5" />} />
      <ToggleSegment active={mapMode === "3d"} onClick={() => setMapMode("3d")} label="3D" icon={<Box className="h-3.5 w-3.5" />} />
    </div>
  );
}

function ToggleSegment({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode; }) {
  return (
    <button type="button" onClick={onClick} className={cn("relative h-7 px-2.5 inline-flex items-center gap-1 rounded-sm text-[11px] font-medium transition-colors", active ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary")} aria-pressed={active} aria-label={`${label} modu`}>
      {active && (
        <motion.span layoutId="modeToggleIndicator" aria-hidden className="absolute inset-0 rounded-sm bg-surface-2 shadow-card border border-border-subtle" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
      )}
      <span className="relative inline-flex items-center gap-1">{icon}{label}</span>
    </button>
  );
}
