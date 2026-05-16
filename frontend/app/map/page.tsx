"use client";

import { useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { getMapLayers, getNearby, searchParcel } from "@/lib/api";
import { Layers, LocateFixed, RefreshCw, Search, ShieldCheck } from "lucide-react";
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
  const [center, setCenter] = useState<[number, number]>([28.9784, 41.0082]);
  const [status, setStatus] = useState("OSM tabanı hazır; parsel veya katman verisi gelene kadar boş ekran yerine İstanbul merkezli harita gösterilir.");
  const [locating, setLocating] = useState(false);
  const displayFeatures = parcelFeatures.length > 0 ? parcelFeatures : demoParcelFeatures;

  const loadLayers = async () => {
    setLoading(true);
    try {
      const res = await getMapLayers();
      setLayers(res.layers);
      setWmsUrl(res.url);
      setStatus(`${res.layers.length} WMS/WFS katmanı yüklendi. Katman kontrolünden görünürlüğü açabilirsiniz.`);
    } catch {
      setStatus("Katman servisi şu an cevap vermedi; temel harita ve demo parsel görünümü korunuyor.");
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
      setStatus(features.length > 0 ? `${features.length} parsel geometriyle haritaya işlendi.` : "Arama sonuç verdi ama geometri dönmedi; temel harita görünür bırakıldı.");
    } catch {
      setStatus("Parsel servisi şu an cevap vermedi; boş ekran yerine örnek kadastro görünümü açık kaldı.");
    } finally {
      setLoading(false);
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus("Tarayıcı konum izni desteklemiyor.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter: [number, number] = [position.coords.longitude, position.coords.latitude];
        setCenter(nextCenter);
        setStatus("Konum alındı; yakın parseller kontrol ediliyor.");
        try {
          const nearby = await getNearby(position.coords.latitude, position.coords.longitude, 1000);
          setStatus(nearby.results.length > 0 ? `${nearby.results.length} yakın parsel bulundu.` : "Konum alındı; 1 km içinde kayıtlı yakın parsel dönmedi.");
        } catch {
          setStatus("Konum alındı; yakın parsel servisi şu an cevap vermiyor.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "Konum izni verilmedi; harita İstanbul merkezinde açık kaldı." : "Konum alınamadı; tekrar deneyin.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f6f1e6] text-[#17231f] md:-mx-8 md:-my-8 md:min-h-[100dvh]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7d0bc]/85 bg-[#fffaf0]/92 px-4 py-3 shadow-sm md:px-6">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#087d7f]" />
          <h1 className="text-lg font-extrabold tracking-[-0.03em]">Harita Çalışma Alanı</h1>
          <span className="rounded-full border border-[#d7d0bc]/85 bg-[#f6f1e6] px-2 py-0.5 text-[11px] font-bold text-[#65726b]">
            Kadastro + WMS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLayers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-[#d7d0bc]/85 bg-white px-3 py-1.5 text-sm font-semibold text-[#17231f] transition-colors hover:bg-[#f6f1e6] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Katmanları Yükle
          </button>
          <button
            onClick={loadParcels}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-[#17231f] px-3 py-1.5 text-sm font-semibold text-[#fffaf0] transition-colors hover:bg-[#26362f] disabled:opacity-50"
          >
            <Search size={14} /> Parselleri Çek
          </button>
          <button
            onClick={locateMe}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-full border border-[#d7d0bc]/85 bg-[#087d7f] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#06686a] disabled:opacity-50"
          >
            <LocateFixed size={14} className={locating ? "animate-pulse" : ""} /> Konum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-[#d7d0bc]/85 bg-[#fffaf0]/76 px-4 py-3 md:grid-cols-4 md:px-6 xl:grid-cols-6">
        <input
          value={il}
          onChange={(e) => setIl(e.target.value)}
          placeholder="İl"
          className="rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]"
        />
        <input
          value={ilce}
          onChange={(e) => setIlce(e.target.value)}
          placeholder="İlçe"
          className="rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]"
        />
        <input
          value={ada}
          onChange={(e) => setAda(e.target.value)}
          placeholder="Ada"
          className="rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]"
        />
        <input
          value={parsel}
          onChange={(e) => setParsel(e.target.value)}
          placeholder="Parsel"
          className="rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm text-[#17231f] outline-none focus:border-[#087d7f]"
        />
        <div className="col-span-2 flex items-center gap-2 text-xs font-medium text-[#5f5847]">
          <ShieldCheck size={14} className="text-[#087d7f]" />
          {status}
        </div>
      </div>

      <div className="flex min-h-[560px] flex-1 p-3 md:p-4">
        <div className="flex-1">
          <MapViewer
            center={center}
            zoom={parcelFeatures.length > 0 ? 15 : 12}
            wmsUrl={wmsUrl}
            wmsLayers={layers.map((layer) => layer.name)}
            geojson={{ type: "FeatureCollection", features: displayFeatures }}
            onLocate={locateMe}
            locateBusy={locating}
            statusMessage={status}
          />
        </div>
        {layers.length > 0 && (
          <div className="ml-3 hidden w-72 overflow-y-auto rounded-[1.4rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-4 shadow-sm xl:block">
            <h2 className="mb-3 text-sm font-extrabold text-[#17231f]">WMS/WFS Katmanları</h2>
            <div className="space-y-2">
              {layers.map((layer) => (
                <div key={layer.name} className="rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-xs">
                  <p className="font-bold text-[#17231f]">{layer.title || layer.name}</p>
                  <p className="mt-0.5 text-[#65726b]">{layer.name}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-[#d7d0bc]/85 pt-3 text-xs text-[#5f5847]">
              <p>Parsel seçimi, ölçüm ve veri güven skoru harita üstünde çalışır.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const demoParcelFeatures: GeoJSON.Feature[] = [
  {
    type: "Feature",
    properties: {
      id: "demo-1254-18",
      ada: "1254",
      parsel: "18",
      il: "İstanbul",
      ilce: "Kadıköy",
      updated_at: "Demo önizleme",
      taks: 0.35,
      kaks: 1.8,
      kat_siniri: "6 Kat",
      imar_tipi: "Konut",
      risk_skoru: 42
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [28.9759, 41.0069],
        [28.9795, 41.0071],
        [28.979, 41.009],
        [28.9761, 41.0092],
        [28.9759, 41.0069]
      ]]
    }
  }
];

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
