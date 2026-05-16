"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  Filter,
  Globe2,
  KeyRound,
  Layers3,
  Loader2,
  LockKeyhole,
  MapPinned,
  RadioTower,
  RefreshCcw,
  Search,
  ShieldAlert,
  SignalHigh,
  TimerReset,
  TriangleAlert
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useSourceDetail, useSourceHealth, useSources } from "@/lib/api/hooks";
import { reprobeSource } from "@/lib/api/eimar";
import {
  getBackendMapProviders,
  getBackendTileStatus,
  getIngestionRequirements,
  getSourceActivation,
  getSourceQuality,
  getWebsiteBootstrap,
  getWebsiteLiveReadiness,
  humanizeApiError
} from "@/lib/api/backend-client";
import type { SourceDetailResponse, SourceEntry } from "@/lib/api/types";
import type {
  BackendMapProviderResponse,
  BackendTileStatusResponse,
  IngestionRequirementsResponse,
  SourceActivationRecord,
  SourceActivationResponse,
  SourceQualityRecord,
  SourceQualityResponse,
  WebsiteBootstrapResponse,
  WebsiteLiveReadinessResponse,
  WebsiteReadinessSource
} from "@/types/api";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  central: "Merkezi",
  metropolitan: "Büyükşehir",
  municipal: "Belediye",
  catalog: "Katalog",
  document: "Doküman"
};

type CommandPayload = {
  bootstrap: WebsiteBootstrapResponse | null;
  readiness: WebsiteLiveReadinessResponse | null;
  quality: SourceQualityResponse | null;
  activation: SourceActivationResponse | null;
  mapProviders: BackendMapProviderResponse[];
  tileStatus: BackendTileStatusResponse | null;
  ingestion: IngestionRequirementsResponse | null;
  error: string | null;
};

export default function KaynaklarPage() {
  const sourcesQuery = useSources();
  const healthQuery = useSourceHealth();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [loadingCommand, setLoadingCommand] = React.useState(true);
  const [command, setCommand] = React.useState<CommandPayload>({
    bootstrap: null,
    readiness: null,
    quality: null,
    activation: null,
    mapProviders: [],
    tileStatus: null,
    ingestion: null,
    error: null
  });
  const detailQuery = useSourceDetail(selectedId);

  const loadCommandCenter = React.useCallback(async () => {
    setLoadingCommand(true);
    const [bootstrap, readiness, quality, activation, providers, tileStatus, ingestion] = await Promise.allSettled([
      getWebsiteBootstrap(),
      getWebsiteLiveReadiness(),
      getSourceQuality({ limit: 120, live_check: false }),
      getSourceActivation({ limit: 120, live_check: false }),
      getBackendMapProviders(),
      getBackendTileStatus(),
      getIngestionRequirements()
    ]);
    const firstError = [bootstrap, readiness, quality, activation, providers, tileStatus, ingestion].find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    setCommand({
      bootstrap: bootstrap.status === "fulfilled" ? bootstrap.value : null,
      readiness: readiness.status === "fulfilled" ? readiness.value : null,
      quality: quality.status === "fulfilled" ? quality.value : null,
      activation: activation.status === "fulfilled" ? activation.value : null,
      mapProviders: providers.status === "fulfilled" ? providers.value : [],
      tileStatus: tileStatus.status === "fulfilled" ? tileStatus.value : null,
      ingestion: ingestion.status === "fulfilled" ? ingestion.value : null,
      error: firstError ? humanizeApiError(firstError.reason, "Kaynak komuta merkezi canlı endpoint'lerin bir bölümünü okuyamadı.") : null
    });
    setLoadingCommand(false);
  }, []);

  React.useEffect(() => {
    void loadCommandCenter();
  }, [loadCommandCenter]);

  const sources = React.useMemo(
    () => (sourcesQuery.data?.ok ? sourcesQuery.data.data.sources : []),
    [sourcesQuery.data]
  );
  const healthMap = React.useMemo(() => {
    if (!healthQuery.data?.ok) return new Map<string, Record<string, unknown>>();
    return new Map(healthQuery.data.data.sources.map((src) => [src.id, src]));
  }, [healthQuery.data]);
  const activationById = React.useMemo(
    () => new Map((command.activation?.sources ?? []).map((source) => [source.sourceId, source])),
    [command.activation]
  );
  const qualityById = React.useMemo(
    () => new Map((command.quality?.sources ?? []).map((source) => [source.source_id, source])),
    [command.quality]
  );
  const visibleSources = React.useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return sources.filter((src) => {
      const activation = activationById.get(src.id);
      const quality = qualityById.get(src.id);
      const probe = healthMap.get(src.id);
      const status = activation?.activationStatus ?? quality?.status ?? String(probe?.status ?? "unknown");
      const categoryMatch = category === "all" || src.category === category;
      const statusMatch = statusFilter === "all" || status === statusFilter;
      const searchMatch =
        !q ||
        [src.name, src.id, src.provider, src.category, src.municipality_name, activation?.nextAction, quality?.user_message]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(q));
      return categoryMatch && statusMatch && searchMatch;
    });
  }, [activationById, category, healthMap, qualityById, search, sources, statusFilter]);

  const summary = command.activation?.summary;
  const coverage = command.bootstrap?.sourceCoverage;
  const readiness = command.readiness;
  const configuredEnv = readiness?.deployment.requiredEnv.filter((item) => item.configured).length ?? 0;
  const requiredEnv = readiness?.deployment.requiredEnv.length ?? 0;
  const verifiedLive = readiness?.sources.filter((source) => source.status === "verified_live").length ?? 0;
  const blockedReadiness = readiness?.sources.filter((source) => !["verified_live", "public_metadata"].includes(source.status)).length ?? 0;
  const protectedSources = command.ingestion?.sources.length ?? coverage?.protectedCount ?? 0;

  return (
    <AppShell>
      <div className="h-full overflow-auto px-4 pb-8 pt-24 lg:pl-[6.5rem] xl:pl-[21rem]">
        <main className="mx-auto max-w-[1540px] space-y-4">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_28px_90px_-58px_rgb(var(--accent-navy)/0.8)]">
            <header className="border-b border-border-subtle/80 bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-green)/0.18),transparent_36%),radial-gradient(circle_at_top_right,rgb(var(--accent-blue)/0.13),transparent_32%),rgb(var(--surface-1)/0.76)] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-fg-secondary hover:text-fg-primary">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Haritaya dön
                  </Link>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10 text-brand-green">
                      <RadioTower className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-green">Kaynak komuta merkezi</p>
                      <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fg-primary">Canlı, aday ve bloklu veri kaynakları</h1>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-secondary">
                        Registry, kalite, aktivasyon, canlı hazırlık, provider ve ingestion gereksinimleri tek ekranda. Veri yoksa sebebi gösterilir; tabloyu yeşile boyayıp kandırma yok.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={loadCommandCenter} disabled={loadingCommand} variant="outline" size="sm">
                    {loadingCommand ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Yenile
                  </Button>
                  <Link
                    href="/calisma-alani"
                    className="inline-flex h-8 items-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-3 text-xs font-semibold text-fg-primary hover:bg-white"
                  >
                    Workspace
                  </Link>
                </div>
              </div>
            </header>

            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard icon={<Database className="h-4 w-4" />} label="Registry" value={coverage?.totalSources ?? sources.length} detail={`${coverage?.municipalSources ?? 0} belediye · ${coverage?.publicCandidateCount ?? 0} açık aday`} />
              <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Aktif kaynak" value={summary?.active ?? 0} detail={`${summary?.metadataOnly ?? 0} metadata · ${summary?.needsContract ?? 0} kontrat`} tone="success" />
              <SummaryCard icon={<LockKeyhole className="h-4 w-4" />} label="Bloklu / korumalı" value={(summary?.blocked ?? 0) + protectedSources} detail={`${summary?.unavailable ?? 0} unavailable · ${protectedSources} credential/legal`} tone="warning" />
              <SummaryCard icon={<SignalHigh className="h-4 w-4" />} label="Canlı hazırlık" value={readiness ? `${configuredEnv}/${requiredEnv}` : "—"} detail={`${verifiedLive} verified · ${blockedReadiness} bekliyor`} tone={readiness?.status === "ok" ? "success" : "warning"} />
              <SummaryCard icon={<Globe2 className="h-4 w-4" />} label="Harita provider" value={command.mapProviders.filter((provider) => provider.configured).length} detail={`${command.mapProviders.length} provider · tile ${command.tileStatus?.status ?? "unknown"}`} />
            </div>

            {command.error && (
              <div className="mx-5 mb-5 flex items-start gap-2 rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{command.error}</span>
              </div>
            )}
          </section>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="overflow-hidden rounded-[1.75rem] border border-border-subtle bg-surface-2/94">
              <header className="grid gap-3 border-b border-border-subtle bg-surface-1/70 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fg-muted">Registry tablosu</p>
                  <h2 className="mt-1 text-lg font-black text-fg-primary">Kaynak, durum ve sonraki aksiyon</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Kaynak ara"
                      className="h-10 w-[230px] rounded-full border border-border-subtle bg-bg pl-9 pr-3 text-sm text-fg-primary outline-none"
                    />
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 rounded-full border border-border-subtle bg-bg px-3 text-sm text-fg-primary"
                  >
                    <option value="all">Tüm kategoriler</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-full border border-border-subtle bg-bg px-3 text-sm text-fg-primary"
                  >
                    <option value="all">Tüm durumlar</option>
                    <option value="active">Active</option>
                    <option value="metadata_only">Metadata only</option>
                    <option value="needs_contract">Needs contract</option>
                    <option value="blocked">Blocked</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="live">Live</option>
                    <option value="fallback">Fallback</option>
                  </select>
                </div>
              </header>

              <div className="min-h-[520px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-surface-2/98 backdrop-blur">
                    <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                      <th className="px-4 py-3">Kaynak</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Kabiliyet</th>
                      <th className="px-4 py-3">Sonraki aksiyon</th>
                      <th className="px-4 py-3">Endpoint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-secondary">
                          Filtreye uyan kaynak yok.
                        </td>
                      </tr>
                    ) : (
                      visibleSources.map((src) => {
                        const probe = healthMap.get(src.id) as Record<string, unknown> | undefined;
                        const activation = activationById.get(src.id);
                        const quality = qualityById.get(src.id);
                        const endpointCount = activation?.usableEndpoints.length ?? quality?.endpoint_count ?? (Array.isArray(probe?.discovered_endpoints) ? probe.discovered_endpoints.length : 0);
                        return (
                          <tr
                            key={src.id}
                            className={cn(
                              "cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-1/70",
                              selectedId === src.id && "bg-[rgb(var(--accent-blue)/0.08)]"
                            )}
                            onClick={() => setSelectedId(src.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-fg-primary">{src.name}</div>
                              <div className="mt-0.5 text-xs text-fg-muted">{src.id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{CATEGORY_LABELS[src.category] ?? src.category}</div>
                              <div className="mt-0.5 text-[11px] text-fg-muted">{src.provider}</div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={activation?.activationStatus ?? quality?.status ?? String(probe?.status ?? "unknown")} />
                              {quality?.last_checked_at && <div className="mt-1 text-[10px] text-fg-muted">{quality.last_checked_at}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex max-w-[220px] flex-wrap gap-1">
                                {(activation?.capabilities ?? src.capabilities ?? []).slice(0, 4).map((capability) => (
                                  <span key={capability} className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] text-fg-secondary">
                                    {capability}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="max-w-[360px] px-4 py-3 text-xs leading-relaxed text-fg-secondary">
                              {activation?.nextAction ?? quality?.next_action ?? quality?.user_message ?? src.notes ?? "Registry kaydı var; canlı kontrol bekliyor."}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              <div className="flex items-center gap-2">
                                <span>{endpointCount}</span>
                                {(src.base_url || activation?.homepageUrl) && (
                                  <a
                                    href={activation?.homepageUrl ?? src.base_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-fg-muted hover:bg-surface-1 hover:text-fg-primary"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-4">
              <ReadinessPanel readiness={command.readiness} />
              <ProviderPanel providers={command.mapProviders} tileStatus={command.tileStatus} ingestion={command.ingestion} />
              <DetailPanelShell
                selectedId={selectedId}
                detail={detailQuery.data?.ok ? detailQuery.data.data : null}
                loading={detailQuery.isLoading}
                activation={selectedId ? activationById.get(selectedId) : undefined}
                quality={selectedId ? qualityById.get(selectedId) : undefined}
                onReprobe={() => {
                  if (selectedId) void reprobeSource(selectedId).then(() => loadCommandCenter());
                }}
              />
            </aside>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <section className={cn("rounded-[1.35rem] border p-4", toneClass(tone))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.04em] tabular-nums">{value}</div>
          <div className="mt-1 text-xs leading-relaxed opacity-75">{detail}</div>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-white/30">{icon}</span>
      </div>
    </section>
  );
}

function ReadinessPanel({ readiness }: { readiness: WebsiteLiveReadinessResponse | null }) {
  if (!readiness) {
    return (
      <SideCard icon={<ShieldAlert className="h-4 w-4" />} title="Canlı hazırlık" subtitle="Endpoint okunamadı">
        <p className="text-sm text-fg-secondary">`/website/live-readiness` yanıtı yok. Ortam hazır varsayılmadı.</p>
      </SideCard>
    );
  }
  return (
    <SideCard icon={<Activity className="h-4 w-4" />} title="Canlı hazırlık" subtitle={`${readiness.deployment.requiredEnv.filter((item) => item.configured).length}/${readiness.deployment.requiredEnv.length} env hazır`}>
      <div className="space-y-2">
        {readiness.deployment.requiredEnv.map((item) => (
          <div key={item.key} className="flex items-start gap-2 rounded-xl border border-border-subtle bg-bg/70 px-3 py-2">
            {item.configured ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" /> : <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />}
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg-primary">{item.key}</div>
              <div className="text-[11px] leading-relaxed text-fg-secondary">{item.purpose}</div>
            </div>
          </div>
        ))}
        <div className="grid gap-2">
          {readiness.sources.map((source) => <ReadinessSourceRow key={source.sourceId} source={source} />)}
        </div>
      </div>
    </SideCard>
  );
}

function ReadinessSourceRow({ source }: { source: WebsiteReadinessSource }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-xs font-bold text-fg-primary">{source.sourceName}</div>
        <StatusPill status={source.status} />
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-secondary">{source.message}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-fg-muted">{source.nextAction}</p>
    </div>
  );
}

function ProviderPanel({
  providers,
  tileStatus,
  ingestion
}: {
  providers: BackendMapProviderResponse[];
  tileStatus: BackendTileStatusResponse | null;
  ingestion: IngestionRequirementsResponse | null;
}) {
  return (
    <SideCard icon={<Layers3 className="h-4 w-4" />} title="Provider ve ingestion" subtitle={`tile: ${tileStatus?.status ?? "unknown"}`}>
      <div className="grid gap-2">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-border-subtle bg-bg/70 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-fg-primary">{provider.name}</div>
              <StatusPill status={provider.configured ? "configured" : provider.envStatus ?? "not_configured"} />
            </div>
            <p className="mt-1 text-[11px] text-fg-muted">{provider.issue ?? provider.capabilities.join(", ")}</p>
          </div>
        ))}
        {providers.length === 0 && <p className="text-sm text-fg-secondary">Provider endpoint'i yanıt vermedi.</p>}
        {ingestion && (
          <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-status-warning">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Filter className="h-3.5 w-3.5" />
              {ingestion.count} erişim gereksinimi
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-fg-secondary">{ingestion.note}</p>
          </div>
        )}
      </div>
    </SideCard>
  );
}

function DetailPanelShell({
  selectedId,
  detail,
  loading,
  activation,
  quality,
  onReprobe
}: {
  selectedId: string | null;
  detail: SourceDetailResponse | null;
  loading: boolean;
  activation?: SourceActivationRecord;
  quality?: SourceQualityRecord;
  onReprobe: () => void;
}) {
  return (
    <SideCard icon={<Database className="h-4 w-4" />} title="Kaynak detayı" subtitle={selectedId ?? "Seçim yok"}>
      {!selectedId ? (
        <div className="rounded-xl border border-dashed border-border-subtle bg-bg p-6 text-center">
          <Database className="mx-auto h-5 w-5 text-fg-muted" />
          <p className="mt-2 text-sm text-fg-secondary">Tablodan bir kaynak seçin.</p>
        </div>
      ) : loading ? (
        <p className="text-sm text-fg-secondary">Yükleniyor…</p>
      ) : !detail ? (
        <p className="text-sm text-status-warning">Detay okunamadı.</p>
      ) : (
        <DetailPanel detail={detail} activation={activation} quality={quality} onReprobe={onReprobe} />
      )}
    </SideCard>
  );
}

function DetailPanel({
  detail,
  activation,
  quality,
  onReprobe
}: {
  detail: SourceDetailResponse;
  activation?: SourceActivationRecord;
  quality?: SourceQualityRecord;
  onReprobe: () => void;
}) {
  const endpoints = Array.isArray(detail.probe.discovered_endpoints) ? (detail.probe.discovered_endpoints as string[]) : [];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fg-primary">{detail.source.name}</h3>
          <p className="mt-1 text-xs text-fg-muted">{detail.source.id}</p>
        </div>
        <button onClick={onReprobe} className="inline-flex h-8 items-center gap-1 rounded-full border border-border-subtle px-2 text-xs hover:bg-surface-1">
          <RefreshCcw className="h-3.5 w-3.5" /> Yeniden probe
        </button>
      </div>
      <div className="rounded-xl border border-border-subtle bg-bg p-3 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusPill status={activation?.activationStatus ?? quality?.status ?? String(detail.probe.status ?? "unknown")} />
          <StatusPill status={detail.source.auth} />
        </div>
        <p className="text-fg-secondary">{activation?.nextAction ?? quality?.user_message ?? detail.source.notes}</p>
        <a href={activation?.homepageUrl ?? detail.source.base_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-brand-blue hover:underline">
          Kaynağı aç <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniFact label="Runtime" value={activation?.runtimeStatus ?? detail.probe.status ?? "unknown"} />
        <MiniFact label="Geometri" value={quality?.geometry_available ? "var" : "yok / bilinmiyor"} />
        <MiniFact label="İmar" value={quality?.imar_available ? "var" : "yok / bilinmiyor"} />
        <MiniFact label="Askı" value={quality?.aski_available ? "var" : "yok / bilinmiyor"} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-fg-primary">Keşfedilen endpoint'ler</h4>
        <div className="space-y-2">
          {endpoints.length === 0 && activation?.usableEndpoints.length ? (
            activation.usableEndpoints.map((endpoint) => (
              <code key={endpoint} className="block overflow-x-auto rounded bg-bg px-2 py-1 text-[11px] text-fg-secondary">{endpoint}</code>
            ))
          ) : endpoints.length === 0 ? (
            <p className="text-xs text-fg-muted">Henüz endpoint bulunamadı.</p>
          ) : (
            endpoints.map((endpoint) => (
              <code key={endpoint} className="block overflow-x-auto rounded bg-bg px-2 py-1 text-[11px] text-fg-secondary">{endpoint}</code>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SideCard({
  icon,
  title,
  subtitle,
  children
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border-subtle bg-surface-2/94 p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-1 text-fg-muted">{icon}</span>
        <div>
          <h2 className="text-sm font-black text-fg-primary">{title}</h2>
          <p className="text-[11px] text-fg-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg/70 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-fg-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-fg-primary">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status || "unknown";
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", statusClass(normalized))}>
      {normalized}
    </span>
  );
}

function statusClass(status: string) {
  if (["ok", "active", "live", "verified_live", "configured"].includes(status)) return "border-status-success/30 bg-status-success/10 text-status-success";
  if (["metadata_only", "public_metadata", "fallback", "partial"].includes(status)) return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
  if (["blocked", "protected", "requires_credentials", "captcha_required", "needs_contract", "method_contract_required", "not_configured"].includes(status)) return "border-status-warning/35 bg-status-warning/10 text-status-warning";
  if (["unavailable", "not_ready", "source_not_found"].includes(status)) return "border-status-error/30 bg-status-error/10 text-status-error";
  return "border-border-subtle bg-surface-1 text-fg-secondary";
}

function toneClass(tone: "neutral" | "success" | "warning") {
  if (tone === "success") return "border-status-success/30 bg-status-success/10 text-status-success";
  if (tone === "warning") return "border-status-warning/30 bg-status-warning/10 text-status-warning";
  return "border-border-subtle bg-surface-1 text-fg-primary";
}
