"use client";

import { useMemo, useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { getMapLayers, getNearby } from "@/lib/api";
import { Crosshair, Layers, MapPin, RefreshCw, Search } from "lucide-react";
import type { LayerInfo } from "@/lib/types";

export default function MapPage() {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>("");
  const [basemap, setBasemap] = useState<"osm" | "light" | "dark">("light");
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.9784, 41.0082]);
  const [radius, setRadius] = useState(2000);
  const [searchInput, setSearchInput] = useState("");
  const [nearbyList, setNearbyList] = useState<Array<{ id: number; label: string; distanceM: number }>>([]);
  const [nearbyResults, setNearbyResults] = useState<Array<{ id: number; lon: number; lat: number; title: string; subtitle?: string }>>([]);
  const [wmsUrl, setWmsUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const loadLayers = async () => {
    setLoading(true);
    try {
      const res = await getMapLayers();
      setLayers(res.layers);
      setWmsUrl(res.url);
      if (res.layers.length > 0) {
        setSelectedLayer((current) => current || res.layers[0].name);
      }
    } catch (e) {
      alert("Katmanlar yüklenemedi: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  const selectedLayerMeta = useMemo(
    () => layers.find((layer) => layer.name === selectedLayer),
    [layers, selectedLayer],
  );

  const locateCurrentUser = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcı konum özelliğini desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter: [number, number] = [position.coords.longitude, position.coords.latitude];
        setMapCenter(nextCenter);
      },
      (error) => {
        alert(`Konum alınamadı: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const runDetailedSearch = async () => {
    const parsed = searchInput
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value));
    if (parsed.length === 2) {
      setMapCenter([parsed[1], parsed[0]]);
    }

    const lat = parsed.length === 2 ? parsed[0] : mapCenter[1];
    const lon = parsed.length === 2 ? parsed[1] : mapCenter[0];
    try {
      setLoading(true);
      const response = await getNearby(lat, lon, radius);
      setNearbyList(
        response.results.map((result) => ({
          id: result.id,
          label: `${result.ada}/${result.parsel} - ${result.municipality || result.district || "Bilinmeyen"}`,
          distanceM: result.distance_m,
        })),
      );
      setNearbyResults(
        [
          {
            id: 0,
          lat,
          lon,
            title: "Arama Merkezi",
            subtitle: `${response.results.length} sonuç · ${radius}m yarıçap`,
          },
        ],
      );
    } catch (error) {
      alert("Detaylı arama çalıştırılamadı: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] -mx-6 -my-6 md:-mx-8 md:-my-8 flex flex-col animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-[180px]">
          <Layers size={18} className="text-[var(--accent-cyan)]" />
          <h1 className="text-lg font-semibold">Harita</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1">
            <MapPin size={14} className="text-[var(--accent-cyan)]" />
            <select
              value={basemap}
              onChange={(event) => setBasemap(event.target.value as "osm" | "light" | "dark")}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="light">Vector Açık</option>
              <option value="dark">Vector Karanlık (iyileştirilmiş)</option>
              <option value="osm">OSM Standart</option>
            </select>
          </div>
          <button onClick={locateCurrentUser} className="flex items-center gap-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <Crosshair size={14} /> Mevcut Konum
          </button>
          <button onClick={loadLayers} disabled={loading} className="flex items-center gap-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Katmanları Yükle
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2">
          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3">
            <Search size={16} className="text-[var(--text-secondary)]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && runDetailedSearch()}
              placeholder="Detaylı arama: lat,lon (örn 41.0082,28.9784) veya mevcut merkezde yakın parsel tara"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
          <input
            type="number"
            value={radius}
            min={100}
            max={50000}
            step={100}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-full lg:w-[180px]"
            placeholder="Yarıçap (m)"
          />
          <button onClick={runDetailedSearch} className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg px-4 py-2 text-sm hover:opacity-90 transition-opacity">
            Detaylı Sorgu
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1">
          <MapViewer center={mapCenter} zoom={12} wmsUrl={wmsUrl} wmsLayer={selectedLayer} basemap={basemap} nearbyFeatures={nearbyResults} />
        </div>

        {layers.length > 0 && (
          <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-y-auto p-4 space-y-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">WMS/WFS Katmanları</h2>
            <div className="space-y-2">
              {layers.map((l) => (
                <button
                  type="button"
                  onClick={() => setSelectedLayer(l.name)}
                  key={l.name}
                  className={`w-full text-left text-xs bg-[var(--bg-elevated)] rounded-lg px-3 py-2 border transition-colors ${
                    selectedLayer === l.name ? "border-[var(--accent-cyan)]/60" : "border-[var(--border-subtle)]"
                  }`}
                >
                  <p className="font-medium text-[var(--text-primary)]">{l.title || l.name}</p>
                  <p className="text-[var(--text-secondary)] mt-0.5">{l.name}</p>
                </button>
              ))}
            </div>
            {selectedLayerMeta && (
              <div className="text-xs bg-[var(--bg-elevated)] rounded-lg px-3 py-3 border border-[var(--border-subtle)] space-y-2">
                <p className="font-semibold text-[var(--text-primary)]">Katman Açıklaması</p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {selectedLayerMeta.abstract || "Bu katman için sunucudan açıklama (abstract) gelmedi."}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">Stiller:</span>{" "}
                  {selectedLayerMeta.styles?.length ? selectedLayerMeta.styles.join(", ") : "Varsayılan"}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">CRS:</span>{" "}
                  {selectedLayerMeta.crs_options?.length ? selectedLayerMeta.crs_options.join(", ") : "Belirtilmedi"}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">BBOX (WGS84):</span>{" "}
                  {selectedLayerMeta.bounding_box_wgs84?.join(", ") || "Belirtilmedi"}
                </p>
              </div>
            )}
            <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-lg px-3 py-2 border border-[var(--border-subtle)]">
              Haritadaki veri görünürlüğü artırıldı: katman seçimi, detay meta bilgisi ve yakın çevre parsel noktaları aktif.
            </div>
            {nearbyList.length > 0 && (
              <div className="text-xs bg-[var(--bg-elevated)] rounded-lg px-3 py-3 border border-[var(--border-subtle)] space-y-2">
                <p className="font-semibold text-[var(--text-primary)]">Detaylı Arama Sonuçları</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {nearbyList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-[var(--text-secondary)]">
                      <span className="truncate">{item.label}</span>
                      <span className="text-[var(--text-primary)]">{Math.round(item.distanceM)}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
