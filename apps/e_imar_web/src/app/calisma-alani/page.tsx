"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Database, KeyRound, Loader2, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { PremiumModulePanel } from "@/components/workspace/premium-module-panel";
import { SessionPanel } from "@/components/workspace/session-panel";
import { type SubscriptionFormState } from "@/components/workspace/subscriptions-tab";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import {
  getPremiumModuleStates,
  getWebsiteWorkspace,
  humanizeApiError,
  listEplanSubscriptions,
  startWebsiteSession,
  upsertEplanSubscription,
  verifyWebsiteSession
} from "@/lib/api/backend-client";
import type { EplanSubscriptionResponse, PremiumModuleState, WebsiteSessionStartResponse, WebsiteSessionVerifyResponse, WebsiteWorkspaceResponse } from "@/types/api";

const DEFAULT_USER = "web-cockpit";

const DEFAULT_SUBSCRIPTION_FORM: SubscriptionFormState = {
  channel: "webhook",
  target: "",
  platform: "external-webhook",
  active: true
};

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
  const [subscriptionResponse, setSubscriptionResponse] = React.useState<EplanSubscriptionResponse | null>(null);
  const [subscriptionError, setSubscriptionError] = React.useState<string | null>(null);
  const [subscriptionForm, setSubscriptionForm] = React.useState<SubscriptionFormState>(DEFAULT_SUBSCRIPTION_FORM);
  const [savingSubscription, setSavingSubscription] = React.useState(false);

  const activeUserReference = userReference.trim() || DEFAULT_USER;

  const loadSubscriptions = React.useCallback(async (ref: string) => {
    try {
      const response = await listEplanSubscriptions(ref);
      setSubscriptionResponse(response);
      setSubscriptionError(null);
    } catch (error) {
      setSubscriptionResponse(null);
      setSubscriptionError(humanizeApiError(error, "E-plan abonelikleri şu an okunamıyor."));
    }
  }, []);

  const loadWorkspace = React.useCallback(async () => {
    const ref = activeUserReference;
    setLoadingWorkspace(true);
    setWorkspaceError(null);
    try {
      const response = await getWebsiteWorkspace(ref);
      setWorkspace(response);
      await loadSubscriptions(ref);
    } catch (error) {
      setWorkspace(null);
      setSubscriptionResponse(null);
      setWorkspaceError(humanizeApiError(error, "Workspace endpoint'i şu an kullanılamıyor."));
    } finally {
      setLoadingWorkspace(false);
    }
  }, [activeUserReference, loadSubscriptions]);

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  React.useEffect(() => {
    let alive = true;
    setLoadingPremiumModules(true);
    getPremiumModuleStates(undefined, activeUserReference)
      .then((states) => {
        if (alive) setPremiumModules(states);
      })
      .finally(() => {
        if (alive) setLoadingPremiumModules(false);
      });
    return () => {
      alive = false;
    };
  }, [activeUserReference]);

  async function issueSession() {
    const ref = activeUserReference;
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

  async function saveSubscription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = subscriptionForm.target.trim();
    if (!target) {
      setSubscriptionError("Abonelik hedefi girin.");
      return;
    }
    setSavingSubscription(true);
    setSubscriptionError(null);
    try {
      const response = await upsertEplanSubscription({
        userReference: activeUserReference,
        channel: subscriptionForm.channel,
        target,
        platform: subscriptionForm.platform.trim() || (subscriptionForm.channel === "push" ? "web" : "external-webhook"),
        active: subscriptionForm.active,
        metadata: {
          source: "workspace-ui",
          createdBy: "calisma-alani"
        }
      });
      setSubscriptionResponse(response);
      if (response.status === "ok") {
        setSubscriptionForm((current) => ({ ...current, target: "" }));
        await loadWorkspace();
      }
    } catch (error) {
      setSubscriptionError(humanizeApiError(error, "Abonelik kaydedilemedi."));
    } finally {
      setSavingSubscription(false);
    }
  }

  const visibleWorkspaceError = workspaceError ?? subscriptionError;

  return (
    <AppShell>
      <div className="h-full overflow-auto px-4 pb-10 pt-24 lg:pl-[6.5rem] xl:pl-[21rem]">
        <main className="mx-auto max-w-[1280px] space-y-4">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-surface-2/94 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_28px_90px_-58px_rgb(var(--accent-navy)/0.8)]">
            <header className="border-b border-border-subtle/80 bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-navy)/0.10),transparent_34%),rgb(var(--surface-1)/0.72)] px-5 py-5">
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-fg-secondary hover:text-fg-primary">
                <ArrowLeft className="h-3.5 w-3.5" />
                Haritaya dön
              </Link>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-navy/15 bg-brand-navy/8 text-brand-navy">
                    <UserRound className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="section-eyebrow">BFF / workspace + session</p>
                    <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fg-primary">Çalışma alanı</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-secondary">
                      Geçmiş, favoriler ve plan bildirim abonelikleri tablı tek workspace yüzeyinde birleşir; backend `not_ready`, `requires_credentials` ve `unavailable` durumları uydurma içerikle kapatılmaz.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">User reference</span>
                    <input
                      value={userReference}
                      onChange={(event) => setUserReference(event.target.value)}
                      className="h-10 w-[220px] rounded-full border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none transition focus:border-brand-green/60"
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

            <div className="grid gap-4 p-5">
              {visibleWorkspaceError && <StateError title="Workspace uyarısı" description={visibleWorkspaceError} compact />}
              <WorkspaceTabs
                workspace={workspace}
                loading={loadingWorkspace}
                error={workspaceError}
                subscriptionResponse={subscriptionResponse}
                subscriptionForm={subscriptionForm}
                savingSubscription={savingSubscription}
                onSubscriptionFormChange={setSubscriptionForm}
                onSubscriptionSubmit={saveSubscription}
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
