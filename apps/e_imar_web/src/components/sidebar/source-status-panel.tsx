"use client";

import * as React from "react";
import { ExternalLink, Radar, RefreshCw } from "lucide-react";
import { summarizeSourceStatuses, useSourceStore } from "@/stores/source-store";
import { cn } from "@/lib/utils";

const FEATURED_SLUGS = ["pendik", "ibb", "ankara", "izmir", "cankaya", "besiktas", "kadikoy", "bodrum", "tkgm", "eplan-csb", "tucbs-public-api"];

export function SourceStatusPanel() {
  const sources = useSourceStore((s) => s.sources);
  const health = useSourceStore((s) => s.health);
  const loading = useSourceStore((s) => s.loading || s.healthLoading);
  const error = useSourceStore((s) => s.error);
  const loadSources = useSourceStore((s) => s.loadSources);
  const refreshHealth = useSourceStore((s) => s.refreshHealth);
  const discover = useSourceStore((s) => s.discover);
  const discoverMunicipalityGis = useSourceStore((s) => s.discoverMunicipalityGis);
  const loadLiveLayers = useSourceStore((s) => s.loadLiveLayers);
  const activeMapLayers = useSourceStore((s) => s.activeMapLayers);
  const probedLayers = useSourceStore((s) => s.probedLayers);
  const liveLayers = useSourceStore((s) => s.liveLayers);
  const probeLayerCatalog = useSourceStore((s) => s.probeLayerCatalog);
  const activateLiveLayer = useSourceStore((s) => s.activateLiveLayer);
  const deactivateLiveLayer = useSourceStore((s) => s.deactivateLiveLayer);
  const discoveries = useSourceStore((s) => s.discoveries);

  React.useEffect(() => {
    void loadSources().then(() => {
      void loadLiveLayers();
      void refreshHealth();
    });
  }, [loadSources, loadLiveLayers, refreshHealth]);

  const summary = summarizeSourceStatuses(sources, health);
  const featured = FEATURED_SLUGS.map((slug) => sources.find((source) => source.slug === slug)).filter(Boolean).slice(0, 9);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1/70 p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-primary">
            <Radar className="h-3.5 w-3.5 text-sky-600" />
            Canlı Veri Kaynakları
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-fg-secondary">
            Resmi belediye/TKGM/e-Plan/TUCBS bağlantıları ve aday OGC/KEOS uçları seeded; kapalı servisler veri varmış gibi çizilmez.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshHealth()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg text-fg-secondary hover:text-fg-primary"
          title="Canlı durum kontrol et"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
        <Metric label="canlı" value={summary.live} tone="live" />
        <Metric label="blok" value={summary.blocked} tone="blocked" />
        <Metric label="zaman" value={summary.timeout} tone="timeout" />
        <Metric label="portal" value={summary.externalOnly} tone="external" />
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {featured.map((source) => {
          if (!source) return null;
          const status = health[source.id]?.status ?? (source.requires_approval || source.requires_credentials ? "requires_approval" : "external_only");
          const slug = source.slug ?? source.id;
          const homepageUrl = source.homepage_url ?? source.base_url ?? "#";
          const sourceLayers = liveLayers.filter((layer) => layer.source_id === source.id);
          const wmsLayer = sourceLayers.find((layer) => layer.type === "wms");
          const probe = sourceLayers.map((layer) => probedLayers[String(layer.id)]).find(Boolean);
          return (
            <div key={source.id} className="rounded-md border border-border-subtle bg-bg/70 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", statusClass(probe?.status ?? status))} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-fg-primary">{source.name}</div>
                  <div className="truncate text-[9.5px] text-fg-muted">
                    {probe ? `probe: ${statusLabel(probe.status ?? "unknown")} · ${probe.available_layers?.length ?? 0} katman` : statusLabel(status)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void discover(source.id);
                    if ((source.kind ?? "").startsWith("municipal")) void discoverMunicipalityGis(slug, true);
                  }}
                  className="rounded border border-border-subtle px-1.5 py-1 text-[10px] text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
                >
                  Keşfet
                </button>
                <button
                  type="button"
                  disabled={!wmsLayer}
                  onClick={() => {
                    if (wmsLayer) void probeLayerCatalog(source.id, wmsLayer.url);
                  }}
                  className="rounded border border-border-subtle px-1.5 py-1 text-[10px] text-fg-secondary hover:bg-surface-1 hover:text-fg-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Katman
                </button>
                <a
                  href={homepageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
                  title="Resmi portalı aç"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {probe?.available_layers && probe.available_layers.length > 0 && wmsLayer && (
                <div className="mt-1 rounded border border-border-subtle bg-surface-1/60 p-1">
                  <div className="mb-1 text-[9.5px] uppercase tracking-wide text-fg-muted">WMS katmanı seç</div>
                  <div className="max-h-24 space-y-1 overflow-auto pr-1">
                    {probe.available_layers.slice(0, 8).map((layer) => {
                      const layerName = String(layer.name ?? "");
                      if (!layerName) return null;
                      return (
                        <button
                          key={layerName}
                          type="button"
                          onClick={() => void activateLiveLayer(source.id, wmsLayer.url, layerName)}
                          className="block w-full truncate rounded border border-border-subtle bg-bg/80 px-1.5 py-1 text-left text-[10px] text-fg-secondary hover:bg-emerald-50 hover:text-emerald-900"
                          title={String(layer.title ?? layerName)}
                        >
                          {String(layer.title ?? layerName)}
                        </button>
                      );
                    })}
                  </div>
                  {probe.cache?.status && <div className="mt-1 text-[9px] text-fg-muted">Cache: {probe.cache.status}</div>}
                </div>
              )}
              <DiscoveryDetails sourceId={source.id} slug={slug} discovery={discoveries[slug] ?? discoveries[source.id]} />
            </div>
          );
        })}
      </div>

      {activeMapLayers.length > 0 && (
        <div className="mt-2 rounded-md border border-emerald-300/50 bg-emerald-50/70 px-2 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Haritada açık WMS</div>
          <div className="mt-1 flex flex-col gap-1">
            {activeMapLayers.map((layer) => (
              <div key={String(layer.id)} className="flex items-center gap-2 text-[10.5px] text-emerald-950">
                <span className="min-w-0 flex-1 truncate">{layer.name ?? layer.title ?? layer.source_id}</span>
                <button
                  type="button"
                  onClick={() => deactivateLiveLayer(layer.id)}
                  className="rounded border border-emerald-300/70 bg-white/70 px-1.5 py-0.5 text-[10px] text-emerald-900 hover:bg-white"
                >
                  Kapat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="mt-2 rounded-md border border-amber-300/50 bg-amber-100/40 px-2 py-1.5 text-[10.5px] leading-snug text-amber-900">{error}</div>}
    </div>
  );
}

function DiscoveryDetails({
  sourceId,
  slug,
  discovery
}: {
  sourceId: string;
  slug: string;
  discovery?: unknown;
}) {
  if (!discovery) return null;
  const payload: any = discovery;
  const ogc: any = payload?.ogc ?? payload ?? {};
  const status = String(ogc.status ?? payload.status ?? "unknown");
  const wmsUrl = String(ogc.wms_url ?? payload.wms_url ?? "-");
  const wfsUrl = String(ogc.wfs_url ?? payload.wfs_url ?? "-");
  const discoveredAt = String(ogc.discovered_at ?? payload.discovered_at ?? "-");
  const refreshAfter = String(ogc.refresh_after ?? payload.refresh_after ?? "-");
  const layers = Array.isArray(ogc.available_layers) ? (ogc.available_layers as Array<Record<string, unknown>>) : [];
  const supportedSrs = Array.isArray(ogc.supported_srs) ? (ogc.supported_srs as string[]) : [];
  const supportedFormats = Array.isArray(ogc.supported_formats) ? (ogc.supported_formats as string[]) : [];
  const keyLayers = layers
    .map((layer) => String(layer.name ?? layer.title ?? ""))
    .filter((name) => /IMAR_DURUMU|PARS|PLAN_PAFTA|SIT_ALANI|imar|parsel|plan|pafta|sit/i.test(name))
    .slice(0, 4);

  return (
    <div className="mt-1 rounded-md border border-border-subtle bg-bg/60 px-2 py-1.5 text-[10px] text-fg-secondary">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-fg-primary">OGC keşfi</span>
        <span className="tabular-nums">{status}</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
        <Row label="WMS" value={wmsUrl} />
        <Row label="WFS" value={wfsUrl} />
        <Row label="Katman" value={`${layers.length}`} />
        <Row label="SRS" value={supportedSrs.slice(0, 3).join(", ") || "-"} />
        <Row label="Format" value={supportedFormats.slice(0, 2).join(", ") || "-"} />
        <Row label="Cache" value={`${discoveredAt} / ${refreshAfter}`} />
      </div>
      {keyLayers.length > 0 && <div className="mt-1 truncate text-[10px] text-fg-muted">Önemli katmanlar: {keyLayers.join(", ")}</div>}
      <div className="mt-1 truncate text-[10px] text-fg-muted">Kaynak: {slug} · {sourceId}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="mr-1 text-fg-muted">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "live" | "blocked" | "timeout" | "external" }) {
  return (
    <div className={cn("rounded-md border px-1 py-1", tone === "live" && "border-emerald-300/60 bg-emerald-50 text-emerald-800", tone === "blocked" && "border-rose-300/60 bg-rose-50 text-rose-800", tone === "timeout" && "border-amber-300/60 bg-amber-50 text-amber-800", tone === "external" && "border-sky-300/60 bg-sky-50 text-sky-800")}>
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
    live: "canlı endpoint bulundu",
    blocked: "erişim engelli/captcha olabilir",
    timeout: "zaman aşımı",
    requires_auth: "kimlik doğrulama gerekli",
    requires_approval: "yasal/kurumsal onay gerekli",
    external_only: "portal linki hazır",
    not_found: "endpoint bulunamadı"
  };
  return labels[status] ?? status;
}
