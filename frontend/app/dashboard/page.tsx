"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFavorites, getHistory, getNearby } from "@/lib/api";
import type { NearbyResult } from "@/lib/types";
import { LayoutDashboard, MapPin, Star, Clock } from "lucide-react";

export default function DashboardPage() {
  const [favorites, setFavorites] = useState<Record<string, unknown>[]>([]);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [nearby, setNearby] = useState<NearbyResult[]>([]);
  const [lat, setLat] = useState("41.0082");
  const [lon, setLon] = useState("28.9784");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [f, h] = await Promise.all([getFavorites(), getHistory()]);
      setFavorites(f.items || []);
      setHistory(h.items || []);
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
  };

  const loadNearby = async () => {
    try {
      const res = await getNearby(Number(lat), Number(lon));
      setNearby(res.results || []);
    } catch (e) {
      alert("Yakınımda arama başarısız: " + String(e));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><Star size={16} className="text-yellow-400" /><h2 className="font-semibold">Favoriler</h2></div>
          {favorites.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Henüz favori yok.</p> : (
            <ul className="space-y-2 text-sm">{favorites.map((f, i) => <li key={i} className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2">{JSON.stringify(f) as React.ReactNode}</li>)}</ul>
          )}
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-[var(--accent-cyan)]" /><h2 className="font-semibold">Geçmiş</h2></div>
          {history.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Henüz geçmiş yok.</p> : (
            <ul className="space-y-2 text-sm">{history.map((h, i) => <li key={i} className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2">{JSON.stringify(h)}</li>)}</ul>
          )}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2"><MapPin size={16} className="text-[var(--accent-magenta)]" /><h2 className="font-semibold">Yakınımda Ara</h2></div>
        <div className="flex gap-3">
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Enlem" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-32" />
          <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Boylam" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-32" />
          <button onClick={loadNearby} className="bg-[var(--accent-magenta)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Ara</button>
        </div>
        {nearby.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearby.map((n, i) => (
              <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm">
                <p className="font-medium">Ada {n.ada} / Parsel {n.parsel}</p>
                <p className="text-[var(--text-secondary)]">{Math.round(n.distance_m)} m uzaklıkta</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
