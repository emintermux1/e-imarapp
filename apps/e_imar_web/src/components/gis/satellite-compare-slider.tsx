"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, GripVertical, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface SatelliteCompareSliderProps {
  className?: string;
}

const HISTORICAL_YEAR = 2014;
const CURRENT_YEAR = 2024;

/**
 * Inline satellite compare preview that lives inside RightInfoPanel and
 * doubles as a button: clicking "Tam ekran" promotes the comparison to the
 * full-bleed map overlay (managed via `useUIStore.compareMode = "satellite"`).
 *
 * The inline view itself uses two CSS-styled tiles to *suggest* the
 * comparison without spawning expensive MapLibre instances inside the panel.
 * The full overlay uses real MapLibre maps (see `SatelliteCompareOverlay`).
 */
export function SatelliteCompareSlider({
  className
}: SatelliteCompareSliderProps) {
  const setCompareMode = useUIStore((s) => s.setCompareMode);
  const [splitPercent, setSplitPercent] = React.useState(50);
  const draggingRef = React.useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const rect = (
      (e.currentTarget.parentElement as HTMLElement).parentElement as HTMLElement
    ).getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(8, Math.min(92, pct)));
  };

  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface-2 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-fg-primary">
          <Layers className="h-3.5 w-3.5 text-fg-muted" />
          Uydu Karşılaştırma
        </span>
        <button
          type="button"
          onClick={() => setCompareMode("satellite")}
          className="inline-flex items-center gap-1 px-1.5 h-6 rounded-sm border border-border-subtle bg-surface-1 text-[10px] uppercase tracking-wider text-fg-secondary hover:bg-surface-3 hover:text-fg-primary transition-colors"
        >
          <Maximize2 className="h-3 w-3" />
          Tam Ekran
        </button>
      </div>

      <div
        className="relative h-32 overflow-hidden bg-[#0F1F33] select-none"
        aria-label="Uydu karşılaştırma kaydırıcısı"
      >
        {/* "Old" half */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 60%, rgba(150,120,90,0.7), rgba(60,50,40,0.1) 70%), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px)",
            filter: "sepia(0.65) saturate(0.55) contrast(1.1) brightness(0.9)",
            clipPath: `inset(0 ${100 - splitPercent}% 0 0)`
          }}
        />
        {/* "Current" half */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 70% 40%, rgba(70,120,180,0.55), rgba(20,40,60,0.05) 70%), repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 7px)",
            clipPath: `inset(0 0 0 ${splitPercent}%)`
          }}
        />

        {/* Year chips */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-sm border border-border-strong bg-surface-2/95 text-[10px] tabular-nums text-fg-secondary">
          <span className="text-fg-muted uppercase tracking-wider">Eski</span>
          <span className="font-semibold text-fg-primary">
            {HISTORICAL_YEAR}
          </span>
        </span>
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-sm border border-brand-blue/60 bg-surface-2/95 text-[10px] tabular-nums text-fg-primary">
          <span className="text-fg-muted uppercase tracking-wider">Güncel</span>
          <span className="font-semibold">{CURRENT_YEAR}</span>
        </span>

        {/* Drag handle */}
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{ left: `${splitPercent}%` }}
        >
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-fg-primary/85"
          />
          <motion.button
            type="button"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.12 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto h-7 w-7 rounded-full border border-border-strong bg-surface-2 shadow-card grid place-items-center cursor-ew-resize hover:bg-surface-3"
            aria-label="Karşılaştırma kaydırıcısı"
          >
            <GripVertical className="h-3.5 w-3.5 text-fg-secondary" />
          </motion.button>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-subtle text-[10px] tabular-nums text-fg-muted">
        <span>Kaydırıcıyı sürükleyin</span>
        <span>{Math.round(splitPercent)}% ⇄ {100 - Math.round(splitPercent)}%</span>
      </div>
    </div>
  );
}
