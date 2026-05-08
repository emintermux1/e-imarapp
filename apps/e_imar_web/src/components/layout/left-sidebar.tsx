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
        "fixed top-14 bottom-0 left-0 z-20 hidden lg:flex flex-col border-r border-border-subtle bg-surface-2 transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[280px]"
      )}
      aria-label="Yan panel"
    >
      <div className="h-10 flex items-center justify-between px-3 border-b border-border-subtle">
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider text-fg-muted",
            collapsed && "sr-only"
          )}
        >
          Çalışma Paneli
        </span>
        <button
          type="button"
          aria-label={collapsed ? "Paneli genişlet" : "Paneli daralt"}
          onClick={toggleSidebar}
          className="h-7 w-7 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary"
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
        <div className="p-3 border-t border-border-subtle">
          <GISLegend />
        </div>
      )}
    </aside>
  );
}
