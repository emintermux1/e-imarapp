'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import type { ReadinessState } from '@/types/readiness';
import { StatusBadge } from './StatusBadge';

interface DataCardProps {
  title: ReactNode;
  description?: ReactNode;
  status?: ReadinessState | null;
  trailing?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
}

export function DataCard({
  title,
  description,
  status,
  trailing,
  footer,
  children,
  className,
  bodyClassName,
  compact = false,
}: DataCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border-subtle bg-bg-surface shadow-panel',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-start gap-3 border-b border-border-subtle',
          compact ? 'px-3 py-2.5' : 'px-4 py-3',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                'm-0 truncate font-semibold text-text-primary',
                compact ? 'text-[14px]' : 'text-h3',
              )}
            >
              {title}
            </h3>
            {status ? <StatusBadge status={status} size={compact ? 'xs' : 'sm'} /> : null}
          </div>
          {description ? (
            <p className="mt-1 text-[12px] text-text-muted">{description}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>
      <div className={cn(compact ? 'p-3' : 'p-4', bodyClassName)}>{children}</div>
      {footer ? (
        <footer
          className={cn(
            'border-t border-border-subtle text-[12px] text-text-muted',
            compact ? 'px-3 py-2' : 'px-4 py-3',
          )}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
