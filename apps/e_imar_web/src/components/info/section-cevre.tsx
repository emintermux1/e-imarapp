import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import { CEVRE_FIELDS } from "@/data/environment";
import { formatM, formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SectionCevre({ parcel }: { parcel: ParcelProps }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CEVRE_FIELDS.map((f) => {
        const Icon = f.icon;
        const raw = parcel.cevre[f.key];
        let display = "—";
        let hint = "";
        if (f.unit === "m") {
          display = formatM(raw);
        } else if (f.unit === "km") {
          display = formatKm(raw);
        } else {
          display = `${raw}/100`;
          hint = scoreLabel(raw);
        }
        return (
          <div
            key={f.key}
            className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                {f.label}
              </span>
              <span className="text-fg-muted">
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-sm tabular-nums font-semibold text-fg-primary">
              {display}
            </div>
            {f.unit === "skor" && (
              <ScoreBar value={raw} reverse={f.key === "gurultuSkoru"} />
            )}
            {hint && <span className="text-[10px] text-fg-muted">{hint}</span>}
          </div>
        );
      })}
    </div>
  );
}

function scoreLabel(value: number) {
  if (value >= 80) return "Çok iyi";
  if (value >= 60) return "İyi";
  if (value >= 40) return "Orta";
  return "Düşük";
}

function ScoreBar({ value, reverse }: { value: number; reverse?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  const score = reverse ? 100 - v : v;
  const color =
    score >= 80
      ? "rgb(var(--status-success))"
      : score >= 60
      ? "rgb(var(--accent-blue))"
      : score >= 40
      ? "rgb(var(--status-warning))"
      : "rgb(var(--status-error))";
  return (
    <div className={cn("h-1 w-full rounded-full bg-border-subtle overflow-hidden")}>
      <div
        className="h-full"
        style={{ width: `${v}%`, backgroundColor: color, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}
