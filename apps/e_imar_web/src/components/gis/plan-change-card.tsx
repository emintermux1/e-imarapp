"use client";

import * as React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Clock3,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { PlanChangeEntry } from "@/data/historical-snapshots";

interface PlanChangeCardProps {
  entry: PlanChangeEntry;
  className?: string;
  onOpenInTimeline?: (year: number) => void;
  /** Set when this card corresponds to the currently-active timeline year. */
  highlighted?: boolean;
}

const KATEGORI_TONE: Record<
  PlanChangeEntry["kategori"],
  { dot: string; label: string }
> = {
  Revizyon: { dot: "rgb(59,110,165)", label: "Revizyon" },
  Tadilat: { dot: "rgb(217,119,6)", label: "Tadilat" },
  "İlk Plan": { dot: "rgb(5,150,105)", label: "İlk Plan" },
  Onay: { dot: "rgb(21,128,61)", label: "Onay" },
  İptal: { dot: "rgb(185,28,28)", label: "İptal" }
};

function YonIcon({ yon }: { yon: PlanChangeEntry["delta"][number]["yon"] }) {
  if (yon === "increase")
    return <ArrowUp className="h-3 w-3 text-status-success" />;
  if (yon === "decrease") return <ArrowDown className="h-3 w-3 text-status-error" />;
  return <ArrowRight className="h-3 w-3 text-fg-muted" />;
}

/**
 * Single plan change card. Used inside SectionGecmis as a vertical timeline.
 *
 * Visually:
 * - Compact 3-grid badge of field-level deltas
 * - Header row with date + kategori dot
 * - "Zaman Çizelgesi'nde Aç" button when callback is provided
 */
export function PlanChangeCard({
  entry,
  className,
  onOpenInTimeline,
  highlighted = false
}: PlanChangeCardProps) {
  const tone = KATEGORI_TONE[entry.kategori];
  return (
    <article
      className={cn(
        "rounded-md border bg-surface-2 transition-colors",
        highlighted
          ? "border-brand-red/65 shadow-[0_0_0_3px_rgb(var(--accent-red)/0.10)]"
          : "border-border-subtle",
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: tone.dot }}
          />
          <span className="text-[10px] uppercase tracking-wider text-fg-muted">
            {tone.label}
          </span>
          <span className="text-[10px] text-fg-muted/80">·</span>
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-fg-secondary">
            <Clock3 className="h-3 w-3 text-fg-muted/80" />
            {formatDate(entry.tarih)}
          </span>
        </div>
        {onOpenInTimeline && (
          <button
            type="button"
            onClick={() => onOpenInTimeline(entry.yil)}
            className={cn(
              "h-6 px-1.5 inline-flex items-center gap-1 rounded-sm border text-[10px] font-medium uppercase tracking-wider transition-colors",
              highlighted
                ? "border-brand-red/60 bg-[rgb(var(--accent-red)/0.10)] text-fg-primary"
                : "border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
            )}
            aria-label={`Zaman Çizelgesi'ni ${entry.yil} yılına aç`}
          >
            <GitBranch className="h-3 w-3" />
            {entry.yil}
          </button>
        )}
      </header>
      <div className="px-3 pb-3 pt-0.5">
        <h3 className="text-[12px] font-semibold text-fg-primary">
          {entry.baslik}
        </h3>
        <p className="text-[11px] text-fg-secondary leading-relaxed mt-0.5">
          {entry.ozet}
        </p>
        {entry.delta.length > 0 && (
          <div
            className={cn(
              "grid gap-1.5 mt-2",
              entry.delta.length === 1 ? "grid-cols-1" : "grid-cols-3"
            )}
          >
            {entry.delta.map((d, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 rounded-sm border border-border-subtle bg-surface-1 px-2 py-1.5"
              >
                <span className="text-[9px] uppercase tracking-wider text-fg-muted">
                  {d.label}
                </span>
                <span className="text-[11px] tabular-nums text-fg-secondary line-through">
                  {d.onceki}
                </span>
                <span className="text-[12px] tabular-nums text-fg-primary font-semibold inline-flex items-center gap-1">
                  <YonIcon yon={d.yon} />
                  {d.sonraki}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
