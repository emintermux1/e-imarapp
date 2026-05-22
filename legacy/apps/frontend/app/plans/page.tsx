"use client";

import { useState, useEffect } from "react";
import { getPlans, getAskiPlans } from "@/lib/api";
import type { PlanResponse } from "@/lib/types";
import { PlanCard } from "@/components/PlanCard";
import { DataTable } from "@/components/DataTable";
import { Layers } from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [aski, setAski] = useState<PlanResponse[]>([]);
  const [tab, setTab] = useState<"all" | "aski">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getPlans(), getAskiPlans()])
      .then(([p, a]) => {
        setPlans(p.items || []);
        setAski(a.items || []);
      })
      .catch((e) => alert("Planlar yüklenemedi: " + String(e)))
      .finally(() => setLoading(false));
  }, []);

  const items = tab === "all" ? plans : aski;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Layers size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">İmar Planları</h1>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "all" ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
          Tüm Planlar
        </button>
        <button onClick={() => setTab("aski")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "aski" ? "bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)]" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
          Askıda ({aski.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => <PlanCard key={p.id} plan={p} />)}
          </div>
          <DataTable
            columns={[
              { key: "id", header: "ID" },
              { key: "plan_type", header: "Plan Türü" },
              { key: "status", header: "Durum" },
              { key: "aski_start", header: "Askı Başlangıç" },
              { key: "aski_end", header: "Askı Bitiş" },
            ]}
            data={items}
            keyExtractor={(r) => r.id}
          />
        </>
      )}
    </div>
  );
}
