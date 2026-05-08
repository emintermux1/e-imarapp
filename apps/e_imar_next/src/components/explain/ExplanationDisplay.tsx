'use client';

import { AlertTriangle, FileText, ListChecks, ShieldQuestion } from 'lucide-react';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { EmptyState } from '@/components/data/EmptyState';
import { Skeleton, SkeletonText } from '@/components/data/Skeleton';
import { ProviderSurface } from './ProviderSurface';
import { cn } from '@/lib/utils/cn';
import type {
  ApiFailure,
  PlanNoteExplainResponse,
} from '@/lib/api/types';

interface ExplanationDisplayProps {
  data: PlanNoteExplainResponse | undefined;
  loading: boolean;
  error?: ApiFailure | null;
  receivedAt?: string;
  idle?: boolean;
}

interface NormalisedExplanation {
  plainSummary?: string;
  bullets?: string[];
  risks?: string[];
  uncertainties?: string[];
  /** Raw fallback when the response shape is opaque. */
  raw?: string;
}

function normaliseExplanation(
  input: PlanNoteExplainResponse['explanation'],
): NormalisedExplanation {
  if (input === undefined || input === null) return {};
  if (typeof input === 'string') return { plainSummary: input };
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const out: NormalisedExplanation = {};
    if (typeof record.plainSummary === 'string') out.plainSummary = record.plainSummary;
    if (Array.isArray(record.bullets)) {
      out.bullets = record.bullets.filter((value): value is string => typeof value === 'string');
    }
    if (Array.isArray(record.risks)) {
      out.risks = record.risks.filter((value): value is string => typeof value === 'string');
    }
    if (Array.isArray(record.uncertainties)) {
      out.uncertainties = record.uncertainties.filter(
        (value): value is string => typeof value === 'string',
      );
    }
    if (
      !out.plainSummary &&
      !out.bullets &&
      !out.risks &&
      !out.uncertainties
    ) {
      out.raw = JSON.stringify(input, null, 2);
    }
    return out;
  }
  return { raw: String(input) };
}

function Section({
  icon,
  title,
  items,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone?: 'neutral' | 'warn' | 'danger';
}) {
  if (!items || items.length === 0) return null;
  return (
    <section
      className={cn(
        'rounded-md border p-3',
        tone === 'warn'
          ? 'border-state-warn/30 bg-state-warn/5'
          : tone === 'danger'
          ? 'border-state-gov-red/30 bg-state-gov-red/5'
          : 'border-border-subtle bg-bg-surface',
      )}
    >
      <h4 className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
        {icon}
        {title}
      </h4>
      <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-text-primary">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function ExplanationDisplay({
  data,
  loading,
  error,
  receivedAt,
  idle,
}: ExplanationDisplayProps) {
  if (idle && !loading && !data && !error) {
    return (
      <div className="grid h-full place-items-center px-4">
        <EmptyState
          title="Plan notunu sol panele yapıştırın"
          description="Plan notunu girip Açıklama oluştur'a bastığınızda backend cevabı burada görünür. İstemcide hiçbir özetleme yapılmaz."
          icon={<FileText className="h-6 w-6" aria-hidden />}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-9 w-full" rounded="md" />
        <SkeletonText lines={4} />
        <Skeleton className="h-32 w-full" rounded="md" />
        <Skeleton className="h-24 w-full" rounded="md" />
      </div>
    );
  }

  const status = error ? 'network_error' : data?.status;
  const exp = normaliseExplanation(data?.explanation);

  return (
    <div className="space-y-3 p-4">
      <ProviderSurface
        provider={data?.provider}
        model={data?.model}
        status={status}
        fetchedAt={receivedAt}
      />
      <ReadinessGate
        status={status}
        loading={false}
        endpoint="/website/bff/plan-note-explain"
        emptyTitle="Backend cevap döndürmedi"
        emptyDescription="LLM cevabında açıklama alanları boştu."
        notReadyTitle="Plan açıklama servisi hazır değil"
        notReadyDescription={
          error
            ? error.message
            : (data?.message as string | undefined) ??
              'Plan-note-explain servisi henüz başarılı bir cevap döndürmedi.'
        }
        nextActions={
          data?.nextActions ?? [
            'OpenAI/Anthropic gibi LLM provider için API anahtarı yapılandırın',
            'Backend `/website/bff/plan-note-explain` rotası üzerinde rate limit ayarını kontrol edin',
          ]
        }
      >
        <div className="space-y-3">
          {exp.plainSummary ? (
            <section className="rounded-md border border-state-info/30 bg-state-info/5 p-3">
              <h4 className="m-0 mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-state-info">
                Sade özet
              </h4>
              <p className="m-0 text-[14px] leading-6 text-text-primary">{exp.plainSummary}</p>
            </section>
          ) : null}

          <Section
            icon={<ListChecks className="h-3.5 w-3.5" aria-hidden />}
            title="Maddeler"
            items={exp.bullets ?? []}
          />

          <Section
            icon={<AlertTriangle className="h-3.5 w-3.5 text-state-warn" aria-hidden />}
            title="Riskler"
            items={exp.risks ?? []}
            tone="warn"
          />

          <Section
            icon={<ShieldQuestion className="h-3.5 w-3.5 text-state-gov-red" aria-hidden />}
            title="Belirsizlikler"
            items={exp.uncertainties ?? []}
            tone="danger"
          />

          {!exp.plainSummary &&
          !exp.bullets?.length &&
          !exp.risks?.length &&
          !exp.uncertainties?.length ? (
            exp.raw ? (
              <section className="rounded-md border border-border-subtle bg-bg-subtle/50 p-3">
                <h4 className="m-0 mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Ham cevap
                </h4>
                <pre className="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-words font-data text-[12px] text-text-primary">
                  {exp.raw}
                </pre>
              </section>
            ) : (
              <p className="m-0 text-[13px] text-text-muted">
                Backend cevabı boş döndü. `nextActions` alanını kontrol edin.
              </p>
            )
          ) : null}
        </div>
      </ReadinessGate>
    </div>
  );
}
