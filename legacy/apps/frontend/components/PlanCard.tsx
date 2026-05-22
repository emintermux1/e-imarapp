"use client";

import type { PlanResponse } from "@/lib/types";
import { Calendar, FileText, Layers } from "lucide-react";

export function PlanCard({ plan }: { plan: PlanResponse }) {
  const isAski = plan.status === "aski" || plan.aski_start;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--accent-magenta)]/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Plan #{plan.id}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${isAski ? "bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)]" : "bg-emerald-500/10 text-emerald-400"}`}>
          {isAski ? "Askıda" : "Onaylı"}
        </span>
      </div>
      <div className="space-y-2 text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <Layers size={14} />
          <span>{plan.plan_type || "Bilinmiyor"}</span>
        </div>
        {plan.aski_start && (
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>Askı: {plan.aski_start} → {plan.aski_end || "?"}</span>
          </div>
        )}
        {plan.pdf_url && (
          <div className="flex items-center gap-2">
            <FileText size={14} />
            <a href={plan.pdf_url} target="_blank" rel="noreferrer" className="text-[var(--accent-cyan)] hover:underline">PDF</a>
          </div>
        )}
      </div>
    </div>
  );
}
