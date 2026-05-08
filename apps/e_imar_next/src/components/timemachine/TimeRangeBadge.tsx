'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimeRangeBadgeProps {
  fromAt?: string | null;
  toAt?: string | null;
  className?: string;
}

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormat.format(date);
}

/**
 * Compact badge that shows the active time-machine range. Renders inline
 * with the timeline so the user can quickly read the from/to labels.
 */
export function TimeRangeBadge({ fromAt, toAt, className }: TimeRangeBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 py-1.5 text-[12px] text-text-secondary shadow-panel',
        className,
      )}
      aria-label="Aktif zaman aralığı"
    >
      <Clock className="h-3.5 w-3.5 text-text-muted" aria-hidden />
      <span className="font-data tabular-nums text-text-primary">
        {formatDate(fromAt)} <span className="text-text-muted">→</span> {formatDate(toAt)}
      </span>
    </div>
  );
}
