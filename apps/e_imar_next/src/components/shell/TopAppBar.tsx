'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bell,
  Box,
  FileText,
  Map as MapIcon,
  Menu,
  Search,
  Star,
  X,
  PlusCircle,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/lib/store/ui-store';
import { useMapStore } from '@/lib/store/map-store';
import { useSearchStore } from '@/lib/store/search-store';
import { ParcelSearchForm } from '@/components/parcel/ParcelSearchForm';
import { EnvironmentStatusChip } from './EnvironmentStatusChip';
import { ThemeToggle } from './ThemeToggle';

export function TopAppBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const setLeftSidebarOpen = useUIStore((s) => s.setLeftSidebarOpen);
  const searchOverlayOpen = useUIStore((s) => s.searchOverlayOpen);
  const setSearchOverlayOpen = useUIStore((s) => s.setSearchOverlayOpen);
  const userReference = useSearchStore((s) => s.userReference);
  const setUserReference = useSearchStore((s) => s.setUserReference);
  const resetSearch = useSearchStore((s) => s.reset);
  const resetMap = useMapStore((s) => s.resetMap);
  const toggle3D = useMapStore((s) => s.toggle3D);
  const reduce = useReducedMotion();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
    setSearchOverlayOpen(true);
  }

  // Close overlay on Escape.
  useEffect(() => {
    if (!searchOverlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOverlayOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOverlayOpen, setSearchOverlayOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-border-subtle bg-bg-surface/95 backdrop-blur">
        <div className="flex h-full items-center gap-3 px-4">
          {/* Mobile menu button */}
          <IconButton
            aria-label="Sol paneli aç"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setLeftSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </IconButton>

          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 focus-visible:shadow-focus focus-visible:outline-none rounded-md px-1"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-navy text-text-inverse">
              <MapIcon className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-[15px] font-semibold text-brand-navy">e-İMAR</span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                GIS workspace
              </span>
            </span>
          </Link>

          {/* Search */}
          <form
            onSubmit={onSubmit}
            className="ml-2 flex max-w-2xl flex-1 items-center"
            role="search"
          >
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ada/parsel, adres, belediye, koordinat ara"
              aria-label="Parsel veya adres ara"
              leftAdornment={<Search className="h-4 w-4" aria-hidden />}
              containerClassName="w-full"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Tooltip content="Yeni sorgu" side="bottom">
              <div>
                <IconButton
                  aria-label="Yeni sorgu"
                  variant="ghost"
                  onClick={() => {
                    resetSearch();
                    resetMap();
                    setSubmittedQuery(null);
                    setQuery('');
                  }}
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            </Tooltip>
            <Tooltip content="Parsel Alarm" side="bottom">
              <Link
                href="/watchlist"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                aria-label="Parsel Alarm"
              >
                <Star className="h-4 w-4" aria-hidden />
              </Link>
            </Tooltip>
            <Tooltip content="Raporlar" side="bottom">
              <Link
                href="/reports"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                aria-label="Raporlar"
              >
                <FileText className="h-4 w-4" aria-hidden />
              </Link>
            </Tooltip>
            <Tooltip content="3D modu (Sprint 3)" side="bottom">
              <div>
                <IconButton aria-label="3D modu" variant="ghost" onClick={toggle3D}>
                  <Box className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            </Tooltip>
            <Tooltip content="Bildirimler (Sprint 2)" side="bottom">
              <div>
                <IconButton aria-label="Bildirimler" variant="ghost">
                  <Bell className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            </Tooltip>

            <div className="hidden h-6 w-px bg-border-subtle md:block" />

            <EnvironmentStatusChip />
            <ThemeToggle />

            <div
              aria-label="Kullanıcı profili"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-text-inverse text-[12px] font-semibold ring-1 ring-border"
              title={userReference || 'Misafir kullanıcı'}
            >
              {userReference ? userReference.slice(0, 2).toUpperCase() : 'GS'}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOverlayOpen ? (
          <motion.div
            key="search-overlay"
            className="fixed inset-0 z-50 bg-bg-inverse/40 backdrop-blur-sm"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setSearchOverlayOpen(false);
            }}
          >
            <motion.div
              initial={reduce ? false : { y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] }}
              className="mx-auto mt-20 w-[min(640px,calc(100%-32px))] rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-panel"
              role="dialog"
              aria-label="Hızlı parsel sorgusu"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 text-h3 text-text-primary">Hızlı sorgu</h2>
                  <p className="mt-1 text-[12px] text-text-muted">
                    Üst arama çubuğundan girilen ifade otomatik olarak doğru sekmeye yönlendirilir.
                  </p>
                </div>
                <IconButton
                  aria-label="Kapat"
                  variant="ghost"
                  onClick={() => setSearchOverlayOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
              <div className="mt-4">
                <Input
                  label="userReference (opsiyonel)"
                  placeholder="örn. demo-user"
                  value={userReference}
                  onChange={(event) => setUserReference(event.target.value)}
                  containerClassName="mb-4"
                />
                <ParcelSearchForm
                  initialQuery={submittedQuery ?? undefined}
                  onAfterSubmit={() => {
                    router.refresh();
                  }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3 text-[12px] text-text-muted">
                <span>İpucu: 12345/7 yazıp Enter&apos;a basın</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchOverlayOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
