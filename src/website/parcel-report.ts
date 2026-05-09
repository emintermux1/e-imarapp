import { randomUUID } from 'crypto';

export type TruthfulFieldStatus = 'ok' | 'not_ready' | 'invalid_input';

export interface ParcelReportField {
  label: string;
  value: string;
  status: TruthfulFieldStatus;
}

export interface ParcelReportSection {
  title: string;
  fields: ParcelReportField[];
}

export interface ParcelReportView {
  reportId: string;
  generatedAt: string;
  title: string;
  disclaimer: string;
  status: 'ok' | 'not_ready' | 'invalid_input';
  query: {
    type?: string;
    ada?: string | null;
    parselNo?: string | null;
    municipalityId?: string | null;
    province?: string | null;
    district?: string | null;
    mahalle?: string | null;
  };
  sections: ParcelReportSection[];
  provenance: Array<{
    sourceId?: string;
    sourceName?: string;
    status?: string;
    endpoint?: string;
    message?: string;
  }>;
  printableHtml: string;
  downloadFilename: string;
}

interface ReportInput {
  query: {
    type?: string;
    ada?: string;
    parselNo?: string;
    municipalityId?: string;
    province?: string;
    district?: string;
    mahalle?: string;
  };
  parcelWorkflow?: Record<string, unknown> | null;
  municipalWorkflow?: Record<string, unknown> | null;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const candidate = value[0];
  return candidate && typeof candidate === 'object' ? (candidate as Record<string, unknown>) : null;
}

function firstParcel(parcelWorkflow?: Record<string, unknown> | null): Record<string, unknown> | null {
  const parcelQuery = parcelWorkflow?.parcelQuery;
  if (!parcelQuery || typeof parcelQuery !== 'object') return null;
  return firstRecord((parcelQuery as Record<string, unknown>).parcels);
}

function sectionField(label: string, value: string | number | undefined): ParcelReportField {
  return {
    label,
    value: value === undefined || value === null || value === '' ? 'unavailable' : String(value),
    status: value === undefined || value === null || value === '' ? 'not_ready' : 'ok',
  };
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fieldMarkup(field: ParcelReportField): string {
  return `
    <div class="field">
      <div class="label">${htmlEscape(field.label)}</div>
      <div class="value status-${field.status}">${htmlEscape(field.value)}</div>
    </div>`;
}

function sectionMarkup(section: ParcelReportSection): string {
  return `
    <section class="section">
      <h2>${htmlEscape(section.title)}</h2>
      <div class="grid">${section.fields.map(fieldMarkup).join('')}</div>
    </section>`;
}

function provenanceMarkup(provenance: ParcelReportView['provenance']): string {
  if (provenance.length === 0) {
    return '<p class="muted">Kaynak / provenance bilgisi unavailable.</p>';
  }
  return `<ul class="provenance">${provenance
    .map((item) => {
      const parts = [item.sourceName || item.sourceId || 'unavailable'];
      if (item.status) parts.push(item.status);
      if (item.endpoint) parts.push(item.endpoint);
      if (item.message) parts.push(item.message);
      return `<li>${htmlEscape(parts.join(' · '))}</li>`;
    })
    .join('')}</ul>`;
}

function renderHtml(view: Omit<ParcelReportView, 'printableHtml' | 'downloadFilename'>): string {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(view.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fb; color: #0f172a; }
    .sheet { max-width: 920px; margin: 0 auto; padding: 32px 24px 48px; }
    .card { background: #fff; border: 1px solid #d8e0ee; border-radius: 18px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); overflow: hidden; }
    .hero { padding: 28px; background: linear-gradient(135deg, #0f172a, #1e3a5f); color: #fff; }
    .hero h1 { margin: 0; font-size: 28px; line-height: 1.15; }
    .hero p { margin: 8px 0 0; color: rgba(255,255,255,0.82); }
    .body { padding: 24px 28px 30px; }
    .section { border-top: 1px solid #e5ecf7; padding-top: 18px; margin-top: 18px; }
    .section:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .section h2 { margin: 0 0 14px; font-size: 16px; letter-spacing: .01em; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .field { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; background: #fbfdff; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
    .value { margin-top: 6px; font-size: 14px; line-height: 1.45; word-break: break-word; }
    .status-ok { color: #0f172a; }
    .status-not_ready { color: #b45309; }
    .status-invalid_input { color: #b91c1c; }
    .muted { color: #64748b; font-size: 13px; }
    .provenance { margin: 0; padding-left: 18px; color: #334155; }
    .footer { margin-top: 22px; padding-top: 18px; border-top: 1px solid #e5ecf7; font-size: 13px; color: #475569; }
    @media print { body { background: #fff; } .sheet { padding: 0; } .card { box-shadow: none; border-radius: 0; border: 0; } }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } .hero h1 { font-size: 22px; } }
  </style>
</head>
<body>
  <main class="sheet">
    <article class="card">
      <header class="hero">
        <h1>${htmlEscape(view.title)}</h1>
        <p>Rapor ID: ${htmlEscape(view.reportId)} · ${htmlEscape(view.generatedAt)}</p>
      </header>
      <div class="body">
        ${view.sections.map(sectionMarkup).join('')}
        <section class="section">
          <h2>Kaynaklar ve provenance</h2>
          ${provenanceMarkup(view.provenance)}
        </section>
        <div class="footer">${htmlEscape(view.disclaimer)}</div>
      </div>
    </article>
  </main>
</body>
</html>`;
}

function normalizeProvenance(entries: unknown): ParcelReportView['provenance'] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((entry) => ({
      sourceId: getString(entry.sourceId),
      sourceName: getString(entry.sourceName),
      status: getString(entry.status),
      endpoint: getString(entry.endpoint),
      message: getString(entry.message),
    }));
}

export function buildParcelReport(input: ReportInput): ParcelReportView {
  const reportId = randomUUID();
  const generatedAt = new Date().toISOString();
  const parcel = firstParcel(input.parcelWorkflow);
  const parcelSummary = input.parcelWorkflow?.potentialSummary && typeof input.parcelWorkflow.potentialSummary === 'object'
    ? (input.parcelWorkflow.potentialSummary as Record<string, unknown>)
    : null;
  const potentialDetails = parcelSummary?.summary && typeof parcelSummary.summary === 'object'
    ? (parcelSummary.summary as Record<string, unknown>)
    : parcelSummary;
  const municipalCapability = input.municipalWorkflow?.municipalityCapability && typeof input.municipalWorkflow.municipalityCapability === 'object'
    ? (input.municipalWorkflow.municipalityCapability as Record<string, unknown>)
    : null;
  const municipalSource = municipalCapability?.source && typeof municipalCapability.source === 'object'
    ? (municipalCapability.source as Record<string, unknown>)
    : null;

  const ada = getString(input.query.ada) ?? getString(parcel?.ada) ?? getString(parcel?.adaNo);
  const parselNo = getString(input.query.parselNo) ?? getString(parcel?.parselNo) ?? getString(parcel?.parsel) ?? getString(parcel?.parcelNo);
  const municipality = getString(municipalSource?.name) ?? getString(input.query.municipalityId) ?? getString(parcel?.municipality);
  const province = getString(input.query.province) ?? getString(municipalSource?.province) ?? getString(parcel?.province) ?? getString(parcel?.il);
  const district = getString(input.query.district) ?? getString(municipalSource?.district) ?? getString(parcel?.district) ?? getString(parcel?.ilce);
  const mahalle = getString(input.query.mahalle) ?? getString(parcel?.mahalle) ?? getString(parcel?.neighborhood);
  const planTitle = getString(parcel?.planTitle) ?? getString(parcel?.plan_title) ?? getString(potentialDetails?.planTitle);
  const planScale = getString(parcel?.planScale) ?? getString(parcel?.scale) ?? getString(parcel?.imarScale) ?? getString(parcel?.plan_scale);
  const imarNotes = getString(parcel?.imarNotes) ?? getString(parcel?.imar_note) ?? getString(parcel?.planNote) ?? getString(parcel?.notes);
  const taks = getNumber(parcel?.taks) ?? getNumber(potentialDetails?.taks);
  const kaks = getNumber(parcel?.kaks) ?? getNumber(potentialDetails?.kaks);
  const hmax = getString(parcel?.hmax) ?? getString(parcel?.gabari) ?? getString(parcel?.height);

  const provenance = [
    ...normalizeProvenance(input.municipalWorkflow?.provenance),
    ...normalizeProvenance(parcelSummary?.provenance),
  ];

  const sections: ParcelReportSection[] = [
    {
      title: 'Kimlik ve konum',
      fields: [
        sectionField('Ada', ada),
        sectionField('Parsel', parselNo),
        sectionField('Belediye', municipality),
        sectionField('İl', province),
        sectionField('İlçe', district),
        sectionField('Mahalle', mahalle),
      ],
    },
    {
      title: 'İmar verileri',
      fields: [
        sectionField('İmar notu', imarNotes),
        sectionField('Plan ölçeği', planScale),
        sectionField('TAKS', taks),
        sectionField('KAKS', kaks),
        sectionField('Hmax / gabari', hmax),
        sectionField('Plan başlığı', planTitle),
      ],
    },
    {
      title: 'Hazırlık ve durum',
      fields: [
        sectionField('Parsel workflow', getString(input.parcelWorkflow?.status)),
        sectionField('Belediye workflow', getString(input.municipalWorkflow?.status)),
        sectionField('Girdi tipi', getString(input.query.type)),
      ],
    },
  ];

  const hasData = sections.some((section) => section.fields.some((field) => field.status === 'ok'));
  const status: ParcelReportView['status'] = hasData ? 'ok' : 'not_ready';
  const title = 'Parsel raporu';
  const disclaimer = 'Bu çıktı resmi belge değildir; yalnızca görünen ve doğrulanmış kaynaklardan türetilen bir önizlemedir.';
  const view: Omit<ParcelReportView, 'printableHtml' | 'downloadFilename'> = {
    reportId,
    generatedAt,
    title,
    disclaimer,
    status,
    query: {
      type: input.query.type,
      ada: input.query.ada ?? ada ?? null,
      parselNo: input.query.parselNo ?? parselNo ?? null,
      municipalityId: input.query.municipalityId ?? getString(municipalSource?.id) ?? null,
      province: input.query.province ?? province ?? null,
      district: input.query.district ?? district ?? null,
      mahalle: input.query.mahalle ?? mahalle ?? null,
    },
    sections,
    provenance,
  };
  return {
    ...view,
    printableHtml: renderHtml(view),
    downloadFilename: `parcel-report-${reportId}.html`,
  };
}
