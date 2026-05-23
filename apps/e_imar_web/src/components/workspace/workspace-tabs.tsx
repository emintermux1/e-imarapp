"use client";

import * as React from "react";
import { Bell, History, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EplanSubscriptionResponse, WebsiteWorkspaceResponse } from "@/types/api";
import { FavoritesTab } from "./favorites-tab";
import { HistoryTab } from "./history-tab";
import { SubscriptionsTab, type SubscriptionFormState } from "./subscriptions-tab";
import { bucketCount, statusLabel, statusTone, subscriptionRecords } from "./workspace-utils";
import { cn } from "@/lib/utils";

type WorkspaceTabsProps = {
  workspace: WebsiteWorkspaceResponse | null;
  loading?: boolean;
  error?: string | null;
  subscriptionResponse?: EplanSubscriptionResponse | null;
  subscriptionForm: SubscriptionFormState;
  savingSubscription?: boolean;
  onSubscriptionFormChange: (form: SubscriptionFormState) => void;
  onSubscriptionSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function WorkspaceTabs({
  workspace,
  loading,
  error,
  subscriptionResponse,
  subscriptionForm,
  savingSubscription,
  onSubscriptionFormChange,
  onSubscriptionSubmit
}: WorkspaceTabsProps) {
  const historyStatus = loading ? "loading" : error ? "unavailable" : workspace?.history.status;
  const favoritesStatus = loading ? "loading" : error ? "unavailable" : workspace?.favorites.status;
  const subscriptionStatus = loading ? "loading" : error ? "unavailable" : subscriptionResponse?.status ?? workspace?.subscriptions.status;
  const subscriptionCount = subscriptionRecords(workspace?.subscriptions, subscriptionResponse).length;

  return (
    <Tabs defaultValue="history" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border-subtle bg-surface-1/74 p-2 md:flex-row md:items-center md:justify-between">
        <TabsList className="grid w-full grid-cols-3 rounded-[1.15rem] bg-bg p-1 md:w-auto">
          <WorkspaceTrigger value="history" icon={<History className="h-3.5 w-3.5" />} label="Geçmiş" count={bucketCount(workspace?.history, 0)} status={historyStatus} />
          <WorkspaceTrigger value="favorites" icon={<Star className="h-3.5 w-3.5" />} label="Favoriler" count={bucketCount(workspace?.favorites, 0)} status={favoritesStatus} />
          <WorkspaceTrigger value="subscriptions" icon={<Bell className="h-3.5 w-3.5" />} label="Abonelikler" count={bucketCount(workspace?.subscriptions, subscriptionCount)} status={subscriptionStatus} />
        </TabsList>
        <div className="flex flex-wrap gap-1.5 px-1">
          <StatusPill label="history" status={historyStatus} />
          <StatusPill label="favorites" status={favoritesStatus} />
          <StatusPill label="subscriptions" status={subscriptionStatus} />
        </div>
      </div>

      <TabsContent value="history">
        <HistoryTab bucket={workspace?.history} loading={loading} error={error} />
      </TabsContent>
      <TabsContent value="favorites">
        <FavoritesTab bucket={workspace?.favorites} loading={loading} error={error} />
      </TabsContent>
      <TabsContent value="subscriptions">
        <SubscriptionsTab
          bucket={workspace?.subscriptions}
          response={subscriptionResponse}
          loading={loading}
          error={error}
          form={subscriptionForm}
          saving={savingSubscription}
          onFormChange={onSubscriptionFormChange}
          onSubmit={onSubscriptionSubmit}
        />
      </TabsContent>
    </Tabs>
  );
}

function WorkspaceTrigger({
  value,
  icon,
  label,
  count,
  status
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  status?: string | null;
}) {
  return (
    <TabsTrigger value={value} className="min-h-11 justify-start gap-2 rounded-[0.9rem] px-3 text-left data-[state=active]:shadow-[0_12px_34px_-26px_rgb(var(--accent-navy)/0.75)]">
      <span className="hidden text-fg-muted sm:inline-flex">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black">{label}</span>
        <span className="block truncate text-[10px] text-fg-muted">{statusLabel(status)}</span>
      </span>
      <span className="ml-auto rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-[10px] font-black tabular-nums text-fg-primary">{count}</span>
    </TabsTrigger>
  );
}

function StatusPill({ label, status }: { label: string; status?: string | null }) {
  return (
    <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(status))}>
      {label}: {statusLabel(status)}
    </span>
  );
}
