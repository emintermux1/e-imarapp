'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWatchlistStore } from '@/lib/store/watchlist-store';

interface AddEntityDialogProps {
  className?: string;
  fullWidth?: boolean;
}

/**
 * Trigger that opens the notification rule builder with a fresh draft.
 * Despite the "Dialog" name from the spec, the builder renders inline in the
 * right column of the watchlist shell — there is no modal to mount, only a
 * setter on the shared store.
 */
export function AddEntityDialog({ className, fullWidth }: AddEntityDialogProps) {
  const openBuilder = useWatchlistStore((s) => s.openBuilder);
  const selectEntity = useWatchlistStore((s) => s.selectEntity);
  return (
    <Button
      variant="primary"
      size="sm"
      leftIcon={<Plus className="h-4 w-4" aria-hidden />}
      onClick={() => {
        selectEntity(null);
        openBuilder({});
      }}
      className={className}
      fullWidth={fullWidth}
    >
      Watchlist&apos;e ekle
    </Button>
  );
}
