"use client";

import * as React from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, ExternalLink, LockKeyhole, MapPinOff, RadioTower, RefreshCw, TimerReset } from "lucide-react";
import { SourceBadge } from "@/components/gis/source-badge";
import {
  explainMissingData,
  formatQualityTimestamp,
  geometryLabel,
  sourceStatusLabel
} from "@/lib/api/quality-labels";
import { summarizeSourceStatuses, useSourceStore } from "@/stores/source-store";
import { cn } from "@/lib/utils";
import type { DataSourceStatus, SourceQualityRecord } from "@/types/api";

const FEATURED_SLUGS = ["pendik", "ibb", "ankara", "izmir", "cankaya", "besiktas", "kadikoy", "bodrum", "tkgm", "eplan-csb", "tucbs-public-api"];

export function SourceStatusPanel() {
  const sources = useSourceStore((s) => s.sources);
  const health = useSourceStore((s) => s.health);
  const quality = useSourceStore((s) => s.quality);
  const activation = useSourceStore((s) => s.activation);
  const loading = useSourceStore((s) => s.loading || s.healthLoading || s.qualityLoading);
  const error = useSourceStore((s) => s.error);
  const loadSources = useSourceStore((s) => s.loadSources);
  const refreshHealth = useSourceStore((s) => s.refreshHealth);
  const refreshQuality = useSourceStore((s) => s.refreshQuality);
  const refreshActivation = useSourceStore((s) => s.refreshActivation);
  const discover = useSourceStore((s) => s.discover);
  const discoverMunicipalityGis = useSourceStore((s) => s.discoverMunicipalityGis);
  const loadLiveLayers = useSourceStore((s) => s.loadLiveLayers);
  const discoveries = useSourceStore((s) => s.discoveries);

  React.useEffect(() => {
    void loadSources().then(() => {
      void loadLiveLayers();
      void refreshHealth();
      void refreshQuality({ limit: 10 });
      void refreshActivation({ limit: 16 });
    });
  }, [loadSources, loadLiveLayers, refreshHealth, refreshQuality, refreshActivation]);

  const summary = summarizeSourceStatuses(sources, health);
  const rollup = quality?.rollup ?? {};
  const qualitySources = quality?.sources ?? [];
  const featured = qualitySources.length > 0
    ? qualitySources.slice(0, 8)
    : FEATURED_SLUGS.map((slug) => sources.find((source) => source.slug === slug)).filter(Boolean).slice(0, 8);

  function refreshAll(liveCheck = false) {
    void refreshHealth();
    void refreshQuality({ limit: 10, live_check: liveCheck });
    void refreshActivation({ limit: 16, live_check: liveCheck });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-blue)/0.12),transparent_38%),rgb(var(--surface-1)/0.78)] p-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_12px_28px_rgb(0_0_0/0.18)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-primary">
            <Activity className="h-3.5 w-3.5 text-[rgb(var(--accent-blue))]" />
            Canlı veri kalite paneli
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-fg-secondary">
            Neden veri yok sorusunu kaynak, geometri ve son kontrol seviyesinde açıklar; fallback/demo durumları saklanmaz.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => refreshAll(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-bg text-fg-secondary transition-colors hover:text-fg-primary focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            title="Kalite panelini yenile"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={() => refreshAll(true)}
            className="hidden h-8 items-center gap-1 rounded-md border border-brand-blue/35 bg-[rgb(var(--accent-blue)/0.08)] px-2 text-[10px] font-medium text-fg-secondary transition-colors hover:text-fg-primary sm:inline-flex"
            title="Canlı kontrol iste"
          >
            <TimerReset className="h-3 w-3" /> canlı
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
        <Metric label="aktif" value={activation?.summary.active ?? (quality ? Number(rollup.live ?? 0) : summary.live)} tone="live" />
        <Metric label="yedek" value={Number(rollup.fallback ?? 0)} tone="fallback" />
        <Metric label="bloklu" value={activation?.summary.blocked ?? (quality ? Number(rollup.unavailable ?? 0) : summary.blocked + summary.timeout)} tone="blocked" />
        <Metric label="kontrat" value={activation?.summary.needsContract ?? qualitySources.filter((item) => item.geometry_available).length} tone="external" />
      </div>

      <div className="mt-2 rounded-lg border border-border-subtle bg-bg/55 px-2.5 py-2 text-[10.5px] leading-relaxed text-fg-secondary">
        <div className="flex items-start gap-2">
          <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" />
          <span>
            {quality
              ? `${quality.total} kaynak kalite kaydı · ${formatQualityTimestamp(quality.fetched_at)} kontrol.`
              : loading
                ? "Kalite endpoint'i sorgulanıyor…"
                : "Kalite endpoint'i henüz yanıtlamadı; sağlık kayıtları ve portal bağlantıları gösteriliyor."}
            {quality?.history_available === false && " Sağlık geçmişi henüz kalıcı tutulmuyor; grafik uydurulmadı."}
          </span>
        </div>
      </div>

      {activation && (
        <div className="mt-2 rounded-lg border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.06)] px-2.5 py-2">
          <div className="flex items-center justify-between gap-2 text-[10.5px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-fg-primary">
              <RadioTower className="h-3.5 w-3.5 text-[rgb(var(--accent-blue))]" />
              Devlet kaynak aktivasyonu
            </span>
            <span className="text-fg-muted">{activation.summary.total} kayıt</span>
          </div>
          <div className="mt-2 grid gap-1.5">
            {activation.sources.slice(0, 5).map((source) => (
              <div key={source.sourceId} className="rounded-md border border-border-subtle bg-bg/65 px-2 py-1.5">
                <div className="flex items-start gap-2">
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", activationDot(source.activationStatus))} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10.5px] font-semibold text-fg-primary">{source.name}</div>
                    <div className="truncate text-[9.5px] text-fg-muted">{activationLabel(source.activationStatus)} · {source.metadata?.province ?? source.jurisdiction}</div>
                  </div>
                  {source.activationStatus === "blocked" && <LockKeyhole className="h-3.5 w-3.5 text-status-warning" />}
                </div>
                <div className="mt-1 line-clamp-2 text-[9.5px] leading-snug text-fg-secondary">{source.nextAction}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        {featured.map((item) => {
          if (!item) return null;
          if ("source_id" in item) return <QualityRow key={item.source_id} record={item} />;
          const status = health[item.id]?.status ?? (item.requires_approval || item.requires_credentials ? "requires_approval" : "external_only");
          const slug = item.slug ?? item.id;
          const homepageUrl = item.homepage_url ?? item.base_url ?? "#";
          return (
            <div key={item.id} className="rounded-lg border border-border-subtle bg-bg/70 px-2.5 py-2">
              <div className="flex items-start gap-2">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", statusClass(status))} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-semibold text-fg-primary">{item.name}</div>
                  <div className="truncate text-[9.5px] text-fg-muted">{statusLabel(status)}</div>
                </div>
	                <button
	                  type="button"
	                  onClick={() => {
	                    void discover(item.id);
	                    if ((item.kind ?? "").startsWith("municipal")) void discoverMunicipalityGis(slug, true);
	                  }}
	                  className="min-h-7 rounded border border-border-subtle px-1.5 py-1 text-[10px] text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
	                >
	                  Keşfet
	                </button>
	                <a href={homepageUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded border border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary" title="Resmi portalı aç">
	                  <ExternalLink className="h-3 w-3" />
	                </a>
	              </div>
	              <DiscoveryDetails sourceId={item.id} slug={slug} discovery={discoveries[slug] ?? discoveries[item.id]} />
            </div>
          );
        })}
      </div>

      {qualitySources.length === 0 && !loading && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-status-warning/35 bg-status-warning/10 px-2 py-1.5 text-[10.5px] leading-snug text-status-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Kalite satırı yok. Backend kalite endpoint'i kapalıysa kaynak yokluğu uydurulmaz; demo/yedek etiketleri görünür kalır.</span>
        </div>
      )}
      {error && <div className="mt-2 rounded-md border border-amber-300/50 bg-amber-100/40 px-2 py-1.5 text-[10.5px] leading-snug text-amber-900">{error}</div>}
    </div>
  );
}

function QualityRow({ record }: { record: SourceQualityRecord }) {
  const slow = typeof record.latency_ms === "number" && record.latency_ms > 2500;
  const noGeometry = !record.geometry_available;
  return (
    <article className="rounded-lg border border-border-subtle bg-bg/72 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.025)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-semibold text-fg-primary">{record.name}</div>
          <div className="mt-0.5 truncate text-[9.5px] text-fg-muted">
            {[record.municipality_name, record.district, record.provider].filter(Boolean).join(" · ") || record.key}
          </div>
        </div>
        <SourceBadge status={record.status} className="h-4 px-1.5 text-[8px]" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
        <MiniFact icon={<Clock3 className="h-3 w-3" />} label="Kontrol" value={formatQualityTimestamp(record.last_checked_at)} />
        <MiniFact icon={<CheckCircle2 className="h-3 w-3" />} label="Başarı" value={formatQualityTimestamp(record.last_success_at)} />
        <MiniFact label="Gecikme" value={record.latency_ms == null ? "—" : `${record.latency_ms} ms`} warn={slow} />
        <MiniFact label="Geometri" value={geometryLabel(record.geometry_available)} warn={noGeometry} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {slow && <Pill tone="warning">slow</Pill>}
        {record.status === "fallback" && <Pill tone="warning">fallback</Pill>}
        {record.status === "unavailable" && <Pill tone="error">unavailable</Pill>}
        {noGeometry && <Pill tone="warning"><MapPinOff className="h-3 w-3" /> no geometry</Pill>}
        {record.imar_available && <Pill tone="info">imar</Pill>}
        {record.aski_available && <Pill tone="info">askı</Pill>}
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-fg-secondary">{explainMissingData(record)}</p>
      {record.next_action && <p className="mt-1 text-[10px] leading-snug text-fg-muted">Sonraki adım: {record.next_action}</p>}
    </article>
  );
}

function DiscoveryDetails({ sourceId, slug, discovery }: { sourceId: string; slug: string; discovery?: unknown }) {
  if (!discovery) return null;
  const payload: any = discovery;
  const ogc: any = payload?.ogc ?? payload ?? {};
  const status = String(ogc.status ?? payload.status ?? "unknown");
  const layers = Array.isArray(ogc.available_layers) ? (ogc.available_layers as Array<Record<string, unknown>>) : [];
  return (
    <div className="mt-2 rounded-md border border-border-subtle bg-bg/60 px-2 py-1.5 text-[10px] text-fg-secondary">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-fg-primary">OGC keşfi</span>
        <span className="tabular-nums">{status}</span>
      </div>
      <div className="mt-1 truncate text-fg-muted">Katman: {layers.length} · Kaynak: {slug} · {sourceId}</div>
    </div>
  );
}

function MiniFact({ label, value, icon, warn }: { label: string; value: string; icon?: React.ReactNode; warn?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-md border px-2 py-1.5", warn ? "border-status-warning/30 bg-status-warning/10" : "border-border-subtle bg-surface-1/70")}>
      <div className="flex items-center gap-1 text-[8.5px] uppercase tracking-wider text-fg-muted">{icon}{label}</div>
      <div className={cn("mt-0.5 truncate font-medium tabular-nums", warn ? "text-status-warning" : "text-fg-secondary")}>{value}</div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "warning" | "error" | "info" }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[9px] font-medium", tone === "warning" && "border-status-warning/30 bg-status-warning/10 text-status-warning", tone === "error" && "border-status-error/30 bg-status-error/10 text-status-error", tone === "info" && "border-brand-blue/30 bg-[rgb(var(--accent-blue)/0.08)] text-[rgb(var(--accent-blue))]")}>{children}</span>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "live" | "blocked" | "fallback" | "external" }) {
  return (
    <div className={cn("rounded-md border px-1 py-1", tone === "live" && "border-emerald-300/60 bg-emerald-50 text-emerald-800", tone === "blocked" && "border-rose-300/60 bg-rose-50 text-rose-800", tone === "fallback" && "border-amber-300/60 bg-amber-50 text-amber-800", tone === "external" && "border-sky-300/60 bg-sky-50 text-sky-800")}>
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="uppercase tracking-wide opacity-75">{label}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "live") return "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.16)]";
  if (["blocked", "requires_auth", "requires_approval"].includes(status)) return "bg-rose-500";
  if (status === "timeout") return "bg-amber-500";
  return "bg-sky-500";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    live: `${sourceStatusLabel("live")} endpoint bulundu`,
    blocked: "erişim engelli/captcha olabilir",
    timeout: "zaman aşımı",
    requires_auth: "kimlik doğrulama gerekli",
    requires_approval: "yasal/kurumsal onay gerekli",
    external_only: "portal linki hazır",
    not_found: "endpoint bulunamadı"
  };
  return labels[status] ?? status;
}

function activationDot(status: string) {
  if (status === "active") return "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.16)]";
  if (status === "blocked") return "bg-rose-500";
  if (status === "needs_contract") return "bg-amber-500";
  if (status === "metadata_only") return "bg-sky-500";
  return "bg-zinc-400";
}

function activationLabel(status: string) {
  const labels: Record<string, string> = {
    active: "public endpoint aktif",
    blocked: "credential/protokol gerekli",
    needs_contract: "method contract gerekli",
    metadata_only: "metadata aktif",
    unavailable: "erişilemiyor"
  };
  return labels[status] ?? status;
}
