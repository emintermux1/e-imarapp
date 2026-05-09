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
import { Maximize2, Minimize2, X } from "lucide-react";
import { DataCoverageBadge } from "@/components/map/data-coverage-badge";
import { MunicipalityWorkbench } from "@/components/map/municipality-workbench";

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
      ? "lg:pl-[280px]"
      : sidebarMode === "collapsed"
      ? "lg:pl-[64px]"
      : "lg:pl-0";

  return (
    <div className="min-h-dvh bg-bg text-fg-primary">
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
        className={`${fullscreenMap ? "pt-0 lg:pl-0" : `pt-14 ${sidebarWidth}`} h-dvh overflow-hidden transition-[padding] duration-200`}
      >
        {children ? (
          <div className="h-full w-full">{children}</div>
        ) : (
          <div className="relative h-full w-full">
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
            <div className="pointer-events-none absolute left-3 top-24 z-10 hidden w-[min(860px,calc(100vw-1.5rem))] md:block">
              <MunicipalityWorkbench />
            </div>
            <div className="pointer-events-auto absolute right-3 bottom-16 z-10 hidden md:block max-w-[280px]">
              <GISLegend
                collapsed={legendCollapsed}
                onCollapsedChange={setLegendCollapsed}
              />
            </div>
            <button
              type="button"
              onClick={() => setFullscreenMap(!fullscreenMap)}
              aria-label={fullscreenMap ? "Tam ekran haritadan çık" : "Tam ekran harita"}
              className="pointer-events-auto absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong bg-surface-2/95 text-fg-secondary shadow-card backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-fg-primary md:hidden"
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
