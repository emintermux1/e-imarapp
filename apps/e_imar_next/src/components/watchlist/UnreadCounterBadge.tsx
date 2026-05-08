'use client';

import { cn } from '@/lib/utils/cn';

interface UnreadCounterBadgeProps {
  count?: number | null;
  className?: string;
}

/**
 * Small red unread counter shown next to a watchlist row. Renders nothing
 * when the count is zero or undefined; the parent must call this lazily so
 * we never display a fabricated counter.
 */
export function UnreadCounterBadge({ count, className }: UnreadCounterBadgeProps) {
  if (!count || count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span
      role="status"
      aria-label={`${count} okunmamış olay`}
      className={cn(
        'inline-flex min-w-[20px] items-center justify-center rounded-full bg-state-gov-red px-1.5 text-[11px] font-semibold leading-5 text-white',
        className,
      )}
    >
      {display}
    </span>
  );
}
