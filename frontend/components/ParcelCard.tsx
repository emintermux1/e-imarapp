"use client";

import type { ParcelResponse } from "@/lib/types";
import { MapPin, Ruler, FileText } from "lucide-react";

export function ParcelCard({ parcel }: { parcel: ParcelResponse }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--accent-cyan)]/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Ada {parcel.ada} / Parsel {parcel.parsel}
        </h3>
        <span className="px-2 py-1 rounded-full text-xs bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
          {parcel.nitelik || "Bilinmiyor"}
        </span>
      </div>
      <div className="space-y-2 text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          <span>{parcel.il}{parcel.ilce ? ` / ${parcel.ilce}` : ""}{parcel.mahalle ? ` / ${parcel.mahalle}` : ""}</span>
        </div>
        {parcel.alan_m2 && (
          <div className="flex items-center gap-2">
            <Ruler size={14} />
            <span>{parcel.alan_m2.toLocaleString("tr-TR")} m²</span>
          </div>
        )}
        {parcel.tapu_durumu && (
          <div className="flex items-center gap-2">
            <FileText size={14} />
            <span>{parcel.tapu_durumu}</span>
          </div>
        )}
      </div>
    </div>
  );
}
