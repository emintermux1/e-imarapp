"use client";

import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import { DataRow } from "@/components/gis/data-card";
import { formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useAskiStore } from "@/stores/aski-store";

export function SectionAski({ parcel }: { parcel: ParcelProps }) {
  const aski = parcel.aski;
  const status = useAskiStore((s) => s.status);
  const message = useAskiStore((s) => s.message);
  const plans = useAskiStore((s) => s.plans);
  const refresh = useAskiStore((s) => s.refresh);

  const liveBox = (
    <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-fg-primary">
            {status === "live" ? `${plans.length} canlı askı planı` : status === "unavailable" ? "Canlı askı erişilemiyor" : "Askı API kontrolü"}
          </p>
          <p className="mt-0.5 text-[11px] text-fg-muted">
            {message ?? "Yenile ile /plans/aski üzerinden canlı planları kontrol edin."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={status === "loading"}
          className="inline-flex h-7 items-center gap-1 rounded-sm border border-border-subtle px-2 text-[11px] text-fg-secondary hover:bg-surface-2 disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Yenile
        </button>
      </div>
      {status === "live" && plans.length > 0 && (
        <div className="mt-2 max-h-24 overflow-auto space-y-1">
          {plans.slice(0, 4).map((plan) => (
            <div key={plan.id} className="flex items-center justify-between gap-2 rounded-sm bg-surface-2 px-2 py-1 text-[11px]">
              <span className="truncate">{plan.plan_type ?? "Askı planı"} #{plan.id}</span>
              <span className="text-fg-muted">{plan.status ?? "canlı"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!aski) {
    return (
      <div className="flex flex-col gap-2">
        {liveBox}
        <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-3 text-center">
          <p className="text-xs text-fg-secondary">Bu parsel için aktif yerel askı bulunmuyor.</p>
          <p className="text-[11px] text-fg-muted mt-1">
            {status === "live" ? "Canlı liste yukarıda; parsel-plan eşleştirmesi bu sprintte özet düzeyde gösterilir." : "Canlı veri yoksa yerel/demo askı gösterilir."}
          </p>
        </div>
      </div>
    );
  }

  const localStatus = aski.durum;
  const remaining = daysUntil(aski.bitis);

  const meta = (() => {
    switch (localStatus) {
      case "askida":
        return {
          label: "Askıda · İtiraz Süresi",
          color: "rgb(var(--status-warning))",
          icon: <AlertTriangle className="h-3.5 w-3.5" />
        };
      case "onaylandi":
        return {
          label: "Onaylandı",
          color: "rgb(var(--status-success))",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />
        };
      case "reddedildi":
        return {
          label: "Reddedildi",
          color: "rgb(var(--status-error))",
          icon: <XCircle className="h-3.5 w-3.5" />
        };
    }
  })();

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center self-start rounded-full border border-border-subtle bg-surface-1 px-2 py-1 text-[11px] text-fg-muted">
        data source: parcels.geo.json (offline demo)
      </div>
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border px-3 py-2"
        )}
        style={{
          borderColor: meta.color,
          backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`
        }}
      >
        <span
          className="inline-flex items-center gap-2 text-xs font-medium"
          style={{ color: meta.color }}
        >
          {meta.icon}
          {meta.label}
        </span>
        {localStatus === "askida" && (
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums"
            style={{ color: meta.color }}
          >
            <CalendarClock className="h-3 w-3" />
            {remaining > 0 ? `${remaining} gün kaldı` : "Süre doldu"}
          </span>
        )}
      </div>
      {liveBox}
      <div className="rounded-md border border-border-subtle bg-surface-2">
        <DataRow label="Askı No" value={aski.askiNo} />
        <DataRow label="Başlangıç" value={formatDate(aski.baslangic)} />
        <DataRow label="Bitiş" value={formatDate(aski.bitis)} />
      </div>
    </div>
  );
}
