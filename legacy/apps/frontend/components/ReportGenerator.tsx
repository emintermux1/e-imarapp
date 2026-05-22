"use client";

import { useState } from "react";
import { generateReport } from "@/lib/api";
import { FileText } from "lucide-react";

export function ReportGenerator() {
  const [reportType, setReportType] = useState("parcel");
  const [parcelId, setParcelId] = useState("");
  const [planId, setPlanId] = useState("");
  const [includeMap, setIncludeMap] = useState(true);
  const [includeTapu, setIncludeTapu] = useState(true);
  const [includeImar, setIncludeImar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: number; status: string; pdf_url?: string } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await generateReport({
        report_type: reportType,
        parcel_id: parcelId ? Number(parcelId) : undefined,
        plan_id: planId ? Number(planId) : undefined,
        include_map: includeMap,
        include_tapu: includeTapu,
        include_imar: includeImar,
      });
      setResult(res);
    } catch (e) {
      alert("Rapor oluşturulamadı: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={20} className="text-[var(--accent-cyan)]" />
        <h2 className="text-lg font-semibold">Rapor Oluştur</h2>
      </div>

      <div>
        <label className="block text-xs text-[var(--text-secondary)] mb-1">Rapor Tipi</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm">
          <option value="parcel">Parsel Raporu</option>
          <option value="plan">Plan Raporu</option>
          <option value="combined">Kombine Rapor</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Parsel ID</label>
          <input type="number" value={parcelId} onChange={(e) => setParcelId(e.target.value)} placeholder="Opsiyonel" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Plan ID</label>
          <input type="number" value={planId} onChange={(e) => setPlanId(e.target.value)} placeholder="Opsiyonel" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeMap} onChange={(e) => setIncludeMap(e.target.checked)} className="accent-[var(--accent-cyan)]" />
          <span>Harita</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeTapu} onChange={(e) => setIncludeTapu(e.target.checked)} className="accent-[var(--accent-cyan)]" />
          <span>Tapu</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeImar} onChange={(e) => setIncludeImar(e.target.checked)} className="accent-[var(--accent-cyan)]" />
          <span>İmar</span>
        </label>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? "Oluşturuluyor..." : "Rapor Oluştur"}
      </button>

      {result && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-emerald-400">Rapor #{result.id} oluşturuldu — {result.status}</p>
          {result.pdf_url && <a href={result.pdf_url} target="_blank" rel="noreferrer" className="text-[var(--accent-cyan)] hover:underline mt-1 inline-block">PDF İndir</a>}
        </div>
      )}
    </div>
  );
}
