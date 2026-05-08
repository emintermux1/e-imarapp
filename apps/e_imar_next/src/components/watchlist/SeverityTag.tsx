'use client';

import { cn } from '@/lib/utils/cn';
import type { WatchlistSeverity } from '@/lib/api/types';

interface SeverityTagProps {
  severity?: WatchlistSeverity | null;
  size?: 'xs' | 'sm';
  className?: string;
}

const TONE: Record<WatchlistSeverity, string> = {
  low: 'border-border bg-bg-subtle text-text-secondary',
  medium: 'border-state-info/30 bg-state-info/10 text-state-info',
  high: 'border-state-warn/40 bg-state-warn/10 text-state-warn',
  critical: 'border-state-gov-red/40 bg-state-gov-red/10 text-state-gov-red',
};

const LABEL: Record<WatchlistSeverity, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export function SeverityTag({ severity, size = 'sm', className }: SeverityTagProps) {
  if (!severity) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-border-subtle bg-bg-subtle px-2 py-0.5 text-[11px] text-text-muted',
          className,
        )}
      >
        Önem belirtilmedi
      </span>
    );
  }
  const label = LABEL[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'xs' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-[12px]',
        TONE[severity],
        className,
      )}
      data-severity={severity}
      aria-label={`Önem seviyesi: ${label}`}
    >
      {label}
    </span>
  );
}
