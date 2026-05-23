"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock3, RadioTower } from "lucide-react";
import { getWebsiteLiveReadiness, humanizeApiError } from "@/lib/api/backend-client";
import type { WebsiteLiveReadinessResponse } from "@/types/api";
import { cn } from "@/lib/utils";

export function StatusBanner({ compact = false }: { compact?: boolean }) {
  const [payload, setPayload] = React.useState<WebsiteLiveReadinessResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    getWebsiteLiveReadiness()
      .then((response) => {
        if (!alive) return;
        setPayload(response);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(humanizeApiError(err, "Backend hazırlık durumu okunamadı."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const status = loading ? "loading" : payload?.status === "ok" ? "ok" : "warning";
  const configured = payload?.deployment.requiredEnv.filter((item) => item.configured).length ?? 0;
  const required = payload?.deployment.requiredEnv.length ?? 0;
  const verified = payload?.sources.filter((source) => source.status === "verified_live").length ?? 0;
  const metadata = payload?.sources.filter((source) => source.status === "public_metadata").length ?? 0;

  return (
    <aside className={cn("rounded-[1.65rem] border p-4", toneClass(status), compact && "p-3")}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70">
          {status === "ok" ? <CheckCircle2 className="h-5 w-5" /> : status === "loading" ? <Clock3 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">Backend readiness</p>
          <h3 className="mt-1 text-base font-black text-fg-primary">
            {status === "ok" ? "Ortam okunuyor" : status === "loading" ? "Kontrol ediliyor" : "Eksik/kapalı servis var"}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
            {error ?? (payload ? `${configured}/${required} env hazır · ${verified} canlı doğrulanmış · ${metadata} public metadata kaynağı.` : "Canlı endpoint bekleniyor; UI fallback mesajıyla çalışır.")}
          </p>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["TKGM", "Belediye", "e-Plan"].map((label, index) => (
            <div key={label} className="rounded-2xl border border-white/55 bg-white/45 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-black text-fg-primary">
                <RadioTower className="h-3.5 w-3.5 text-brand-green" />
                {label}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-fg-secondary">
                {payload?.sources[index]?.message ?? "Kaynak sınıfı görünür; korumalı akış uydurulmaz."}
              </p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function toneClass(status: "ok" | "loading" | "warning") {
  if (status === "ok") return "border-status-success/25 bg-status-success/10 text-status-success";
  if (status === "loading") return "border-brand-blue/25 bg-brand-blue/10 text-brand-blue";
  return "border-status-warning/25 bg-status-warning/10 text-status-warning";
}
