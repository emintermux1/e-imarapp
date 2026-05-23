"use client";

import * as React from "react";
import { FileText, Clock, Download, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; tone: string; icon: React.FC<{ className?: string }> }> = {
  pending: { label: "Bekliyor", tone: "bg-status-warning/10 text-status-warning border-status-warning/30", icon: Clock },
  processing: { label: "İşleniyor", tone: "bg-brand-blue/10 text-brand-blue border-brand-blue/30", icon: Loader2 },
  completed: { label: "Tamamlandı", tone: "bg-status-success/10 text-status-success border-status-success/30", icon: CheckCircle2 },
  failed: { label: "Başarısız", tone: "bg-status-error/10 text-status-error border-status-error/30", icon: AlertTriangle }
};

const fallbackConfig = { label: "Bilinmiyor", tone: "bg-fg-muted/10 text-fg-muted border-border-subtle", icon: Clock };

interface Props {
  report: ReportResponse;
  onClick?: () => void;
}

export function ReportStatusCard({ report, onClick }: Props) {
  const config = STATUS_CONFIG[report.status] || fallbackConfig;
  const Icon = config.icon;

  return (
    <article
      role="listitem"
      className={cn(
        "group relative rounded-xl border border-border-subtle bg-surface-1/70 p-3.5 transition-colors hover:border-brand-blue/30 hover:bg-surface-1 cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border-subtle bg-surface-2">
              <FileText className="h-3.5 w-3.5 text-fg-muted" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[11px] font-bold text-fg-primary">
                Rapor #{report.id}
              </h3>
              <p className="mt-0.5 text-[10px] text-fg-muted">
                Parsel: {report.parcel_id || "—"} · Plan: {report.plan_id || "—"}
              </p>
            </div>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0",
            config.tone
          )}
        >
          <Icon className={cn("h-3 w-3", report.status === "processing" && "animate-spin")} />
          {config.label}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-subtle/60 pt-2">
        <time className="text-[9px] text-fg-muted/70 tabular-nums">
          {report.created_at ? new Date(report.created_at).toLocaleString("tr-TR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          }) : "—"}
        </time>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {report.pdf_url && (
            <a
              href={report.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-brand-blue/12 border border-brand-blue/25 px-2 py-0.5 text-[9px] font-semibold text-brand-blue"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-3 w-3" />
              PDF
            </a>
          )}
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-fg-muted">
            <ExternalLink className="h-3 w-3" />
            Detay
          </span>
        </div>
      </div>
    </article>
  );
}
