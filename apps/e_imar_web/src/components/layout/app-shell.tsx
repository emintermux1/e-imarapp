"use client";

import * as React from "react";
import { TopBar } from "./top-bar";
import { LeftSidebar } from "./left-sidebar";
import { RightInfoPanel } from "./right-info-panel";
import { MapCanvas } from "@/components/map/map-canvas";
import { MapHud } from "@/components/map/map-hud";
import { GISLegend } from "@/components/gis/gis-legend";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { Sheet } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarSections } from "@/components/sidebar/sidebar-sections";
import { useUIStore } from "@/stores/ui-store";
import { BrandMark } from "./brand-mark";
import {
  BarChart3,
  Bookmark,
  FileDown,
  Layers3,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Navigation,
  Route,
  Search,
  X
} from "lucide-react";
import { DataCoverageBadge } from "@/components/map/data-coverage-badge";
import { MunicipalityWorkbench } from "@/components/map/municipality-workbench";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const cursorReadoutRef = React.useRef<HTMLSpanElement>(null);
  const zoomReadoutRef = React.useRef<HTMLSpanElement>(null);
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const legendCollapsed = useUIStore((s) => s.legendCollapsed);
  const setLegendCollapsed = useUIStore((s) => s.setLegendCollapsed);
  const fullscreenMap = useUIStore((s) => s.fullscreenMap);
  const setFullscreenMap = useUIStore((s) => s.setFullscreenMap);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const sidebarWidth =
    sidebarMode === "expanded"
      ? "lg:pl-[296px]"
    : sidebarMode === "collapsed"
      ? "lg:pl-[80px]"
      : "lg:pl-0";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg-primary">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_8%_8%,rgb(var(--accent-green)/0.18),transparent_26rem),radial-gradient(circle_at_92%_0%,rgb(var(--accent-blue)/0.10),transparent_28rem)]" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-52 border-b border-white/40 bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.78),rgb(var(--bg)/0))]" />
      {!fullscreenMap && <TopBar onOpenMobileMenu={() => setMobileNavOpen(true)} />}

      {!fullscreenMap && <LeftSidebar />}

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
        className={`${fullscreenMap ? "pt-0 lg:pl-0" : `pt-16 ${sidebarWidth}`} relative z-10 h-dvh overflow-hidden transition-[padding] duration-200`}
      >
        {children ? (
          <div className="h-full w-full">{children}</div>
        ) : (
          <div className="relative h-full w-full">
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,transparent_0,transparent_38%,rgb(6_20_14/0.08)_100%)]" />
            <MapCanvas
              cursorReadoutRef={cursorReadoutRef}
              zoomReadoutRef={zoomReadoutRef}
              className="absolute inset-0"
            />
            <MapHud
              cursorReadoutRef={cursorReadoutRef}
              zoomReadoutRef={zoomReadoutRef}
            />
            <DataCoverageBadge />
            <ReferenceCommandPanel />
            <MobileMapHint />
            <div className="pointer-events-none absolute left-5 top-[22.5rem] z-10 hidden w-[min(760px,calc(100vw-2rem))] xl:block">
              <MunicipalityWorkbench />
            </div>
            <div className="pointer-events-auto absolute right-4 bottom-16 z-10 hidden md:block max-w-[280px]">
              <GISLegend
                collapsed={legendCollapsed}
                onCollapsedChange={setLegendCollapsed}
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
            <RightInfoPanel />
          </div>
          {!fullscreenMap && <MobileBottomSheet />}
        </>
      )}
    </div>
  );
}

function ReferenceCommandPanel() {
  return (
    <section className="pointer-events-auto absolute left-5 top-5 z-10 hidden w-[min(520px,calc(100vw-2rem))] xl:block">
      <div className="rounded-[2.2rem] border border-white/45 bg-white/20 p-1.5 shadow-[0_30px_90px_-50px_rgb(var(--accent-navy)/0.82)]">
        <div className="civic-panel overflow-hidden rounded-[1.85rem] border border-white/10 p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Türkiye geneli
              </div>
              <h1 className="mt-3 max-w-[14ch] text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white text-balance">
                Parsel ve imar sorgulama
              </h1>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-[1.6rem] border border-white/12 bg-white/10 text-white">
              <MapIcon className="h-9 w-9" />
            </div>
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.08] p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.10)]">
            <div className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 text-[rgb(var(--text-primary))] shadow-[0_18px_42px_-30px_rgb(0_0_0/0.5)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green/10 text-brand-green">
                <Search className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-extrabold">Parsel sorgulamak için</div>
                <div className="mt-1 space-y-1 text-xs text-fg-secondary">
                  <div>Haritada bir noktaya dokun</div>
                  <div>Ya da üstten il / ada / parsel ile ara</div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <CommandChip icon={<Layers3 className="h-3.5 w-3.5" />} label="Katman" />
              <CommandChip icon={<BarChart3 className="h-3.5 w-3.5" />} label="Analiz" />
              <CommandChip icon={<Bookmark className="h-3.5 w-3.5" />} label="Favori" />
              <CommandChip icon={<FileDown className="h-3.5 w-3.5" />} label="PDF" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1.3rem] border border-white/12 bg-black/10 p-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Canlı işlem</div>
              <div className="mt-1 text-sm font-semibold text-white">Çoklu parsel, rota ve kaynak ayrımı tek panelde.</div>
            </div>
            <div className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-amber px-4 text-sm font-black text-[rgb(10_31_24)] soft-press">
              <Route className="h-4 w-4" />
              Rota
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommandChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/10 text-[11px] font-semibold text-white/84">
      {icon}
      {label}
    </div>
  );
}

function MobileMapHint() {
  const items = [
    { icon: <Layers3 className="h-4 w-4" />, label: "Katman" },
    { icon: <Navigation className="h-4 w-4" />, label: "Konum" },
    { icon: <Search className="h-4 w-4" />, label: "Ara" }
  ];

  return (
    <div className="pointer-events-auto absolute left-3 top-4 z-10 flex flex-col gap-2 xl:hidden">
      <div className="map-glass-shell max-w-[calc(100vw-5.5rem)] rounded-[1.5rem] px-4 py-3 md:hidden">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">Parsel & İmar</div>
        <div className="mt-1 text-sm font-black leading-tight text-fg-primary">Haritada dokun, bilgileri al</div>
      </div>
      <div className="hidden gap-2 md:flex xl:hidden">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "map-glass-shell inline-flex h-12 items-center gap-2 rounded-2xl px-3 text-sm font-bold text-fg-primary",
              "soft-press hover:bg-white"
            )}
          >
            <span className="text-brand-green">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
