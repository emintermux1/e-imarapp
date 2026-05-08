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
        <div className="max-h-[48vh] overflow-y-auto border-t border-border-subtle px-3 py-3">
          <LegendHeading>Plan kullanımı</LegendHeading>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Object.values(ZONING_PRESETS).map((preset) => (
              <LegendItem key={preset.type} label={preset.label}>
                <span
                  aria-hidden
                  className="block h-3 w-4 rounded-[2px] border"
                  style={{
                    backgroundColor: preset.fill,
                    borderColor: preset.stroke
                  }}
                />
              </LegendItem>
            ))}
          </div>

          <div className="mt-3 border-t border-border-subtle/60 pt-2">
            <LegendHeading>Harita çizimleri</LegendHeading>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <LegendItem label="Seçili parsel">
                <span aria-hidden className="block h-0.5 w-6 bg-[rgb(var(--accent-red))]" />
              </LegendItem>
              <LegendItem label="Belediye sınırı">
                <span
                  aria-hidden
                  className="block h-0.5 w-6 border-t border-dashed border-[#0F766E]"
                />
              </LegendItem>
              <LegendItem label="Metro / raylı sistem">
                <span aria-hidden className="block h-1 w-6 rounded-full bg-[#2563EB]" />
              </LegendItem>
              <LegendItem label="Mevcut konum">
                <span
                  aria-hidden
                  className="block h-3 w-3 rounded-full border-2 border-white bg-[#2563EB] shadow-sm"
                />
              </LegendItem>
            </div>
          </div>

          <div className="mt-3 border-t border-border-subtle/60 pt-2">
            <LegendHeading>Askı ve risk</LegendHeading>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <LegendItem label="Askıda plan">
                <span aria-hidden className="block h-3 w-4 rounded-[2px] border border-[#102A4C] bg-[#102A4C]/25" />
              </LegendItem>
              <LegendItem label="Onaylandı">
                <span aria-hidden className="block h-3 w-4 rounded-[2px] border border-emerald-700 bg-emerald-500/20" />
              </LegendItem>
              <LegendItem label="Reddedildi">
                <span aria-hidden className="block h-3 w-4 rounded-[2px] border border-red-700 bg-red-500/20" />
              </LegendItem>
              <LegendItem label="Dönüşüm">
                <span aria-hidden className="block h-3 w-4 rounded-[2px] border border-amber-700 bg-amber-500/25" />
              </LegendItem>
              <LegendItem label="Risk düşük → yüksek" className="col-span-2">
                <span
                  aria-hidden
                  className="block h-2 w-20 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg,#86EFAC 0%,#FACC15 45%,#F97316 65%,#DC2626 82%,#9F1239 100%)"
                  }}
                />
              </LegendItem>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
      {children}
    </div>
  );
}

function LegendItem({
  children,
  label,
  className
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="inline-flex h-4 w-6 shrink-0 items-center justify-center">
        {children}
      </span>
      <span className="truncate text-[11px] text-fg-secondary">{label}</span>
    </div>
  );
}
