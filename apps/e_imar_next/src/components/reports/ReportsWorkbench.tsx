'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, FileText, Sparkles, ShieldAlert } from 'lucide-react';
import { useBootstrap, useParcelReportMutation, usePlanExplainMutation } from '@/lib/query/hooks';
import type { Audience, ParcelReportResponse, PlanNoteExplainResponse } from '@/lib/api/types';
import { DataCard } from '@/components/data/DataCard';
import { EmptyState } from '@/components/data/EmptyState';
import { StatusBanner } from '@/components/data/StatusBanner';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils/cn';
import { trackEvent } from '@/lib/analytics/events';

const audienceOptions: Array<{ value: Audience; label: string }> = [
  { value: 'citizen', label: 'Vatandaş' },
  { value: 'architect', label: 'Mimar' },
  { value: 'investor', label: 'Yatırımcı' },
];

const audienceLabels: Record<Audience, string> = {
  citizen: 'vatandaş',
  architect: 'mimar',
  investor: 'yatırımcı',
};

function normalizeExplain(response: PlanNoteExplainResponse['explanation']) {
  if (!response || typeof response === 'string') {
    return {
      sadeOzeti: typeof response === 'string' ? response : '',
      yapilasmaKosullari: [] as string[],
      riskler: [] as string[],
      gerekliKurumGorusleri: [] as string[],
      bilinmeyenler: [] as string[],
    };
  }
  const record = response as Record<string, unknown>;
  const list = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
      : [];
  const text = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
    return '';
  };
  return {
    sadeOzeti: text('sadeOzeti', 'plainSummary', 'summary', 'explanation'),
    yapilasmaKosullari: list(record.yapilasmaKosullari ?? record.bullets ?? record.conditions),
    riskler: list(record.riskler ?? record.risks),
    gerekliKurumGorusleri: list(record.gerekliKurumGorusleri ?? record.requiredOpinions ?? record.requiredInstitutions),
    bilinmeyenler: list(record.bilinmeyenler ?? record.uncertainties ?? record.unknowns),
  };
}

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function printHtml(html: string) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function SectionList({ items }: { items: string[] }) {
  if (!items.length) {
    return <li className="text-text-muted">unavailable</li>;
  }
  return items.map((item) => <li key={item}>{item}</li>);
}

function ReportPreview({ report }: { report: ParcelReportResponse }) {
  const previewHtml = report.printableHtml ?? '';
  const sections = report.sections ?? [];
  const disclaimer = report.disclaimer ?? 'Bu çıktı resmi belge değildir.';
  return (
    <div className="space-y-4">
      <StatusBanner
        status={report.status ?? 'not_ready'}
        title={report.title ?? 'Parsel raporu'}
        message={disclaimer}
        nextActions={report.status === 'not_ready' ? ['Eksik alanlar unavailable olarak gösterilir.', 'Rapor yalnızca doğrulanmış alanlardan türetilir.'] : undefined}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge status={report.status ?? 'not_ready'} size="xs" />
          <span className="font-data text-[12px] text-text-muted">{report.reportId}</span>
          <span className="font-data text-[12px] text-text-muted">{report.generatedAt}</span>
        </div>
      </StatusBanner>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          leftIcon={<Printer className="h-4 w-4" aria-hidden />}
          onClick={() => printHtml(previewHtml)}
          disabled={!previewHtml}
        >
          Yazdır
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          onClick={() => downloadHtml(report.downloadFilename ?? 'parcel-report.html', previewHtml)}
          disabled={!previewHtml}
        >
          HTML indir
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-panel">
          <iframe
            title="Rapor önizleme"
            srcDoc={previewHtml}
            className="h-[780px] w-full bg-white"
            sandbox="allow-same-origin"
          />
        </div>
        <div className="space-y-4">
          {sections.map((section) => (
            <DataCard key={section.title ?? 'section'} title={section.title ?? 'Bölüm'} compact>
              <div className="grid gap-2 sm:grid-cols-2">
                {(section.fields ?? []).map((field) => (
                  <div key={`${section.title}-${field.label}`} className="rounded-lg border border-border-subtle bg-bg-subtle/30 p-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-text-muted">{field.label ?? 'unavailable'}</div>
                    <div className={cn('mt-1 text-[13px] leading-5', field.status === 'not_ready' ? 'text-amber-700' : 'text-text-primary')}>
                      {field.value ?? 'unavailable'}
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          ))}
          <DataCard title="Provenance" compact>
            <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
              {(report.provenance ?? []).length ? (
                report.provenance!.map((item, index) => (
                  <li key={`${item.sourceId ?? item.sourceName ?? index}`}>
                    {[item.sourceName ?? item.sourceId ?? 'unavailable', item.status, item.endpoint, item.message]
                      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
                      .join(' · ')}
                  </li>
                ))
              ) : (
                <li>unavailable</li>
              )}
            </ul>
          </DataCard>
        </div>
      </div>
    </div>
  );
}

function ExplainResult({ data, audience }: { data: PlanNoteExplainResponse; audience: Audience }) {
  const explanation = normalizeExplain(data.explanation);
  const status = data.status ?? 'not_ready';
  if (status !== 'ok') {
    return (
      <StatusBanner
        status={status}
        title={status === 'requires_credentials' ? 'AI not_ready' : 'Plan notu açıklaması'}
        message={
          status === 'requires_credentials'
            ? 'AI açıklama için gerekli kimlik bilgileri sunucuda yapılandırılmamış.'
            : status === 'invalid_input'
              ? 'İmar notu metni boş olamaz.'
              : data.message ?? 'Açıklama üretilemedi.'
        }
        nextActions={status === 'requires_credentials' ? ['OPENAI_API_KEY veya eşdeğer AI bağlantısını yapılandırın.'] : undefined}
      />
    );
  }

  const grouped = [
    { title: 'Sade özet', items: explanation.sadeOzeti ? [explanation.sadeOzeti] : [] },
    { title: 'Yapılaşma koşulları', items: explanation.yapilasmaKosullari },
    { title: 'Riskler', items: explanation.riskler },
    { title: 'Gerekli kurum görüşleri', items: explanation.gerekliKurumGorusleri },
    { title: 'Bilinmeyenler', items: explanation.bilinmeyenler },
  ];

  return (
    <div className="space-y-4">
      <StatusBanner
        status="ok"
        title={`İmar notu özeti · ${audienceLabels[audience]}`}
        message="Açıklama yalnızca girilen metne dayanır; boş inputtan veya eksik kaynaktan analiz üretilmez."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((group) => (
          <DataCard key={group.title} title={group.title} compact>
            {group.items.length ? (
              <ul className="m-0 list-disc space-y-2 pl-5 text-[13px] leading-5 text-text-secondary">
                <SectionList items={group.items} />
              </ul>
            ) : (
              <EmptyState compact title="unavailable" description="Bu bölüm için veri döndürülmedi." />
            )}
          </DataCard>
        ))}
      </div>
    </div>
  );
}

export function ReportsWorkbench() {
  const bootstrap = useBootstrap();
  const reportMutation = useParcelReportMutation();
  const explainMutation = usePlanExplainMutation();
  const [reportForm, setReportForm] = useState({
    ada: '',
    parselNo: '',
    municipalityId: '',
    province: '',
    district: '',
    mahalle: '',
  });
  const [reportError, setReportError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [audience, setAudience] = useState<Audience>('citizen');
  const [noteError, setNoteError] = useState<string | null>(null);

  const capability = bootstrap.data?.websiteCapabilities?.planNoteExplain ?? null;
  const reportData = reportMutation.data;
  const explainData = explainMutation.data;

  const reportSummary = useMemo(() => {
    if (!reportData) return null;
    return reportData.sections?.flatMap((section) => section.fields ?? []) ?? [];
  }, [reportData]);

  return (
    <div className="h-full overflow-y-auto bg-bg-base">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-6">
        <header className="space-y-3 rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-surface to-bg-subtle p-5 shadow-panel">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-navy text-text-inverse shadow-sm">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="m-0 text-h1 text-text-primary">Raporlar ve plan notu açıklayıcı</h1>
              <p className="mt-1 max-w-3xl text-[14px] text-text-secondary">
                Parsel raporu printable HTML olarak üretilir; plan notu açıklaması yalnızca gerçek AI yanıtı veya açık requires_credentials/not_ready durumu ile gösterilir.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <StatusBadge status={bootstrap.isPending || bootstrap.isError ? 'not_ready' : 'ok'} size="xs" />
            <span>report format: printable HTML</span>
            <span>·</span>
            <span>AI audience modes: vatandaş / mimar / yatırımcı</span>
            {capability === false ? (
              <span className="inline-flex items-center gap-1 text-amber-700"><ShieldAlert className="h-3.5 w-3.5" aria-hidden />planNoteExplain not_ready</span>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <DataCard
            title="Parsel report"
            description="Ada/parsel, belediye, provenance, imar notu ve plan ölçüsü alanları yalnızca doğrulanmış veri varsa doldurulur."
            trailing={<StatusBadge status={reportMutation.data?.status ?? (reportMutation.isPending ? 'not_ready' : 'idle')} size="xs" />}
            bodyClassName="space-y-4"
          >
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setReportError(null);
                const ada = reportForm.ada.trim();
                const parselNo = reportForm.parselNo.trim();
                if (!ada || !parselNo) {
                  setReportError('Ada ve parsel zorunludur.');
                  return;
                }
                trackEvent('report_requested', { parcelId: `${ada}-${parselNo}`, format: 'pdf' });
                await reportMutation.mutateAsync({
                  query: {
                    type: 'ada_parsel',
                    ada,
                    parselNo,
                    municipalityId: reportForm.municipalityId.trim() || undefined,
                    province: reportForm.province.trim() || undefined,
                    district: reportForm.district.trim() || undefined,
                    mahalle: reportForm.mahalle.trim() || undefined,
                  },
                });
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Ada" value={reportForm.ada} onChange={(e) => setReportForm((s) => ({ ...s, ada: e.target.value }))} />
                <Input label="Parsel" value={reportForm.parselNo} onChange={(e) => setReportForm((s) => ({ ...s, parselNo: e.target.value }))} />
                <Input label="Belediye ID" value={reportForm.municipalityId} onChange={(e) => setReportForm((s) => ({ ...s, municipalityId: e.target.value }))} />
                <Input label="İl" value={reportForm.province} onChange={(e) => setReportForm((s) => ({ ...s, province: e.target.value }))} />
                <Input label="İlçe" value={reportForm.district} onChange={(e) => setReportForm((s) => ({ ...s, district: e.target.value }))} />
                <Input label="Mahalle" value={reportForm.mahalle} onChange={(e) => setReportForm((s) => ({ ...s, mahalle: e.target.value }))} />
              </div>
              {reportError ? <p className="text-[13px] text-state-gov-red">{reportError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={reportMutation.isPending} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
                  Rapor üret
                </Button>
              </div>
            </form>
            {reportMutation.error ? (
              <StatusBanner
                status={reportMutation.error.status === 'network_error' ? 'unavailable' : 'not_ready'}
                title="Rapor üretilemedi"
                message={reportMutation.error.message}
              />
            ) : null}
            {reportData ? <ReportPreview report={reportData} /> : (
              <EmptyState
                compact
                title="Rapor bekleniyor"
                description="Ada/parsel girdikten sonra backend printable HTML döndürür. Boş alanlar unavailable kalır."
              />
            )}
            {reportSummary?.length ? (
              <div className="text-[12px] text-text-muted">
                {reportSummary.length} alan rapora işlendi.
              </div>
            ) : null}
          </DataCard>

          <DataCard
            title="AI plan note explainer"
            description="Vatandaş / mimar / yatırımcı modunda yalnızca metin girdisine dayalı açıklama üretir."
            trailing={<StatusBadge status={explainMutation.data?.status ?? (explainMutation.isPending ? 'not_ready' : 'idle')} size="xs" />}
            bodyClassName="space-y-4"
          >
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setNoteError(null);
                const trimmed = noteText.trim();
                if (!trimmed) {
                  setNoteError('Plan notu metni boş olamaz.');
                  return;
                }
                trackEvent('plan_explain_started', { audience, length: trimmed.length });
                await explainMutation.mutateAsync({ noteText: trimmed, audience });
                trackEvent('plan_explain_finished', { status: 'ok' });
              }}
            >
              <Select
                label="Audience mode"
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                options={audienceOptions}
              />
              <Textarea
                label="Plan notu"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={9}
                hint="İmar notunu yapıştırın. Boş metinde açıklama üretilmez."
              />
              {noteError ? <p className="text-[13px] text-state-gov-red">{noteError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={explainMutation.isPending} leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
                  Açıkla
                </Button>
              </div>
            </form>
            {explainMutation.error ? (
              <StatusBanner
                status={explainMutation.error.status === 'network_error' ? 'unavailable' : 'not_ready'}
                title="Plan notu açıklanamadı"
                message={explainMutation.error.message}
              />
            ) : null}
            {explainData ? (
              <ExplainResult data={explainData} audience={audience} />
            ) : (
              <EmptyState
                compact
                icon={<Sparkles className="h-5 w-5" aria-hidden />}
                title="Açıklama bekleniyor"
                description="İmar notu girin; backend credential yoksa requires_credentials döndürür, boş inputta ise hata gösterilir."
              />
            )}
          </DataCard>
        </section>
      </div>
    </div>
  );
}
