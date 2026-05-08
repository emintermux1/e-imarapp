"use client";

import * as React from "react";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZONING_PRESETS } from "@/data/zoning";

export function GISLegend({ collapsed: collapsedProp, onCollapsedChange }: {
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}) {
  const [internal, setInternal] = React.useState(false);
  const collapsed = collapsedProp ?? internal;
  const setCollapsed = (v: boolean) => {
    if (onCollapsedChange) onCollapsedChange(v);
    else setInternal(v);
  };
  return (
    <div className="bg-surface-2 border border-border-strong rounded-md shadow-card overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-1 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="inline-flex items-center gap-1.5 font-medium text-fg-primary">
          <Layers className="h-3.5 w-3.5 text-fg-muted" />
          Katman Açıklamaları
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-fg-muted transition-transform",
            collapsed ? "rotate-0" : "rotate-180"
          )}
        />
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-3 border-t border-border-subtle">
          {Object.values(ZONING_PRESETS).map((preset) => (
            <div key={preset.type} className="flex items-center gap-2">
              <span
                aria-hidden
                className="block h-3 w-4 rounded-[2px] border"
                style={{
                  backgroundColor: preset.fill,
                  borderColor: preset.stroke
                }}
              />
              <span className="text-[11px] text-fg-secondary truncate">
                {preset.label}
              </span>
            </div>
          ))}
          <div className="col-span-2 mt-2 pt-2 border-t border-border-subtle/60 space-y-1">
            <div className="flex items-center gap-2">
              <span aria-hidden className="block h-0.5 w-6 bg-[rgb(var(--accent-red))]" />
              <span className="text-[11px] text-fg-secondary">Seçili parsel</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="block h-0.5 w-6"
                style={{ backgroundColor: "rgb(var(--accent-navy))" }}
              />
              <span className="text-[11px] text-fg-secondary">İdari sınır</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
