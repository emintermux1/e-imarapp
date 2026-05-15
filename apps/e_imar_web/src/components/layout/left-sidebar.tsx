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
        "fixed bottom-4 left-3 top-24 z-20 hidden flex-col overflow-hidden rounded-[1.7rem] border border-white/15 bg-[linear-gradient(180deg,rgb(var(--accent-navy)/0.98),rgb(6_20_14/0.96))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_28px_84px_-44px_rgb(var(--accent-navy)/0.9)] backdrop-blur-md transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:flex",
        collapsed ? "w-[68px]" : "w-[292px]"
      )}
      aria-label="Yan panel"
    >
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-white/[0.06] px-3">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.22em] text-white/58",
            collapsed && "sr-only"
          )}
        >
          Çalışma Paneli
        </span>
        <button
          type="button"
          aria-label={collapsed ? "Paneli genişlet" : "Paneli daralt"}
          onClick={toggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/62 transition-colors hover:bg-white/10 hover:text-white soft-press"
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
        <div className="border-t border-white/10 bg-white/[0.05] p-3">
          <GISLegend />
        </div>
      )}
    </aside>
  );
}
