"use client";

import { useState } from "react";
import { NativeMapCanvas } from "@/components/NativeMapCanvas";
import { satelliteChanges, satelliteIllegalConstruction } from "@/lib/api";
import { Satellite, AlertTriangle, CheckCircle, CalendarDays } from "lucide-react";

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
    <div className="-mx-4 -my-4 min-h-[calc(100dvh-3.5rem)] space-y-4 bg-[#f6f1e6] p-4 text-[#17231f] md:-mx-8 md:-my-8 md:min-h-[100dvh] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Satellite size={20} className="text-[#087d7f]" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.05em]">Uydu Analizi</h1>
            <p className="text-sm text-[#65726b]">BBOX formu artık görsel uydu önizlemesiyle birlikte çalışır.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <NativeMapCanvas mode="satellite" compact status="Uydu görüntüsü temsilidir; analiz sonucu servis yanıtı geldiğinde aşağıda gösterilir." />
        <div className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-5 shadow-[0_16px_42px_rgba(37,48,42,0.12)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#17231f]">
            <CalendarDays className="h-4 w-4 text-[#087d7f]" />
            Analiz alanı ve tarihleri
          </div>
          <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">BBOX (minX,minY,maxX,maxY)</label>
          <input value={bbox} onChange={(e) => setBbox(e.target.value)} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm font-mono text-[#17231f] outline-none focus:border-[#087d7f]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Önceki Tarih</label>
            <input type="date" value={dateBefore} onChange={(e) => setDateBefore(e.target.value)} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Sonraki Tarih</label>
            <input type="date" value={dateAfter} onChange={(e) => setDateAfter(e.target.value)} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={runChanges} disabled={loading} className="rounded-full bg-[#17231f] py-2.5 text-sm font-extrabold text-[#fffaf0] hover:bg-[#26362f] disabled:opacity-50">Değişim Tespiti</button>
          <button onClick={runIllegal} disabled={loading} className="rounded-full border border-[#d7d0bc]/85 bg-white py-2.5 text-sm font-extrabold text-[#17231f] hover:bg-[#f6f1e6] disabled:opacity-50">Kaçak Yapı Kontrolü</button>
        </div>
          </div>
        </div>
      </div>

      {result && result.type === "changes" && (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-700" /><h3 className="font-semibold text-emerald-800">Değişim Analizi Tamamlandı</h3></div>
          <pre className="overflow-x-auto text-xs text-[#5f5847]">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {result && result.type === "illegal" && (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5">
          <div className="mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-700" /><h3 className="font-semibold text-amber-800">Kaçak Yapı Analizi</h3></div>
          <pre className="overflow-x-auto text-xs text-[#5f5847]">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {result && result.type === "error" && (
        <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">{result.message as string}</div>
      )}
    </div>
  );
}
