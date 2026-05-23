"use client";

import * as React from "react";
import { Crosshair, LocateFixed, SearchCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findStructuredParcel, parseCoordinateQuery, structuredParcelLabel } from "@/lib/search/mvp-query";
import { runWebsiteParcelWorkflow } from "@/lib/api/backend-client";
import { getPolygonCentroid } from "@/data/location-navigation";
import { useHistoryStore } from "@/stores/history-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type FormState = {
  il: string;
  ilce: string;
  mahalle: string;
  ada: string;
  parsel: string;
  coordinate: string;
};

const DEFAULT_FORM: FormState = {
  il: "",
  ilce: "",
  mahalle: "",
  ada: "",
  parsel: "",
  coordinate: ""
};

export function ParcelMvpQueryPanel() {
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [status, setStatus] = React.useState<{ tone: "success" | "warning" | "muted"; message: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const pushHistory = useHistoryStore((s) => s.push);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitParcel(event: React.FormEvent) {
    event.preventDefault();
    const query = { il: form.il, ilce: form.ilce, mahalle: form.mahalle, ada: form.ada, parsel: form.parsel };
    const label = structuredParcelLabel(query);
    const local = findStructuredParcel(query);
    pushHistory({ query: label || `${form.ada}/${form.parsel}`, mode: "AdaParsel", resultCount: local ? 1 : 0 });
    if (local) {
      const center = local.properties.centroid ?? getPolygonCentroid(local);
      setSelectedArea(null);
      setSelectedPoint(null);
      setSelectedParcelId(local.properties.id);
      setRightPanelOpen(true);
      if (center) flyTo({ center, zoom: 16, parcelId: local.properties.id });
      setStatus({ tone: "success", message: `${label} haritada seçildi; sağ kartta imar, TAKS/KAKS, plan notu ve kaynak güveni açıldı.` });
      return;
    }

    setLoading(true);
    try {
      const workflow = await runWebsiteParcelWorkflow({
        query: {
          type: "ada_parsel",
          ada: form.ada,
          parselNo: form.parsel,
          province: form.il,
          district: form.ilce,
          mahalle: form.mahalle
        }
      });
      const resultCount = typeof workflow.parcelQuery?.count === "number" ? workflow.parcelQuery.count : 0;
      setStatus({
        tone: resultCount > 0 ? "success" : "warning",
        message: resultCount > 0
          ? "BFF ada/parsel sonucu döndü; geometri varsa haritada normalize edilecek."
          : "Bu ada/parsel için canlı geometri dönmedi; belediye connector discovery veya kaynak anlaşması gerekiyor."
      });
    } catch {
      setStatus({ tone: "warning", message: "Canlı BFF ulaşılamıyor; production'da örnek veri fallback kapalı kalır ve sonuç unavailable görünür." });
    } finally {
      setLoading(false);
    }
  }

  function submitCoordinate(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseCoordinateQuery(form.coordinate);
    if (!parsed) {
      setStatus({ tone: "warning", message: "Koordinat WGS84 formatında ve Türkiye sınırları içinde olmalı. Örn. 41.04321, 29.00821" });
      return;
    }
    setSelectedArea(null);
    setSelectedParcelId(null);
    setSelectedPoint({ lat: parsed.lat, lng: parsed.lng, source: "search" });
    setRightPanelOpen(true);
    flyTo({ center: [parsed.lng, parsed.lat], zoom: 16 });
    pushHistory({ query: form.coordinate, mode: "Koordinat", resultCount: 1 });
    setStatus({ tone: "success", message: "Koordinat haritada odaklandı; sağ panel en yakın parsel/kaynak durumunu unavailable ise açıkça gösterir." });
  }

  return (
    <div className="grid gap-2 rounded-[1.15rem] border border-border-subtle bg-surface-1/70 p-2">
      <form onSubmit={submitParcel} className="grid gap-2 lg:grid-cols-[1fr_1fr_1fr_74px_74px_auto]">
        <QueryInput label="İl" value={form.il} onChange={(value) => update("il", value)} placeholder="İstanbul" />
        <QueryInput label="İlçe" value={form.ilce} onChange={(value) => update("ilce", value)} placeholder="Pendik" />
        <QueryInput label="Mahalle" value={form.mahalle} onChange={(value) => update("mahalle", value)} placeholder="Mahalle" />
        <QueryInput label="Ada" value={form.ada} onChange={(value) => update("ada", value)} placeholder="1234" required />
        <QueryInput label="Parsel" value={form.parsel} onChange={(value) => update("parsel", value)} placeholder="2" required />
        <Button type="submit" size="sm" disabled={loading} className="self-end">
          <SearchCheck className="h-3.5 w-3.5" />
          Seç
        </Button>
      </form>
      <form onSubmit={submitCoordinate} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <QueryInput label="Koordinat sorgu" value={form.coordinate} onChange={(value) => update("coordinate", value)} placeholder="41.04321, 29.00821" />
        <Button type="submit" size="sm" variant="outline" className="self-end">
          <LocateFixed className="h-3.5 w-3.5" />
          Git
        </Button>
      </form>
      {status && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed",
            status.tone === "success" && "border-status-success/30 bg-status-success/10 text-status-success",
            status.tone === "warning" && "border-status-warning/30 bg-status-warning/10 text-status-warning",
            status.tone === "muted" && "border-border-subtle bg-surface-2 text-fg-muted"
          )}
        >
          {status.tone === "warning" ? <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}

function QueryInput({
  label,
  value,
  onChange,
  placeholder,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-fg-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-9 rounded-xl border border-border-subtle bg-bg px-3 text-xs font-semibold text-fg-primary outline-none transition focus:border-brand-green/60"
      />
    </label>
  );
}
