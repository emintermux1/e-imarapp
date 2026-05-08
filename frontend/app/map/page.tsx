"use client";

import { useMemo, useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { getMapLayers, getNearby } from "@/lib/api";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type maplibregl from "maplibre-gl";
import { Calculator, Crosshair, Download, Eraser, FileSpreadsheet, Layers, MapPin, RefreshCw, Search } from "lucide-react";
import type { LayerInfo } from "@/lib/types";

type MeasureMode = "none" | "distance" | "area" | "slope";

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const radius = 6371000;
  const dLat = toRadians(b[1] - a[1]);
  const dLon = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * radius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function polygonAreaSquareMeters(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const earthRadius = 6378137;
  const avgLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const projected = points.map((point) => {
    const x = toRadians(point[0]) * earthRadius * Math.cos(toRadians(avgLat));
    const y = toRadians(point[1]) * earthRadius;
    return [x, y] as [number, number];
  });

  let area = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const j = (i + 1) % projected.length;
    area += projected[i][0] * projected[j][1] - projected[j][0] * projected[i][1];
  }
  return Math.abs(area / 2);
}

function formatDistance(valueMeters: number): string {
  if (valueMeters >= 1000) return `${(valueMeters / 1000).toFixed(2)} km`;
  return `${valueMeters.toFixed(1)} m`;
}

function formatArea(valueSquareMeters: number): string {
  if (valueSquareMeters >= 1_000_000) return `${(valueSquareMeters / 1_000_000).toFixed(2)} km²`;
  if (valueSquareMeters >= 10_000) return `${(valueSquareMeters / 10_000).toFixed(2)} ha`;
  return `${valueSquareMeters.toFixed(1)} m²`;
}

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
  const [mapHandle, setMapHandle] = useState<maplibregl.Map | null>(null);
  const [measureMode, setMeasureMode] = useState<MeasureMode>("none");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [startElevation, setStartElevation] = useState(0);
  const [endElevation, setEndElevation] = useState(0);
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

  const onMapClick = (coords: { lon: number; lat: number }) => {
    if (measureMode === "none") return;
    setMeasurePoints((previous) => [...previous, [coords.lon, coords.lat]]);
  };

  const clearMeasurements = () => {
    setMeasurePoints([]);
    setStartElevation(0);
    setEndElevation(0);
  };

  const undoLastMeasurementPoint = () => {
    setMeasurePoints((previous) => previous.slice(0, -1));
  };

  const measurementDistanceMeters = useMemo(() => {
    if (measureMode !== "distance" && measureMode !== "slope") return 0;
    if (measurePoints.length < 2) return 0;
    return measurePoints.reduce((sum, point, index) => {
      if (index === 0) return sum;
      return sum + haversineMeters(measurePoints[index - 1], point);
    }, 0);
  }, [measureMode, measurePoints]);

  const measurementAreaSquareMeters = useMemo(() => {
    if (measureMode !== "area") return 0;
    return polygonAreaSquareMeters(measurePoints);
  }, [measureMode, measurePoints]);

  const slopePercent = useMemo(() => {
    if (measureMode !== "slope" || measurementDistanceMeters <= 0) return 0;
    return ((endElevation - startElevation) / measurementDistanceMeters) * 100;
  }, [endElevation, measureMode, measurementDistanceMeters, startElevation]);

  const measurementGeojson = useMemo(() => {
    const features: Array<Record<string, unknown>> = measurePoints.map((point, index) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point[0], point[1]] },
      properties: { title: `Nokta ${index + 1}` },
    }));

    if ((measureMode === "distance" || measureMode === "slope") && measurePoints.length >= 2) {
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: measurePoints.map((point) => [point[0], point[1]]) },
        properties: { title: "Mesafe Çizgisi" },
      });
    }
    if (measureMode === "area" && measurePoints.length >= 3) {
      const polygon = [...measurePoints, measurePoints[0]];
      features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [polygon.map((point) => [point[0], point[1]])] },
        properties: { title: "Alan Poligonu" },
      });
    }
    return { type: "FeatureCollection", features };
  }, [measureMode, measurePoints]);

  const exportExcelReport = () => {
    const rows = nearbyList.map((item) => ({
      id: item.id,
      label: item.label,
      distance_m: Math.round(item.distanceM),
      layer: selectedLayer || "seçilmedi",
      radius_m: radius,
      timestamp: new Date().toISOString(),
    }));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: "Arama sonucu bulunamadı." }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "MapReport");
    XLSX.writeFile(workbook, `map-report-${Date.now()}.xlsx`);
  };

  const exportPdfReport = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const image = mapHandle?.getCanvas().toDataURL("image/png");
    const now = new Date().toLocaleString("tr-TR");
    doc.setFontSize(14);
    doc.text("Harita Durum Raporu", 14, 14);
    doc.setFontSize(10);
    doc.text(`Zaman: ${now}`, 14, 22);
    doc.text(`Katman: ${selectedLayerMeta?.title || selectedLayer || "Secili degil"}`, 14, 28);
    doc.text(`Arama Kriteri: ${searchInput || "Merkez tabanli sorgu"}`, 14, 34);
    doc.text(`Yaricap: ${radius} m`, 14, 40);
    doc.text(`Olcum Modu: ${measureMode}`, 14, 46);
    doc.text(
      `Olcum Sonucu: Mesafe ${formatDistance(measurementDistanceMeters)} / Alan ${formatArea(measurementAreaSquareMeters)} / Egim ${slopePercent.toFixed(2)}%`,
      14,
      52,
    );
    doc.text(`Sonuc sayisi: ${nearbyList.length}`, 14, 58);
    if (selectedLayerMeta?.abstract) {
      doc.text(`Katman Aciklama: ${selectedLayerMeta.abstract.slice(0, 180)}`, 14, 64);
    }

    if (image) {
      doc.addImage(image, "PNG", 14, 72, 182, 92);
    }

    const tableStartY = 170;
    doc.setFontSize(9);
    doc.text("Top Sonuclar", 14, tableStartY);
    nearbyList.slice(0, 8).forEach((item, index) => {
      const y = tableStartY + 6 + index * 5;
      doc.text(`- ${item.label} (${Math.round(item.distanceM)}m)`, 14, y);
    });
    doc.save(`map-report-${Date.now()}.pdf`);
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
          <button onClick={exportPdfReport} className="flex items-center gap-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <Download size={14} /> PDF
          </button>
          <button onClick={exportExcelReport} className="flex items-center gap-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <FileSpreadsheet size={14} /> Excel
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
          <MapViewer
            center={mapCenter}
            zoom={12}
            wmsUrl={wmsUrl}
            wmsLayer={selectedLayer}
            basemap={basemap}
            nearbyFeatures={nearbyResults}
            onMapReady={setMapHandle}
            onMapClick={onMapClick}
            measurementGeojson={measurementGeojson}
          />
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
            <div className="text-xs bg-[var(--bg-elevated)] rounded-lg px-3 py-3 border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1"><Calculator size={13} /> Ölçüm Araçları</p>
                <div className="flex items-center gap-2">
                  <button onClick={undoLastMeasurementPoint} disabled={measurePoints.length === 0} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40">Geri Al</button>
                  <button onClick={clearMeasurements} className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <Eraser size={12} /> Temizle
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setMeasureMode("distance")} className={`rounded px-2 py-1 border ${measureMode === "distance" ? "border-[var(--accent-cyan)]" : "border-[var(--border-subtle)]"}`}>Mesafe</button>
                <button onClick={() => setMeasureMode("area")} className={`rounded px-2 py-1 border ${measureMode === "area" ? "border-[var(--accent-cyan)]" : "border-[var(--border-subtle)]"}`}>Alan</button>
                <button onClick={() => setMeasureMode("slope")} className={`rounded px-2 py-1 border ${measureMode === "slope" ? "border-[var(--accent-cyan)]" : "border-[var(--border-subtle)]"}`}>Eğim</button>
                <button onClick={() => setMeasureMode("none")} className={`rounded px-2 py-1 border ${measureMode === "none" ? "border-[var(--accent-cyan)]" : "border-[var(--border-subtle)]"}`}>Kapalı</button>
              </div>
              <p className="text-[var(--text-secondary)]">
                {measureMode === "none"
                  ? "Ölçüm kapalı. Bir mod seçip haritaya tıklayarak başlayın."
                  : "Haritaya tıklayarak ölçüm noktalarını ekleyin."}{" "}
                Nokta sayısı: {measurePoints.length}
              </p>
              <p className="text-[var(--text-secondary)]">Mesafe: <span className="text-[var(--text-primary)]">{formatDistance(measurementDistanceMeters)}</span></p>
              <p className="text-[var(--text-secondary)]">Alan: <span className="text-[var(--text-primary)]">{formatArea(measurementAreaSquareMeters)}</span></p>
              {measureMode === "slope" && (
                <div className="space-y-1.5">
                  <input type="number" value={startElevation} onChange={(event) => setStartElevation(Number(event.target.value))} placeholder="Başlangıç kotu (m)" className="w-full bg-transparent border border-[var(--border-subtle)] rounded px-2 py-1" />
                  <input type="number" value={endElevation} onChange={(event) => setEndElevation(Number(event.target.value))} placeholder="Bitiş kotu (m)" className="w-full bg-transparent border border-[var(--border-subtle)] rounded px-2 py-1" />
                  <p className="text-[var(--text-secondary)]">Eğim: <span className="text-[var(--text-primary)]">{slopePercent.toFixed(2)}%</span></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
