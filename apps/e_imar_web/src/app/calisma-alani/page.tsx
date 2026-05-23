"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2, Database, History, KeyRound, Loader2, Star, TriangleAlert, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  getPremiumModuleStates,
  getWebsiteWorkspace,
  humanizeApiError,
  startWebsiteSession,
  verifyWebsiteSession
} from "@/lib/api/backend-client";
import type { PremiumModuleState, WebsiteSessionStartResponse, WebsiteSessionVerifyResponse, WebsiteWorkspaceBucket, WebsiteWorkspaceResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const DEFAULT_USER = "web-cockpit";

export default function WorkspacePage() {
  const [userReference, setUserReference] = React.useState(DEFAULT_USER);
  const [workspace, setWorkspace] = React.useState<WebsiteWorkspaceResponse | null>(null);
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = React.useState(false);
  const [session, setSession] = React.useState<WebsiteSessionStartResponse | null>(null);
  const [verification, setVerification] = React.useState<WebsiteSessionVerifyResponse | null>(null);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const [loadingSession, setLoadingSession] = React.useState(false);
  const [premiumModules, setPremiumModules] = React.useState<PremiumModuleState[]>([]);
  const [loadingPremiumModules, setLoadingPremiumModules] = React.useState(true);

  const loadWorkspace = React.useCallback(async () => {
    const ref = userReference.trim() || DEFAULT_USER;
    setLoadingWorkspace(true);
    setWorkspaceError(null);
    try {
      setWorkspace(await getWebsiteWorkspace(ref));
    } catch (error) {
      setWorkspace(null);
      setWorkspaceError(humanizeApiError(error, "Workspace endpoint'i şu an kullanılamıyor."));
    } finally {
      setLoadingWorkspace(false);
    }
  }, [userReference]);

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  React.useEffect(() => {
    let alive = true;
    setLoadingPremiumModules(true);
    getPremiumModuleStates(undefined, userReference.trim() || DEFAULT_USER)
      .then((states) => {
        if (alive) setPremiumModules(states);
      })
      .finally(() => {
        if (alive) setLoadingPremiumModules(false);
      });
    return () => {
      alive = false;
    };
  }, [userReference]);

  async function issueSession() {
    const ref = userReference.trim() || DEFAULT_USER;
    setLoadingSession(true);
    setSessionError(null);
    setVerification(null);
    try {
      const started = await startWebsiteSession({ userReference: ref, roles: ["user"], expiresInHours: 24 });
      setSession(started);
      if (started.token) {
        setVerification(await verifyWebsiteSession(started.token));
      }
    } catch (error) {
      setSession(null);
      setSessionError(humanizeApiError(error, "Oturum endpoint'i şu an kullanılamıyor."));
    } finally {
      setLoadingSession(false);
    }
  }

  const historyBucket = workspace?.history;
  const favoritesBucket = workspace?.favorites;
  const subscriptionBucket = workspace?.subscriptions;

  return (
    <AppShell>
      <div className="h-full overflow-auto px-4 pb-10 pt-24 lg:pl-[6.5rem] xl:pl-[21rem]">
        <main className="mx-auto max-w-[1280px] space-y-4">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_28px_90px_-58px_rgb(var(--accent-navy)/0.8)]">
            <header className="border-b border-border-subtle/80 bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-green)/0.18),transparent_34%),rgb(var(--surface-1)/0.72)] px-5 py-5">
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-fg-secondary hover:text-fg-primary">
                <ArrowLeft className="h-3.5 w-3.5" />
                Haritaya dön
              </Link>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10 text-brand-green">
                    <UserRound className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-green">BFF / workspace + session</p>
                    <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fg-primary">Çalışma alanı</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-secondary">
                      Geçmiş, favoriler ve plan bildirim abonelikleri tek backend workspace çağrısında toplanır; oturum secret yoksa durum açıkça `requires_credentials` kalır.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">User reference</span>
                    <input
                      value={userReference}
                      onChange={(event) => setUserReference(event.target.value)}
                      className="h-10 w-[220px] rounded-full border border-border-subtle bg-bg px-3 text-sm text-fg-primary"
                    />
                  </label>
                  <Button onClick={loadWorkspace} disabled={loadingWorkspace} variant="outline">
                    {loadingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Yenile
                  </Button>
                  <Button onClick={issueSession} disabled={loadingSession}>
                    {loadingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Oturum dene
                  </Button>
                </div>
              </div>
            </header>

            {workspaceError && (
              <div className="border-b border-status-warning/30 bg-status-warning/10 px-5 py-3 text-sm text-status-warning">
                {workspaceError}
              </div>
            )}

            <div className="grid gap-4 p-5 lg:grid-cols-3">
              <WorkspaceBucketCard
                icon={<History className="h-4 w-4" />}
                title="Sorgu geçmişi"
                bucket={historyBucket}
                emptyText="Backend history tablosunda kayıt yok veya erişim hazır değil."
              />
              <WorkspaceBucketCard
                icon={<Star className="h-4 w-4" />}
                title="Favoriler"
                bucket={favoritesBucket}
                emptyText="Favori parsel/plan kaydı yok."
              />
              <WorkspaceBucketCard
                icon={<Bell className="h-4 w-4" />}
                title="Bildirim abonelikleri"
                bucket={subscriptionBucket}
                emptyText="E-plan aboneliği yok veya servis not_ready döndü."
              />
            </div>
          </section>

          <PremiumModulePanel modules={premiumModules} loading={loadingPremiumModules} />
          <SessionPanel session={session} verification={verification} error={sessionError} loading={loadingSession} />
        </main>
      </div>
    </AppShell>
  );
}

function PremiumModulePanel({
  modules,
  loading
}: {
  modules: PremiumModuleState[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border-subtle bg-surface-2/94 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">Premium / readiness</p>
          <h2 className="mt-1 text-base font-black text-fg-primary">Bağlı backend modülleri</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg-secondary">
            Analiz, yapı zarfı, tevhid, e-plan ve abonelik uçları gerçek durumlarıyla gösterilir; parsel gerektiren modüller seçim yoksa `not_ready` kalır.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(modules.length ? modules : fallbackPremiumModules()).map((module) => (
          <section key={module.key} className={cn("rounded-2xl border p-3", moduleTone(module.status))}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-fg-primary">{module.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{module.detail}</p>
              </div>
              <span className="rounded-full border border-current/20 bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                {module.status}
              </span>
            </div>
            {module.href && (
              <Link href={module.href} className="mt-3 inline-flex text-xs font-bold text-fg-primary underline decoration-border-strong underline-offset-4">
                {module.actionLabel ?? "Aç"}
              </Link>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function WorkspaceBucketCard({
  icon,
  title,
  bucket,
  emptyText
}: {
  icon: React.ReactNode;
  title: string;
  bucket?: WebsiteWorkspaceBucket;
  emptyText: string;
}) {
  const records = Array.isArray(bucket?.items) ? bucket.items : Array.isArray(bucket?.subscriptions) ? bucket.subscriptions : [];
  const count = bucket?.count ?? records.length;
  const status = bucket?.status ?? (bucket ? "ok" : "not_loaded");
  const issue = readIssue(bucket);

  return (
    <section className="rounded-[1.5rem] border border-border-subtle bg-surface-1/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-2 text-fg-muted">{icon}</span>
          <div>
            <h2 className="text-sm font-black text-fg-primary">{title}</h2>
            <p className="text-[11px] text-fg-muted">{status}</p>
          </div>
        </div>
        <span className="rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-xs font-bold tabular-nums text-fg-primary">{count}</span>
      </div>
      {issue && (
        <div className="mt-3 rounded-xl border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-[11px] leading-relaxed text-status-warning">
          {issue}
        </div>
      )}
      {records.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-fg-secondary">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {records.slice(0, 5).map((item, index) => (
            <RecordPreview key={String(item.id ?? item.created_at ?? index)} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecordPreview({ item }: { item: Record<string, unknown> }) {
  const title = String(item.label ?? item.query_type ?? item.channel ?? item.id ?? "Kayıt");
  const detail = String(item.created_at ?? item.updated_at ?? item.target ?? item.status ?? "Detay yok");
  return (
    <div className="rounded-xl border border-border-subtle bg-bg/75 px-3 py-2">
      <div className="truncate text-sm font-semibold text-fg-primary">{title}</div>
      <div className="mt-0.5 truncate text-[11px] text-fg-muted">{detail}</div>
    </div>
  );
}

function SessionPanel({
  session,
  verification,
  error,
  loading
}: {
  session: WebsiteSessionStartResponse | null;
  verification: WebsiteSessionVerifyResponse | null;
  error: string | null;
  loading: boolean;
}) {
  const status = loading ? "loading" : error ? "unavailable" : verification?.status ?? session?.status ?? "idle";
  return (
    <section className={cn("rounded-[1.5rem] border p-4", statusTone(status))}>
      <div className="flex items-start gap-3">
        {status === "ok" ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : status === "loading" ? <Loader2 className="mt-0.5 h-5 w-5 animate-spin" /> : <TriangleAlert className="mt-0.5 h-5 w-5" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-fg-primary">{status === "ok" ? "Oturum doğrulandı" : status === "idle" ? "Oturum denenmedi" : "Oturum hazır değil"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
            {error ?? verification?.message ?? session?.message ?? "WEBSITE_SESSION_SECRET tanımlıysa token üretilip hemen verify edilir."}
          </p>
          {session?.token && (
            <code className="mt-3 block max-w-full overflow-hidden text-ellipsis rounded-xl border border-border-subtle bg-bg px-3 py-2 text-[11px] text-fg-muted">
              {session.token}
            </code>
          )}
        </div>
      </div>
    </section>
  );
}

function readIssue(bucket?: WebsiteWorkspaceBucket) {
  const message = bucket?.issue?.message;
  return typeof message === "string" ? message : null;
}

function statusTone(status: string) {
  if (status === "ok") return "border-status-success/35 bg-status-success/10 text-status-success";
  if (status === "loading") return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
  if (status === "idle") return "border-border-subtle bg-surface-2/94 text-fg-muted";
  return "border-status-warning/35 bg-status-warning/10 text-status-warning";
}

function moduleTone(status: string) {
  if (status === "ok") return "border-status-success/30 bg-status-success/10 text-status-success";
  if (["empty", "not_ready", "requires_credentials", "unavailable"].includes(status)) return "border-status-warning/30 bg-status-warning/10 text-status-warning";
  return "border-brand-blue/30 bg-[rgb(var(--accent-blue)/0.08)] text-brand-blue";
}

function fallbackPremiumModules(): PremiumModuleState[] {
  return [
    {
      key: "loading",
      title: "Modüller okunuyor",
      status: "loading",
      detail: "Canlı endpoint durumları bekleniyor."
    }
  ];
}
