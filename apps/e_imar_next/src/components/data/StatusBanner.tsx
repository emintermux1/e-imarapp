'use client';

import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ReadinessState, ReadinessTone } from '@/types/readiness';
import { readinessLabel, readinessTone } from '@/lib/utils/readiness';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from './StatusBadge';

interface StatusBannerProps {
  status?: ReadinessState | null;
  title?: string;
  message?: string;
  nextActions?: string[];
  onRetry?: () => void;
  retryLabel?: string;
  /** Show icon-only badge or a full-width banner. */
  variant?: 'banner' | 'inline';
  endpoint?: string;
  children?: ReactNode;
  className?: string;
}

const TONE_CARD: Record<ReadinessTone, string> = {
  success: 'bg-state-success/5 border-state-success/30 text-text-primary',
  warn: 'bg-state-warn/5 border-state-warn/30 text-text-primary',
  danger: 'bg-state-gov-red/5 border-state-gov-red/30 text-text-primary',
  info: 'bg-state-info/5 border-state-info/30 text-text-primary',
  neutral: 'bg-bg-subtle border-border-subtle text-text-primary',
};

export function StatusBanner({
  status,
  title,
  message,
  nextActions,
  onRetry,
  retryLabel = 'Tekrar dene',
  variant = 'banner',
  endpoint,
  children,
  className,
}: StatusBannerProps) {
  const tone = readinessTone(status);
  const heading = title ?? readinessLabel(status);
  const isInline = variant === 'inline';
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border',
        TONE_CARD[tone],
        isInline ? 'p-3' : 'p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <StatusBadge status={status} size={isInline ? 'xs' : 'sm'} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="m-0 text-[15px] font-semibold leading-5">{heading}</h4>
            {endpoint ? (
              <span className="font-data text-[11px] text-text-muted">{endpoint}</span>
            ) : null}
          </div>
          {message ? (
            <p className="m-0 text-[13px] leading-5 text-text-secondary">{message}</p>
          ) : null}
          {nextActions && nextActions.length > 0 ? (
            <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
              {nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          ) : null}
          {children}
          {onRetry ? (
            <div className="pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={onRetry}
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
              >
                {retryLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
