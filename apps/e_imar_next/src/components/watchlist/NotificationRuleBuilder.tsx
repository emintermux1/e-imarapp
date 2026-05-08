'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBanner } from '@/components/data/StatusBanner';
import { useWatchlistStore } from '@/lib/store/watchlist-store';
import { useCreateSubscription } from '@/lib/query/hooks';
import { trackEvent } from '@/lib/analytics/events';
import {
  ENTITY_TYPE_HINT,
  ENTITY_TYPE_LABEL,
  EVENT_HINT,
  EVENT_LABEL,
} from './watchlist-utils';
import type {
  WatchlistChannel,
  WatchlistEntityType,
  WatchlistEventType,
  WatchlistRule,
  WatchlistSeverity,
} from '@/lib/api/types';

const ENTITY_TYPES: WatchlistEntityType[] = ['parcel', 'region', 'municipality_feed'];
const EVENT_TYPES: WatchlistEventType[] = ['plan_change', 'risk_change', 'aski_start', 'aski_end'];
const SEVERITIES: WatchlistSeverity[] = ['low', 'medium', 'high', 'critical'];
const CHANNELS: WatchlistChannel[] = ['push', 'email'];

const schema = z.object({
  entityType: z.enum(['parcel', 'region', 'municipality_feed']),
  entityRef: z.string().trim().min(1, 'Referans gerekli'),
  events: z.array(z.enum(EVENT_TYPES as [WatchlistEventType, ...WatchlistEventType[]])).min(1, 'En az bir olay seçin'),
  severityFloor: z.enum(SEVERITIES as [WatchlistSeverity, ...WatchlistSeverity[]]).optional(),
  channels: z.array(z.enum(CHANNELS as [WatchlistChannel, ...WatchlistChannel[]])).default([]),
  label: z.string().trim().max(120, 'Etiket çok uzun').optional(),
});

type FormValues = z.infer<typeof schema>;

interface NotificationRuleBuilderProps {
  userReference: string;
  onSaved?: () => void;
}

export function NotificationRuleBuilder({
  userReference,
  onSaved,
}: NotificationRuleBuilderProps) {
  const builderDraft = useWatchlistStore((s) => s.builderDraft);
  const closeBuilder = useWatchlistStore((s) => s.closeBuilder);
  const createMutation = useCreateSubscription(userReference);

  const initial: FormValues = {
    entityType: builderDraft?.entityType ?? 'parcel',
    entityRef: builderDraft?.entityRef ?? '',
    events: (builderDraft?.events as WatchlistEventType[]) ?? [],
    severityFloor: builderDraft?.severityFloor ?? 'medium',
    channels: (builderDraft?.channels as WatchlistChannel[]) ?? ['push'],
    label: builderDraft?.label ?? '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  // Reset the form whenever the active draft changes (e.g. when the user
  // clicks Edit on a different existing rule).
  useEffect(() => {
    form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    builderDraft?.id,
    builderDraft?.entityType,
    builderDraft?.entityRef,
  ]);

  const editingExisting = Boolean(builderDraft?.id);

  function onSubmit(values: FormValues) {
    const rule: WatchlistRule = {
      id: builderDraft?.id,
      entityType: values.entityType,
      entityRef: values.entityRef,
      events: values.events,
      severityFloor: values.severityFloor,
      channels: values.channels,
      label: values.label?.trim() || undefined,
    };
    trackEvent('watchlist_entity_added', {
      entityType: rule.entityType,
      entityRef: rule.entityRef,
    });
    createMutation.mutate(rule, {
      onSuccess: () => {
        trackEvent('watchlist_rule_saved', {
          entityType: rule.entityType,
          events: rule.events,
          severityFloor: rule.severityFloor,
        });
        closeBuilder();
        onSaved?.();
      },
    });
  }

  const entityType = form.watch('entityType');

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex h-full flex-col gap-3 p-4"
      aria-label="Bildirim kuralı oluştur"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-h3 text-text-primary">
            {editingExisting ? 'Kuralı düzenle' : 'Yeni watchlist kuralı'}
          </h3>
          <p className="m-0 mt-0.5 text-[12px] text-text-muted">
            Backend `/eplan/subscriptions` rotasına gönderilir; başarısız olursa hata banner&apos;ı gösterilir.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          leftIcon={<X className="h-3.5 w-3.5" aria-hidden />}
          onClick={closeBuilder}
        >
          Vazgeç
        </Button>
      </header>

      <fieldset className="m-0 border-0 p-0">
        <legend className="text-[13px] font-medium text-text-secondary">Varlık tipi</legend>
        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {ENTITY_TYPES.map((type) => {
            const checked = form.watch('entityType') === type;
            return (
              <label
                key={type}
                className={`cursor-pointer rounded-md border px-3 py-2 text-[12px] transition-colors focus-within:shadow-focus ${
                  checked
                    ? 'border-brand-navy bg-brand-navy/5 text-text-primary'
                    : 'border-border bg-bg-surface text-text-secondary hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={type}
                  checked={checked}
                  onChange={() => form.setValue('entityType', type, { shouldValidate: true })}
                  aria-label={ENTITY_TYPE_LABEL[type]}
                />
                <span className="block font-medium">{ENTITY_TYPE_LABEL[type]}</span>
                <span className="mt-0.5 block text-[11px] text-text-muted">
                  {ENTITY_TYPE_HINT[type]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Input
        label="Referans"
        placeholder={ENTITY_TYPE_HINT[entityType]}
        {...form.register('entityRef')}
        error={form.formState.errors.entityRef?.message}
      />

      <fieldset className="m-0 border-0 p-0">
        <legend className="text-[13px] font-medium text-text-secondary">İzlenecek olaylar</legend>
        <Controller
          name="events"
          control={form.control}
          render={({ field }) => (
            <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {EVENT_TYPES.map((event) => {
                const checked = field.value.includes(event);
                return (
                  <label
                    key={event}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-[12px] transition-colors focus-within:shadow-focus ${
                      checked
                        ? 'border-brand-navy bg-brand-navy/5 text-text-primary'
                        : 'border-border bg-bg-surface text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? field.value.filter((value) => value !== event)
                          : [...field.value, event];
                        field.onChange(next);
                      }}
                      aria-label={EVENT_LABEL[event]}
                    />
                    <span className="block font-medium">{EVENT_LABEL[event]}</span>
                    <span className="mt-0.5 block text-[11px] text-text-muted">
                      {EVENT_HINT[event]}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {form.formState.errors.events ? (
          <p className="mt-1 text-[12px] text-state-gov-red" role="alert">
            {form.formState.errors.events.message as string}
          </p>
        ) : null}
      </fieldset>

      <Select
        label="Önem alt sınırı"
        options={SEVERITIES.map((value) => ({
          value,
          label: {
            low: 'Düşük',
            medium: 'Orta',
            high: 'Yüksek',
            critical: 'Kritik',
          }[value],
        }))}
        {...form.register('severityFloor')}
      />

      <fieldset className="m-0 border-0 p-0">
        <legend className="text-[13px] font-medium text-text-secondary">Kanallar</legend>
        <Controller
          name="channels"
          control={form.control}
          render={({ field }) => (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CHANNELS.map((channel) => {
                const checked = field.value.includes(channel);
                return (
                  <label
                    key={channel}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] transition-colors focus-within:shadow-focus ${
                      checked
                        ? 'border-brand-navy bg-brand-navy/5 text-text-primary'
                        : 'border-border bg-bg-surface text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? field.value.filter((value) => value !== channel)
                          : [...field.value, channel];
                        field.onChange(next);
                      }}
                      aria-label={channel === 'push' ? 'Uygulama içi bildirim' : 'E-posta'}
                    />
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full border ${
                        checked
                          ? 'border-brand-navy bg-brand-navy'
                          : 'border-border-strong bg-bg-surface'
                      }`}
                      aria-hidden
                    />
                    {channel === 'push' ? 'Uygulama içi' : 'E-posta'}
                  </label>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      <Input
        label="Etiket (opsiyonel)"
        placeholder="örn. Çankaya — yeni planlar"
        {...form.register('label')}
        error={form.formState.errors.label?.message}
      />

      {createMutation.isError ? (
        <StatusBanner
          status="network_error"
          title="Watchlist kaydı eklenemedi"
          message={createMutation.error?.message}
          endpoint={createMutation.error?.endpoint}
        />
      ) : null}

      <div className="mt-auto flex items-center justify-end gap-2">
        {editingExisting ? (
          <Button
            type="button"
            variant="ghost"
            leftIcon={<Trash2 className="h-3.5 w-3.5 text-state-gov-red" aria-hidden />}
            onClick={closeBuilder}
          >
            Sil
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={closeBuilder}>
          Vazgeç
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={createMutation.isPending}
          leftIcon={<Save className="h-4 w-4" aria-hidden />}
        >
          Kaydet
        </Button>
      </div>
    </form>
  );
}
