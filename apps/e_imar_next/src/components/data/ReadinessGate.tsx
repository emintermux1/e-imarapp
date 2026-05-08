'use client';

import type { ReactNode } from 'react';
import type { BackendStatus } from '@/lib/api/types';
import type { ReadinessState } from '@/types/readiness';
import { EmptyState } from './EmptyState';
import { SkeletonCard } from './Skeleton';
import { StatusBanner } from './StatusBanner';

interface ReadinessGateProps {
  status?: BackendStatus | ReadinessState | null;
  loading?: boolean;
  /** Optional list of synonym statuses that should also be treated as ok. */
  okStatuses?: ReadinessState[];
  emptyTitle?: string;
  emptyDescription?: string;
  notReadyTitle?: string;
  notReadyDescription?: string;
  message?: string;
  nextActions?: string[];
  endpoint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

/**
 * `ReadinessGate` is the central UI fork that maps backend status responses
 * to either children (`ok`) or an explicit empty / banner / skeleton state.
 *
 * It NEVER falls back to fake values — every backend status is rendered
 * verbatim through `StatusBanner` so the user can see what is missing and
 * the agreed `nextActions` (if any).
 */
export function ReadinessGate({
  status,
  loading,
  okStatuses,
  emptyTitle = 'Sonuç bulunamadı',
  emptyDescription = 'Bu sorgu için backend tarafında veri yok.',
  notReadyTitle,
  notReadyDescription,
  message,
  nextActions,
  endpoint,
  onRetry,
  retryLabel,
  loadingFallback,
  children,
}: ReadinessGateProps) {
  if (loading || status === 'loading') {
    return <>{loadingFallback ?? <SkeletonCard />}</>;
  }

  const okSet = new Set<ReadinessState>(['ok', ...(okStatuses ?? [])]);
  if (status && okSet.has(status as ReadinessState)) {
    return <>{children}</>;
  }

  if (!status || status === 'idle') {
    return <>{children}</>;
  }

  if (status === 'empty') {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-[13px] font-medium text-brand-muted-blue hover:underline focus-visible:shadow-focus focus-visible:outline-none"
            >
              {retryLabel ?? 'Yeniden sorgula'}
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <StatusBanner
      status={status as ReadinessState}
      title={notReadyTitle}
      message={notReadyDescription ?? message}
      nextActions={nextActions}
      endpoint={endpoint}
      onRetry={onRetry}
      retryLabel={retryLabel}
    />
  );
}
