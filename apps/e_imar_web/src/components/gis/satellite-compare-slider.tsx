"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function SatelliteCompareSlider({
  disabled = true,
  className
}: {
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface-2 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle text-xs">
        <span className="font-medium text-fg-primary">Uydu Karşılaştırma</span>
        {disabled && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            <Lock className="h-3 w-3" /> Yakında
          </span>
        )}
      </div>
      <div className="relative h-32 overflow-hidden">
        {/* placeholder mock dual-image strip */}
        <div className="absolute inset-0 flex">
          <div
            className={cn(
              "flex-1 grid place-items-center bg-[radial-gradient(circle_at_30%_40%,rgba(59,110,165,0.18),transparent_60%)]",
              "border-r border-border-strong"
            )}
          >
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">
              2018
            </span>
          </div>
          <div className="flex-1 grid place-items-center bg-[radial-gradient(circle_at_70%_50%,rgba(195,154,43,0.22),transparent_60%)]">
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">
              2024
            </span>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute top-0 left-1/2 h-full w-px bg-fg-primary/40"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border border-border-strong bg-surface-2 shadow-card grid place-items-center text-[10px] tabular-nums text-fg-muted"
        >
          ⇄
        </div>
      </div>
    </div>
  );
}
