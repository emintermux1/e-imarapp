"use client";

import * as React from "react";
import { History, Lock } from "lucide-react";
import { DataCard } from "./data-card";
import { cn } from "@/lib/utils";

interface TimelinePanelProps {
  disabled?: boolean;
  summary?: string;
  className?: string;
}

const stops = [
  { yil: "2014", label: "İlk Plan" },
  { yil: "2017", label: "Revizyon" },
  { yil: "2020", label: "Tadilat" },
  { yil: "2024", label: "Mevcut" },
  { yil: "2026", label: "Askıda" }
];

export function TimelinePanel({
  disabled = true,
  summary,
  className
}: TimelinePanelProps) {
  return (
    <DataCard
      variant="subtle"
      padding="sm"
      className={cn("relative overflow-hidden", className)}
      title={
        <span className="inline-flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-fg-muted" />
          Time Machine
        </span>
      }
      subtitle={summary ?? "Plan değişikliklerini yıllar boyunca karşılaştırın."}
      rightSlot={
        disabled ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            <Lock className="h-3 w-3" /> Yakında
          </span>
        ) : null
      }
    >
      <div className={cn("relative pt-2 pb-1", disabled && "opacity-60")}>
        <div
          aria-hidden
          className="absolute inset-x-1.5 top-[18px] h-px bg-border-strong"
        />
        <div className="relative flex justify-between">
          {stops.map((s, i) => (
            <div key={s.yil} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full border bg-surface-2 z-10",
                  i === stops.length - 1
                    ? "border-brand-red"
                    : "border-border-strong"
                )}
              />
              <span className="text-[10px] tabular-nums text-fg-muted">
                {s.yil}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DataCard>
  );
}
