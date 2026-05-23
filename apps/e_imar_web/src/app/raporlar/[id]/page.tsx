"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Loader2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfPreview } from "@/components/reports/pdf-preview";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { getBackendReport } from "@/lib/api/backend-client";
import { humanizeApiError } from "@/lib/api/backend-client";
import type { ReportResponse, WebsiteParcelReportResponse } from "@/types/api";

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [report, setReport] = React.useState<ReportResponse | null>(null);
  const [htmlReport, setHtmlReport] = React.useState<WebsiteParcelReportResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [htmlLoading, setHtmlLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await getBackendReport(Number(id));
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError(humanizeApiError(err, "Rapor yüklenemedi."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleGenerateHtml = async () => {
    if (htmlLoading) return;
    setHtmlLoading(true);
    try {
      const { generateWebsiteParcelReport } = await import("@/lib/api/backend-client");
      const result = await generateWebsiteParcelReport({
        query: {
          type: "ada_parsel",
          ada: String(report?.parcel_id ?? ""),
          parselNo: "1",
          municipalityId: undefined
        }
      });
      setHtmlReport(result);
    } catch {
      // swallow — preview best-effort
    } finally {
      setHtmlLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
        <span className="text-[13px] font-medium text-fg-muted">Rapor #{id} yükleniyor…</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-status-error mx-auto" />
          <p className="mt-3 text-[13px] font-semibold text-fg-primary">
            {error || "Rapor bulunamadı."}
          </p>
          <Link href="/raporlar" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Raporlara dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/raporlar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-fg-muted hover:text-fg-primary hover:bg-surface-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-blue" />
                <h1 className="text-[18px] font-black tracking-tight text-fg-primary">
                  Rapor #{report.id}
                </h1>
                <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] font-semibold text-fg-muted uppercase">
                  {report.status}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-fg-muted">
                Parsel: {report.parcel_id || "—"} · Plan: {report.plan_id || "—"}
              </p>
            </div>
          </div>
          <ReportDownloadButton reportId={report.id} pdfUrl={report.pdf_url} />
        </div>

        <div className="rounded-[1.25rem] border border-white/45 bg-surface-2/94 p-5 shadow-[0_1px_0_rgb(255_255_255/0.58)_inset,0_20px_50px_-38px_rgb(var(--accent-navy)/0.44)] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[12px] font-black text-fg-primary uppercase tracking-[0.12em]">
              Rapor İçeriği
            </h2>
            {!htmlReport && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateHtml}
                disabled={htmlLoading}
                className="gap-1.5"
              >
                {htmlLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {htmlLoading ? "Hazırlanıyor…" : "HTML Önizleme"}
              </Button>
            )}
          </div>

          <PdfPreview report={htmlReport} loading={htmlLoading} />
        </div>
      </div>
    </div>
  );
}
