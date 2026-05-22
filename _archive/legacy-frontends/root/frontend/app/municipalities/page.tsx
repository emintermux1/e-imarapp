"use client";

import { useState, useEffect } from "react";
import { getMunicipalities, discoverMunicipality } from "@/lib/api";
import type { MunicipalityResponse } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { Building2, Radio } from "lucide-react";

export default function MunicipalitiesPage() {
  const [items, setItems] = useState<MunicipalityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMunicipalities()
      .then(setItems)
      .catch((e) => alert("Belediyeler yüklenemedi: " + String(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleDiscover = async (slug: string) => {
    setDiscovering(slug);
    try {
      const res = await discoverMunicipality(slug);
      alert(`${res.name}: ${res.live_endpoints.length} aktif endpoint bulundu`);
    } catch (e) {
      alert("Keşif başarısız: " + String(e));
    } finally {
      setDiscovering(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Building2 size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Belediyeler</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Belediye" },
            { key: "province", header: "İl" },
            { key: "district", header: "İlçe" },
            { key: "type", header: "Tip" },
            {
              key: "slug",
              header: "İşlemler",
              render: (row: MunicipalityResponse) => (
                <button
                  onClick={() => handleDiscover(row.slug)}
                  disabled={discovering === row.slug}
                  className="flex items-center gap-1 text-xs bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] px-2 py-1 rounded hover:bg-[var(--accent-cyan)]/20 transition-colors disabled:opacity-50"
                >
                  <Radio size={12} /> Keşfet
                </button>
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
