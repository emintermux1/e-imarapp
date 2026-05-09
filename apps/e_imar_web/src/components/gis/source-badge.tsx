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
  live: "border-status-success/45 bg-status-success/10 text-status-success [--source-dot:rgb(var(--status-success))]",
  fallback: "border-status-warning/45 bg-status-warning/10 text-status-warning [--source-dot:rgb(var(--status-warning))]",
  unavailable: "border-status-error/45 bg-status-error/10 text-status-error [--source-dot:rgb(var(--status-error))]",
  computed: "border-[rgb(var(--accent-blue))]/45 bg-[rgb(var(--accent-blue))]/10 text-[rgb(var(--accent-blue))] [--source-dot:rgb(var(--accent-blue))]",
  demo: "border-border-strong bg-surface-2 text-fg-muted [--source-dot:rgb(var(--text-muted))]"
};

const TITLES: Record<DataSourceStatus, string> = {
  live: "Canlı belediye/API kaynağından geldi",
  fallback: "Canlı kaynak yerine yerel yedek veya önbellek kullanılıyor",
  unavailable: "Kaynak erişilemiyor veya bu veri yayınlanmıyor",
  computed: "Uygulama tarafından hesaplandı veya kullanıcı seçimiyle üretildi",
  demo: "Demo/tahmini veri; resmi kaynak gibi sunulmaz"
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
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
        CLASSES[status],
        className
      )}
      title={TITLES[status]}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--source-dot)] shadow-[0_0_10px_var(--source-dot)]" />
      {label ?? LABELS[status]}
    </span>
  );
}

export const SOURCE_BADGE_LABELS = LABELS;
export const SOURCE_BADGE_TITLES = TITLES;
