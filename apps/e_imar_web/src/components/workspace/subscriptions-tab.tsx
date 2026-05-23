"use client";

import * as React from "react";
import { BellPlus, Loader2, Send, Webhook } from "lucide-react";
import { StateEmpty } from "@/components/states/state-empty";
import { StateError } from "@/components/states/state-error";
import { StateLoading } from "@/components/states/state-loading";
import { StateNotReady } from "@/components/states/state-not-ready";
import { StateRequiresCredentials } from "@/components/states/state-requires-credentials";
import { StateUnavailable } from "@/components/states/state-unavailable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { EplanSubscriptionResponse, WebsiteWorkspaceBucket } from "@/types/api";
import { WorkspaceRecordCard } from "./workspace-record-card";
import { bucketCount, readIssueMessage, statusTone, subscriptionRecords } from "./workspace-utils";
import { cn } from "@/lib/utils";

export type SubscriptionFormState = {
  channel: "webhook" | "push";
  target: string;
  platform: string;
  active: boolean;
};

export function SubscriptionsTab({
  bucket,
  response,
  loading,
  error,
  form,
  saving,
  onFormChange,
  onSubmit
}: {
  bucket?: WebsiteWorkspaceBucket;
  response?: EplanSubscriptionResponse | null;
  loading?: boolean;
  error?: string | null;
  form: SubscriptionFormState;
  saving?: boolean;
  onFormChange: (form: SubscriptionFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const records = subscriptionRecords(bucket, response);
  const status = loading ? "loading" : error ? "unavailable" : response?.status ?? bucket?.status;
  const issue = error ?? readIssueMessage(response) ?? readIssueMessage(bucket);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.55fr)]">
      <div className="space-y-3">
        {loading ? (
          <StateLoading title="Abonelikler yükleniyor" description="/eplan/subscriptions ve workspace subscriptions bucket yanıtları bekleniyor." />
        ) : error ? (
          <StateError title="Abonelikler alınamadı" description={error} />
        ) : status === "not_ready" ? (
          <StateNotReady title="Abonelik deposu hazır değil" description={issue ?? "notification_subscriptions tablosu için veritabanı bağlantısı gerekli."} />
        ) : status === "requires_credentials" ? (
          <StateRequiresCredentials title="Abonelik için yetki gerekiyor" description={issue ?? "E-plan bildirim akışı servis yetkisi bekliyor."} />
        ) : status === "unavailable" ? (
          <StateUnavailable title="Abonelik endpoint'i erişilemiyor" description={issue ?? "Canlı /eplan/subscriptions endpoint'i okunamadı."} />
        ) : records.length === 0 ? (
          <StateEmpty title="Abonelik yok" description="Webhook veya push hedefi ekleyerek plan değişikliği bildirimlerini bu kullanıcı referansına bağlayın." />
        ) : (
          <>
            <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1/72 px-4 py-3">
              <h2 className="text-sm font-black text-fg-primary">Plan bildirim abonelikleri</h2>
              <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                {bucketCount(bucket, records.length)} kayıt · durumlar POST /eplan/subscriptions upsert sonucu ile yenilenir.
              </p>
            </div>
            <div className="grid gap-2">
              {records.map((item, index) => (
                <WorkspaceRecordCard key={String(item.id ?? item.channel ?? item.target ?? index)} item={item} type="subscriptions" />
              ))}
            </div>
          </>
        )}
      </div>

      <SubscriptionForm status={status} form={form} saving={saving} onFormChange={onFormChange} onSubmit={onSubmit} />
    </section>
  );
}

function SubscriptionForm({
  status,
  form,
  saving,
  onFormChange,
  onSubmit
}: {
  status?: string | null;
  form: SubscriptionFormState;
  saving?: boolean;
  onFormChange: (form: SubscriptionFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  function update<K extends keyof SubscriptionFormState>(key: K, value: SubscriptionFormState[K]) {
    onFormChange({ ...form, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-border-subtle bg-surface-1/86 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.68)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10 text-brand-green">
          <BellPlus className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">POST /eplan/subscriptions</p>
          <h2 className="mt-1 text-base font-black text-fg-primary">Abonelik kontrolü</h2>
          <p className="mt-1 text-xs leading-relaxed text-fg-secondary">Webhook veya push hedefi aynı kullanıcı referansı için upsert edilir.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">Kanal</span>
          <select
            value={form.channel}
            onChange={(event) => update("channel", event.target.value as SubscriptionFormState["channel"])}
            className="h-10 rounded-xl border border-border-subtle bg-bg px-3 text-sm font-semibold text-fg-primary outline-none transition focus:border-brand-green/60"
          >
            <option value="webhook">Webhook</option>
            <option value="push">Push</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">Hedef</span>
          <input
            value={form.target}
            onChange={(event) => update("target", event.target.value)}
            placeholder={form.channel === "webhook" ? "https://example.com/eplan-hook" : "web-push-endpoint-or-device-token"}
            className="h-10 rounded-xl border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-brand-green/60"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">Platform</span>
          <input
            value={form.platform}
            onChange={(event) => update("platform", event.target.value)}
            placeholder={form.channel === "webhook" ? "external-webhook" : "web"}
            className="h-10 rounded-xl border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-brand-green/60"
          />
        </label>
        <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg px-3 py-2">
          <div>
            <div className="text-xs font-black text-fg-primary">Aktif</div>
            <p className="text-[11px] text-fg-muted">Kapalıysa hedef tutulur ama bildirim gönderilmez.</p>
          </div>
          <Switch checked={form.active} onCheckedChange={(checked) => update("active", checked)} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(status))}>
          {status ?? "idle"}
        </span>
        <Button type="submit" disabled={saving} className="min-w-[150px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.channel === "webhook" ? <Webhook className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
