'use client';

import { useEffect } from 'react';
import { useMapStore } from '@/lib/store/map-store';
import { useUIStore } from '@/lib/store/ui-store';

interface SelectParcelOnMountProps {
  id: string;
}

/**
 * Tiny client helper that runs once on mount to sync the route parameter
 * `id` with the map store. The accompanying server component remains a pure
 * server component — this just bootstraps the UI.
 */
export function SelectParcelOnMount({ id }: SelectParcelOnMountProps) {
  const selectParcel = useMapStore((s) => s.selectParcel);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  useEffect(() => {
    selectParcel(id, null);
    setRightPanelOpen(true);
  }, [id, selectParcel, setRightPanelOpen]);

  return null;
}
