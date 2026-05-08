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
import { X } from "lucide-react";

export function AppShell() {
  const cursorReadoutRef = React.useRef<HTMLSpanElement>(null);
  const zoomReadoutRef = React.useRef<HTMLSpanElement>(null);
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const legendCollapsed = useUIStore((s) => s.legendCollapsed);
  const setLegendCollapsed = useUIStore((s) => s.setLegendCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const sidebarWidth =
    sidebarMode === "expanded"
      ? "lg:pl-[280px]"
      : sidebarMode === "collapsed"
      ? "lg:pl-[64px]"
      : "lg:pl-0";

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
          <MapCanvas
            cursorReadoutRef={cursorReadoutRef}
            zoomReadoutRef={zoomReadoutRef}
            className="absolute inset-0"
          />
          <MapHud
            cursorReadoutRef={cursorReadoutRef}
            zoomReadoutRef={zoomReadoutRef}
          />
          {/* Inline floating legend for desktop only */}
          <div className="pointer-events-auto absolute right-3 bottom-16 z-10 hidden md:block max-w-[280px]">
            <GISLegend
              collapsed={legendCollapsed}
              onCollapsedChange={setLegendCollapsed}
            />
          </div>
        </div>
      </main>

      {/* Right panel — desktop */}
      <div className="hidden lg:block">
        <RightInfoPanel />
      </div>

      {/* Mobile bottom sheet */}
      <MobileBottomSheet />
    </div>
  );
}
