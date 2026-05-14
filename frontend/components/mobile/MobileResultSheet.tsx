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
    <div className={`fixed inset-x-0 bottom-0 z-30 rounded-t-[2rem] border border-[#d8cdb9] bg-[#fffaf0]/95 p-4 shadow-[0_-18px_50px_rgba(72,60,44,0.18)] backdrop-blur transition-transform duration-300 md:static md:rounded-[1.5rem] md:p-5 ${expanded ? "max-h-[82dvh] overflow-y-auto" : "max-h-[42dvh] overflow-hidden"}`}>
      <button onClick={onToggle} className="mx-auto mb-3 flex min-h-8 w-full items-center justify-center text-[#7b837f] md:hidden" aria-label={expanded ? "Sonuç panelini daralt" : "Sonuç panelini genişlet"}>
        <span className="h-1.5 w-12 rounded-full bg-[#d8cdb9]" />
        <ChevronUp className={`ml-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167c80]">Sorgu sonucu</p>
          <h2 className="mt-1 text-xl font-semibold text-[#24312f]">
            {primaryParcel ? `${primaryParcel.ada}/${primaryParcel.parsel} parsel` : "Canlı resmî sonuç bekleniyor"}
          </h2>
          <p className="mt-1 text-sm text-[#66736f]">
            {primaryParcel ? `${primaryParcel.il ?? "İl yok"} / ${primaryParcel.ilce ?? "İlçe yok"}` : "Kaynaklar denendi; resmi veri yoksa nedeni aşağıda kalır."}
          </p>
        </div>
        <span className="rounded-full border border-[#d8cdb9] bg-[#f6f1e8] px-3 py-1 text-xs text-[#66736f]">{parcels.length} kayıt</span>
      </div>

      <div className="mt-4 grid gap-2">
        {probes.map((probe) => {
          const copy = statusCopy(probe.status);
          return (
            <div key={`${probe.sourceId}-${probe.category}`} className="rounded-2xl border border-[#e1d7c6] bg-[#f6f1e8] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#24312f]">{probe.sourceName}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${sourceToneClasses(copy.tone)}`}>{copy.label}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#66736f]">{probe.message}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/map" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-[#d8cdb9] bg-[#f6f1e8] px-3 text-xs font-semibold text-[#24312f]">
          <MapPinned className="h-4 w-4" /> Harita
        </Link>
        <Link href="/reports" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-[#167c80] bg-[#167c80] px-3 text-xs font-semibold text-white">
          <FileText className="h-4 w-4" /> Rapor
        </Link>
        <button className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-[#d8cdb9] bg-[#f6f1e8] px-3 text-xs font-semibold text-[#24312f]">
          <Share2 className="h-4 w-4" /> Paylaş
        </button>
      </div>

      {report ? (
        <div className="mt-4 rounded-2xl border border-[#e1d7c6] bg-[#f6f1e8] p-3 text-xs leading-5 text-[#66736f]">
          <p className="font-semibold text-[#24312f]">{report.title ?? "Parsel raporu"}</p>
          <p className="mt-1">{report.disclaimer ?? "Resmî belge değildir; doğrulama gerekir."}</p>
          {report.generatedAt ? <p className="mt-2 text-[#7b837f]">Üretim: {new Date(report.generatedAt).toLocaleString("tr-TR")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
