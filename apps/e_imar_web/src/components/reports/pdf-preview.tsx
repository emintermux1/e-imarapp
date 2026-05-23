"use client";

import * as React from "react";
import { FileText, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebsiteParcelReportResponse } from "@/types/api";

interface Props {
  report: WebsiteParcelReportResponse | null;
  loading?: boolean;
}

export function PdfPreview({ report, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Clock className="h-10 w-10 animate-pulse text-fg-muted/30" />
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-fg-muted">Rapor yükleniyor…</p>
          <p className="text-[10px] text-fg-muted/60">Backend rapor verisini hazırlıyor.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <FileText className="h-10 w-10 text-fg-muted/25" />
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-fg-muted">Henüz rapor verisi yok</p>
          <p className="text-[10px] text-fg-muted/60 max-w-[280px]">
            Parsel sorgusu yaparak imar durum raporu oluşturun. Rapor tamamlandığında burada görünür.
          </p>
        </div>
      </div>
    );
  }

  const sections = report.sections ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[12px] font-black text-fg-primary uppercase tracking-[0.12em]">
            {report.title || "İmar Durum Raporu"}
          </h2>
          {report.generatedAt && (
            <time className="mt-0.5 block text-[10px] text-fg-muted tabular-nums">
              {new Date(report.generatedAt).toLocaleString("tr-TR", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </time>
          )}
        </div>
        {report.downloadFilename && (
          <a
            href={`#download-${report.reportId}`}
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-brand-blue/25 bg-brand-blue/8 px-2.5 py-0.5 text-[10px] font-semibold text-brand-blue"
          >
            <ExternalLink className="h-3 w-3" />
            {report.downloadFilename}
          </a>
        )}
      </div>

      {report.disclaimer && (
        <div className="rounded-lg border border-status-warning/25 bg-status-warning/6 px-3 py-1.5 text-[10px] leading-relaxed text-fg-muted">
          {report.disclaimer}
        </div>
      )}

      {sections.map((section, idx) => (
        <div
          key={section.id || idx}
          className={cn(
            "rounded-xl border border-border-subtle bg-surface-1/60 p-3",
            section.status === "not_available" && "opacity-55"
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              "grid h-1.5 w-1.5 rounded-full",
              section.status === "ok" ? "bg-status-success" :
              section.status === "not_available" ? "bg-fg-muted/40" :
              "bg-status-warning"
            )} />
            <h3 className="text-[11px] font-bold text-fg-primary">
              {section.title || `Bölüm ${idx + 1}`}
            </h3>
          </div>
          {section.body && (
            <div
              className="prose prose-sm max-w-none text-[11px] text-fg-secondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          )}
          {section.items && section.items.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {section.items.map((item, i) => (
                <li key={i} className="text-[11px] text-fg-secondary pl-2 border-l-2 border-border-subtle">
                  {typeof item === "string" ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {report.printableHtml && (
        <div
          className="mt-2 rounded-xl border border-brand-blue/20 bg-[rgb(var(--accent-navy)/0.03)] p-3"
          dangerouslySetInnerHTML={{ __html: report.printableHtml }}
        />
      )}
    </div>
  );
}
