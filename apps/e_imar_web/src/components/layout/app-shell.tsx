"use client";

import * as React from "react";
import Link from "next/link";
import { TopBar } from "./top-bar";
import { LeftSidebar } from "./left-sidebar";
import { RightInfoPanel } from "./right-info-panel";
import { MapShell } from "@/components/map/map-shell";
import { MapHud } from "@/components/map/map-hud";
import { GISLegend } from "@/components/gis/gis-legend";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { Sheet } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarSections } from "@/components/sidebar/sidebar-sections";
import { DataCoverageBadge } from "@/components/map/data-coverage-badge";
import { MunicipalityWorkbench } from "@/components/map/municipality-workbench";
import { AskiPopover } from "@/components/map/aski-popover";
import { TimelineFloating } from "@/components/gis/timeline-floating";
import { Section3DAnalizleri } from "@/components/gis/section-3d-analizleri";
import { LiveReadinessStrip } from "@/components/product/live-readiness-strip";
import { LayerCatalogDrawer } from "@/components/map/layer-catalog-drawer";
import { HomepageQueryCard } from "@/components/product/homepage-query-card";
import { SkipToMain } from "@/components/a11y/skip-to-main";
import { useUIStore } from "@/stores/ui-store";
import { BrandMark } from "./brand-mark";
import { GlobalSearch } from "@/components/search/global-search";
import {
  Layers3,
  Maximize2,
  Minimize2,
  Navigation,
  Search,
  SlidersHorizontal,
  LocateFixed,
  Box,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AskiPolygonFeature } from "@/data/aski-polygons";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const cursorReadoutRef = React.useRef<HTMLSpanElement>(null);
  const zoomReadoutRef = React.useRef<HTMLSpanElement>(null);
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const legendCollapsed = useUIStore((s) => s.legendCollapsed);
  const setLegendCollapsed = useUIStore((s) => s.setLegendCollapsed);
  const fullscreenMap = useUIStore((s) => s.fullscreenMap);
  const setFullscreenMap = useUIStore((s) => s.setFullscreenMap);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [legendDockOpen, setLegendDockOpen] = React.useState(false);
  const [layerCatalogOpen, setLayerCatalogOpen] = React.useState(false);
  const [askiPopover, setAskiPopover] = React.useState<{
    feature: AskiPolygonFeature;
    position: { x: number; y: number };
  } | null>(null);

  const showSidebar = !fullscreenMap && sidebarMode !== "hidden";
  const leftDockClass =
    sidebarMode === "expanded"
      ? "left-[320px]"
      : sidebarMode === "collapsed"
      ? "left-[88px]"
      : "left-4";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg-primary">
      <SkipToMain />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_8%_8%,rgb(var(--accent-navy)/0.06),transparent_24rem),radial-gradient(circle_at_92%_0%,rgb(var(--accent-blue)/0.05),transparent_26rem)]" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-28 border-b border-white/30 bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.45),rgb(var(--bg)/0))]" />
      {!fullscreenMap && <TopBar onOpenMobileMenu={() => setMobileNavOpen(true)} />}

      {showSidebar && <LeftSidebar />}

      <Sheet
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        side="left"
        width={300}
        ariaLabel="Mobil yan menü"
        className="lg:hidden"
      >
        <div className="flex items-center justify-between gap-2 px-3 h-12 border-b border-border-subtle">
          <BrandMark />
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setMobileNavOpen(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-surface-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <SidebarSections />
        </ScrollArea>
        <div className="p-3 border-t border-border-subtle">
          <GISLegend />
        </div>
      </Sheet>

      <main
        id="main-map-workspace"
        tabIndex={-1}
        className="relative z-10 h-dvh overflow-hidden outline-none"
      >
        {children ? (
          <div className="h-full w-full">{children}</div>
        ) : (
          <div className="relative h-full w-full">
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,transparent_0,transparent_62%,rgb(6_20_14/0.05)_100%)]" />
            <MapShell
              cursorReadoutRef={cursorReadoutRef}
              zoomReadoutRef={zoomReadoutRef}
              onAskiClick={(feature, position) => setAskiPopover({ feature, position })}
            />
            {askiPopover && (
              <AskiPopover
                feature={askiPopover.feature}
                position={askiPopover.position}
                onClose={() => setAskiPopover(null)}
              />
            )}
            <MapInstructionIsland />
            <div className={cn("pointer-events-auto absolute top-44 z-20 hidden w-[420px] transition-[left] duration-300 2xl:block", leftDockClass)}>
              <HomepageQueryCard />
            </div>
            <div className={cn("pointer-events-auto absolute top-24 z-20 hidden transition-[left] duration-300 xl:flex", leftDockClass)}>
              <MapSourceDock />
            </div>
            <div className="pointer-events-auto absolute right-[420px] top-24 z-20 hidden xl:block">
              <LiveReadinessStrip />
            </div>
            <div className={cn("pointer-events-auto absolute bottom-24 z-20 hidden w-[min(760px,calc(100vw-34rem))] transition-[left] duration-300 2xl:block", leftDockClass)}>
              <MunicipalityWorkbench />
            </div>
            <MapHud
              cursorReadoutRef={cursorReadoutRef}
              zoomReadoutRef={zoomReadoutRef}
            />
            <TimelineFloating />
            <MobileMapHint />
            <MapActionDock
              searchOpen={searchOpen}
              onOpenSearch={() => setSearchOpen(true)}
              legendOpen={!legendCollapsed}
              onToggleLegend={() => setLayerCatalogOpen(true)}
              fullscreenMap={fullscreenMap}
              onToggleFullscreen={() => setFullscreenMap(!fullscreenMap)}
              mapMode={mapMode}
              onToggle3D={() => setMapMode(mapMode === "3d" ? "2d" : "3d")}
            />
            <LayerCatalogDrawer open={layerCatalogOpen} onOpenChange={setLayerCatalogOpen} />
            <div
              className={cn(
                "pointer-events-auto absolute right-4 z-10 hidden max-w-[280px] transition-[bottom] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:block",
                legendDockOpen ? "bottom-20" : "bottom-4"
              )}
            >
              <GISLegend
                collapsed={legendCollapsed}
                onCollapsedChange={(next) => {
                  setLegendCollapsed(next);
                  setLegendDockOpen(!next);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setFullscreenMap(!fullscreenMap)}
              aria-label={fullscreenMap ? "Tam ekran haritadan çık" : "Tam ekran harita"}
              className="pointer-events-auto absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-surface-2/95 text-fg-secondary shadow-card backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-fg-primary md:hidden"
            >
              {fullscreenMap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </main>

      {!children && (
        <>
          <div className={fullscreenMap ? "hidden" : "hidden lg:block"}>
            <RightInfoPanel floating />
          </div>
          <Section3DAnalizleri />
          {!fullscreenMap && <MobileBottomSheet />}
        </>
      )}
    </div>
  );
}

function MapSourceDock() {
  return (
    <div className="map-glass-shell flex items-center gap-2 rounded-2xl px-2 py-2">
      <DataCoverageBadge />
      <Link
        href="/kaynaklar"
        className="soft-press inline-flex h-8 items-center rounded-full border border-border-subtle bg-surface-1 px-3 text-[11px] font-bold text-fg-secondary transition-colors hover:bg-white hover:text-fg-primary"
      >
        Kaynak merkezi
      </Link>
    </div>
  );
}

function MapInstructionIsland() {
  return (
    <section className="pointer-events-auto absolute left-1/2 top-24 z-20 hidden w-[min(640px,calc(100vw-20rem))] -translate-x-1/2 p-1 md:block xl:top-[5.75rem]">
      <div className="glass-panel p-1.5">
        <div className="rounded-[1.45rem] border border-white/60 bg-surface-2/94 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.88)]">
        <div className="mb-3 flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent-navy))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]">
            <Search className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="section-eyebrow">
              Tek yerden sorgula
            </div>
            <div className="mt-0.5 truncate text-sm font-bold tracking-[-0.02em] text-fg-primary">
              Ada/parsel, adres, koordinat veya belediye seç
            </div>
          </div>
        </div>
        <GlobalSearch />
        </div>
      </div>
    </section>
  );
}

function MapActionDock({
  searchOpen,
  onOpenSearch,
  legendOpen,
  onToggleLegend,
  fullscreenMap,
  onToggleFullscreen,
  mapMode,
  onToggle3D
}: {
  searchOpen: boolean;
  onOpenSearch: () => void;
  legendOpen: boolean;
  onToggleLegend: () => void;
  fullscreenMap: boolean;
  onToggleFullscreen: () => void;
  mapMode: "2d" | "3d";
  onToggle3D: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 -translate-x-1/2 md:bottom-4">
      <div className="glass-panel p-1.5">
        <div className="flex items-center gap-1 rounded-[1.35rem] border border-white/50 bg-surface-2/92 px-1.5 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.78)]">
          <DockButton
            icon={<LocateFixed className="h-4 w-4" />}
            label="Konum"
            onClick={() => window.dispatchEvent(new CustomEvent("eimar:map:control", { detail: { action: "locate" } }))}
          />
          <DockButton
            active={searchOpen}
            icon={<Search className="h-4 w-4" />}
            label="Sorgu"
            onClick={onOpenSearch}
          />
          <DockButton
            active={legendOpen}
            icon={<Layers3 className="h-4 w-4" />}
            label="Katman"
            onClick={onToggleLegend}
          />
          <DockButton
            active={mapMode === "3d"}
            icon={<Box className="h-4 w-4" />}
            label={mapMode === "3d" ? "2D" : "3D"}
            onClick={onToggle3D}
          />
          <DockButton
            icon={<SlidersHorizontal className="h-4 w-4" />}
            label={fullscreenMap ? "Normal" : "Tam ekran"}
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
}

function DockButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "soft-press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        active
          ? "bg-[rgb(var(--accent-navy))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]"
          : "text-fg-secondary hover:bg-surface-1 hover:text-fg-primary",
        "max-sm:min-h-11 max-sm:min-w-11 max-sm:justify-center max-sm:px-3 max-sm:text-xs"
      )}
    >
      <span className={active ? "text-white" : "text-fg-secondary"}>{icon}</span>
      {label}
    </button>
  );
}

function MobileMapHint() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setLegendCollapsed = useUIStore((s) => s.setLegendCollapsed);
  const setMapMode = useUIStore((s) => s.setMapMode);

  return (
    <div className="pointer-events-auto absolute left-3 top-4 z-10 flex flex-col gap-2 xl:hidden">
      <div className="map-glass-shell max-w-[calc(100vw-5.5rem)] rounded-[1.5rem] px-4 py-3 md:hidden">
        <div className="section-eyebrow">Harita komutu</div>
        <div className="mt-1 text-sm font-black leading-tight text-fg-primary">Ara, katman aç veya 3D&apos;ye geç</div>
      </div>
      <div className="hidden gap-2 md:flex xl:hidden">
        <HintButton icon={<Search className="h-4 w-4" />} label="Ara" onClick={() => setSearchOpen(true)} />
        <HintButton icon={<Layers3 className="h-4 w-4" />} label="Katman" onClick={() => setLegendCollapsed(false)} />
        <HintButton icon={<Navigation className="h-4 w-4" />} label="Konum" onClick={() => window.dispatchEvent(new CustomEvent("eimar:map:control", { detail: { action: "locate" } }))} />
        <HintButton icon={<Box className="h-4 w-4" />} label="3D" onClick={() => setMapMode("3d")} />
      </div>
    </div>
  );
}

function HintButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "map-glass-shell inline-flex h-12 items-center gap-2 rounded-2xl px-3 text-sm font-bold text-fg-primary",
        "soft-press hover:bg-white"
      )}
    >
      <span className="text-fg-secondary">{icon}</span>
      {label}
    </button>
  );
}
