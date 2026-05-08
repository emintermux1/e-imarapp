"use client";

import * as React from "react";
import { Clock, Trash2 } from "lucide-react";
import { useHistoryStore } from "@/stores/history-store";
import { useUIStore } from "@/stores/ui-store";

const TAB_LABELS: Record<string, string> = {
  Hepsi: "Hepsi",
  AdaParsel: "Ada/Parsel",
  Koordinat: "Koordinat",
  Adres: "Adres",
  Belediye: "Belediye"
};

export function HistorySection() {
  const items = useHistoryStore((s) => s.items);
  const clear = useHistoryStore((s) => s.clear);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-5 text-center">
        <Clock className="mx-auto h-5 w-5 text-fg-muted/70" />
        <p className="mt-2 text-xs text-fg-secondary">Henüz arama yok.</p>
        <p className="mt-1 text-[11px] text-fg-muted leading-relaxed">
          Cmd/Ctrl + K ile aramayı açabilirsiniz.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-wider text-fg-muted">
          {items.length} kayıt
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-[11px] text-fg-muted hover:text-status-error transition-colors inline-flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Geçmişi Temizle
        </button>
      </div>
      {items.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-surface-1 transition-colors text-left"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-fg-muted">
            <Clock className="h-3 w-3" />
          </span>
          <span className="flex-1 text-xs text-fg-primary truncate">{h.query}</span>
          <span className="text-[10px] uppercase tracking-wider text-fg-muted">
            {TAB_LABELS[h.mode] ?? h.mode}
          </span>
        </button>
      ))}
    </div>
  );
}
