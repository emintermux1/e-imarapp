'use client';

import { CheckCircle2, CircleAlert, Server, WifiOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useBootstrap, useMapProviders } from '@/lib/query/hooks';
import { StatusBadge } from '@/components/data/StatusBadge';
import { apiBaseUrl } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import type { ReadinessTone } from '@/types/readiness';
import { readinessTone } from '@/lib/utils/readiness';

interface ChipState {
  tone: ReadinessTone;
  label: string;
  icon: React.ReactNode;
}

function rolledUpTone(tones: ReadinessTone[]): ReadinessTone {
  if (tones.includes('danger')) return 'danger';
  if (tones.includes('warn')) return 'warn';
  if (tones.every((t) => t === 'success')) return 'success';
  if (tones.includes('success')) return 'info';
  return 'neutral';
}

const TONE_CLASSES: Record<ReadinessTone, string> = {
  success: 'border-state-success/40 bg-state-success/10 text-state-success',
  warn: 'border-state-warn/40 bg-state-warn/10 text-state-warn',
  danger: 'border-state-gov-red/40 bg-state-gov-red/10 text-state-gov-red',
  info: 'border-state-info/40 bg-state-info/10 text-state-info',
  neutral: 'border-border bg-bg-subtle text-text-secondary',
};

export function EnvironmentStatusChip() {
  const bootstrap = useBootstrap();
  const providers = useMapProviders();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const chip = useMemo<ChipState>(() => {
    if (bootstrap.isLoading || providers.isLoading) {
      return {
        tone: 'info',
        label: 'Bağlanıyor',
        icon: <Server className="h-3.5 w-3.5" aria-hidden />,
      };
    }
    if (bootstrap.isError) {
      return {
        tone: 'danger',
        label: 'API erişilemiyor',
        icon: <WifiOff className="h-3.5 w-3.5" aria-hidden />,
      };
    }
    const apiTone: ReadinessTone = readinessTone(bootstrap.data?.status ?? 'ok');
    const tileTone: ReadinessTone = readinessTone(bootstrap.data?.map?.tileStatus?.status);
    const providerList = bootstrap.data?.map?.providers?.length
      ? bootstrap.data.map.providers
      : providers.data ?? [];
    const provTone: ReadinessTone =
      providerList.length === 0
        ? 'neutral'
        : providerList.every((p) => p.configured)
        ? 'success'
        : providerList.some((p) => p.configured)
        ? 'warn'
        : 'danger';
    const tone = rolledUpTone([apiTone, tileTone, provTone]);
    if (tone === 'success') {
      return {
        tone,
        label: 'Tüm sistemler hazır',
        icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />,
      };
    }
    if (tone === 'warn') {
      return {
        tone,
        label: 'Kısmi hazırlık',
        icon: <CircleAlert className="h-3.5 w-3.5" aria-hidden />,
      };
    }
    if (tone === 'danger') {
      return {
        tone,
        label: 'Kaynak hazır değil',
        icon: <CircleAlert className="h-3.5 w-3.5" aria-hidden />,
      };
    }
    return {
      tone: 'info',
      label: 'Durum bekleniyor',
      icon: <Server className="h-3.5 w-3.5" aria-hidden />,
    };
  }, [bootstrap.isLoading, bootstrap.isError, bootstrap.data, providers.isLoading, providers.data]);

  const providerList = bootstrap.data?.map?.providers?.length
    ? bootstrap.data.map.providers
    : providers.data ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors',
          'focus-visible:shadow-focus focus-visible:outline-none',
          TONE_CLASSES[chip.tone],
        )}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              chip.tone === 'success'
                ? 'bg-state-success animate-ping'
                : chip.tone === 'warn'
                ? 'bg-state-warn'
                : chip.tone === 'danger'
                ? 'bg-state-gov-red'
                : 'bg-state-info',
            )}
          />
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              chip.tone === 'success'
                ? 'bg-state-success'
                : chip.tone === 'warn'
                ? 'bg-state-warn'
                : chip.tone === 'danger'
                ? 'bg-state-gov-red'
                : 'bg-state-info',
            )}
          />
        </span>
        <span className="hidden sm:inline">{chip.label}</span>
        <span className="sm:hidden inline-flex">{chip.icon}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0, 0, 1] }}
            role="dialog"
            aria-label="Sistem durumu"
            className="absolute right-0 top-full z-40 mt-2 w-[320px] rounded-lg border border-border bg-bg-surface p-3 text-[12px] shadow-panel"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="m-0 text-[13px] font-semibold text-text-primary">Sistem durumu</h4>
              <span className="font-data text-[11px] text-text-muted">{apiBaseUrl}</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span className="text-text-secondary">API</span>
                <StatusBadge
                  status={bootstrap.isError ? 'network_error' : bootstrap.data?.status ?? 'ok'}
                  size="xs"
                />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-text-secondary">Tile servisi</span>
                <StatusBadge status={bootstrap.data?.map?.tileStatus?.status ?? 'idle'} size="xs" />
              </li>
              <li>
                <div className="mb-1 text-text-secondary">Harita sağlayıcılar</div>
                {providerList.length === 0 ? (
                  <span className="text-text-muted">Sağlayıcı listesi boş.</span>
                ) : (
                  <ul className="space-y-1">
                    {providerList.map((provider) => (
                      <li
                        key={provider.id}
                        className="flex items-center justify-between rounded-sm bg-bg-subtle/60 px-2 py-1"
                      >
                        <span className="truncate text-text-primary">{provider.name}</span>
                        <StatusBadge
                          status={provider.configured ? 'ok' : 'requires_credentials'}
                          size="xs"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-text-muted">
              Durumlar backend tarafından döndürülen `tileStatus`, `map.providers` ve istek
              kodlarına göre türetilir; sahte hazırlık göstergesi yoktur.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
