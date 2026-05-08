'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crosshair, MapPin, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { useParcelWorkflowMutation } from '@/lib/query/hooks';
import { useMapStore } from '@/lib/store/map-store';
import { useSearchStore } from '@/lib/store/search-store';
import { useUIStore } from '@/lib/store/ui-store';
import { trackEvent } from '@/lib/analytics/events';
import { extractParcelFacts } from '@/lib/utils/parcel';
import type { ParcelQueryType, ParcelWorkflowPayload } from '@/lib/api/types';
import { StatusBanner } from '@/components/data/StatusBanner';
import { cn } from '@/lib/utils/cn';

const adaParselSchema = z.object({
  ada: z
    .string()
    .trim()
    .min(1, 'Ada numarası gerekli')
    .max(20, 'Ada numarası fazla uzun'),
  parselNo: z
    .string()
    .trim()
    .min(1, 'Parsel numarası gerekli')
    .max(20, 'Parsel numarası fazla uzun'),
  municipalityId: z.string().trim().optional(),
});

const coordinateSchema = z.object({
  longitude: z
    .string()
    .trim()
    .min(1, 'Boylam gerekli')
    .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), 'Geçerli sayı girin'),
  latitude: z
    .string()
    .trim()
    .min(1, 'Enlem gerekli')
    .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), 'Geçerli sayı girin'),
  municipalityId: z.string().trim().optional(),
});

const addressSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, 'Adres en az 3 karakter olmalı')
    .max(280, 'Adres çok uzun'),
  municipalityId: z.string().trim().optional(),
});

type AdaParselValues = z.infer<typeof adaParselSchema>;
type CoordinateValues = z.infer<typeof coordinateSchema>;
type AddressValues = z.infer<typeof addressSchema>;

type ActiveTab = 'ada_parsel' | 'coordinate' | 'address';

const tabs: TabItem[] = [
  { id: 'ada_parsel', label: 'Ada / Parsel' },
  { id: 'coordinate', label: 'Koordinat' },
  { id: 'address', label: 'Adres' },
];

interface ParcelSearchFormProps {
  className?: string;
  onAfterSubmit?: () => void;
  /** Pre-fill from a global query string from `TopAppBar`. */
  initialQuery?: string;
}

export function ParcelSearchForm({ className, onAfterSubmit, initialQuery }: ParcelSearchFormProps) {
  const [tab, setTab] = useState<ActiveTab>('ada_parsel');
  const mutation = useParcelWorkflowMutation();
  const setLastQuery = useSearchStore((s) => s.setLastQuery);
  const setLastResponse = useSearchStore((s) => s.setLastResponse);
  const userReference = useSearchStore((s) => s.userReference);
  const selectParcel = useMapStore((s) => s.selectParcel);
  const resetMap = useMapStore((s) => s.resetMap);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const setBottomSheetSnap = useUIStore((s) => s.setBottomSheetSnap);
  const setSearchOverlayOpen = useUIStore((s) => s.setSearchOverlayOpen);

  const adaParselForm = useForm<AdaParselValues>({
    resolver: zodResolver(adaParselSchema),
    defaultValues: { ada: '', parselNo: '', municipalityId: '' },
  });
  const coordinateForm = useForm<CoordinateValues>({
    resolver: zodResolver(coordinateSchema),
    defaultValues: { longitude: '', latitude: '', municipalityId: '' },
  });
  const addressForm = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { address: '', municipalityId: '' },
  });

  // Detect initial query type to pre-fill the form when opened from top-bar.
  useEffect(() => {
    if (!initialQuery) return;
    const trimmed = initialQuery.trim();
    if (!trimmed) return;
    const coordMatch = trimmed.match(/^(-?\d+(?:[.,]\d+)?)[\s,;]+(-?\d+(?:[.,]\d+)?)$/);
    const adaParselMatch = trimmed.match(/^(\d{1,8})\s*[\/\-x]\s*(\d{1,8})$/);
    if (coordMatch) {
      setTab('coordinate');
      coordinateForm.reset({
        latitude: coordMatch[1].replace(',', '.'),
        longitude: coordMatch[2].replace(',', '.'),
        municipalityId: '',
      });
    } else if (adaParselMatch) {
      setTab('ada_parsel');
      adaParselForm.reset({ ada: adaParselMatch[1], parselNo: adaParselMatch[2], municipalityId: '' });
    } else {
      setTab('address');
      addressForm.reset({ address: trimmed, municipalityId: '' });
    }
    // We intentionally only react to the prop changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function runWorkflow(payload: ParcelWorkflowPayload, type: ParcelQueryType) {
    setLastQuery(payload);
    trackEvent('query_submitted', { type, userReference: payload.userReference });
    try {
      const { response, cacheKey } = await mutation.mutateAsync(payload);
      setLastResponse(response, cacheKey);
      const parcels = response.parcelQuery?.parcels ?? [];
      trackEvent('query_finished', {
        type,
        status: response.status ?? response.parcelQuery?.status,
        count: parcels.length,
      });
      if (parcels.length > 0) {
        const firstParcel = extractParcelFacts(parcels[0], 'parcel-0');
        selectParcel(firstParcel.id, cacheKey);
        setRightPanelOpen(true);
        setBottomSheetSnap('half');
        setSearchOverlayOpen(false);
        trackEvent('parcel_selected', { parcelId: firstParcel.id, source: 'search' });
      } else {
        // Keep panel open so the user sees the empty/not_ready state.
        setRightPanelOpen(true);
      }
      onAfterSubmit?.();
    } catch (error) {
      trackEvent('query_failed', {
        type,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  const submitting = mutation.isPending;
  const userRef = userReference.trim() || undefined;

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <Tabs
        items={tabs}
        value={tab}
        onChange={(id) => setTab(id as ActiveTab)}
        ariaLabel="Sorgu tipi"
        variant="underline"
      />

      {tab === 'ada_parsel' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={adaParselForm.handleSubmit((values) => {
            void runWorkflow(
              {
                userReference: userRef,
                query: {
                  type: 'ada_parsel',
                  ada: values.ada,
                  parselNo: values.parselNo,
                  municipalityId: values.municipalityId || undefined,
                },
              },
              'ada_parsel',
            );
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ada"
              placeholder="Ör. 12345"
              inputMode="numeric"
              autoComplete="off"
              {...adaParselForm.register('ada')}
              error={adaParselForm.formState.errors.ada?.message}
            />
            <Input
              label="Parsel"
              placeholder="Ör. 7"
              inputMode="numeric"
              autoComplete="off"
              {...adaParselForm.register('parselNo')}
              error={adaParselForm.formState.errors.parselNo?.message}
            />
          </div>
          <Input
            label="Belediye ID (opsiyonel)"
            placeholder="UUID"
            autoComplete="off"
            {...adaParselForm.register('municipalityId')}
          />
          <FormFooter
            submitting={submitting}
            onClear={() => {
              adaParselForm.reset();
              resetMap();
            }}
          />
        </form>
      ) : null}

      {tab === 'coordinate' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={coordinateForm.handleSubmit((values) => {
            void runWorkflow(
              {
                userReference: userRef,
                query: {
                  type: 'coordinate',
                  latitude: Number(values.latitude.replace(',', '.')),
                  longitude: Number(values.longitude.replace(',', '.')),
                  srid: 4326,
                  municipalityId: values.municipalityId || undefined,
                },
              },
              'coordinate',
            );
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Enlem"
              placeholder="Ör. 39.9208"
              inputMode="decimal"
              autoComplete="off"
              leftAdornment={<Crosshair className="h-4 w-4" aria-hidden />}
              {...coordinateForm.register('latitude')}
              error={coordinateForm.formState.errors.latitude?.message}
            />
            <Input
              label="Boylam"
              placeholder="Ör. 32.8541"
              inputMode="decimal"
              autoComplete="off"
              leftAdornment={<Crosshair className="h-4 w-4" aria-hidden />}
              {...coordinateForm.register('longitude')}
              error={coordinateForm.formState.errors.longitude?.message}
            />
          </div>
          <Input
            label="Belediye ID (opsiyonel)"
            placeholder="UUID"
            autoComplete="off"
            {...coordinateForm.register('municipalityId')}
          />
          <FormFooter
            submitting={submitting}
            onClear={() => {
              coordinateForm.reset();
              resetMap();
            }}
          />
        </form>
      ) : null}

      {tab === 'address' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={addressForm.handleSubmit((values) => {
            void runWorkflow(
              {
                userReference: userRef,
                query: {
                  type: 'address',
                  address: values.address,
                  municipalityId: values.municipalityId || undefined,
                },
              },
              'address',
            );
          })}
        >
          <Input
            label="Adres"
            placeholder="İl / İlçe / Mahalle / Sokak"
            autoComplete="off"
            leftAdornment={<MapPin className="h-4 w-4" aria-hidden />}
            {...addressForm.register('address')}
            error={addressForm.formState.errors.address?.message}
          />
          <Input
            label="Belediye ID (opsiyonel)"
            placeholder="UUID"
            autoComplete="off"
            {...addressForm.register('municipalityId')}
          />
          <FormFooter
            submitting={submitting}
            onClear={() => {
              addressForm.reset();
              resetMap();
            }}
          />
        </form>
      ) : null}

      {mutation.isError ? (
        <StatusBanner
          status="network_error"
          title="Backend bağlantısı"
          message={mutation.error?.message}
          endpoint={mutation.error?.endpoint}
          onRetry={() => mutation.reset()}
          retryLabel="Hata mesajını temizle"
        />
      ) : null}
    </div>
  );
}

function FormFooter({ submitting, onClear }: { submitting: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="submit"
        variant="primary"
        leftIcon={<Search className="h-4 w-4" aria-hidden />}
        loading={submitting}
        fullWidth
      >
        {submitting ? 'Sorgulanıyor' : 'Sorgula'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
        onClick={onClear}
      >
        Haritayı temizle
      </Button>
    </div>
  );
}
