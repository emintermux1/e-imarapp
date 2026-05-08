'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlanNoteInput } from './PlanNoteInput';
import { ExplanationDisplay } from './ExplanationDisplay';
import { useExplainPlanNote } from '@/lib/query/hooks';
import { useUIStore } from '@/lib/store/ui-store';
import { trackEvent } from '@/lib/analytics/events';

/**
 * Two-column shell hosting the dedicated plan-explain route. The left side
 * is the input form, the right side renders the structured explanation
 * (or the readiness state when the backend isn't ready).
 */
export function PlanExplainShell() {
  const params = useSearchParams();
  const consumePendingPlanNote = useUIStore((s) => s.consumePendingPlanNote);
  const [defaultNote, setDefaultNote] = useState<string>('');
  const [receivedAt, setReceivedAt] = useState<string | undefined>(undefined);
  const explainMutation = useExplainPlanNote();

  // On first mount, consume any handed-off plan note from the parcel detail
  // accordion (preferred), or fall back to the `?note=` query param.
  useEffect(() => {
    const fromStore = consumePendingPlanNote();
    if (fromStore) {
      setDefaultNote(fromStore);
      return;
    }
    const fromUrl = params?.get('note');
    if (fromUrl) setDefaultNote(fromUrl);
    // We deliberately consume only on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idle = explainMutation.status === 'idle';

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[480px_minmax(0,1fr)]">
      <section
        className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin border-b border-border-subtle bg-bg-surface p-4 lg:border-b-0 lg:border-r"
        aria-label="Plan notu giriş formu"
      >
        <PlanNoteInput
          defaultNote={defaultNote}
          loading={explainMutation.isPending}
          onSubmit={(payload) => {
            explainMutation.mutate(payload, {
              onSuccess: (response) => {
                const fetchedAt = new Date().toISOString();
                setReceivedAt(fetchedAt);
                trackEvent('plan_explain_received', {
                  status: response.status,
                  provider: response.provider,
                  model: response.model,
                });
              },
              onError: () => {
                setReceivedAt(new Date().toISOString());
                trackEvent('plan_explain_received', {
                  status: 'network_error',
                });
              },
            });
          }}
        />
      </section>

      <section
        className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin bg-bg-base"
        aria-label="Açıklama sonucu"
      >
        <ExplanationDisplay
          data={explainMutation.data}
          loading={explainMutation.isPending}
          error={explainMutation.error ?? null}
          receivedAt={receivedAt}
          idle={idle}
        />
      </section>
    </div>
  );
}
