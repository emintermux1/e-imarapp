'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPinned, X } from 'lucide-react';
import { Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ParcelDetailAccordion } from '@/components/parcel/ParcelDetailAccordion';
import { EmptyState } from '@/components/data/EmptyState';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useMapStore } from '@/lib/store/map-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useSearchStore } from '@/lib/store/search-store';
import { queryKeys } from '@/lib/query/keys';
import type { ParcelWorkflowResponse } from '@/lib/api/types';
import { buildParcelWorkflowView } from '@/lib/utils/parcel';
import { cn } from '@/lib/utils/cn';
import { trackEvent } from '@/lib/analytics/events';

interface RightContextPanelProps {
  className?: string;
  withCloseButton?: boolean;
}

function PanelHeader({ title, subtitle, status, onClose }: {
  title: string;
  subtitle?: string;
  status?: string;
  onClose?: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="m-0 truncate text-h3 text-text-primary">{title}</h2>
          {status ? <StatusBadge status={status} size="xs" /> : null}
        </div>
        {subtitle ? <p className="mt-0.5 text-[12px] text-text-muted">{subtitle}</p> : null}
      </div>
      {onClose ? (
        <IconButton aria-label="Sağ paneli kapat" variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" aria-hidden />
        </IconButton>
      ) : null}
    </header>
  );
}

export function RightContextPanel({ className, withCloseButton }: RightContextPanelProps) {
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const selectedWorkflowKey = useMapStore((s) => s.selectedWorkflowKey);
  const selectParcel = useMapStore((s) => s.selectParcel);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const lastResponse = useSearchStore((s) => s.lastResponse);
  const lastResponseKey = useSearchStore((s) => s.lastResponseKey);
  const queryClient = useQueryClient();

  // Resolve the workflow response for the selected parcel.
  let workflow: ParcelWorkflowResponse | undefined;
  if (selectedWorkflowKey && selectedWorkflowKey === lastResponseKey && lastResponse) {
    workflow = lastResponse;
  } else if (selectedWorkflowKey) {
    workflow = queryClient.getQueryData<ParcelWorkflowResponse>(
      queryKeys.parcelWorkflow(selectedWorkflowKey),
    );
  } else if (lastResponse) {
    workflow = lastResponse;
  }

  const view = buildParcelWorkflowView(workflow, selectedParcelId);
  const hasParcel = view.parcels.length > 0;

  function handleClose() {
    setRightPanelOpen(false);
  }

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col border-l border-border-subtle bg-bg-surface',
        className,
      )}
      aria-label="Sağ bağlam paneli"
    >
      {!selectedParcelId && !hasParcel ? (
        <>
          <PanelHeader
            title="Bağlam paneli"
            subtitle="Bir parsel seçildiğinde detaylar burada görünür"
            onClose={withCloseButton ? handleClose : undefined}
          />
          <div className="flex-1 overflow-y-auto scroll-thin">
            <EmptyState
              title="Bir parsel seçin"
              description="Üst arama çubuğundan ada/parsel, koordinat veya adres ile sorgu çalıştırın. Backend hazır olan veriyi burada gösterir; eksik alanlar için doğrudan readiness mesajı render edilir."
              icon={<MapPinned className="h-6 w-6" aria-hidden />}
              action={
                <Button size="sm" variant="primary" onClick={() => useUIStore.getState().setSearchOverlayOpen(true)}>
                  Hızlı sorgu aç
                </Button>
              }
            />
          </div>
        </>
      ) : (
        <>
          <PanelHeader
            title={
              view.selectedParcel?.ada && view.selectedParcel?.parselNo
                ? `Ada ${view.selectedParcel.ada} / Parsel ${view.selectedParcel.parselNo}`
                : 'Parsel detayı'
            }
            subtitle={view.selectedParcel?.planTitle ?? view.selectedParcel?.municipality}
            status={view.parcelStatus ?? view.status}
            onClose={withCloseButton ? handleClose : undefined}
          />
          <div className="flex-1 overflow-y-auto scroll-thin">
            <Suspense fallback={null}>
              {hasParcel ? (
                <>
                  {view.parcels.length > 1 ? (
                    <div className="border-b border-border-subtle bg-bg-subtle/30 px-4 py-2">
                      <div className="flex items-center justify-between text-[12px] text-text-muted">
                        <span>{view.parcels.length} sonuç</span>
                        <select
                          value={view.selectedParcel?.id ?? view.parcels[0]?.id}
                          onChange={(event) => {
                            selectParcel(event.target.value, selectedWorkflowKey);
                            trackEvent('parcel_selected', {
                              parcelId: event.target.value,
                              source: 'search',
                            });
                          }}
                          className="rounded-md border border-border bg-bg-surface px-2 py-1 font-data text-[12px] text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                          aria-label="Parsel seç"
                        >
                          {view.parcels.map((parcel) => (
                            <option key={parcel.id} value={parcel.id}>
                              {parcel.ada ?? '?'} / {parcel.parselNo ?? '?'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                  <ParcelDetailAccordion view={view} />
                </>
              ) : (
                <div className="p-4">
                  <ReadinessGate
                    status={view.parcelStatus ?? view.status ?? 'empty'}
                    nextActions={view.parcelQuery?.nextActions ?? workflow?.nextActions}
                    emptyTitle="Sorgu için kayıt bulunamadı"
                    emptyDescription="Backend bu sorguya parsel döndürmedi. Ada/parsel veya adres bilgisini kontrol edin."
                  >
                    <div />
                  </ReadinessGate>
                </div>
              )}
            </Suspense>
          </div>
        </>
      )}
    </aside>
  );
}

interface RightContextPanelDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RightContextPanelDrawer({ open, onClose }: RightContextPanelDrawerProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="right-drawer"
          className="fixed inset-0 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.16 }}
        >
          <button
            type="button"
            aria-label="Drawer arka planı"
            className="absolute inset-0 bg-bg-inverse/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-[420px] max-w-[90vw] bg-bg-surface shadow-panel"
            initial={reduce ? false : { x: 440 }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: 440 }}
            transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] }}
          >
            <RightContextPanel withCloseButton />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
