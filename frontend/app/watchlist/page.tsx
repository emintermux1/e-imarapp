"use client";

import { useState, useEffect } from "react";
import { getWatchlist, addWatchlist, deleteWatchlist } from "@/lib/api";
import type { WatchlistItemResponse } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { Bell, Trash2, Plus } from "lucide-react";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [newParcelId, setNewParcelId] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getWatchlist();
      setItems(res);
    } catch (e) {
      alert("Yüklenemedi: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newParcelId) return;
    try {
      await addWatchlist({ parcel_id: Number(newParcelId), label: newLabel || undefined });
      setNewParcelId(""); setNewLabel("");
      load();
    } catch (e) {
      alert("Eklenemedi: " + String(e));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWatchlist(id);
      load();
    } catch (e) {
      alert("Silinemedi: " + String(e));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Bell size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">İzleme Listesi</h1>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 flex gap-3">
        <input value={newParcelId} onChange={(e) => setNewParcelId(e.target.value)} placeholder="Parsel ID" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-32" />
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Etiket (opsiyonel)" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm flex-1" />
        <button onClick={handleAdd} className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"><Plus size={16} /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "parcel_id", header: "Parsel ID" },
            { key: "label", header: "Etiket" },
            { key: "notification_channels", header: "Bildirimler", render: (r) => (r.notification_channels || []).join(", ") },
            {
              key: "id",
              header: "",
              render: (r: WatchlistItemResponse) => (
                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              ),
            },
          ]}
          data={items}
          keyExtractor={(r) => r.id}
        />
      )}
    </div>
  );
}
