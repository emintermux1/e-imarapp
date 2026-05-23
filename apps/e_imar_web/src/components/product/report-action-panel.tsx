"use client";

import { Download, FileText, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActionPanel({
  parcelLabel = "Seçili parsel",
  sourceCount = 0,
  generatedAt = new Date().toISOString()
}: {
  parcelLabel?: string;
  sourceCount?: number;
  generatedAt?: string;
}) {
  const date = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(generatedAt));

  return (
    <section className="rounded-[1.75rem] border border-white/55 bg-surface-2/95 p-4 shadow-[0_22px_70px_-54px_rgb(var(--accent-navy)/0.9)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--accent-amber)/0.16)] text-[rgb(var(--accent-amber))]">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[rgb(var(--accent-amber))]">Rapor aksiyonları</p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-fg-primary">{parcelLabel}</h3>
          <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
            {sourceCount} kaynak/probe kaydıyla ön inceleme. Resmî belge değildir; kaynak linki ve kontrol tarihi raporda korunur.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Yazdır
        </Button>
        <Button type="button" variant="outline" onClick={() => void navigator.clipboard?.writeText(window.location.href)}>
          <Share2 className="h-4 w-4" />
          Link kopyala
        </Button>
        <Button type="button" variant="primary" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          PDF al
        </Button>
      </div>
      <div className="mt-3 rounded-2xl border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-fg-secondary">
        Son kontrol: <span className="font-bold text-fg-primary">{date}</span> · AI özet yalnız gelen plan notunu sadeleştirir.
      </div>
    </section>
  );
}
