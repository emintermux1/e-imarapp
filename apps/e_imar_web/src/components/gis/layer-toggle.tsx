"use client";

import * as React from "react";
import { Eye, EyeOff, GripVertical, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface LayerToggleProps {
  id: string;
  label: string;
  description?: string;
  statusLabel?: string;
  status?: "official" | "public_metadata" | "demo" | "derived" | "not_ready";
  emptyReason?: string;
  icon?: React.ReactNode;
  visible: boolean;
  opacity: number; // 0..1
  onToggle: (next: boolean) => void;
  onOpacity: (value: number) => void;
}

export function LayerToggle({
  label,
  description,
  statusLabel,
  status,
  emptyReason,
  icon,
  visible,
  opacity,
  onToggle,
  onOpacity
}: LayerToggleProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={cn(
        "border border-border-subtle rounded-md transition-colors",
        visible ? "bg-surface-2" : "bg-surface-1"
      )}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          aria-label={visible ? `${label} katmanını gizle` : `${label} katmanını göster`}
          onClick={() => onToggle(!visible)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors md:h-6 md:w-6",
            visible
              ? "text-fg-primary hover:bg-surface-3"
              : "text-fg-muted hover:bg-surface-3"
          )}
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <span aria-hidden className="text-fg-muted">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        {icon && <span aria-hidden className="text-fg-muted">{icon}</span>}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex min-h-8 flex-1 min-w-0 items-center justify-between gap-2 text-left md:min-h-0",
            "text-sm",
            visible ? "text-fg-primary" : "text-fg-secondary"
          )}
        >
          <span className="min-w-0">
            <span className="block truncate">{label}</span>
            {statusLabel && (
              <span className={cn("mt-1 inline-flex rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em]", statusClassName(status))}>
                {statusLabel}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-fg-muted transition-transform",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-0 flex flex-col gap-2">
          {description && (
            <p className="text-[11px] text-fg-muted">{description}</p>
          )}
          {visible && (status === "not_ready" || emptyReason) && (
            <div className={cn(
              "rounded-sm border px-2 py-1.5 text-[11px] leading-relaxed",
              status === "not_ready"
                ? "border-status-warning/35 bg-status-warning/10 text-status-warning"
                : "border-border-subtle bg-surface-1 text-fg-muted"
            )}>
              {emptyReason ?? "Bu katman için çizilebilir veri kaynağı henüz hazır değil."}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-fg-muted w-12 shrink-0">
              Opaklık
            </span>
            <Slider
              value={[Math.round(opacity * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => onOpacity((v[0] ?? 0) / 100)}
              aria-label={`${label} opaklığı`}
            />
            <span className="text-xs tabular-nums text-fg-secondary w-9 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function statusClassName(status: LayerToggleProps["status"]) {
  switch (status) {
    case "official":
      return "border-status-success/35 bg-status-success/10 text-status-success";
    case "public_metadata":
      return "border-[rgb(var(--accent-blue))]/35 bg-[rgb(var(--accent-blue))]/10 text-[rgb(var(--accent-blue))]";
    case "demo":
      return "border-border-strong bg-surface-2 text-fg-muted";
    case "derived":
      return "border-brand-blue/35 bg-brand-blue/10 text-brand-blue";
    case "not_ready":
      return "border-status-warning/35 bg-status-warning/10 text-status-warning";
    default:
      return "border-border-subtle bg-surface-1 text-fg-muted";
  }
}
