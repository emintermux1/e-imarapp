"use client";

import * as React from "react";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMON_PLAN_CONSTRAINTS,
  PLAN_STATUS_LABELS,
  ZONING_PRESETS
} from "@/data/zoning";

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
        <div className="px-3 py-3 border-t border-border-subtle">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Object.values(ZONING_PRESETS).map((preset) => (
              <div key={preset.type} className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden
                  className="block h-3 w-4 rounded-[2px] border shrink-0"
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
          </div>

          <div className="mt-3 pt-2 border-t border-border-subtle/60">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-muted">
              İmar detayları
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["1/1000 UİP", "1/5000 NİP", ...Object.values(PLAN_STATUS_LABELS).slice(0, 4)].map((label) => (
                <span
                  key={label}
                  className="inline-flex h-5 items-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[10px] text-fg-secondary"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-2 grid gap-1">
              {Object.values(ZONING_PRESETS).slice(0, 5).map((preset) => (
                <div key={`${preset.type}-subs`} className="text-[10px] leading-snug text-fg-muted">
                  <span className="font-medium text-fg-secondary">{preset.shortLabel ?? preset.type}:</span>{" "}
                  {(preset.subcategories ?? []).slice(0, 3).join(" · ")}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {COMMON_PLAN_CONSTRAINTS.slice(0, 6).map((constraint) => (
                <span
                  key={constraint}
                  className="rounded-sm bg-surface-1 px-1.5 py-0.5 text-[10px] text-fg-muted border border-border-subtle"
                >
                  {constraint}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-border-subtle/60 space-y-1">
            <div className="flex items-center gap-2">
              <span aria-hidden className="block h-0.5 w-6 bg-[rgb(var(--accent-red))]" />
              <span className="text-[11px] text-fg-secondary">Seçili parsel</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="block h-0.5 w-6 border-t-2 border-dashed border-amber-600" />
              <span className="text-[11px] text-fg-secondary">Kentsel dönüşüm / rezerv</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="block h-0.5 w-6 bg-teal-700" />
              <span className="text-[11px] text-fg-secondary">Sit / koruma kısıtı</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
