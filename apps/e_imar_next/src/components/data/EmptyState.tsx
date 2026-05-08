'use client';

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-6 px-4' : 'gap-3 py-12 px-6',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-bg-subtle text-text-muted',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}
        aria-hidden
      >
        {icon ?? <Inbox className={compact ? 'h-5 w-5' : 'h-6 w-6'} />}
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className={cn('m-0 font-semibold text-text-primary', compact ? 'text-[14px]' : 'text-h3')}>
          {title}
        </h3>
        {description ? (
          <p className="m-0 text-[13px] leading-5 text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
