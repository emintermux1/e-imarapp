import * as React from "react";
import { cn } from "@/lib/utils";
import { DEPREM_LABELS, RISK03_LABELS } from "@/data/risk-scores";

interface RiskIndicatorProps {
  label: string;
  value: number;
  scale: 5 | 3;
  className?: string;
}

function colorVarFor(value: number, scale: 5 | 3) {
  if (scale === 5) {
    if (value >= 5) return "var(--risk-5)";
    if (value >= 4) return "var(--risk-4)";
    if (value >= 3) return "var(--risk-3)";
    if (value >= 2) return "var(--risk-2)";
    return "var(--risk-1)";
  }
  if (value >= 3) return "var(--risk-4)";
  if (value >= 2) return "var(--risk-3)";
  if (value >= 1) return "var(--risk-2)";
  return "var(--risk-0)";
}

export function RiskIndicator({
  label,
  value,
  scale,
  className
}: RiskIndicatorProps) {
  const total = scale;
  const labels = scale === 5 ? DEPREM_LABELS : RISK03_LABELS;
  const color = colorVarFor(value, scale);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-fg-muted">
          {label}
        </span>
        <span
          className="inline-flex items-center gap-1 px-1.5 h-5 rounded-sm text-[10px] font-medium tabular-nums"
          style={{
            backgroundColor: `rgb(${color} / 0.14)`,
            color: `rgb(${color})`,
            border: `1px solid rgb(${color} / 0.45)`
          }}
        >
          {value}/{total}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="h-1.5 flex-1 rounded-sm"
            style={{
              backgroundColor:
                i < value ? `rgb(${color})` : "rgb(var(--border-subtle))"
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-fg-secondary">
        {labels[value] ?? "-"}
      </span>
    </div>
  );
}
