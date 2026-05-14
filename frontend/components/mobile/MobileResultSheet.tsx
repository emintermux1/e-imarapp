"use client";

import Link from "next/link";
import { ChevronUp, FileText, MapPinned, Share2 } from "lucide-react";
import type { ParcelReportResponse, ParcelResponse } from "@/lib/types";
import { sourceToneClasses, statusCopy, type ProductizedSourceProbe } from "@/lib/source-status";

type MobileResultSheetProps = {
  parcels: ParcelResponse[];
  probes: ProductizedSourceProbe[];
  report?: ParcelReportResponse | null;
  expanded: boolean;
  onToggle: () => void;
};

export function MobileResultSheet({ parcels, probes, report, expanded, onToggle }: MobileResultSheetProps) {
  const primaryParcel = parcels[0];

  return (
    <div className={`fixed inset-x-0 bottom-0 z-30 rounded-t-[2rem] border border-white/10 bg-slate-950/95 p-4 shadow-[0_-24px_80px_rgba(2,6,23,0.45)] backdrop-blur transition-transform duration-300 md:static md:rounded-[2rem] md:p-5 ${expanded ? "max-h-[82dvh] overflow-y-auto" : "max-h-[42dvh] overflow-hidden"}`}>
      <button onClick={onToggle} className="mx-auto mb-3 flex min-h-8 w-full items-center justify-center text-slate-400 md:hidden" aria-label={expanded ? "Sonuç panelini daralt" : "Sonuç panelini genişlet"}>
        <span className="h-1.5 w-12 rounded-full bg-white/20" />
        <ChevronUp className={`ml-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Sorgu sonucu</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {primaryParcel ? `${primaryParcel.ada}/${primaryParcel.parsel} parsel` : "Canlı resmî sonuç bekleniyor"}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {primaryParcel ? `${primaryParcel.il ?? "İl yok"} / ${primaryParcel.ilce ?? "İlçe yok"}` : "Kaynaklar denendi; resmi veri yoksa nedeni aşağıda kalır."}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{parcels.length} kayıt</span>
      </div>

      <div className="mt-4 grid gap-2">
        {probes.map((probe) => {
          const copy = statusCopy(probe.status);
          return (
            <div key={`${probe.sourceId}-${probe.category}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{probe.sourceName}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${sourceToneClasses(copy.tone)}`}>{copy.label}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-400">{probe.message}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/map" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white">
          <MapPinned className="h-4 w-4" /> Harita
        </Link>
        <Link href="/reports" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-cyan-200/20 bg-cyan-200 px-3 text-xs font-semibold text-slate-950">
          <FileText className="h-4 w-4" /> Rapor
        </Link>
        <button className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white">
          <Share2 className="h-4 w-4" /> Paylaş
        </button>
      </div>

      {report ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-300">
          <p className="font-semibold text-white">{report.title ?? "Parsel raporu"}</p>
          <p className="mt-1">{report.disclaimer ?? "Resmî belge değildir; doğrulama gerekir."}</p>
          {report.generatedAt ? <p className="mt-2 text-slate-500">Üretim: {new Date(report.generatedAt).toLocaleString("tr-TR")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
