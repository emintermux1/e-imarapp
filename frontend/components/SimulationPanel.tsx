"use client";

import { useState } from "react";
import { simulateVolume, simulateCompliance } from "@/lib/api";

export function SimulationPanel() {
  const [floors, setFloors] = useState(5);
  const [floorHeight, setFloorHeight] = useState(3.0);
  const [buildingType] = useState("apartment");
  const [parcelArea, setParcelArea] = useState(500);
  const [emsal, setEmsal] = useState(1.5);
  const [gabari, setGabari] = useState(15);
  const [hMax, setHMax] = useState(45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const runVolume = async () => {
    setLoading(true);
    try {
      const res = await simulateVolume({
        footprint_geojson: { type: "Polygon", coordinates: [[[28.9784, 41.0082], [28.9794, 41.0082], [28.9794, 41.0092], [28.9784, 41.0092], [28.9784, 41.0082]]] },
        floors,
        floor_height: floorHeight,
        building_type: buildingType,
      });
      setResult({ type: "volume", data: res });
    } catch (e) {
      setResult({ type: "error", message: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const runCompliance = async () => {
    setLoading(true);
    try {
      const res = await simulateCompliance({
        footprint_geojson: { type: "Polygon", coordinates: [[[28.9784, 41.0082], [28.9794, 41.0082], [28.9794, 41.0092], [28.9784, 41.0092], [28.9784, 41.0082]]] },
        parcel_area_m2: parcelArea,
        emsal,
        gabari,
        h_max: hMax,
        floors,
        floor_height: floorHeight,
      });
      setResult({ type: "compliance", data: res });
    } catch (e) {
      setResult({ type: "error", message: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[#17231f]">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Kat Sayısı</label>
          <input type="number" value={floors} onChange={(e) => setFloors(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Kat Yüksekliği (m)</label>
          <input type="number" step={0.1} value={floorHeight} onChange={(e) => setFloorHeight(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Parsel Alanı (m²)</label>
          <input type="number" value={parcelArea} onChange={(e) => setParcelArea(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Emsal</label>
          <input type="number" step={0.1} value={emsal} onChange={(e) => setEmsal(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Gabari (m)</label>
          <input type="number" value={gabari} onChange={(e) => setGabari(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#65726b]">Hmax (m)</label>
          <input type="number" value={hMax} onChange={(e) => setHMax(Number(e.target.value))} className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={runVolume} disabled={loading} className="rounded-full bg-[#17231f] py-2.5 text-sm font-extrabold text-[#fffaf0] transition-colors hover:bg-[#26362f] disabled:opacity-50">
          {loading ? "Hesaplanıyor..." : "Hacim Hesapla"}
        </button>
        <button onClick={runCompliance} disabled={loading} className="rounded-full border border-[#d7d0bc]/85 bg-white py-2.5 text-sm font-extrabold text-[#17231f] transition-colors hover:bg-[#f6f1e6] disabled:opacity-50">
          {loading ? "Kontrol ediliyor..." : "Uygunluk Kontrolü"}
        </button>
      </div>

      {result && result.type === "volume" && (
        <div className="space-y-1 rounded-2xl border border-[#d7d0bc]/85 bg-[#f6f1e6] p-4 text-sm">
          <p><span className="text-[#65726b]">Taban Alanı:</span> {((result.data as Record<string, unknown>).base_area_m2 as number)?.toLocaleString("tr-TR")} m²</p>
          <p><span className="text-[#65726b]">Toplam Alan:</span> {((result.data as Record<string, unknown>).total_floor_area_m2 as number)?.toLocaleString("tr-TR")} m²</p>
          <p><span className="text-[#65726b]">Hacim:</span> {((result.data as Record<string, unknown>).volume_m3 as number)?.toLocaleString("tr-TR")} m³</p>
          <p><span className="text-[#65726b]">Yükseklik:</span> {String((result.data as Record<string, unknown>).height_m)} m</p>
        </div>
      )}

      {result && result.type === "compliance" && (
        <div className={`rounded-2xl border p-4 text-sm ${(result.data as Record<string, unknown>).compliant ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <p className="mb-2 font-semibold">{(result.data as Record<string, unknown>).compliant === true ? "Uygun" : "Uygun Değil"}</p>
          {((result.data as Record<string, unknown>).violations as string[]).length > 0 && (
            <ul className="list-inside list-disc text-red-700">
              {((result.data as Record<string, unknown>).violations as string[]).map((v, i) => <li key={i}>{v}</li>)}
            </ul>
          )}
        </div>
      )}

      {result && result.type === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{result.message as string}</div>
      )}
    </div>
  );
}
