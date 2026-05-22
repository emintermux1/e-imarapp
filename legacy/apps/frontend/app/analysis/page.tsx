"use client";

import { useState } from "react";
import { analysisMergeable, analysisValueEstimate, analysisPlanLegend } from "@/lib/api";
import { BarChart3 } from "lucide-react";

export default function AnalysisPage() {
  const [parcelIds, setParcelIds] = useState("");
  const [parcelId, setParcelId] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const runMergeable = async () => {
    setLoading(true);
    try {
      const ids = parcelIds.split(",").map(Number).filter(Boolean);
      const res = await analysisMergeable(ids);
      setResult({ type: "mergeable", data: res });
    } catch (e) { setResult({ type: "error", message: String(e) }); }
    finally { setLoading(false); }
  };

  const runValue = async () => {
    setLoading(true);
    try {
      const res = await analysisValueEstimate(Number(parcelId));
      setResult({ type: "value", data: res });
    } catch (e) { setResult({ type: "error", message: String(e) }); }
    finally { setLoading(false); }
  };

  const runLegend = async () => {
    setLoading(true);
    try {
      const res = await analysisPlanLegend(pdfUrl);
      setResult({ type: "legend", data: res });
    } catch (e) { setResult({ type: "error", message: String(e) }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Analiz Araçları</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Birleşebilir Parseller</h3>
          <input value={parcelIds} onChange={(e) => setParcelIds(e.target.value)} placeholder="1,2,3..." className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <button onClick={runMergeable} disabled={loading} className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg py-2 text-sm hover:opacity-90 disabled:opacity-50">Kontrol Et</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Değer Tahmini</h3>
          <input value={parcelId} onChange={(e) => setParcelId(e.target.value)} placeholder="Parsel ID" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <button onClick={runValue} disabled={loading} className="w-full bg-[var(--accent-magenta)] text-white font-medium rounded-lg py-2 text-sm hover:opacity-90 disabled:opacity-50">Tahmin Et</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Plan Lejantı</h3>
          <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="PDF URL" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <button onClick={runLegend} disabled={loading} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium rounded-lg py-2 text-sm hover:bg-white/5 disabled:opacity-50">Oku</button>
        </div>
      </div>

      {result && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5">
          <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
