import { cn } from "@/lib/utils";
import type { DataSourceStatus } from "@/types/api";

const LABELS: Record<DataSourceStatus, string> = {
  live: "Canlı API",
  fallback: "Yerel yedek",
  unavailable: "API yok",
  computed: "Hesaplandı",
  demo: "Demo veri"
};

const CLASSES: Record<DataSourceStatus, string> = {
  live: "border-status-success/40 bg-status-success/10 text-status-success",
  fallback: "border-status-warning/40 bg-status-warning/10 text-status-warning",
  unavailable: "border-status-error/40 bg-status-error/10 text-status-error",
  computed: "border-[rgb(var(--accent-blue))]/40 bg-[rgb(var(--accent-blue))]/10 text-[rgb(var(--accent-blue))]",
  demo: "border-border-strong bg-surface-2 text-fg-muted"
};

export function SourceBadge({
  status,
  label,
  className
}: {
  status: DataSourceStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium uppercase tracking-[0.08em]",
        CLASSES[status],
        className
      )}
    >
      {label ?? LABELS[status]}
    </span>
  );
}

export const SOURCE_BADGE_LABELS = LABELS;
