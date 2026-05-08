"use client";

import { useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { getMapLayers } from "@/lib/api";
import { Layers, RefreshCw } from "lucide-react";

export default function MapPage() {
  const [layers, setLayers] = useState<{ name: string; title?: string }[]>([]);
  const [wmsUrl, setWmsUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="h-[calc(100vh-4rem)] -mx-6 -my-6 md:-mx-8 md:-my-8 flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[var(--accent-cyan)]" />
          <h1 className="text-lg font-semibold">Harita</h1>
        </div>
        <button onClick={loadLayers} disabled={loading} className="flex items-center gap-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Katmanları Yükle
        </button>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1">
          <MapViewer center={[28.9784, 41.0082]} zoom={12} wmsUrl={wmsUrl} wmsLayer={layers[0]?.name} />
        </div>

        {layers.length > 0 && (
          <div className="w-64 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-y-auto p-4">
            <h2 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">WMS/WFS Katmanları</h2>
            <div className="space-y-2">
              {layers.map((l) => (
                <div key={l.name} className="text-xs bg-[var(--bg-elevated)] rounded-lg px-3 py-2 border border-[var(--border-subtle)]">
                  <p className="font-medium text-[var(--text-primary)]">{l.title || l.name}</p>
                  <p className="text-[var(--text-secondary)] mt-0.5">{l.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
