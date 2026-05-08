'use client';

import { Bot, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ReadinessState } from '@/types/readiness';

interface ProviderSurfaceProps {
  provider?: string;
  model?: string;
  status?: ReadinessState | null;
  fetchedAt?: string;
  className?: string;
}

/**
 * Compact "trust strip" rendered above the explanation. Surfaces the LLM
 * provider, model and the timestamp the response was returned. We never
 * fabricate provider/model — when the backend omits the field we render
 * an em-dash so the user can see what's missing.
 */
export function ProviderSurface({
  provider,
  model,
  status,
  fetchedAt,
  className,
}: ProviderSurfaceProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border-subtle bg-bg-subtle/40 px-3 py-2 text-[12px] text-text-secondary',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Bot className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <span className="font-medium text-text-primary">{provider?.trim() || 'Sağlayıcı —'}</span>
        {model ? <span className="font-data text-[11px] text-text-muted">/ {model}</span> : null}
      </span>
      {status ? <StatusBadge status={status} size="xs" /> : null}
      {fetchedAt ? (
        <span
          className="inline-flex items-center gap-1.5 font-data text-[11px] tabular-nums"
          title={formatDateTime(fetchedAt)}
        >
          <Clock className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          {formatRelativeTime(fetchedAt)}
        </span>
      ) : null}
    </div>
  );
}
