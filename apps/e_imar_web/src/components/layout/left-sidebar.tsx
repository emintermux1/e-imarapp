"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarSections } from "@/components/sidebar/sidebar-sections";
import { GISLegend } from "@/components/gis/gis-legend";
import { cn } from "@/lib/utils";

export function LeftSidebar() {
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const collapsed = sidebarMode === "collapsed";

  return (
    <aside
      className={cn(
        "fixed bottom-4 left-3 top-20 z-20 hidden flex-col overflow-hidden rounded-xl border border-border-strong/80 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.78)_inset,0_22px_54px_-34px_rgb(18_52_82/0.5)] backdrop-blur-md transition-[width] duration-200 lg:flex",
        collapsed ? "w-[64px]" : "w-[280px]"
      )}
      aria-label="Yan panel"
    >
      <div className="flex h-12 items-center justify-between border-b border-border-subtle/80 bg-surface-3/70 px-3">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted",
            collapsed && "sr-only"
          )}
        >
          Çalışma Paneli
        </span>
        <button
          type="button"
          aria-label={collapsed ? "Paneli genişlet" : "Paneli daralt"}
          onClick={toggleSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg-primary"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <ScrollArea className="flex-1">
        <SidebarSections collapsed={collapsed} />
      </ScrollArea>
      {!collapsed && (
        <div className="border-t border-border-subtle/80 bg-surface-3/45 p-3">
          <GISLegend />
        </div>
      )}
    </aside>
  );
}
