"use client";

import * as React from "react";
import Link from "next/link";
import { Database, ExternalLink, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useSourceDetail, useSourceHealth, useSources } from "@/lib/api/hooks";
import { reprobeSource } from "@/lib/api/eimar";
import type { SourceDetailResponse, SourceEntry } from "@/lib/api/types";

const CATEGORY_LABELS: Record<string, string> = {
  central: "Merkezi",
  metropolitan: "Büyükşehir",
  municipal: "Belediye",
  "municipal-gis": "Belediye CBS",
  municipal_gis: "Belediye CBS",
  parcel: "Parsel",
  plan: "Plan",
  open_data: "Açık veri",
  address: "Adres",
  catalog: "Katalog",
  document: "Doküman",
};

export default function KaynaklarPage() {
  const sourcesQuery = useSources();
  const healthQuery = useSourceHealth();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("all");
  const detailQuery = useSourceDetail(selectedId);
  const sources = React.useMemo(
    () => (sourcesQuery.data?.ok ? sourcesQuery.data.data.sources : []),
    [sourcesQuery.data]
  );
  const visibleSources = React.useMemo(
    () => sources.filter((src) => category === "all" || src.category === category),
    [category, sources]
  );
  const categories = React.useMemo(
    () => Array.from(new Set(sources.map((src) => src.category).filter(Boolean))).sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "tr")),
    [sources]
  );
  const healthMap = React.useMemo(() => {
    if (!healthQuery.data?.ok) return new Map<string, Record<string, unknown>>();
    return new Map(healthQuery.data.data.sources.map((src) => [src.id, src]));
  }, [healthQuery.data]);

  return (
    <AppShell>
      <div className="h-full overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1600px] gap-4 px-4 pb-4 pt-20 lg:pl-24 lg:pt-24">
          <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface-2">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <div>
                <h1 className="text-lg font-semibold text-fg-primary">Veri Kaynakları</h1>
                <p className="text-sm text-fg-secondary">Gerçek kaynak registry + canlı probe durumu</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 rounded-md border border-border-subtle bg-bg px-3 text-sm"
                >
                  <option value="all">Tüm kategoriler</option>
                  {categories.map((key) => (
                    <option key={key} value={key}>{categoryLabel(key)}</option>
                  ))}
                </select>
                <Link href="/" className="inline-flex h-9 items-center rounded-md border border-border-subtle px-3 text-sm hover:bg-surface-1">Haritaya dön</Link>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-2">
                  <tr className="border-b border-border-subtle text-fg-secondary">
                    <th className="px-4 py-3">Kaynak</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Sağlayıcı</th>
                    <th className="px-4 py-3">Auth</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {sourcesQuery.isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-secondary">
                        Kaynak registry yükleniyor…
                      </td>
                    </tr>
                  )}
                  {!sourcesQuery.isLoading && visibleSources.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-secondary">
                        Bu filtrede gösterilecek kaynak yok.
                      </td>
                    </tr>
                  )}
                  {visibleSources.map((src) => {
                    const probe = healthMap.get(src.id) as Record<string, unknown> | undefined;
                    const endpointCount = Array.isArray(probe?.discovered_endpoints) ? probe?.discovered_endpoints.length : 0;
                    return (
                      <tr
                        key={src.id}
                        className={`cursor-pointer border-b border-border-subtle hover:bg-surface-1/60 ${selectedId === src.id ? "bg-brand-green/5" : ""}`}
                        onClick={() => setSelectedId(src.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-fg-primary">{src.name}</div>
                          <div className="text-xs text-fg-muted">{src.id}</div>
                        </td>
                        <td className="px-4 py-3">{categoryLabel(src.category)}</td>
                        <td className="px-4 py-3">{src.provider}</td>
                        <td className="px-4 py-3"><Badge tone="neutral">{src.auth}</Badge></td>
                        <td className="px-4 py-3"><StatusBadge status={String(probe?.status ?? "unknown")} /></td>
                        <td className="px-4 py-3">{endpointCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="hidden w-[380px] shrink-0 overflow-auto rounded-xl border border-border-subtle bg-surface-2 lg:block">
            <div className="border-b border-border-subtle px-4 py-3">
              <h2 className="font-medium text-fg-primary">Kaynak detayı</h2>
            </div>
            <div className="p-4">
              {!selectedId ? (
                <EmptyPanel />
              ) : detailQuery.isLoading ? (
                <p className="text-sm text-fg-secondary">Yükleniyor…</p>
              ) : !detailQuery.data?.ok ? (
                <p className="text-sm text-red-600">Detay okunamadı.</p>
              ) : (
                <DetailPanel detail={detailQuery.data.data} onReprobe={() => reprobeSource(selectedId)} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function DetailPanel({ detail, onReprobe }: { detail: SourceDetailResponse; onReprobe: () => ReturnType<typeof reprobeSource> }) {
  const [probeState, setProbeState] = React.useState<"idle" | "running" | "ok" | "error">("idle");
  const [probeMessage, setProbeMessage] = React.useState<string | null>(null);
  const endpoints = Array.isArray(detail.probe.discovered_endpoints) ? (detail.probe.discovered_endpoints as string[]) : [];
  const latency = typeof detail.probe.latency_ms === "number" ? `${Math.round(detail.probe.latency_ms)} ms` : "—";
  const httpStatus = typeof detail.probe.http_status === "number" ? String(detail.probe.http_status) : "—";
  const capabilities = detail.source.capabilities ?? [];
  async function handleReprobe() {
    setProbeState("running");
    setProbeMessage(null);
    const result = await onReprobe();
    if (result?.ok) {
      setProbeState("ok");
      setProbeMessage("Probe isteği tamamlandı; sonuçlar bir sonraki yenilemede güncellenir.");
    } else {
      setProbeState("error");
      setProbeMessage(result?.error ?? "Probe isteği tamamlanamadı.");
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fg-primary">{detail.source.name}</h3>
          <p className="mt-1 text-xs text-fg-muted">{detail.source.id}</p>
        </div>
        <button
          onClick={handleReprobe}
          disabled={probeState === "running"}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle px-2 text-xs hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${probeState === "running" ? "animate-spin" : ""}`} /> {probeState === "running" ? "Probe…" : "Yeniden probe"}
        </button>
      </div>
      {probeMessage && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${probeState === "ok" ? "border-green-200 bg-green-50 text-green-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {probeMessage}
        </div>
      )}
      <div className="rounded-lg border border-border-subtle bg-bg p-3 text-sm">
        <div className="mb-2 flex items-center gap-2"><StatusBadge status={String(detail.probe.status ?? "unknown")} /><Badge tone="neutral">{detail.source.auth}</Badge></div>
        <p className="text-fg-secondary">{detail.source.notes || "Bu kaynak için açıklama metadatası bulunmuyor."}</p>
        <a href={detail.source.base_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Kaynağı aç <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Metric label="Kategori" value={categoryLabel(detail.source.category)} />
        <Metric label="Strateji" value={detail.source.discovery_strategy} />
        <Metric label="HTTP" value={httpStatus} />
        <Metric label="Gecikme" value={latency} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-fg-primary">Kabiliyetler</h4>
        {capabilities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-subtle bg-bg px-3 py-2 text-xs text-fg-muted">Kabiliyet metadatası yok; canlı veri gibi gösterilmemeli.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {capabilities.map((capability) => (
              <span key={capability} className="rounded-full border border-border-subtle bg-bg px-2 py-1 text-[11px] text-fg-secondary">
                {capability.replaceAll("_", " ").replaceAll("-", " ")}
              </span>
            ))}
          </div>
        )}
      </div>
      {detail.probe.message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {detail.probe.message}
        </div>
      )}
      <div>
        <h4 className="mb-2 text-sm font-medium text-fg-primary">Keşfedilen endpoint'ler</h4>
        <div className="space-y-2">
          {endpoints.length === 0 ? <p className="text-xs text-fg-muted">Henüz endpoint bulunamadı.</p> : endpoints.map((endpoint) => (
            <code key={endpoint} className="block overflow-x-auto rounded bg-bg px-2 py-1 text-[11px] text-fg-secondary">{endpoint}</code>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">{label}</div>
      <div className="mt-1 truncate text-fg-primary">{value || "—"}</div>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="rounded-lg border border-dashed border-border-subtle bg-bg p-6 text-center">
      <Database className="mx-auto h-5 w-5 text-fg-muted" />
      <p className="mt-2 text-sm text-fg-secondary">Soldan bir kaynak seçin.</p>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "neutral" | "ok" }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${tone === "ok" ? "bg-green-100 text-green-700" : "bg-surface-1 text-fg-secondary"}`}>{children}</span>;
}

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.replaceAll("_", " ").replaceAll("-", " ");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized === "ok" || normalized === "live"
    ? "bg-green-100 text-green-700"
    : normalized.includes("credential") || normalized.includes("captcha") || normalized.includes("agreement")
      ? "bg-amber-100 text-amber-700"
      : normalized === "partial" || normalized === "fallback"
        ? "bg-sky-100 text-sky-700"
        : normalized.includes("metadata") || normalized === "unknown"
          ? "bg-surface-1 text-fg-secondary"
          : "bg-rose-100 text-rose-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${tone}`}>{status}</span>;
}
