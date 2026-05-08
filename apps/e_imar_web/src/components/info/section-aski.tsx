import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import { DataRow } from "@/components/gis/data-card";
import { formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export function SectionAski({ parcel }: { parcel: ParcelProps }) {
  const aski = parcel.aski;

  if (!aski) {
    return (
      <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-3 text-center">
        <p className="text-xs text-fg-secondary">Bu parsel için aktif askı bulunmuyor.</p>
        <p className="text-[11px] text-fg-muted mt-1">Son onaylanan plan üzerinden işlem yapılır.</p>
      </div>
    );
  }

  const status = aski.durum;
  const remaining = daysUntil(aski.bitis);

  const meta = (() => {
    switch (status) {
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
        {status === "askida" && (
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums"
            style={{ color: meta.color }}
          >
            <CalendarClock className="h-3 w-3" />
            {remaining > 0 ? `${remaining} gün kaldı` : "Süre doldu"}
          </span>
        )}
      </div>
      <div className="rounded-md border border-border-subtle bg-surface-2">
        <DataRow label="Askı No" value={aski.askiNo} />
        <DataRow label="Başlangıç" value={formatDate(aski.baslangic)} />
        <DataRow label="Bitiş" value={formatDate(aski.bitis)} />
      </div>
    </div>
  );
}
