"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole, RadioTower } from "lucide-react";
import { getWebsiteLiveReadiness, humanizeApiError } from "@/lib/api/backend-client";
import type { WebsiteLiveReadinessResponse, WebsiteReadinessSource } from "@/types/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function LiveReadinessStrip() {
  const [payload, setPayload] = React.useState<WebsiteLiveReadinessResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getWebsiteLiveReadiness()
      .then((response) => {
        if (!alive) return;
        setPayload(response);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setPayload(null);
        setError(humanizeApiError(err, "Canlı hazırlık endpoint'i okunamadı."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const configured = payload?.deployment.requiredEnv.filter((item) => item.configured).length ?? 0;
  const required = payload?.deployment.requiredEnv.length ?? 3;
  const readySources = payload?.sources.filter((source) => source.status === "verified_live").length ?? 0;
  const metadataSources = payload?.sources.filter((source) => source.status === "public_metadata").length ?? 0;
  const blockedSources = payload?.sources.filter((source) => !["verified_live", "public_metadata"].includes(source.status)).length ?? 0;
  const status = loading ? "loading" : payload?.status ?? "unavailable";

  return (
    <section className="map-glass-shell min-w-[330px] max-w-[520px] rounded-[1.5rem] p-2" aria-busy={loading}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl border", statusClass(status))}>
              {status === "ok" ? <CheckCircle2 className="h-4 w-4" /> : status === "loading" ? <Clock3 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </span>
            <div>
              <div className="section-eyebrow">Canlı hazırlık</div>
              <div className="text-sm font-black text-fg-primary">
                {status === "ok" ? "Ortam hazır" : status === "loading" ? "Kontrol ediliyor" : "Hazır değil"}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="mt-2 space-y-2" aria-hidden>
              <Skeleton className="h-3 w-[88%]" />
              <Skeleton className="h-3 w-[62%]" />
            </div>
          ) : (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-fg-secondary">
              {error ?? `${configured}/${required} ortam değişkeni hazır · ${readySources} doğrulanmış kaynak · ${metadataSources} metadata kaynağı · ${blockedSources} kontrat/erişim bekliyor.`}
            </p>
          )}
        </div>
        <Link
          href="/calisma-alani"
          className="soft-press touch-target shrink-0 rounded-full border border-border-subtle bg-surface-1 px-3 text-[11px] font-bold text-fg-primary hover:bg-white"
        >
          Workspace
        </Link>
      </div>
      {loading ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl border border-border-subtle bg-surface-1/80 px-2 py-1.5">
              <Skeleton className="h-3 w-[70%]" />
              <Skeleton className="mt-1.5 h-2.5 w-[55%]" />
            </div>
          ))}
        </div>
      ) : payload?.sources ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {payload.sources.slice(0, 3).map((source) => (
            <ReadinessMiniSource key={source.sourceId} source={source} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReadinessMiniSource({ source }: { source: WebsiteReadinessSource }) {
  return (
    <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-1/80 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        {source.status === "public_metadata" ? (
          <RadioTower className="h-3 w-3 shrink-0 text-[rgb(var(--accent-blue))]" />
        ) : source.status === "verified_live" ? (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-status-success" />
        ) : (
          <LockKeyhole className="h-3 w-3 shrink-0 text-status-warning" />
        )}
        <span className="truncate text-[10.5px] font-semibold text-fg-primary">{source.sourceName}</span>
      </div>
      <div className="mt-1 truncate text-[9.5px] uppercase tracking-wide text-fg-muted">{sourceLabel(source.status)}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "ok") return "border-status-success/30 bg-status-success/10 text-status-success";
  if (status === "loading") return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
  return "border-status-warning/35 bg-status-warning/12 text-status-warning";
}

function sourceLabel(status: WebsiteReadinessSource["status"]) {
  switch (status) {
    case "verified_live":
      return "doğrulandı";
    case "public_metadata":
      return "metadata";
    case "protected":
    case "requires_credentials":
    case "captcha_required":
      return "korumalı";
    case "method_contract_required":
      return "kontrat";
    case "not_ready":
      return "hazır değil";
    default:
      return status;
  }
}
