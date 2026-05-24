"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Brain, CheckCircle2, Loader2, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { explainWebsitePlanNote, humanizeApiError } from "@/lib/api/backend-client";
import type { PlanNoteExplainResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const SAMPLE_NOTE =
  "Plan notu: Konut alanlarında TAKS 0.30, KAKS 1.50 olarak uygulanır. Bodrum katlar emsale dahil değildir. Yola terk işlemi tamamlanmadan ruhsat düzenlenemez.";

export default function PlanNotePage() {
  const [noteText, setNoteText] = React.useState(SAMPLE_NOTE);
  const [audience, setAudience] = React.useState<"citizen" | "architect" | "investor">("citizen");
  const [result, setResult] = React.useState<PlanNoteExplainResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function explain() {
    const trimmed = noteText.trim();
    if (!trimmed) {
      setError("Açıklanacak plan notu girin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await explainWebsitePlanNote({
        userReference: "web-cockpit",
        noteText: trimmed,
        audience,
        maxBullets: 6
      });
      setResult(response);
    } catch (err) {
      setResult(null);
      setError(humanizeApiError(err, "Plan notu açıklama endpoint'i şu an kullanılamıyor."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="h-full overflow-auto px-4 pb-10 pt-24 lg:pl-[6.5rem] xl:pl-[21rem]">
        <main className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)]">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_28px_90px_-58px_rgb(var(--accent-navy)/0.8)]">
            <header className="border-b border-border-subtle/80 bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-blue)/0.15),transparent_34%),rgb(var(--surface-1)/0.72)] px-5 py-5">
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-fg-secondary hover:text-fg-primary">
                <ArrowLeft className="h-3.5 w-3.5" />
                Haritaya dön
              </Link>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.10)] text-[rgb(var(--accent-blue))]">
                  <Brain className="h-6 w-6" />
                </span>
                <div>
                  <p className="section-eyebrow">BFF / plan-note-explain</p>
                  <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fg-primary">Plan notu açıklayıcı</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-secondary">
                    Resmî plan notunu sade dile çevirir; sağlayıcı hazır değilse bunu açık durum kartıyla gösterir.
                  </p>
                </div>
              </div>
            </header>

            <div className="grid gap-4 p-5">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">Plan notu metni</span>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={10}
                  className="min-h-[240px] resize-y rounded-2xl border border-border-subtle bg-bg px-4 py-3 text-sm leading-relaxed text-fg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.72)] outline-none placeholder:text-fg-muted"
                />
              </label>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">Hedef dil</span>
                  <select
                    value={audience}
                    onChange={(event) => setAudience(event.target.value as typeof audience)}
                    className="h-10 rounded-full border border-border-subtle bg-bg px-3 text-sm text-fg-primary"
                  >
                    <option value="citizen">Vatandaş</option>
                    <option value="architect">Mimar / plancı</option>
                    <option value="investor">Yatırımcı</option>
                  </select>
                </label>
                <Button onClick={explain} disabled={loading} className="min-w-[180px]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Açıkla
                </Button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <StatusPanel result={result} error={error} loading={loading} />
            <ExplanationPanel result={result} />
          </aside>
        </main>
      </div>
    </AppShell>
  );
}

function StatusPanel({
  result,
  error,
  loading
}: {
  result: PlanNoteExplainResponse | null;
  error: string | null;
  loading: boolean;
}) {
  const status = loading ? "loading" : error ? "unavailable" : result?.status ?? "idle";
  return (
    <section className={cn("rounded-[1.5rem] border p-4", statusTone(status))}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          {status === "ok" ? <CheckCircle2 className="h-5 w-5" /> : status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <TriangleAlert className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-fg-primary">{statusLabel(status)}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
            {error ?? result?.message ?? result?.issue?.message ?? "Açıklama için metni gönderin."}
          </p>
          {result?.provider && (
            <p className="mt-2 text-[11px] text-fg-muted">
              {result.provider} {result.model ? `· ${result.model}` : ""}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ExplanationPanel({ result }: { result: PlanNoteExplainResponse | null }) {
  const explanation = result?.explanation;
  if (!explanation) {
    return (
      <section className="rounded-[1.5rem] border border-border-subtle bg-surface-2/94 p-5">
        <ShieldAlert className="h-5 w-5 text-fg-muted" />
        <h2 className="mt-3 text-base font-black text-fg-primary">Sonuç bekleniyor</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
          Endpoint `requires_credentials`, `provider_error` veya `not_ready` dönerse açıklama uydurulmaz; durum kartı aynen gösterilir.
        </p>
      </section>
    );
  }
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border-subtle bg-surface-2/94 p-5">
      <div>
        <p className="section-eyebrow">Sade özet</p>
        <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-fg-primary">{explanation.plainSummary ?? "Özet dönmedi"}</h2>
      </div>
      <ListBlock title="Maddeler" items={explanation.bullets} />
      <ListBlock title="Riskler" items={explanation.risks} tone="warning" />
      <ListBlock title="Belirsizlikler" items={explanation.uncertainties} tone="muted" />
    </section>
  );
}

function ListBlock({ title, items, tone = "info" }: { title: string; items?: string[]; tone?: "info" | "warning" | "muted" }) {
  const values = items?.filter(Boolean) ?? [];
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1/80 p-3">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">{title}</div>
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-fg-secondary">Kayıt yok.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-fg-secondary">
          {values.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warning" ? "bg-status-warning" : tone === "muted" ? "bg-fg-muted" : "bg-[rgb(var(--accent-blue))]")} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "ok") return "Açıklama hazır";
  if (status === "loading") return "Açıklanıyor";
  if (status === "idle") return "Hazır";
  if (status === "requires_credentials") return "Sağlayıcı anahtarı gerekiyor";
  if (status === "provider_error") return "Sağlayıcı hatası";
  return "Endpoint hazır değil";
}

function statusTone(status: string) {
  if (status === "ok") return "border-status-success/35 bg-status-success/10 text-status-success";
  if (status === "loading") return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
  if (status === "idle") return "border-border-subtle bg-surface-2/94 text-fg-muted";
  return "border-status-warning/35 bg-status-warning/10 text-status-warning";
}
