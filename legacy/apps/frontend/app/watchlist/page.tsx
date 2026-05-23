"use client";

import { useState, useEffect } from "react";
import { getFavorites, getWatchlist, addWatchlist, deleteWatchlist, saveFavorite } from "@/lib/api";
import type { WatchlistItemResponse } from "@/lib/types";
import { NativeMapCanvas } from "@/components/NativeMapCanvas";
import { Bell, Trash2, Plus, Star } from "lucide-react";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItemResponse[]>([]);
  const [favorites, setFavorites] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [newParcelId, setNewParcelId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [status, setStatus] = useState("Parsel ID girip hem alarm listesine hem favorilere kaydedebilirsiniz.");
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [watchlistRes, favoritesRes] = await Promise.allSettled([getWatchlist(), getFavorites()]);
      if (watchlistRes.status === "fulfilled") setItems(watchlistRes.value);
      if (favoritesRes.status === "fulfilled") setFavorites(favoritesRes.value.items);
      if (watchlistRes.status === "rejected" && favoritesRes.status === "rejected") {
        setStatus("Kullanıcı veri servisleri cevap vermedi; giriş/API bağlantısını kontrol edin.");
      } else {
        setStatus("Kayıtlı parsel ve favoriler güncellendi.");
      }
    } catch (e) {
      setStatus("Liste yüklenemedi: " + String(e));
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
      setStatus("Parsel alarm listesine eklendi.");
      load();
    } catch (e) {
      setStatus("Alarm listesine eklenemedi: " + String(e));
    }
  };

  const handleSaveFavorite = async (parcelId = Number(newParcelId || 125418), label = newLabel || "Kadıköy 1254 / 18") => {
    setFavoriteBusy(true);
    try {
      await saveFavorite("parcel", parcelId, label);
      setStatus("Parsel favorilere kaydedildi.");
      await load();
    } catch (e) {
      setStatus("Favori kaydedilemedi: " + String(e));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWatchlist(id);
      setStatus("Parsel alarm listesinden silindi.");
      load();
    } catch (e) {
      setStatus("Silinemedi: " + String(e));
    }
  };

  return (
    <div className="-mx-4 -my-4 min-h-[calc(100dvh-3.5rem)] space-y-4 bg-[#f6f1e6] p-4 text-[#17231f] md:-mx-8 md:-my-8 md:min-h-[100dvh] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[#087d7f]" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.05em]">Parsel Alarm ve Favoriler</h1>
            <p className="text-sm text-[#65726b]">{status}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <NativeMapCanvas mode="map" compact onFavorite={() => handleSaveFavorite()} favoriteBusy={favoriteBusy} status="Favori yıldızı aktif; API yanıtı gelmezse kullanıcıya açık hata mesajı verilir." />
        <div className="space-y-4">
          <div className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-5 shadow-[0_16px_42px_rgba(37,48,42,0.12)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#17231f]">
              <Plus className="h-4 w-4 text-[#087d7f]" />
              Yeni kayıt
            </div>
            <div className="space-y-3">
              <input value={newParcelId} onChange={(e) => setNewParcelId(e.target.value)} placeholder="Parsel ID" className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Etiket (opsiyonel)" className="w-full rounded-2xl border border-[#d7d0bc]/85 bg-white px-3 py-2 text-sm outline-none focus:border-[#087d7f]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={handleAdd} disabled={!newParcelId} className="rounded-full bg-[#17231f] px-4 py-2.5 text-sm font-extrabold text-[#fffaf0] disabled:opacity-50">Alarm kur</button>
                <button onClick={() => handleSaveFavorite()} disabled={favoriteBusy} className="rounded-full border border-[#d7d0bc]/85 bg-white px-4 py-2.5 text-sm font-extrabold text-[#17231f] disabled:opacity-50"><Star className="mr-1 inline h-4 w-4" /> Favori</button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-5 shadow-[0_16px_42px_rgba(37,48,42,0.12)]">
            <h2 className="mb-3 text-sm font-extrabold">Alarm listesi</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#087d7f] border-t-transparent" /></div>
            ) : (
              <div className="space-y-2">
                {items.length === 0 ? <p className="rounded-2xl border border-dashed border-[#d7d0bc]/85 p-4 text-sm text-[#65726b]">Henüz kayıtlı alarm yok.</p> : null}
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#d7d0bc]/85 bg-white p-3 text-sm">
                    <div>
                      <p className="font-extrabold">Parsel {item.parcel_id ?? "—"}</p>
                      <p className="text-xs text-[#65726b]">{item.label || "Etiket yok"} · {(item.notification_channels || []).join(", ") || "Bildirim kanalı yok"}</p>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="rounded-full p-2 text-red-700 hover:bg-red-50" aria-label="Alarmı sil"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-5 shadow-[0_16px_42px_rgba(37,48,42,0.12)]">
            <h2 className="mb-3 text-sm font-extrabold">Favoriler</h2>
            <div className="space-y-2">
              {favorites.length === 0 ? <p className="rounded-2xl border border-dashed border-[#d7d0bc]/85 p-4 text-sm text-[#65726b]">Henüz kayıtlı favori yok.</p> : null}
              {favorites.map((favorite, index) => (
                <div key={`${String(favorite.item_id ?? favorite.id ?? index)}`} className="rounded-2xl border border-[#d7d0bc]/85 bg-white p-3 text-sm">
                  <p className="font-extrabold">{String(favorite.label ?? favorite.item_type ?? "Favori parsel")}</p>
                  <p className="text-xs text-[#65726b]">ID: {String(favorite.item_id ?? favorite.id ?? "—")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
