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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Kat Sayısı</label>
          <input type="number" value={floors} onChange={(e) => setFloors(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Kat Yüksekliği (m)</label>
          <input type="number" step={0.1} value={floorHeight} onChange={(e) => setFloorHeight(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Parsel Alanı (m²)</label>
          <input type="number" value={parcelArea} onChange={(e) => setParcelArea(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Emsal</label>
          <input type="number" step={0.1} value={emsal} onChange={(e) => setEmsal(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Gabari (m)</label>
          <input type="number" value={gabari} onChange={(e) => setGabari(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Hmax (m)</label>
          <input type="number" value={hMax} onChange={(e) => setHMax(Number(e.target.value))} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={runVolume} disabled={loading} className="flex-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Hesaplanıyor..." : "Hacim Hesapla"}
        </button>
        <button onClick={runCompliance} disabled={loading} className="flex-1 bg-[var(--accent-magenta)] text-white font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Kontrol ediliyor..." : "Uygunluk Kontrolü"}
        </button>
      </div>

      {result && result.type === "volume" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm space-y-1">
          <p><span className="text-[var(--text-secondary)]">Taban Alanı:</span> {((result.data as Record<string, unknown>).base_area_m2 as number)?.toLocaleString("tr-TR")} m²</p>
          <p><span className="text-[var(--text-secondary)]">Toplam Alan:</span> {((result.data as Record<string, unknown>).total_floor_area_m2 as number)?.toLocaleString("tr-TR")} m²</p>
          <p><span className="text-[var(--text-secondary)]">Hacim:</span> {((result.data as Record<string, unknown>).volume_m3 as number)?.toLocaleString("tr-TR")} m³</p>
          <p><span className="text-[var(--text-secondary)]">Yükseklik:</span> {String((result.data as Record<string, unknown>).height_m)} m</p>
        </div>
      )}

      {result && result.type === "compliance" && (
        <div className={`border rounded-lg p-4 text-sm ${(result.data as Record<string, unknown>).compliant ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <p className="font-semibold mb-2">{(result.data as Record<string, unknown>).compliant === true ? "✅ Uygun" : "❌ Uygun Değil"}</p>
          {((result.data as Record<string, unknown>).violations as string[]).length > 0 && (
            <ul className="list-disc list-inside text-red-400">
              {((result.data as Record<string, unknown>).violations as string[]).map((v, i) => <li key={i}>{v}</li>)}
            </ul>
          )}
        </div>
      )}

      {result && result.type === "error" && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4 text-sm text-red-400">{result.message as string}</div>
      )}
    </div>
  );
}
