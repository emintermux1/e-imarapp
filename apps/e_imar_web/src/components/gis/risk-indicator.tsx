"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DEPREM_LABELS, RISK03_LABELS } from "@/data/risk-scores";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface RiskIndicatorProps {
  label: string;
  value: number;
  scale: 5 | 3;
  className?: string;
  onClick?: () => void;
  actionLabel?: string;
  /** Optional contextual sentence; defaults are localized per scale/value. */
  description?: string;
  /** Short subtitle inside the tooltip header. */
  source?: string;
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

const DEFAULT_DEPREM_DESC: Record<number, string> = {
  1: "1. derece deprem bölgesi sınır dışında, görece düşük tehlike.",
  2: "Düşük tehlike — yapı tasarımında temel önlemler yeterli olabilir.",
  3: "Orta tehlike — DBYBHY 2018 zorunlu detaylandırmalar uygulanmalı.",
  4: "Yüksek risk — 1. derece deprem bölgesine yakın; sismik izolasyon değerlendirilmeli.",
  5: "Çok yüksek risk — 1. derece bölgede; özel performans değerlendirmesi gerekli."
};
const DEFAULT_RISK03_DESC: Record<number, string> = {
  0: "Tespit edilmiş risk yok.",
  1: "Düşük risk — bölgesel ortalamanın altında.",
  2: "Orta risk — denetimli planlama önerilir.",
  3: "Yüksek risk — afet senaryosu için ayrıca değerlendirme yapılmalı."
};

/**
 * Risk göstergesi — Radix tooltip ile zengin açıklama gösterir.
 */
export function RiskIndicator({
  label,
  value,
  scale,
  className,
  onClick,
  actionLabel,
  description,
  source
}: RiskIndicatorProps) {
  const total = scale;
  const labels = scale === 5 ? DEPREM_LABELS : RISK03_LABELS;
  const color = colorVarFor(value, scale);
  const desc =
    description ??
    (scale === 5
      ? DEFAULT_DEPREM_DESC[value]
      : DEFAULT_RISK03_DESC[value]) ??
    "—";
  const tooltipText = `${label} ${value}/${total}: ${labels[value] ?? "-"} · ${desc}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          tabIndex={0}
          aria-label={tooltipText}
          className={cn(
            "flex flex-col gap-1 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 text-left",
            onClick ? "cursor-pointer hover:border-border-strong hover:bg-surface-1" : "cursor-help",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
            onClick && "transition-colors",
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
          {actionLabel && (
            <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--accent-navy))]">
              {actionLabel}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-[260px] !bg-surface-2 !text-fg-primary border border-border-strong shadow-pop p-2.5 normal-case"
      >
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: `rgb(${color})` }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-primary">
              {label} · {value}/{total}
            </span>
          </span>
          <p className="text-[11px] leading-relaxed text-fg-secondary normal-case">
            <span className="text-fg-primary font-medium">
              {labels[value] ?? "-"}:
            </span>{" "}
            {desc}
          </p>
          {source && (
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">
              Kaynak · {source}
            </span>
          )}
          {onClick && (
            <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--accent-navy))]">
              Haritada odaklanır
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
