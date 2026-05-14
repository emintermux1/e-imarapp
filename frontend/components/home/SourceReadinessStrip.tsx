import { ShieldCheck, ShieldAlert, Clock3 } from "lucide-react";
import { defaultReadinessSources, sourceDotClass, sourceToneClasses, statusCopy, type ProductizedSourceProbe } from "@/lib/source-status";

type SourceReadinessStripProps = {
  sources?: ProductizedSourceProbe[];
  generatedAt?: string;
  compact?: boolean;
};

export function SourceReadinessStrip({ sources = defaultReadinessSources(), generatedAt, compact = false }: SourceReadinessStripProps) {
  return (
    <div className="rounded-[1.5rem] border border-[#d8cdb9] bg-[#fffaf0] p-4 shadow-[0_14px_34px_rgba(72,60,44,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167c80]">Canlı kaynak durumu</p>
          <h2 className="mt-1 text-xl font-semibold text-[#24312f]">Resmî sonuç etiketi sadece doğrulanınca açılır</h2>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#167c80]" />
      </div>

      <div className={compact ? "mt-4 space-y-2" : "mt-5 grid gap-3"}>
        {sources.map((source) => {
          const copy = statusCopy(source.status);
          return (
            <div key={source.sourceId} className="rounded-2xl border border-[#e1d7c6] bg-[#f6f1e8] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${sourceDotClass(copy.tone)}`} />
                    <p className="truncate text-sm font-semibold text-[#24312f]">{source.sourceName}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#66736f]">{source.message}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${sourceToneClasses(copy.tone)}`}>
                  {copy.label}
                </span>
              </div>
              {!compact && source.nextAction ? (
                <p className="mt-2 border-t border-[#e1d7c6] pt-2 text-xs text-[#7b837f]">{source.nextAction}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#e1d7c6] pt-3 text-xs text-[#66736f]">
        <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Resmî belge değildir</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {generatedAt ? new Date(generatedAt).toLocaleString("tr-TR") : "Canlı probe bekleniyor"}</span>
      </div>
    </div>
  );
}
