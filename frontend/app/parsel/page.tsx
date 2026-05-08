"use client";

import { useState } from "react";
import { searchParcel, searchParcelQuery } from "@/lib/api";
import type { ParcelResponse } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { ParcelCard } from "@/components/ParcelCard";
import { DataTable } from "@/components/DataTable";
import { Search } from "lucide-react";

export default function ParselPage() {
  const [query, setQuery] = useState("");
  const [ada, setAda] = useState("");
  const [parsel, setParsel] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [results, setResults] = useState<ParcelResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        const res = await searchParcelQuery(query);
        setResults(res);
      } else {
        const res = await searchParcel({ ada, parsel, il, ilce });
        setResults(res.items || []);
      }
    } catch (e) {
      alert("Arama başarısız: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Search size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Parsel Ara</h1>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
        <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} placeholder="Genel arama (ada, parsel, adres)..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input value={ada} onChange={(e) => setAda(e.target.value)} placeholder="Ada" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <input value={parsel} onChange={(e) => setParsel(e.target.value)} placeholder="Parsel" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <input value={il} onChange={(e) => setIl(e.target.value)} placeholder="İl" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
          <input value={ilce} onChange={(e) => setIlce(e.target.value)} placeholder="İlçe" className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={handleSearch} disabled={loading} className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg px-5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Aranıyor..." : "Ara"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sonuçlar ({results.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => <ParcelCard key={p.id} parcel={p} />)}
          </div>
          <DataTable
            columns={[
              { key: "id", header: "ID" },
              { key: "ada", header: "Ada" },
              { key: "parsel", header: "Parsel" },
              { key: "il", header: "İl" },
              { key: "ilce", header: "İlçe" },
              { key: "alan_m2", header: "Alan (m²)" },
              { key: "tapu_durumu", header: "Tapu" },
            ]}
            data={results}
            keyExtractor={(r) => r.id}
          />
        </div>
      )}
    </div>
  );
}
