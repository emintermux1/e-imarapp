import * as React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Filter, Loader2, MapPinned, RefreshCw, XCircle } from "lucide-react";
import type { ParcelProps } from "@/types/parcel";
import { DataRow } from "@/components/gis/data-card";
import { formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ASKI_POLYGONS, type AskiPolygonFeature } from "@/data/aski-polygons";
import {
  filterAskiRecords,
  formatProvenanceBadge,
  summarizeAskiProvenance
} from "@/lib/aski-tracking";
import { useAskiStore } from "@/stores/aski-store";

const ALL_STATUSES = ["all", "askida", "onaylandi", "reddedildi", "donusum"] as const;

export function SectionAski({ parcel }: { parcel: ParcelProps }) {
  const [municipality, setMunicipality] = React.useState("");
  const [status, setStatus] = React.useState<(typeof ALL_STATUSES)[number]>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const exactParcelMatches = React.useMemo(
    () => ASKI_POLYGONS.filter((record) => record.matchedParcelId === parcel.id),
    [parcel.id]
  );

  const filtered = React.useMemo(
    () =>
      filterAskiRecords(ASKI_POLYGONS, {
        municipality,
        status,
        from,
        to
      }),
    [municipality, status, from, to]
  );

  const hasActiveFilters = Boolean(municipality || status !== "all" || from || to);
  const visible = filtered;
  const provenanceSummary = summarizeAskiProvenance(exactParcelMatches.length > 0 ? exactParcelMatches : ASKI_POLYGONS);
  const uniqueMunicipalities = React.useMemo(
    () =>
      Array.from(new Set(ASKI_POLYGONS.map((record) => record.belediye))).sort((a, b) =>
        a.localeCompare(b, "tr", { sensitivity: "base" })
      ),
    []
  );

  const liveStatus = useAskiStore((s) => s.status);
  const liveMessage = useAskiStore((s) => s.message);
  const livePlans = useAskiStore((s) => s.plans);
  const refreshLivePlans = useAskiStore((s) => s.refresh);
  const aski = parcel.aski;
  const hasKnownMatch = exactParcelMatches.length > 0 || Boolean(aski);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border-subtle bg-surface-1/70 px-3 py-2 text-[11px] text-fg-secondary">
        <div className="flex items-center gap-2 text-fg-primary">
          <MapPinned className="h-3.5 w-3.5 text-fg-muted" />
          <span className="font-medium">Askı workbench</span>
        </div>
        <p className="mt-1 leading-relaxed">
          Bu görünüm map overlay kayıtlarını yerel örnek/türetilmiş provenance ile gösterir; resmi canlı askı verisi olmadığı yerde veri uydurulmaz.
        </p>
        <div className="mt-2 inline-flex items-center rounded-full border border-border-subtle bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
live_sync: {liveStatus} · overlay provenance: örnek/türetilmiş
        </div>
      </div>


      <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-fg-primary">
              {liveStatus === "live" ? `${livePlans.length} canlı askı planı` : liveStatus === "unavailable" ? "Canlı askı erişilemiyor" : "Askı API kontrolü"}
            </p>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              {liveMessage ?? "Yenile ile /plans/aski üzerinden canlı planları kontrol edin."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshLivePlans()}
            disabled={liveStatus === "loading"}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-border-subtle px-2 text-[11px] text-fg-secondary hover:bg-surface-2 disabled:opacity-60"
          >
            {liveStatus === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Yenile
          </button>
        </div>
        {liveStatus === "live" && livePlans.length > 0 && (
          <div className="mt-2 max-h-24 overflow-auto space-y-1">
            {livePlans.slice(0, 4).map((plan) => (
              <div key={plan.id} className="flex items-center justify-between gap-2 rounded-sm bg-surface-2 px-2 py-1 text-[11px]">
                <span className="truncate">{plan.plan_type ?? "Askı planı"} #{plan.id}</span>
                <span className="text-fg-muted">{plan.status ?? "canlı"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 rounded-md border border-border-subtle bg-surface-2 p-3 text-[11px] sm:grid-cols-4">
        <MiniStat label="örnek" value={provenanceSummary.demo.toString()} />
        <MiniStat label="public_metadata" value={provenanceSummary.public_metadata.toString()} />
        <MiniStat label="official" value={provenanceSummary.official.toString()} />
        <MiniStat label="derived" value={provenanceSummary.derived.toString()} />
      </div>

      <div className="grid gap-2 rounded-md border border-border-subtle bg-surface-1/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">Belediye</span>
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none"
          >
            <option value="">Tümü</option>
            {uniqueMunicipalities.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">Plan durumu</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof ALL_STATUSES)[number])}
            className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none"
          >
            <option value="all">Tümü</option>
            <option value="askida">Askıda</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="reddedildi">Reddedildi</option>
            <option value="donusum">Dönüşüm</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">Başlangıç</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">Bitiş</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-2 px-3 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-fg-primary">
          {aski ? <CalendarClock className="h-3.5 w-3.5 text-fg-muted" /> : <AlertTriangle className="h-3.5 w-3.5 text-fg-muted" />}
          {aski ? `Parsel için yerel askı kaydı var · ${aski.durum}` : "Parsel için bilinen askı kaydı yok"}
        </span>
        <span className="text-[11px] text-fg-muted">{visible.length} kayıt</span>
      </div>

      {!hasKnownMatch && exactParcelMatches.length === 0 && (
        <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-2 text-[11px] text-fg-secondary">
          Ada/parsel düzeyinde askı eşleşmesi bulunmadı; aşağıdaki liste genel overlay kayıtlarını gösterir.
        </div>
      )}

      {!hasKnownMatch && (
        <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-3 text-center">
          <p className="text-xs text-fg-secondary">Bu parsel için bilinen askı kaydı eşleşmedi.</p>
          <p className="mt-1 text-[11px] text-fg-muted leading-relaxed">
            Map overlay ve mevcut örnek/türetilmiş kayıtlarda bu ada/parsel için resmi veya sentetik eşleşme bulunmadı.
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-3 text-center">
          <p className="text-xs text-fg-secondary">
            {hasActiveFilters ? "Filtrelere uyan askı kaydı yok." : "Bu parsel için bilinen askı kaydı yok."}
          </p>
          <p className="mt-1 text-[11px] text-fg-muted leading-relaxed">Belediye, plan durumu veya tarih aralığını genişletin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.slice(0, 8).map((record) => (
            <AskiTimelineItem key={record.id} record={record} selected={record.matchedParcelId === parcel.id} />
          ))}
        </div>
      )}

      <div className="rounded-md border border-border-subtle bg-surface-2">
        {aski ? (
          <>
            <DataRow label="Askı No" value={aski.askiNo} />
            <DataRow label="Başlangıç" value={formatDate(aski.baslangic)} />
            <DataRow label="Bitiş" value={formatDate(aski.bitis)} />
          </>
        ) : (
          <>
            <DataRow label="Ada/Parsel" value={`${parcel.ada}/${parcel.parsel}`} />
            <DataRow label="İl / İlçe" value={`${parcel.ilce} / ${parcel.il}`} />
            <DataRow label="Durum" value="Yerel askı verisi yok" />
          </>
        )}
      </div>
    </div>
  );
}

function AskiTimelineItem({ record, selected }: { record: AskiPolygonFeature; selected: boolean }) {
  const remaining = daysUntil(record.bitis);
  const meta = getStatusMeta(record.durum);
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-[12px]",
        selected ? "border-brand-blue bg-brand-blue/5" : "border-border-subtle bg-surface-2"
      )}
      style={{ borderColor: selected ? undefined : meta.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: meta.color }}>
              {meta.icon}
              {meta.label}
            </span>
            <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
              {formatProvenanceBadge(record.provenance)}
            </span>
          </div>
          <div className="mt-1 truncate text-fg-primary">{record.label}</div>
          <div className="mt-0.5 text-[11px] text-fg-muted">
            {record.belediye} · {record.ilceSlug} / {record.ilSlug}
          </div>
        </div>
        {record.durum === "askida" && (
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: meta.color }}>
            {remaining > 0 ? `${remaining} gün` : "Süre doldu"}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-fg-muted">
        <span>{formatDate(record.baslangic)}</span>
        <span>→</span>
        <span>{formatDate(record.bitis)}</span>
        {record.matchedParcelId && <span>· parsel {record.matchedParcelId}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 text-[12px] text-fg-primary">{value}</div>
    </div>
  );
}

function getStatusMeta(status: AskiPolygonFeature["durum"]) {
  switch (status) {
    case "askida":
      return { label: "Askıda", color: "rgb(var(--status-warning))", icon: <AlertTriangle className="h-3.5 w-3.5" /> };
    case "onaylandi":
      return { label: "Onaylandı", color: "rgb(var(--status-success))", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "reddedildi":
      return { label: "Reddedildi", color: "rgb(var(--status-error))", icon: <XCircle className="h-3.5 w-3.5" /> };
    case "donusum":
      return { label: "Dönüşüm", color: "rgb(217,119,6)", icon: <Filter className="h-3.5 w-3.5" /> };
  }
}
