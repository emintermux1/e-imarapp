'use client';

import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore, type BottomSheetSnap } from '@/lib/store/ui-store';
import { useMapStore } from '@/lib/store/map-store';
import { useAskiStore } from '@/lib/store/aski-store';
import { useSuspensionNotices } from '@/lib/query/hooks';
import { LeftSidebar } from './LeftSidebar';
import { RightContextPanel } from './RightContextPanel';
import { AskiPlanList } from '@/components/aski/AskiPlanList';
import { AskiFilters } from '@/components/aski/AskiFilters';
import { AskiPlanCard } from '@/components/aski/AskiPlanCard';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { cn } from '@/lib/utils/cn';
import type { SuspensionNoticeQuery } from '@/lib/api/client';

interface BottomSheetProps {
  className?: string;
}

const SNAP_HEIGHT_VH: Record<BottomSheetSnap, number> = {
  collapsed: 12,
  half: 50,
  full: 90,
};

export function BottomSheet({ className }: BottomSheetProps) {
  const snap = useUIStore((s) => s.bottomSheetSnap);
  const setSnap = useUIStore((s) => s.setBottomSheetSnap);
  const cycleSnap = useUIStore((s) => s.cycleBottomSheetSnap);
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const pathname = usePathname();
  const isAskiRoute = pathname?.startsWith('/aski-haritasi') ?? false;
  const reduce = useReducedMotion();

  const [vh, setVh] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const snapHeightPx = (vh * SNAP_HEIGHT_VH[snap]) / 100;
  const targetY = vh - snapHeightPx;

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;
    const intent = offsetY + velocityY * 0.3;
    if (intent < -80) {
      setSnap(snap === 'collapsed' ? 'half' : 'full');
    } else if (intent > 80) {
      setSnap(snap === 'full' ? 'half' : 'collapsed');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`sheet-${snap}`}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        initial={reduce ? false : { y: vh }}
        animate={{ y: targetY }}
        transition={reduce ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0, 0, 1] }}
        className={cn(
          'fixed inset-x-0 z-30 rounded-t-xl border-t border-border-subtle bg-bg-surface shadow-sheet',
          'lg:hidden',
          className,
        )}
        style={{ height: `${SNAP_HEIGHT_VH.full}vh`, top: 0 }}
      >
        <button
          type="button"
          onClick={cycleSnap}
          aria-label="Alt paneli genişlet"
          className="mx-auto block w-full pt-2 pb-1 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-border-strong" aria-hidden />
        </button>
        <div className="h-[calc(100%-1.5rem)] overflow-hidden">
          {isAskiRoute ? (
            <AskiBottomSheetContent />
          ) : selectedParcelId ? (
            <RightContextPanel className="border-l-0" />
          ) : (
            <LeftSidebar className="border-r-0" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Mobile bottom-sheet view for `/aski-haritasi`. Surfaces the filter strip,
 * the active suspension list and (when a plan is selected) its detail card.
 */
function AskiBottomSheetContent() {
  const filters = useAskiStore((s) => s.filters);
  const selectedPlanId = useAskiStore((s) => s.selectedPlanId);
  const query = useMemo<SuspensionNoticeQuery>(
    () => ({
      from: filters.dateFrom ?? undefined,
      to: filters.dateTo ?? undefined,
      municipalityIds:
        filters.municipalityIds.length > 0 ? filters.municipalityIds : undefined,
      planTypes: filters.planTypes.length > 0 ? filters.planTypes : undefined,
    }),
    [filters],
  );
  const noticesQuery = useSuspensionNotices(query);
  const status = noticesQuery.isError ? 'network_error' : noticesQuery.data?.status;
  const notices = noticesQuery.data?.notices ?? [];
  const selected = notices.find((notice) => notice.id === selectedPlanId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle px-3 py-2">
        <AskiFilters compact className="border-0 p-0 shadow-none" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        {status === 'ok' ? (
          <>
            <AskiPlanList notices={notices} vertical />
            {selected ? <AskiPlanCard notice={selected} /> : null}
          </>
        ) : (
          <div className="p-3">
            <ReadinessGate
              status={status}
              loading={noticesQuery.isLoading}
              endpoint="/eplan/suspension-notices"
              emptyTitle="Aktif askı kaydı yok"
              emptyDescription="Bu filtrelerle eşleşen kayıt bulunamadı."
              notReadyTitle="Askı kataloğu hazır değil"
              notReadyDescription={
                noticesQuery.isError
                  ? noticesQuery.error?.message
                  : (noticesQuery.data?.message as string | undefined)
              }
              nextActions={noticesQuery.data?.nextActions}
              onRetry={() => noticesQuery.refetch()}
            >
              <div />
            </ReadinessGate>
          </div>
        )}
      </div>
    </div>
  );
}
