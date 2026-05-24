"use client";

import * as React from "react";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMON_PLAN_CONSTRAINTS,
  PLAN_STATUS_LABELS,
  ZONING_PRESETS
} from "@/data/zoning";
import { LAYER_DESCRIPTORS, type LayerDescriptor } from "@/lib/maplibre/layers";

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
    <div className="overflow-hidden rounded-[1.35rem] border border-white/55 bg-surface-2/92 text-xs shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_18px_52px_-38px_rgb(var(--accent-navy)/0.72)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-surface-1"
        aria-expanded={!collapsed}
      >
        <span className="inline-flex items-center gap-1.5 font-black text-fg-primary">
          <Layers className="h-3.5 w-3.5 text-brand-navy" />
          Harita katmanları
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
            <LegendHeading>İmar detayları</LegendHeading>
            <div className="flex flex-wrap gap-1">
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

          <div className="mt-3 border-t border-border-subtle/60 pt-2">
            <LegendHeading>Harita çizimleri</LegendHeading>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <LegendItem label="Seçili parsel">
                <span aria-hidden className="block h-0.5 w-6 bg-[rgb(var(--accent-red))]" />
              </LegendItem>
              <LegendItem label="Belediye sınırı">
                <span aria-hidden className="block h-0.5 w-6 border-t border-dashed border-[#0F766E]" />
              </LegendItem>
              <LegendItem label="Metro / raylı sistem">
                <span aria-hidden className="block h-1 w-6 rounded-full bg-[#2563EB]" />
              </LegendItem>
              <LegendItem label="Kentsel dönüşüm / rezerv">
                <span aria-hidden className="block h-0.5 w-6 border-t-2 border-dashed border-amber-600" />
              </LegendItem>
              <LegendItem label="Plan kısıt çizgileri">
                <span aria-hidden className="block h-0.5 w-6 border-t-2 border-dashed border-teal-700" />
              </LegendItem>
              <LegendItem label="Sit / koruma kısıtı">
                <span aria-hidden className="block h-0.5 w-6 bg-teal-700" />
              </LegendItem>
              <LegendItem label="Mevcut konum">
                <span aria-hidden className="block h-3 w-3 rounded-full border-2 border-white bg-[#2563EB] shadow-sm" />
              </LegendItem>
              <LegendItem label="Türkiye çalışma çerçevesi">
                <span aria-hidden className="block h-0.5 w-6 border-t border-dashed border-[#102A4C]" />
              </LegendItem>
            </div>
          </div>

          <div className="mt-3 border-t border-border-subtle/60 pt-2">
            <LegendHeading>Veri statüleri</LegendHeading>
            <div className="grid grid-cols-1 gap-1.5">
              {LEGEND_STATUS_ROWS.map((row) => (
                <LegendItem key={row.status} label={row.label}>
                  <span className={cn("block h-2.5 w-5 rounded-[2px] border", row.className)} />
                </LegendItem>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-fg-muted">
              Not ready katman açılırsa panel neden veri çizilmediğini yazar; uydurma değer üretilmez.
            </p>
          </div>

          <div className="mt-3 border-t border-border-subtle/60 pt-2">
            <LegendHeading>Premium GIS taksonomisi</LegendHeading>
            <div className="grid grid-cols-2 gap-1">
              {taxonomyCounts.map((entry) => (
                <span key={entry.group} className="rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-1 text-[10px] text-fg-secondary">
                  {entry.group} <span className="text-fg-muted tabular-nums">({entry.count})</span>
                </span>
              ))}
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

const LEGEND_STATUS_ROWS: Array<{
  status: LayerDescriptor["status"];
  label: string;
  className: string;
}> = [
  { status: "official", label: "official · resmî kaynak", className: "border-status-success/40 bg-status-success/30" },
  { status: "public_metadata", label: "public metadata · açık kayıt", className: "border-[rgb(var(--accent-blue))]/40 bg-[rgb(var(--accent-blue))]/25" },
  { status: "demo", label: "açık/kayıtlı · resmi değil", className: "border-border-strong bg-surface-3" },
  { status: "derived", label: "derived · hesap/türetim", className: "border-brand-blue/40 bg-brand-blue/20" },
  { status: "not_ready", label: "keşif bekliyor · veri bağlı değil", className: "border-status-warning/45 bg-status-warning/25" }
];

const taxonomyCounts = Array.from(
  LAYER_DESCRIPTORS.reduce((acc, layer) => {
    acc.set(layer.group, (acc.get(layer.group) ?? 0) + 1);
    return acc;
  }, new Map<LayerDescriptor["group"], number>())
).map(([group, count]) => ({ group, count }));

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
