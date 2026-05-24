import { sourceStatusLabel, sourceStatusTitle } from "@/lib/api/quality-labels";
import { statusChipClass } from "@/lib/ui/status-tones";
import { cn } from "@/lib/utils";
import type { DataSourceStatus } from "@/types/api";

const LABELS: Record<DataSourceStatus, string> = {
  live: sourceStatusLabel("live"),
  fallback: sourceStatusLabel("fallback"),
  unavailable: sourceStatusLabel("unavailable"),
  computed: sourceStatusLabel("computed"),
  demo: sourceStatusLabel("demo"),
  official: sourceStatusLabel("official"),
  public_metadata: sourceStatusLabel("public_metadata"),
  derived: sourceStatusLabel("derived"),
  not_ready: sourceStatusLabel("not_ready")
};

const TITLES: Record<DataSourceStatus, string> = {
  live: sourceStatusTitle("live"),
  fallback: sourceStatusTitle("fallback"),
  unavailable: sourceStatusTitle("unavailable"),
  computed: sourceStatusTitle("computed"),
  demo: sourceStatusTitle("demo"),
  official: sourceStatusTitle("official"),
  public_metadata: sourceStatusTitle("public_metadata"),
  derived: sourceStatusTitle("derived"),
  not_ready: sourceStatusTitle("not_ready")
};

export function SourceBadge({
  status,
  label,
  className,
  compact
}: {
  status: DataSourceStatus | "live" | "fallback" | "demo" | "unavailable";
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const resolved = status in LABELS ? (status as DataSourceStatus) : "demo";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium tracking-normal",
        compact ? "h-4 px-1.5 text-[9px]" : "h-5 px-2 text-[10px]",
        statusChipClass(resolved),
        className
      )}
      title={TITLES[resolved]}
    >
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--chip-dot)]" />
      {label ?? LABELS[resolved]}
    </span>
  );
}

export const SOURCE_BADGE_LABELS = LABELS;
export const SOURCE_BADGE_TITLES = TITLES;
