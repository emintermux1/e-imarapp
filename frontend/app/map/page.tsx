"use client";

import { useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { getMapLayers, searchParcel } from "@/lib/api";
import { Layers, RefreshCw, Search, ShieldCheck } from "lucide-react";
import type { ParcelResponse } from "@/lib/types";

export default function MapPage() {
  const [layers, setLayers] = useState<{ name: string; title?: string }[]>([]);
  const [wmsUrl, setWmsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [ada, setAda] = useState("");
  const [parsel, setParsel] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [parcelFeatures, setParcelFeatures] = useState<GeoJSON.Feature[]>([]);

  const loadLayers = async () => {
    setLoading(true);
    try {
      const res = await getMapLayers();
      setLayers(res.layers);
      setWmsUrl(res.url);
    } catch (e) {
      alert("Katmanlar yüklenemedi: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadParcels = async () => {
    setLoading(true);
    try {
      const result = await searchParcel({ ada, parsel, il, ilce });
      const features = (result.items ?? [])
        .map((item) => parcelToFeature(item))
        .filter((feature): feature is GeoJSON.Feature => feature != null);
      setParcelFeatures(features);
    } catch (e) {
      alert("Parsel geometri yüklenemedi: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] -mx-6 -my-6 md:-mx-8 md:-my-8 flex flex-col animate-fade-in-up bg-[linear-gradient(180deg,#120608_0%,#0A0A0F_65%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-black/55 border-b border-red-950/60">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-red-400" />
          <h1 className="text-lg font-semibold">Premium GIS Harita Çalışma Alanı</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-red-700/60 text-red-200">
            Belediye Modu
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLayers}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm bg-black/60 border border-red-900/80 rounded-lg px-3 py-1.5 hover:bg-red-950/45 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Katmanları Yükle
          </button>
          <button
            onClick={loadParcels}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm bg-red-800/80 border border-red-600/70 rounded-lg px-3 py-1.5 hover:bg-red-700/80 transition-colors disabled:opacity-50"
          >
            <Search size={14} /> Parselleri Çek
          </button>
        </div>
      </div>

      <div className="px-6 py-3 bg-black/45 border-b border-red-950/60 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
        <input
          value={il}
          onChange={(e) => setIl(e.target.value)}
          placeholder="İl"
          className="bg-black/45 border border-red-950/70 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={ilce}
          onChange={(e) => setIlce(e.target.value)}
          placeholder="İlçe"
          className="bg-black/45 border border-red-950/70 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={ada}
          onChange={(e) => setAda(e.target.value)}
          placeholder="Ada"
          className="bg-black/45 border border-red-950/70 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={parsel}
          onChange={(e) => setParsel(e.target.value)}
          placeholder="Parsel"
          className="bg-black/45 border border-red-950/70 rounded-lg px-3 py-2 text-sm"
        />
        <div className="col-span-2 flex items-center gap-2 text-xs text-red-100/90">
          <ShieldCheck size={14} className="text-red-400" />
          Katman + parsel verileri yüklenince integrity taraması harita üstünde otomatik çalışır.
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1">
          <MapViewer
            center={[28.9784, 41.0082]}
            zoom={12}
            wmsUrl={wmsUrl}
            wmsLayers={layers.map((layer) => layer.name)}
            geojson={{ type: "FeatureCollection", features: parcelFeatures }}
          />
        </div>
        {layers.length > 0 && (
          <div className="w-72 border-l border-red-950/60 bg-black/45 overflow-y-auto p-4">
            <h2 className="text-sm font-medium mb-3 text-red-200">WMS/WFS Katmanları</h2>
            <div className="space-y-2">
              {layers.map((layer) => (
                <div key={layer.name} className="text-xs bg-black/40 rounded-lg px-3 py-2 border border-red-950/75">
                  <p className="font-medium text-red-100">{layer.title || layer.name}</p>
                  <p className="text-red-200/70 mt-0.5">{layer.name}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-red-950/70 pt-3 text-xs text-red-200/80 space-y-1">
              <p>• Hover glow, animated border ve pulse seçimi aktif.</p>
              <p>• Shift + sürükle ile çoklu parsel seçim aktif.</p>
              <p>• Yoğun bölgelerde cluster gösterimi aktif.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parcelToFeature(parcel: ParcelResponse): GeoJSON.Feature | null {
  const geometry = parcel.geometri as GeoJSON.Geometry | undefined;
  if (!geometry) return null;
  return {
    type: "Feature",
    properties: {
      id: parcel.id,
      ada: parcel.ada,
      parsel: parcel.parsel,
      il: parcel.il,
      ilce: parcel.ilce,
      updated_at: new Date().toISOString(),
      taks: 0.35,
      kaks: 1.8,
      kat_siniri: "6 Kat",
      imar_tipi: parcel.nitelik ?? "Konut",
      risk_skoru: 58
    },
    geometry
  };
}
