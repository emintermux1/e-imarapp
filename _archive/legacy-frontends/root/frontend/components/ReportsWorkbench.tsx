"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Sparkles } from "lucide-react";
import { generateParcelReport, explainPlanNote } from "@/lib/api";
import type { Audience, ParcelReportResponse, PlanNoteExplainResponse } from "@/lib/types";

const audienceOptions: Array<{ value: Audience; label: string }> = [
  { value: "citizen", label: "Vatandaş" },
  { value: "architect", label: "Mimar" },
  { value: "investor", label: "Yatırımcı" },
];

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function printHtml(html: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function normalizeExplanation(data: PlanNoteExplainResponse | null) {
  const explanation = data?.explanation;
  if (!explanation || typeof explanation === "string") {
    return {
      plainSummary: typeof explanation === "string" ? explanation : "",
      bullets: [] as string[],
      risks: [] as string[],
      uncertainties: [] as string[],
      requiredOpinions: [] as string[],
    };
  }
  const record = explanation as Record<string, unknown>;
  const text = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    return "";
  };
  const list = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
      : [];
  return {
    plainSummary: text("plainSummary", "sadeOzeti", "summary", "explanation"),
    bullets: list(record.bullets ?? record.yapilasmaKosullari ?? record.conditions),
    risks: list(record.risks ?? record.riskler),
    uncertainties: list(record.uncertainties ?? record.bilinmeyenler),
    requiredOpinions: list(record.requiredOpinions ?? record.gerekliKurumGorusleri),
  };
}

export function ReportsWorkbench() {
  const [query, setQuery] = useState({ ada: "", parselNo: "", municipalityId: "", province: "", district: "", mahalle: "" });
  const [planNote, setPlanNote] = useState("Emsal 1.50, TAKS 0.40, max yükseklik 15.50m, ön bahçe çekme 5m.");
  const [audience, setAudience] = useState<Audience>("citizen");
  const [report, setReport] = useState<ParcelReportResponse | null>(null);
  const [explain, setExplain] = useState<PlanNoteExplainResponse | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explanation = useMemo(() => normalizeExplanation(explain), [explain]);
  const printableHtml = report?.printableHtml ?? "";

  async function onGenerateReport() {
    setLoadingReport(true);
    setError(null);
    try {
      const response = await generateParcelReport({
        query: { type: "ada_parsel", ...query },
      });
      setReport(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rapor üretilemedi.");
    } finally {
      setLoadingReport(false);
    }
  }

  async function onExplainPlan() {
    const trimmed = planNote.trim();
    if (!trimmed) {
      setError("Plan notu metni boş olamaz.");
      return;
    }
    setLoadingExplain(true);
    setError(null);
    try {
      const response = await explainPlanNote({ noteText: trimmed, audience, maxBullets: 6 });
      setExplain(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Açıklama üretilemedi.");
    } finally {
      setLoadingExplain(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Parsel raporu</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Printable HTML döner. Boş alanlar unavailable kalır; resmi belge değildir.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(["ada", "parselNo", "municipalityId", "province", "district", "mahalle"] as const).map((key) => (
            <input
              key={key}
              value={query[key]}
              onChange={(event) => setQuery((state) => ({ ...state, [key]: event.target.value }))}
              placeholder={key}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onGenerateReport} disabled={loadingReport} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-[var(--bg-primary)] disabled:opacity-60">
            <Download size={16} />
            {loadingReport ? "Üretiliyor..." : "Rapor üret"}
          </button>
          <button onClick={() => printableHtml && printHtml(printableHtml)} disabled={!printableHtml} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium disabled:opacity-60">
            <Printer size={16} />
            Yazdır
          </button>
          <button onClick={() => printableHtml && downloadHtml(report?.downloadFilename || "parcel-report.html", printableHtml)} disabled={!printableHtml} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium disabled:opacity-60">
            HTML indir
          </button>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {report ? (
          <pre className="max-h-80 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-black/20 p-3 text-xs">{JSON.stringify(report, null, 2)}</pre>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Rapor çıktısı burada görünecek.</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">AI plan notu açıklayıcı</h2>
          <p className="text-sm text-[var(--text-secondary)]">Audience mode: vatandaş, mimar, yatırımcı.</p>
        </div>
        <select value={audience} onChange={(event) => setAudience(event.target.value as Audience)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm">
          {audienceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <textarea value={planNote} onChange={(event) => setPlanNote(event.target.value)} rows={8} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm" />
        <button onClick={onExplainPlan} disabled={loadingExplain} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-magenta)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          <Sparkles size={16} />
          {loadingExplain ? "Açıklanıyor..." : "Açıkla"}
        </button>
        {explain?.status && explain.status !== "ok" ? (
          <p className="text-sm text-amber-300">
            {explain.message ?? (typeof explain.issue === "string" ? explain.issue : explain.issue?.message) ?? "Açıklama üretilemedi."}
          </p>
        ) : null}
        {explain?.status === "ok" ? (
          <div className="space-y-3 rounded-lg border border-[var(--border-subtle)] p-4">
            <p className="text-sm">{explanation.plainSummary || "unavailable"}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
              {explanation.bullets.map((item) => <li key={item}>{item}</li>)}
              {explanation.risks.map((item) => <li key={`risk-${item}`}>{item}</li>)}
              {explanation.uncertainties.map((item) => <li key={`unc-${item}`}>{item}</li>)}
              {explanation.requiredOpinions.map((item) => <li key={`req-${item}`}>{item}</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Boş inputtan analiz üretilmez; requires_credentials/not_ready durumları açık gösterilir.</p>
        )}
      </section>
    </div>
  );
}
