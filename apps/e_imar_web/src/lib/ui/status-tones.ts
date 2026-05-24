import type { DataSourceStatus } from "@/types/api";

/** UI chip tones — intentionally muted; no neon success green in product chrome. */
export const STATUS_CHIP: Record<
  DataSourceStatus | "live" | "fallback" | "demo" | "unavailable",
  string
> = {
  live: "border-brand-navy/22 bg-brand-navy/6 text-fg-secondary [--chip-dot:rgb(var(--accent-navy))]",
  official: "border-brand-navy/22 bg-brand-navy/6 text-fg-secondary [--chip-dot:rgb(var(--accent-navy))]",
  fallback: "border-status-warning/28 bg-status-warning/8 text-fg-secondary [--chip-dot:rgb(var(--status-warning))]",
  unavailable: "border-status-error/28 bg-status-error/8 text-fg-secondary [--chip-dot:rgb(var(--status-error))]",
  computed: "border-brand-blue/28 bg-brand-blue/8 text-fg-secondary [--chip-dot:rgb(var(--accent-blue))]",
  demo: "border-border-subtle bg-surface-1 text-fg-muted [--chip-dot:rgb(var(--text-muted))]",
  public_metadata: "border-border-subtle bg-surface-1 text-fg-muted [--chip-dot:rgb(var(--text-muted))]",
  derived: "border-brand-blue/22 bg-brand-blue/6 text-fg-secondary [--chip-dot:rgb(var(--accent-blue))]",
  not_ready: "border-status-warning/25 bg-status-warning/8 text-fg-muted [--chip-dot:rgb(var(--status-warning))]"
};

export function statusChipClass(status: DataSourceStatus | string | undefined) {
  if (status && status in STATUS_CHIP) {
    return STATUS_CHIP[status as keyof typeof STATUS_CHIP];
  }
  return STATUS_CHIP.demo;
}

export function metricValueTone(kind: "positive" | "neutral" | "caution" | "danger") {
  switch (kind) {
    case "positive":
      return "text-brand-navy";
    case "caution":
      return "text-status-warning";
    case "danger":
      return "text-status-error";
    default:
      return "text-fg-primary";
  }
}
