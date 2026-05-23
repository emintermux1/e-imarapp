import * as React from "react";
import {
  INVESTMENT_SUBSCORES,
  deriveInvestmentBreakdown
} from "@/data/investment-scores";
import type { ParcelProps } from "@/types/parcel";
import { cn } from "@/lib/utils";

function gradeColor(score: number) {
  if (score >= 80) return "rgb(var(--status-success))";
  if (score >= 65) return "rgb(var(--accent-blue))";
  if (score >= 50) return "rgb(var(--status-warning))";
  return "rgb(var(--status-error))";
}

export function SectionYatirimSkoru({ parcel }: { parcel: ParcelProps }) {
  const sub = deriveInvestmentBreakdown(parcel);
  const total = parcel.yatirimSkoru;
  const totalColor = gradeColor(total);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border-subtle bg-surface-2 p-3 flex items-center gap-3">
        <ScoreDial value={total} color={totalColor} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-fg-muted">
            Yatırım Skoru
          </span>
          <span className="text-2xl font-semibold tabular-nums" style={{ color: totalColor }}>
            {total}
            <span className="text-[12px] text-fg-muted ml-1">/100</span>
          </span>
          <span className="text-[11px] text-fg-secondary">
            {summaryLabel(total)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {INVESTMENT_SUBSCORES.map((s) => {
          const value = Math.round(sub[s.key]);
          const c = gradeColor(value);
          return (
            <div
              key={s.key}
              className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                  {s.label}
                </span>
                <span className="text-[10px] tabular-nums text-fg-muted">
                  ağırlık {(s.weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: c }}
                >
                  {value}
                </span>
                <span className="text-[10px] text-fg-muted">/100</span>
              </div>
              <div className={cn("mt-1 h-1 w-full rounded-full bg-border-subtle overflow-hidden")}>
                <div
                  className="h-full"
                  style={{
                    width: `${value}%`,
                    backgroundColor: c,
                    transition: "width 220ms ease-out"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreDial({ value, color }: { value: number; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  return (
    <svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Yatırım skoru ${value}`}
    >
      <circle
        cx={32}
        cy={32}
        r={radius}
        stroke="rgb(var(--border-subtle))"
        strokeWidth={4}
        fill="none"
      />
      <circle
        cx={32}
        cy={32}
        r={radius}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 350ms ease-out" }}
      />
      <text
        x={32}
        y={36}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill="rgb(var(--text-primary))"
      >
        {value}
      </text>
    </svg>
  );
}

function summaryLabel(value: number) {
  if (value >= 80) return "Yüksek getiri potansiyeli";
  if (value >= 65) return "Cazip portföy fırsatı";
  if (value >= 50) return "Orta segment, dikkatli inceleme";
  return "Risk/getiri dengesi zayıf";
}
