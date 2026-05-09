"use client";

import * as React from "react";
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
import { useUIStore } from "@/stores/ui-store";
import { BrandMark } from "./brand-mark";
import { Search, X } from "lucide-react";
import { TimelineFloating } from "@/components/gis/timeline-floating";
import { Section3DAnalizleri } from "@/components/gis/section-3d-analizleri";
import { AskiPopover } from "@/components/map/aski-popover";
import { DataCoverageBadge } from "@/components/map/data-coverage-badge";
import { ACTIVE_PLANS, activePlansInBounds } from "@/data/active-plans";
import type { ActivePlanFeature } from "@/data/active-plans";
import type { AskiPolygonFeature } from "@/data/aski-polygons";

export function AppShell() {
  const cursorReadoutRef = React.useRef<HTMLSpanElement>(null);
  const zoomReadoutRef = React.useRef<HTMLSpanElement>(null);
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const legendCollapsed = useUIStore((s) => s.legendCollapsed);
  const setLegendCollapsed = useUIStore((s) => s.setLegendCollapsed);
  const mapMode = useUIStore((s) => s.mapMode);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const [askiPopover, setAskiPopover] = React.useState<{
    feature: AskiPolygonFeature;
    pos: { x: number; y: number };
  } | null>(null);
  const [areaResults, setAreaResults] = React.useState<ActivePlanFeature[] | null>(null);

  // ESC closes the popover.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAskiPopover(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarWidth =
    sidebarMode === "expanded"
      ? "lg:pl-[280px]"
      : sidebarMode === "collapsed"
        ? "lg:pl-[64px]"
        : "lg:pl-0";

  function searchVisibleArea() {
    const map = (window as Window & { __mlMap?: import("maplibre-gl").Map }).__mlMap;
    if (!map) {
      setAreaResults(ACTIVE_PLANS.slice(0, 10));
      return;
    }
    const bounds = map.getBounds();
    const results = activePlansInBounds({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth()
    });
    setAreaResults(results);
  }

  return (
    <div className="min-h-dvh bg-bg text-fg-primary">
      <TopBar onOpenMobileMenu={() => setMobileNavOpen(true)} />

      <LeftSidebar />

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
        className={`pt-14 ${sidebarWidth} h-dvh overflow-hidden transition-[padding] duration-200`}
      >
        <div className="relative h-full w-full">
          <MapShell
            cursorReadoutRef={cursorReadoutRef}
            zoomReadoutRef={zoomReadoutRef}
            onAskiClick={(feature, pos) =>
              setAskiPopover({ feature, pos })
            }
          />
          <DataCoverageBadge />
          <MapHud
            cursorReadoutRef={cursorReadoutRef}
            zoomReadoutRef={zoomReadoutRef}
          />
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
            <button
              type="button"
              onClick={searchVisibleArea}
              className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-md bg-brand-blue px-5 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            >
              <Search className="h-4 w-4" />
              Bu Alanda Ara
            </button>
          </div>
          {areaResults && (
            <div className="pointer-events-auto absolute left-3 top-16 z-20 w-[min(620px,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-border-strong bg-surface-2 shadow-pop">
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold text-fg-primary">
                    Yürürlükteki Planlar
                  </div>
                  <div className="text-[11px] text-fg-muted">
                    Görünür harita alanında {areaResults.length.toLocaleString("tr-TR")} kayıt
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Sonuçları kapat"
                  onClick={() => setAreaResults(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[330px] overflow-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-surface-2 text-[10px] uppercase tracking-wide text-fg-muted">
                    <tr className="border-b border-border-subtle">
                      <th className="px-3 py-2 font-medium">Adı</th>
                      <th className="px-3 py-2 font-medium">PIN</th>
                      <th className="px-3 py-2 font-medium">Türü</th>
                      <th className="px-3 py-2 font-medium">İl</th>
                      <th className="px-3 py-2 font-medium">İlçe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaResults.slice(0, 10).map((plan) => (
                      <tr key={plan.id} className="border-b border-border-subtle/70">
                        <td className="max-w-[260px] truncate px-3 py-2 text-fg-primary">{plan.title}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-data text-fg-primary">{plan.pin}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{plan.planType}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{plan.province}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{plan.district}</td>
                      </tr>
                    ))}
                    {areaResults.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-fg-muted">
                          Bu görünür alanda yürürlükteki plan kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="pointer-events-auto absolute right-3 bottom-16 z-10 hidden md:block max-w-[280px]">
            <GISLegend
              collapsed={legendCollapsed}
              onCollapsedChange={setLegendCollapsed}
            />
          </div>
          <TimelineFloating />
        </div>
      </main>

      {/* Right panel — desktop */}
      <div className="hidden lg:block">
        <RightInfoPanel />
        {mapMode === "3d" && <Section3DAnalizleri />}
      </div>

      <MobileBottomSheet />

      {askiPopover && (
        <AskiPopover
          feature={askiPopover.feature}
          position={askiPopover.pos}
          onClose={() => setAskiPopover(null)}
        />
      )}
    </div>
  );
}
