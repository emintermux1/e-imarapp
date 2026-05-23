"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Search, ShieldCheck } from "lucide-react";
import { generateParcelReport, searchParcel } from "@/lib/api";
import type { ParcelReportResponse, ParcelResponse } from "@/lib/types";
import { defaultReadinessSources, probesFromMunicipalWorkflow, type ProductizedSourceProbe } from "@/lib/source-status";
import { SourceReadinessStrip } from "@/components/home/SourceReadinessStrip";
import { MobileResultSheet } from "@/components/mobile/MobileResultSheet";

type LookupState = "idle" | "loading" | "ready" | "error";

export function MobileLookupFlow() {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [ada, setAda] = useState("");
  const [parsel, setParsel] = useState("");
  const [state, setState] = useState<LookupState>("idle");
  const [error, setError] = useState("");
  const [parcels, setParcels] = useState<ParcelResponse[]>([]);
  const [report, setReport] = useState<ParcelReportResponse | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [workflowProbes, setWorkflowProbes] = useState<ProductizedSourceProbe[]>([]);

  const probes = useMemo(() => (workflowProbes.length ? workflowProbes : defaultReadinessSources()), [workflowProbes]);

  const runLookup = async () => {
    setState("loading");
    setError("");
    setReport(null);
    try {
      const parcelResult = await searchParcel({ ada, parsel, il, ilce });
      const items = parcelResult.items ?? [];
      setParcels(items);

      const syntheticWorkflow = {
        status: items.length ? "public_metadata" : "method_contract_required",
        query: { province: il, district: ilce, ada, parsel },
        parcelGeometryAttempt: {
          status: items.some((item) => item.geometri) ? "public_metadata" : "not_ready",
          message: items.some((item) => item.geometri)
            ? "Backend parsel geometrisi döndürdü; resmi TKGM canlı etiketi ayrıca doğrulanmalıdır."
            : "TKGM canlı geometri contract henüz doğrulanmadı."
        },
        zoningAttempt: {
          status: "method_contract_required",
          source: ilce ? `${ilce.toLowerCase()}-municipality` : "municipality-source",
          message: "Belediye imar method contract canlı sonuç için doğrulanmalı."
        },
        provenance: []
      };
      const nextProbes = probesFromMunicipalWorkflow(syntheticWorkflow);
      setWorkflowProbes(nextProbes);

      const reportResult = await generateParcelReport({
        query: { type: "ada_parsel", ada, parselNo: parsel, province: il, district: ilce },
        parcelWorkflow: { status: items.length ? "ok" : "not_ready", parcelQuery: { status: items.length ? "ok" : "not_ready", parcels: items } },
        municipalWorkflow: syntheticWorkflow
      });
      setReport(reportResult);
      setState("ready");
      setSheetExpanded(true);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Sorgu tamamlanamadı.");
    }
  };

  const disabled = state === "loading" || (!ada.trim() && !parsel.trim() && !il.trim() && !ilce.trim());

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-200 p-3 text-slate-950">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Tek elle sorgu</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Ada/parsel arama</h1>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Field label="İl" value={il} onChange={setIl} placeholder="İstanbul" />
          <Field label="İlçe / belediye" value={ilce} onChange={setIlce} placeholder="Pendik" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ada" value={ada} onChange={setAda} placeholder="123" />
            <Field label="Parsel" value={parsel} onChange={setParsel} placeholder="7" />
          </div>
          <button
            onClick={runLookup}
            disabled={disabled}
            className="mt-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-5 text-sm font-bold text-slate-950 transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Kaynakları kontrol et
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {state === "error" ? (
          <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <section className="min-h-[420px] rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.94),rgba(2,6,23,0.86))] p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Akış</p>
            <h2 className="text-xl font-semibold text-white">Arama → kaynak → sonuç → rapor</h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{state === "ready" ? "Sonuç hazır" : "Beklemede"}</span>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-3">
          <div className="h-64 rounded-[1.25rem] border border-cyan-200/10 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.16),transparent_25%),linear-gradient(135deg,#0f172a,#020617)] p-4">
            <div className="h-full rounded-2xl border border-white/10 bg-[linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.07)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(255,255,255,0.07)_50%,transparent_51%)] bg-[size:42px_42px]" />
          </div>
        </div>
        <div className="mt-4 hidden md:block">
          <MobileResultSheet parcels={parcels} probes={probes} report={report} expanded onToggle={() => undefined} />
        </div>
      </section>

      <div className="lg:col-span-2">
        <SourceReadinessStrip sources={probes} compact />
      </div>

      {state === "ready" ? (
        <div className="md:hidden">
          <MobileResultSheet parcels={parcels} probes={probes} report={report} expanded={sheetExpanded} onToggle={() => setSheetExpanded((expanded) => !expanded)} />
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-200/50"
      />
    </label>
  );
}
