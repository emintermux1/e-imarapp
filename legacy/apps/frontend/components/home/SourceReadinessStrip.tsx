import { ShieldCheck, ShieldAlert, Clock3 } from "lucide-react";
import { defaultReadinessSources, sourceDotClass, sourceToneClasses, statusCopy, type ProductizedSourceProbe } from "@/lib/source-status";

type SourceReadinessStripProps = {
  sources?: ProductizedSourceProbe[];
  generatedAt?: string;
  compact?: boolean;
};

export function SourceReadinessStrip({ sources = defaultReadinessSources(), generatedAt, compact = false }: SourceReadinessStripProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.32)] ring-1 ring-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Canlı kaynak durumu</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Resmî sonuç etiketi sadece doğrulanınca açılır</h2>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-200" />
      </div>

      <div className={compact ? "mt-4 space-y-2" : "mt-5 grid gap-3"}>
        {sources.map((source) => {
          const copy = statusCopy(source.status);
          return (
            <div key={source.sourceId} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${sourceDotClass(copy.tone)}`} />
                    <p className="truncate text-sm font-semibold text-white">{source.sourceName}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{source.message}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${sourceToneClasses(copy.tone)}`}>
                  {copy.label}
                </span>
              </div>
              {!compact && source.nextAction ? (
                <p className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-400">{source.nextAction}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Resmî belge değildir</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {generatedAt ? new Date(generatedAt).toLocaleString("tr-TR") : "Canlı probe bekleniyor"}</span>
      </div>
    </div>
  );
}
