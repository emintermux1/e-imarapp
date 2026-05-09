"use client";

import * as React from "react";
import { ExternalLink, Radar, RefreshCw } from "lucide-react";
import { summarizeSourceStatuses, useSourceStore } from "@/stores/source-store";
import { cn } from "@/lib/utils";

const FEATURED_SLUGS = ["pendik", "ibb", "ankara", "izmir", "cankaya", "tkgm", "eplan-csb", "tucbs-public-api"];

export function SourceStatusPanel() {
  const sources = useSourceStore((s) => s.sources);
  const health = useSourceStore((s) => s.health);
  const loading = useSourceStore((s) => s.loading || s.healthLoading);
  const error = useSourceStore((s) => s.error);
  const loadSources = useSourceStore((s) => s.loadSources);
  const refreshHealth = useSourceStore((s) => s.refreshHealth);
  const discover = useSourceStore((s) => s.discover);
  const loadLiveLayers = useSourceStore((s) => s.loadLiveLayers);

  React.useEffect(() => {
    void loadSources().then(() => {
      void loadLiveLayers();
      void refreshHealth();
    });
  }, [loadSources, loadLiveLayers, refreshHealth]);

  const summary = summarizeSourceStatuses(sources, health);
  const featured = FEATURED_SLUGS.map((slug) => sources.find((source) => source.slug === slug)).filter(Boolean).slice(0, 8);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1/70 p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-primary">
            <Radar className="h-3.5 w-3.5 text-sky-600" />
            Canlı Veri Kaynakları
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-fg-secondary">
            Resmi belediye/TKGM/e-Plan/TUCBS bağlantıları seeded; kapalı servisler demo katmanla etiketlenir.
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
          const status = health[source.id]?.status ?? (source.requires_approval ? "requires_approval" : "external_only");
          return (
            <div key={source.id} className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg/70 px-2 py-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", statusClass(status))} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-fg-primary">{source.name}</div>
                <div className="truncate text-[9.5px] text-fg-muted">{statusLabel(status)}</div>
              </div>
              <button
                type="button"
                onClick={() => void discover(source.id)}
                className="rounded border border-border-subtle px-1.5 py-1 text-[10px] text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
              >
                Keşfet
              </button>
              <a
                href={source.homepage_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-fg-secondary hover:bg-surface-1 hover:text-fg-primary"
                title="Resmi portalı aç"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          );
        })}
      </div>

      {error && <div className="mt-2 rounded-md border border-amber-300/50 bg-amber-100/40 px-2 py-1.5 text-[10.5px] leading-snug text-amber-900">{error}</div>}
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
