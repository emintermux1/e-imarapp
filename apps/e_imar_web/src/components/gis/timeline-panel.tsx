"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Play, Pause, GitCompareArrows } from "lucide-react";
import { DataCard } from "./data-card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import {
  HISTORICAL_YEAR_RANGE,
  TIME_MACHINE_YEARS
} from "@/data/historical-snapshots";

interface TimelinePanelProps {
  /** Optional summary subtitle (defaults to a generic Türkçe sentence). */
  summary?: string;
  className?: string;
  /** Mini-mode for use inside the SectionGecmis (no headline year). */
  compact?: boolean;
}

/**
 * In-panel TimelinePanel — replaces the Task 1 placeholder. Drives the same
 * `useUIStore.timelineYear` as the floating bar; mounting either component
 * controls the same state.
 *
 * The header reflects the current selected year and exposes a compare
 * toggle.
 */
export function TimelinePanel({
  summary,
  className,
  compact = false
}: TimelinePanelProps) {
  const timelineYear = useUIStore((s) => s.timelineYear);
  const setTimelineYear = useUIStore((s) => s.setTimelineYear);
  const compareMode = useUIStore((s) => s.compareMode);
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const compareYear = useUIStore((s) => s.timelineCompareYear);
  const setCompareYear = useUIStore((s) => s.setTimelineCompareYear);
  const mapMode = useUIStore((s) => s.mapMode);
  const [playing, setPlaying] = React.useState(false);

  const year = timelineYear ?? HISTORICAL_YEAR_RANGE.max;

  React.useEffect(() => {
    if (!playing || timelineYear == null) return;
    const t = window.setInterval(() => {
      const next = year + 1;
      if (next > HISTORICAL_YEAR_RANGE.max) {
        setPlaying(false);
        return;
      }
      setTimelineYear(next);
    }, 1100);
    return () => window.clearInterval(t);
  }, [playing, year, timelineYear, setTimelineYear]);

  const isCompare = compareMode === "timeMachine";

  return (
    <DataCard
      variant="subtle"
      padding="sm"
      className={cn("relative overflow-hidden", className)}
      title={
        <span className="inline-flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-fg-muted" />
          Zaman Çizelgesi
        </span>
      }
      subtitle={
        summary ?? `${HISTORICAL_YEAR_RANGE.min} – ${HISTORICAL_YEAR_RANGE.max} arası plan tarihçesi.`
      }
      rightSlot={
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-fg-secondary">
            {year}
          </span>
          {isCompare && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-fg-secondary">
              ↔ {compareYear ?? HISTORICAL_YEAR_RANGE.max}
            </span>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Durdur" : "Oynat"}
            className="h-6 w-6 inline-flex items-center justify-center rounded border border-border-subtle bg-surface-2 text-fg-secondary hover:bg-surface-3"
          >
            {playing ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>
          <Slider
            value={[year]}
            min={HISTORICAL_YEAR_RANGE.min}
            max={HISTORICAL_YEAR_RANGE.max}
            step={1}
            onValueChange={([v]) => setTimelineYear(v)}
            aria-label="Yıl seçici"
            className="flex-1"
          />
        </div>

        <div className="relative pt-2 pb-1">
          <div
            aria-hidden
            className="absolute inset-x-1.5 top-[18px] h-px bg-border-strong"
          />
          <div className="relative flex justify-between">
            {TIME_MACHINE_YEARS.map((y) => {
              const active = y <= year;
              const isCurrent = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTimelineYear(y)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                  aria-label={`Yıl ${y}`}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full border bg-surface-2 z-10 transition-colors",
                      isCurrent
                        ? "border-brand-red bg-brand-red"
                        : active
                        ? "border-brand-blue/70"
                        : "border-border-strong group-hover:border-fg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      isCurrent ? "text-fg-primary font-semibold" : "text-fg-muted"
                    )}
                  >
                    {y}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!compact && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <label
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] text-fg-secondary",
                mapMode === "3d" && "opacity-60"
              )}
            >
              <GitCompareArrows className="h-3 w-3 text-fg-muted" />
              Karşılaştır
              <Switch
                checked={isCompare}
                disabled={mapMode === "3d"}
                onCheckedChange={(v) => {
                  if (mapMode === "3d") return;
                  setCompareMode(v ? "timeMachine" : "off");
                  if (v && compareYear == null)
                    setCompareYear(HISTORICAL_YEAR_RANGE.max);
                }}
                aria-label="Karşılaştır"
              />
            </label>
            <AnimatePresence>
              {mapMode === "3d" && (
                <motion.span
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-fg-muted"
                >
                  3D'de karşılaştırma kapalı.
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DataCard>
  );
}
