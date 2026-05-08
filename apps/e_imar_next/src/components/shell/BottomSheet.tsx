'use client';

import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUIStore, type BottomSheetSnap } from '@/lib/store/ui-store';
import { useMapStore } from '@/lib/store/map-store';
import { LeftSidebar } from './LeftSidebar';
import { RightContextPanel } from './RightContextPanel';
import { cn } from '@/lib/utils/cn';

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
          {selectedParcelId ? (
            <RightContextPanel className="border-l-0" />
          ) : (
            <LeftSidebar className="border-r-0" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
