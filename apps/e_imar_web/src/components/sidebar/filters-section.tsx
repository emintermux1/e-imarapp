"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { ZONING_PRESETS } from "@/data/zoning";
import { BELEDIYE_LIST } from "@/data/belediye";
import type { ZoningType } from "@/types/parcel";
import { cn } from "@/lib/utils";
import {
  useFilterStore,
  type ParcelFilters
} from "@/stores/filter-store";
import { useParcelFilters } from "@/hooks/use-parcel-filters";

const PLAN_TIPLERI = [
  "Uygulama İmar Planı",
  "Nazım İmar Planı",
  "Mevzii İmar Planı",
  "Revizyon İmar Planı",
  "Koruma Amaçlı UİP"
];

const DURUM_OPTIONS: Array<{ id: ParcelFilters["durum"][number]; label: string }> = [
  { id: "askida", label: "Askıda" },
  { id: "onaylandi", label: "Onaylandı" },
  { id: "reddedildi", label: "Reddedildi" },
  { id: "yok", label: "Plan Yok" }
];

const YAPILASMA_OPTIONS = ["Ayrik", "Bitisik", "Blok"];

export function FiltersSection() {
  const state = useFilterStore((s) => s.parcelFilters);
  const setParcelFilters = useFilterStore((s) => s.setParcelFilters);
  const resetParcelFilters = useFilterStore((s) => s.resetParcelFilters);
  const { filteredCount, totalCount, hasActiveFilters } = useParcelFilters();

  function toggle<K extends keyof ParcelFilters>(key: K, value: ParcelFilters[K][number]) {
    setParcelFilters(((s) => {
      const arr = s[key] as Array<ParcelFilters[K][number]>;
      const has = arr.includes(value);
      const next = has ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...s, [key]: next } as ParcelFilters;
    })(state));
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-sm border border-border-subtle bg-surface-1 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-fg-secondary">
            Eşleşen parsel
            <span className="ml-1 font-semibold tabular-nums text-fg-primary">
              {filteredCount.toLocaleString("tr-TR")}
            </span>
            <span className="ml-1 text-fg-muted">/ {totalCount.toLocaleString("tr-TR")}</span>
          </span>
          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={resetParcelFilters}
            className={cn(
              "h-6 px-2 rounded-sm border text-[10px] uppercase tracking-wider",
              hasActiveFilters
                ? "border-border-strong text-fg-primary hover:bg-surface-2"
                : "border-border-subtle text-fg-muted cursor-not-allowed"
            )}
          >
            Sıfırla
          </button>
        </div>
      </section>
      <FilterGroup label="Belediye">
        <div className="flex flex-wrap gap-1">
          {BELEDIYE_LIST.slice(0, 12).map((b) => {
            const active = state.belediyeler.includes(b.id);
            return (
              <FilterChip
                key={b.id}
                active={active}
                onClick={() => toggle("belediyeler", b.id)}
              >
                {shortBelediyeName(b.ad)}
              </FilterChip>
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup label="Plan Tipi">
        <div className="flex flex-wrap gap-1">
          {PLAN_TIPLERI.map((p) => (
            <FilterChip
              key={p}
              active={state.planTipi.includes(p)}
              onClick={() => toggle("planTipi", p)}
            >
              {p}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Durum">
        <div className="flex flex-col gap-1.5">
          {DURUM_OPTIONS.map((d) => (
            <label
              key={d.id}
              className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-sm hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <span className="text-xs text-fg-primary">{d.label}</span>
              <Switch
                checked={state.durum.includes(d.id)}
                onCheckedChange={() => toggle("durum", d.id)}
                aria-label={d.label}
              />
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Yapılaşma">
        <div className="flex flex-wrap gap-1">
          {YAPILASMA_OPTIONS.map((y) => (
            <FilterChip
              key={y}
              active={state.yapilasma.includes(y)}
              onClick={() => toggle("yapilasma", y)}
            >
              {y === "Ayrik" ? "Ayrık" : y === "Bitisik" ? "Bitişik" : "Blok"}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Plan Kullanımı">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(ZONING_PRESETS) as ZoningType[]).map((z) => {
            const active = state.zoning.includes(z);
            const preset = ZONING_PRESETS[z];
            return (
              <button
                key={z}
                type="button"
                onClick={() => toggle("zoning", z)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-6 px-2 rounded-sm border text-[11px] tabular-nums transition-colors",
                  active
                    ? "ring-1 ring-fg-primary"
                    : "hover:opacity-80"
                )}
                style={{
                  backgroundColor: preset.fill,
                  borderColor: preset.stroke,
                  color: preset.stroke
                }}
              >
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: preset.stroke }}
                  aria-hidden
                />
                {preset.label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-fg-muted px-1">
        {label}
      </span>
      {children}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-6 px-2 rounded-sm text-[11px] border tabular-nums transition-colors",
        active
          ? "bg-fg-primary text-bg border-fg-primary"
          : "bg-surface-2 text-fg-secondary border-border-subtle hover:border-border-strong hover:text-fg-primary"
      )}
    >
      {children}
    </button>
  );
}

function shortBelediyeName(s: string) {
  return s
    .replace("Büyükşehir Belediyesi", "BB")
    .replace("Belediyesi", "Bld.");
}
