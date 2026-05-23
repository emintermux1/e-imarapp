'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Building,
  Filter,
  History,
  Layers,
  Star,
  X,
} from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { LayerCatalog } from '@/components/map/LayerCatalog';
import { EmptyState } from '@/components/data/EmptyState';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { useUIStore, type LeftSidebarTab } from '@/lib/store/ui-store';
import { useWorkspace } from '@/lib/query/hooks';
import { useSearchStore } from '@/lib/store/search-store';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

const TAB_ITEMS: TabItem[] = [
  { id: 'layers', label: 'Katmanlar', icon: <Layers className="h-3.5 w-3.5" aria-hidden /> },
  { id: 'saved', label: 'Kayıtlı', icon: <Bookmark className="h-3.5 w-3.5" aria-hidden /> },
  { id: 'watchlist', label: 'Alarm', icon: <Star className="h-3.5 w-3.5" aria-hidden /> },
  { id: 'history', label: 'Geçmiş', icon: <History className="h-3.5 w-3.5" aria-hidden /> },
  { id: 'filters', label: 'Filtreler', icon: <Filter className="h-3.5 w-3.5" aria-hidden /> },
];

interface LeftSidebarProps {
  className?: string;
  /** When true, render close button (mobile drawer) */
  withCloseButton?: boolean;
}

export function LeftSidebar({ className, withCloseButton }: LeftSidebarProps) {
  const tab = useUIStore((s) => s.leftSidebarTab);
  const setTab = useUIStore((s) => s.setLeftSidebarTab);
  const setOpen = useUIStore((s) => s.setLeftSidebarOpen);

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col border-r border-border-subtle bg-bg-surface',
        className,
      )}
      aria-label="Sol kenar paneli"
    >
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle px-3 pt-3">
        <Tabs
          items={TAB_ITEMS}
          value={tab}
          onChange={(id) => setTab(id as LeftSidebarTab)}
          ariaLabel="Sol panel sekmeleri"
          variant="underline"
          size="sm"
          className="border-0"
        />
        {withCloseButton ? (
          <IconButton
            aria-label="Sol paneli kapat"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="-mt-1"
          >
            <X className="h-4 w-4" aria-hidden />
          </IconButton>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'layers' ? <LayerCatalog className="h-full" /> : null}
        {tab === 'saved' ? <SavedTab /> : null}
        {tab === 'watchlist' ? <WatchlistTab /> : null}
        {tab === 'history' ? <HistoryTab /> : null}
        {tab === 'filters' ? <FiltersTab /> : null}
      </div>
    </aside>
  );
}

function PanelContent({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto scroll-thin p-4">{children}</div>;
}

function SavedTab() {
  const userReference = useSearchStore((s) => s.userReference);
  const workspace = useWorkspace(userReference || undefined);
  const status = userReference
    ? workspace.isError
      ? 'network_error'
      : workspace.data?.favorites?.status
    : 'not_ready';
  const items = workspace.data?.favorites?.favorites ?? [];
  return (
    <PanelContent>
      <ReadinessGate
        status={status as string | undefined}
        loading={workspace.isLoading}
        emptyTitle="Kayıtlı sorgu yok"
        emptyDescription="Backend kayıt servisi henüz kayıt döndürmedi."
        notReadyTitle="Kayıtlı sorgular hazır değil"
        notReadyDescription="Profil bağlamak için userReference girin veya Sprint 2'de aktif olacak workspace modülünü bekleyin."
        nextActions={workspace.data?.favorites?.nextActions}
      >
        {items.length === 0 ? (
          <EmptyState
            title="Henüz kayıt yok"
            description="Sorgu çalıştırdıktan sonra parselleri Yıldıza ekleyin."
            icon={<Bookmark className="h-5 w-5" aria-hidden />}
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="rounded-md border border-border-subtle bg-bg-base/50 px-3 py-2 text-[12px] text-text-secondary"
              >
                <pre className="m-0 whitespace-pre-wrap break-words font-data text-[11px]">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </ReadinessGate>
    </PanelContent>
  );
}

function WatchlistTab() {
  return (
    <PanelContent>
      <ReadinessGate
        status="not_ready"
        notReadyTitle="Parsel Alarm Sprint 2"
        notReadyDescription="Parsel Alarm kuralları ve bildirim tercihleri Sprint 2'de aktive edilecek."
        nextActions={[
          'Sprint 2: /eplan/subscriptions ile Parsel Alarm kuralı oluşturma',
          'Sprint 2: WebSocket bildirim akışı',
        ]}
      >
        <div />
      </ReadinessGate>
    </PanelContent>
  );
}

function HistoryTab() {
  const userReference = useSearchStore((s) => s.userReference);
  const workspace = useWorkspace(userReference || undefined);
  const status = userReference
    ? workspace.isError
      ? 'network_error'
      : workspace.data?.history?.status
    : 'not_ready';
  const items = workspace.data?.history?.history ?? [];
  return (
    <PanelContent>
      <ReadinessGate
        status={status as string | undefined}
        loading={workspace.isLoading}
        emptyTitle="Sorgu geçmişi yok"
        emptyDescription="Henüz herhangi bir parsel sorgusu kayıt altına alınmadı."
        notReadyTitle="Geçmiş bağlı değil"
        notReadyDescription="Backend workspace modülü henüz hazır değil veya userReference belirtilmedi."
        nextActions={workspace.data?.history?.nextActions}
      >
        {items.length === 0 ? (
          <EmptyState
            title="Henüz geçmiş yok"
            description="Bir sorgu çalıştırdığınızda geçmiş burada görünecek."
            icon={<History className="h-5 w-5" aria-hidden />}
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="rounded-md border border-border-subtle bg-bg-base/50 px-3 py-2 text-[12px] text-text-secondary"
              >
                <pre className="m-0 whitespace-pre-wrap break-words font-data text-[11px]">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </ReadinessGate>
    </PanelContent>
  );
}

function FiltersTab() {
  const reduce = useReducedMotion();
  return (
    <PanelContent>
      <div className="space-y-3">
        <div>
          <h4 className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Belediye
          </h4>
          <AnimatePresence>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.18 }}
              className="mt-2 rounded-md border border-dashed border-border-subtle p-3 text-[12px] text-text-muted"
            >
              <Building className="mb-2 h-4 w-4" aria-hidden />
              İl/İlçe/Mahalle hiyerarşi seçici Sprint 2&apos;de bağlanacak.
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <h4 className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Zaman aralığı
          </h4>
          <div className="mt-2 rounded-md border border-dashed border-border-subtle p-3 text-[12px] text-text-muted">
            Plan değişim filtreleri için Sprint 2&apos;de time-machine modülü açılacak.
          </div>
        </div>
        <ReadinessGate
          status="not_ready"
          notReadyTitle="Filtreler — Sprint 2"
          notReadyDescription="Belediye ve plan tipi filtreleri için ingestion modülü tamamlanmalı."
        >
          <div />
        </ReadinessGate>
      </div>
    </PanelContent>
  );
}

interface LeftSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile/tablet drawer wrapper. AppShell renders this for `< lg` viewports.
 */
export function LeftSidebarDrawer({ open, onClose }: LeftSidebarDrawerProps) {
  const reduce = useReducedMotion();

  // Sync open prop with store + lock body scroll while open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="drawer"
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
            className="absolute inset-y-0 left-0 w-[320px] max-w-[85vw] bg-bg-surface shadow-panel"
            initial={reduce ? false : { x: -340 }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: -340 }}
            transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] }}
          >
            <LeftSidebar withCloseButton />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
