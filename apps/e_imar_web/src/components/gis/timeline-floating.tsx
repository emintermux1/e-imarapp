"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, GitCompareArrows, X, Pause, Play, StepBack, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";

const MIN = 2010;
const MAX = 2026;
const KEY_YEARS = [2010, 2014, 2017, 2020, 2022, 2024, 2026];

/**
 * Floating Zaman Çizelgesi bar that sits 24px above the bottom-right HUD cluster.
 * Drives `useUIStore.timelineYear` and `compareMode`.
 *
 * UX:
 * - Hidden until the user clicks "Zaman Çizelgesi" in the topbar (or anywhere
 *   else that calls `setTimelineYear(...)` for the first time).
 * - When `timelineYear === null` we render only the FAB-style entry pill
 *   instead, so the timeline doesn't crowd the map.
 */
export function TimelineFloating() {
  const timelineYear = useUIStore((s) => s.timelineYear);
  const setTimelineYear = useUIStore((s) => s.setTimelineYear);
  const compareYear = useUIStore((s) => s.timelineCompareYear);
  const setCompareYear = useUIStore((s) => s.setTimelineCompareYear);
  const compareMode = useUIStore((s) => s.compareMode);
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const mapMode = useUIStore((s) => s.mapMode);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const selected = useMapStore((s) => s.selectedParcelId);

  const [playing, setPlaying] = React.useState(false);

  // Auto-play through years
  React.useEffect(() => {
    if (!playing || timelineYear == null) return;
    const t = window.setInterval(() => {
      const next = (timelineYear ?? MIN) + 1;
      if (next > MAX) {
        setPlaying(false);
        return;
      }
      setTimelineYear(next);
    }, 1100);
    return () => window.clearInterval(t);
  }, [playing, timelineYear, setTimelineYear]);

  if (timelineYear == null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
      >
        <button
          type="button"
          onClick={() => setTimelineYear(MAX)}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-strong bg-surface-2 shadow-card text-[12px]",
            "text-fg-secondary hover:text-fg-primary hover:bg-surface-3 transition-colors"
          )}
        >
          <History className="h-3.5 w-3.5" />
          Zaman Çizelgesi'ni Aç
        </button>
      </motion.div>
    );
  }

  const isCompare = compareMode === "timeMachine";

  return (
    <AnimatePresence>
      <motion.div
        key="timeline-floating"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[min(720px,calc(100%-32px))]"
      >
        <div className="flex flex-col gap-2 rounded-md border border-border-strong bg-surface-2/95 shadow-card backdrop-blur-[2px]">
          <header className="flex items-center justify-between gap-2 px-3 pt-2 pb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-fg-muted">
                <History className="h-3.5 w-3.5" />
                Zaman Çizelgesi
              </span>
              <span className="text-base font-semibold tabular-nums text-fg-primary">
                {timelineYear}
              </span>
              {isCompare && (
                <>
                  <ArrowDivider />
                  <span className="text-base font-semibold tabular-nums text-fg-primary">
                    {compareYear ?? MAX}
                  </span>
                </>
              )}
              {selected && (
                <span className="text-[11px] text-fg-secondary truncate hidden md:inline ml-2">
                  Seçili parsel: <span className="text-fg-primary">{selected.split("-").slice(-2).join("/")}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimelineYear(Math.max(MIN, timelineYear - 1))}
                className="h-9 w-9 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary md:h-7 md:w-7"
                aria-label="Önceki yıl"
              >
                <StepBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className={cn(
                  "h-9 w-9 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary md:h-7 md:w-7"
                )}
                aria-label={playing ? "Durdur" : "Otomatik oynat"}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setTimelineYear(Math.min(MAX, timelineYear + 1))}
                className="h-9 w-9 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary md:h-7 md:w-7"
                aria-label="Sonraki yıl"
              >
                <StepForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimelineYear(null);
                  setCompareMode("off");
                  setCompareYear(null);
                  setSelectedArea(null);
                  setSelectedParcelId(selected);
                }}
                className="h-9 w-9 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary md:h-7 md:w-7"
                aria-label="Kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="flex items-center gap-3 px-3 pb-2">
            <Slider
              value={[timelineYear]}
              min={MIN}
              max={MAX}
              step={1}
              onValueChange={([v]) => setTimelineYear(v)}
              className="flex-1"
              aria-label="Yıl seçici (sol)"
            />
            {isCompare && (
              <Slider
                value={[compareYear ?? MAX]}
                min={MIN}
                max={MAX}
                step={1}
                onValueChange={([v]) => setCompareYear(v)}
                className="flex-1"
                aria-label="Yıl seçici (sağ)"
              />
            )}
          </div>

          <div className="flex items-center gap-2 px-3 pb-2 pt-0.5">
            <div className="flex flex-1 items-center justify-between text-[10px] tabular-nums text-fg-muted">
              {KEY_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTimelineYear(y)}
                  className={cn(
                    "px-1.5 py-0.5 rounded-sm hover:bg-surface-1 hover:text-fg-primary transition-colors",
                    y === timelineYear && "bg-surface-1 text-fg-primary"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
            <label
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] text-fg-secondary",
                mapMode === "3d" && "opacity-60"
              )}
            >
              <GitCompareArrows className="h-3.5 w-3.5 text-fg-muted" />
              Karşılaştır
              <Switch
                checked={isCompare}
                onCheckedChange={(v) => {
                  if (mapMode === "3d") return;
                  setCompareMode(v ? "timeMachine" : "off");
                  if (v && compareYear == null) setCompareYear(MAX);
                }}
                disabled={mapMode === "3d"}
                aria-label="Karşılaştır"
              />
            </label>
          </div>
          {mapMode === "3d" && isCompare && (
            <div className="px-3 pb-2 text-[10px] tabular-nums text-fg-muted">
              3D modunda karşılaştırma desteklenmiyor. 2D'ye geçin.
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ArrowDivider() {
  return (
    <span aria-hidden className="text-fg-muted text-[10px] mx-1">
      ↔
    </span>
  );
}
