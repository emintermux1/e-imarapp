"use client";

import { useState } from "react";
import { satelliteChanges, satelliteIllegalConstruction } from "@/lib/api";
import { Satellite, AlertTriangle, CheckCircle } from "lucide-react";

export default function SatellitePage() {
  const [bbox, setBbox] = useState("28.9,41.0,29.0,41.1");
  const [dateBefore, setDateBefore] = useState("2023-01-01");
  const [dateAfter, setDateAfter] = useState("2024-01-01");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const runChanges = async () => {
    setLoading(true);
    try {
      const coords = bbox.split(",").map(Number);
      const res = await satelliteChanges({ bbox: coords, date_before: dateBefore, date_after: dateAfter });
      setResult({ type: "changes", data: res });
    } catch (e) {
      setResult({ type: "error", message: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const runIllegal = async () => {
    setLoading(true);
    try {
      const coords = bbox.split(",").map(Number);
      const res = await satelliteIllegalConstruction({ bbox: coords });
      setResult({ type: "illegal", data: res });
    } catch (e) {
      setResult({ type: "error", message: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Satellite size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Uydu Analizi</h1>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">BBOX (minX,minY,maxX,maxY)</label>
          <input value={bbox} onChange={(e) => setBbox(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Önceki Tarih</label>
            <input type="date" value={dateBefore} onChange={(e) => setDateBefore(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Sonraki Tarih</label>
            <input type="date" value={dateAfter} onChange={(e) => setDateAfter(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={runChanges} disabled={loading} className="flex-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">Değişim Tespiti</button>
          <button onClick={runIllegal} disabled={loading} className="flex-1 bg-[var(--accent-magenta)] text-white font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">Kaçak Yapı Kontrolü</button>
        </div>
      </div>

      {result && result.type === "changes" && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={18} className="text-emerald-400" /><h3 className="font-semibold text-emerald-400">Değişim Analizi Tamamlandı</h3></div>
          <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {result && result.type === "illegal" && (
        <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-400" /><h3 className="font-semibold text-red-400">Kaçak Yapı Analizi</h3></div>
          <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {result && result.type === "error" && (
        <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 text-sm text-red-400">{result.message as string}</div>
      )}
    </div>
  );
}
