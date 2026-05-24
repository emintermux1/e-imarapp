"use client";

import * as React from "react";
import { Bell, Clock3, MapPin, RadioTower, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceRecord } from "./workspace-utils";
import { compactRecordDetail, compactRecordTitle, formatRecordDate } from "./workspace-utils";

type WorkspaceRecordCardProps = {
  item: WorkspaceRecord;
  type: "history" | "favorites" | "subscriptions";
};

export function WorkspaceRecordCard({ item, type }: WorkspaceRecordCardProps) {
  const title = compactRecordTitle(item, type === "history" ? "Sorgu kaydı" : type === "favorites" ? "Favori kayıt" : "Abonelik");
  const rawDetail = compactRecordDetail(item);
  const date = formatRecordDate(item.created_at ?? item.createdAt ?? item.updated_at ?? item.updatedAt);
  const status = typeof item.status === "string" ? item.status : typeof item.active === "boolean" ? (item.active ? "active" : "paused") : null;
  const Icon = type === "history" ? Clock3 : type === "favorites" ? Star : Bell;

  return (
    <article className="group rounded-[1.15rem] border border-border-subtle bg-surface-1/80 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] transition hover:-translate-y-px hover:border-border-strong hover:bg-surface-2/90">
      <div className="flex items-start gap-3">
        <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", iconTone(type))}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-fg-primary">{title}</h3>
              <p className="mt-0.5 truncate text-xs text-fg-secondary">{date ?? rawDetail}</p>
            </div>
            {status && (
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]", status === "active" || status === "ok" ? "border-status-success/30 bg-status-success/10 text-status-success" : "border-border-subtle bg-surface-2 text-fg-muted")}>
                {status}
              </span>
            )}
          </div>
          <RecordMeta item={item} type={type} />
        </div>
      </div>
    </article>
  );
}

function RecordMeta({ item, type }: { item: WorkspaceRecord; type: WorkspaceRecordCardProps["type"] }) {
  const values = [
    type === "subscriptions" ? labelPair("Kanal", item.channel) : labelPair("Tip", item.query_type ?? item.queryType),
    type === "subscriptions" ? labelPair("Hedef", item.target) : labelPair("Sonuç", item.result_count ?? item.resultCount),
    type === "favorites" ? labelPair("Parsel", item.parcel_id) : null,
    type === "subscriptions" ? labelPair("Platform", item.platform) : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (values.length === 0) {
    return (
      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-fg-muted">
        <RadioTower className="h-3.5 w-3.5" />
        Backend kaydı sade payload döndürdü.
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span key={`${value.label}-${value.value}`} className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg px-2 py-1 text-[11px] font-semibold text-fg-secondary">
          {value.label === "Parsel" && <MapPin className="h-3 w-3" />}
          <span className="text-fg-muted">{value.label}</span>
          <span className="max-w-[190px] truncate">{value.value}</span>
        </span>
      ))}
    </div>
  );
}

function labelPair(label: string, value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return { label, value: String(value) };
}

function iconTone(type: WorkspaceRecordCardProps["type"]) {
  if (type === "history") return "border-brand-blue/25 bg-brand-blue/10 text-brand-blue";
  if (type === "favorites") return "border-brand-amber/25 bg-brand-amber/10 text-brand-amber";
  return "border-brand-navy/15 bg-brand-navy/8 text-brand-navy";
}
