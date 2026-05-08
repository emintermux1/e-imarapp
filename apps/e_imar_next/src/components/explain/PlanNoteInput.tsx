'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { AudienceSelector } from './AudienceSelector';
import { useUIStore } from '@/lib/store/ui-store';
import { trackEvent } from '@/lib/analytics/events';
import type { Audience, PlanNoteExplainPayload } from '@/lib/api/types';

const schema = z.object({
  noteText: z
    .string()
    .trim()
    .min(8, 'Plan notu en az 8 karakter olmalı')
    .max(20000, 'Plan notu çok uzun (maks. 20.000 karakter)'),
  audience: z.enum(['citizen', 'architect', 'investor']),
  maxBullets: z
    .number({ invalid_type_error: 'Sayı girin' })
    .int('Tam sayı girin')
    .min(4, 'En az 4 madde')
    .max(12, 'En fazla 12 madde'),
});

type FormValues = z.infer<typeof schema>;

interface PlanNoteInputProps {
  onSubmit: (payload: PlanNoteExplainPayload) => void;
  loading?: boolean;
  defaultNote?: string;
}

export function PlanNoteInput({ onSubmit, loading, defaultNote }: PlanNoteInputProps) {
  const userReference = useUIStore((s) => s.userReference);

  const initial = useMemo<FormValues>(
    () => ({
      noteText: defaultNote ?? '',
      audience: 'citizen' as Audience,
      maxBullets: 6,
    }),
    [defaultNote],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  // When pendingPlanNote is consumed externally we get a defaultNote update —
  // sync that into the form value.
  useEffect(() => {
    if (defaultNote && defaultNote !== form.getValues('noteText')) {
      form.setValue('noteText', defaultNote, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultNote]);

  const audience = form.watch('audience');

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const payload: PlanNoteExplainPayload = {
          userReference: userReference ?? undefined,
          noteText: values.noteText,
          audience: values.audience,
          maxBullets: values.maxBullets,
        };
        trackEvent('plan_explain_submitted', {
          audience: values.audience,
          maxBullets: values.maxBullets,
          length: values.noteText.length,
        });
        onSubmit(payload);
      })}
      className="flex h-full flex-col gap-4"
      aria-label="Plan notu açıklama formu"
    >
      <div className="space-y-1">
        <h2 className="m-0 inline-flex items-center gap-2 text-h3 text-text-primary">
          <Sparkles className="h-4 w-4 text-state-info" aria-hidden />
          Plan notu açıklayıcı
        </h2>
        <p className="m-0 text-[12px] text-text-muted">
          Yapışan plan notu metnini sade Türkçeye çeviriyoruz. Sağlayıcı bilgisi cevap alındığında
          sağ panelde görünür.
        </p>
      </div>

      <Textarea
        label="Plan notu metni"
        placeholder="Resmi plan açıklamasını veya plan notunu yapıştırın"
        rows={12}
        {...form.register('noteText')}
        error={form.formState.errors.noteText?.message}
        hint="Backend bu metni LLM&apos;e iletir; istemcide hiçbir özetleme yapılmaz."
      />

      <AudienceSelector
        value={audience}
        onChange={(next) => form.setValue('audience', next, { shouldValidate: true })}
      />

      <Input
        type="number"
        min={4}
        max={12}
        label="Maks. madde sayısı"
        {...form.register('maxBullets', { valueAsNumber: true })}
        error={form.formState.errors.maxBullets?.message}
        hint="4 ile 12 arası bir değer önerilir"
      />

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          leftIcon={<Send className="h-4 w-4" aria-hidden />}
        >
          {loading ? 'Gönderiliyor' : 'Açıklama oluştur'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => form.reset(initial)}
        >
          Temizle
        </Button>
      </div>
    </form>
  );
}
