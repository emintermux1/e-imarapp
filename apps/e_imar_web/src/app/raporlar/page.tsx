"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportStatusCard } from "@/components/reports/report-status-card";
import { ReportRequestForm } from "@/components/reports/report-request-form";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/backend-client";
import { humanizeApiError } from "@/lib/api/backend-client";
import type { ReportResponse } from "@/types/api";

export default function RaporlarPage() {
  const [reports, setReports] = React.useState<ReportResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<ReportResponse[]>("/reports");
        if (!cancelled) {
          setReports(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(humanizeApiError(err, "Raporlar yüklenemedi."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-fg-muted hover:text-fg-primary hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-blue" />
              <h1 className="text-[18px] font-black tracking-tight text-fg-primary">
                Raporlar
              </h1>
            </div>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              İmar durum raporları, parsel özetleri ve plan notu raporları.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-fg-muted">
              {reports.length} rapor
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className={cn("gap-1.5", showForm && "bg-surface-2 border-border-subtle")}
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Formu Gizle" : "Yeni Rapor"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6">
            <ReportRequestForm
              onReportCreated={() => {
                setShowForm(false);
                setLoading(true);
                setReports([]);
                apiFetch<ReportResponse[]>("/reports")
                  .then((data) => {
                    setReports(Array.isArray(data) ? data : []);
                  })
                  .catch(() => {})
                  .finally(() => setLoading(false));
              }}
            />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            <span className="text-[12px] text-fg-muted font-medium">Raporlar yükleniyor…</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-status-error/35 bg-status-error/6 px-4 py-3 text-[12px] text-status-error">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-surface-1/40 py-16 text-center">
            <FileText className="h-12 w-12 text-fg-muted/20" />
            <div>
              <p className="text-[13px] font-semibold text-fg-muted">
                Henüz rapor yok
              </p>
              <p className="mt-1 text-[11px] text-fg-muted/60 max-w-[320px]">
                İlk raporunuzu oluşturmak için &quot;Yeni Rapor&quot; butonunu kullanın.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {reports.map((report) => (
              <Link key={report.id} href={`/raporlar/${report.id}`}>
                <ReportStatusCard report={report} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
