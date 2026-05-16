"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, LineChart, XCircle } from "lucide-react";
import { SourceBadge } from "@/components/gis/source-badge";
import { formatQualityTimestamp } from "@/lib/api/quality-labels";
import { cn } from "@/lib/utils";
import type { SourceProbeEvent, SourceQualityRecord } from "@/types/api";

function eventStatus(event: SourceProbeEvent) {
  return String(event.status ?? (event.success === true ? "live" : event.success === false ? "unavailable" : "unknown"));
}

function eventTone(event: SourceProbeEvent) {
  const status = eventStatus(event).toLowerCase();
  if (event.success === true || ["live", "success", "ok", "healthy"].includes(status)) return "live";
  if (event.success === false || ["failed", "failure", "error", "timeout", "unavailable"].includes(status)) return "unavailable";
  if (["fallback", "degraded"].includes(status)) return "fallback";
  return "computed";
}

function eventLabel(event: SourceProbeEvent) {
  const status = eventStatus(event);
  const checked = formatQualityTimestamp(event.checked_at ?? event.timestamp ?? event.started_at ?? event.finished_at);
  const latency = typeof event.latency_ms === "number" ? ` · ${Math.round(event.latency_ms)} ms` : "";
  const http = event.http_status ? ` · HTTP ${event.http_status}` : "";
  return `${checked}${http}${latency} · ${status}`;
}

export function SourceHealthTrend({
  record,
  compact = false,
  className
}: {
  record?: SourceQualityRecord | null;
  compact?: boolean;
  className?: string;
}) {
  const events = (record?.recent_probe_events ?? record?.probe_events ?? []).slice(0, compact ? 5 : 7);
  const historyAvailable = record?.history_available === true && events.length > 0;
  const consecutiveFailures = record?.consecutive_failures ?? 0;
  const unavailableReason = record?.history_unavailable_reason ?? (!record?.history_available ? "Sağlık geçmişi backend tarafından henüz kalıcı tutulmuyor." : events.length === 0 ? "Bu kaynak için son probe olayları dönmedi." : undefined);
  const suggestedAction = record?.suggested_action ?? record?.next_action ?? (record?.status === "unavailable" ? "Portal veya servis endpoint'i yeniden kontrol edilmeli." : undefined);

  return (
    <div className={cn("rounded-lg border border-border-subtle bg-surface-1/55 p-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
          <LineChart className="h-3 w-3" /> Sağlık izi
        </span>
        <SourceBadge
          status={historyAvailable ? (consecutiveFailures > 0 ? "fallback" : "live") : "unavailable"}
          label={historyAvailable ? (consecutiveFailures > 0 ? `${consecutiveFailures} hata` : "geçmiş var") : "geçmiş yok"}
          className="h-4 px-1.5 text-[8px]"
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
        <TrendFact icon={<CheckCircle2 className="h-3 w-3" />} label="Son başarı" value={formatQualityTimestamp(record?.last_success_at)} />
        <TrendFact icon={<XCircle className="h-3 w-3" />} label="Son hata" value={formatQualityTimestamp(record?.last_failed_at)} warn={Boolean(record?.last_failed_at || consecutiveFailures > 0)} />
        {!compact && <TrendFact icon={<CalendarClock className="h-3 w-3" />} label="Sonraki" value={formatQualityTimestamp(record?.next_scheduled_check_at ?? record?.next_check_at)} />}
        {!compact && <TrendFact icon={<AlertTriangle className="h-3 w-3" />} label="Ardışık hata" value={String(consecutiveFailures)} warn={consecutiveFailures > 0} />}
      </div>

      {events.length > 0 ? (
        <div className="mt-2">
          <div className="flex h-7 items-end gap-1 rounded-md border border-border-subtle bg-bg/55 px-1.5 py-1" aria-label="Son probe olayları">
            {events.map((event, index) => (
              <span
                key={`${event.checked_at ?? event.timestamp ?? index}-${index}`}
                title={eventLabel(event)}
                className={cn(
                  "flex-1 rounded-sm border transition-transform hover:-translate-y-0.5",
                  compact ? "min-h-3" : "min-h-4",
                  eventTone(event) === "live" && "border-status-success/40 bg-status-success/70",
                  eventTone(event) === "fallback" && "border-status-warning/40 bg-status-warning/70",
                  eventTone(event) === "unavailable" && "border-status-error/40 bg-status-error/75",
                  eventTone(event) === "computed" && "border-[rgb(var(--accent-blue))]/35 bg-[rgb(var(--accent-blue)/0.58)]"
                )}
              />
            ))}
          </div>
          {!compact && (
            <div className="mt-1.5 space-y-1">
              {events.slice(0, 3).map((event, index) => (
                <div key={`event-${index}-${event.checked_at ?? event.timestamp ?? "unknown"}`} className="flex items-start gap-1.5 text-[9.5px] leading-snug text-fg-muted">
                  <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", eventTone(event) === "live" && "bg-status-success", eventTone(event) === "fallback" && "bg-status-warning", eventTone(event) === "unavailable" && "bg-status-error", eventTone(event) === "computed" && "bg-[rgb(var(--accent-blue))]")} />
                  <span className="min-w-0 truncate">{eventLabel(event)}{event.error ? ` · ${event.error}` : event.message ? ` · ${event.message}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 rounded-md border border-border-subtle bg-bg/45 px-2 py-1.5 text-[10px] leading-snug text-fg-muted">
          {unavailableReason} {suggestedAction ? `Öneri: ${suggestedAction}` : "Olay veya uptime uydurulmadı."}
        </div>
      )}

      {historyAvailable && suggestedAction && !compact && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-border-subtle bg-bg/45 px-2 py-1.5 text-[10px] leading-snug text-fg-secondary">
          <Clock3 className="mt-0.5 h-3 w-3 shrink-0 text-fg-muted" />
          <span>{suggestedAction}</span>
        </div>
      )}
    </div>
  );
}

function TrendFact({ label, value, icon, warn }: { label: string; value: string; icon?: React.ReactNode; warn?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-md border px-2 py-1.5", warn ? "border-status-warning/30 bg-status-warning/10" : "border-border-subtle bg-bg/55")}>
      <div className="flex items-center gap-1 text-[8.5px] uppercase tracking-wider text-fg-muted">{icon}{label}</div>
      <div className={cn("mt-0.5 truncate font-medium tabular-nums", warn ? "text-status-warning" : "text-fg-secondary")}>{value}</div>
    </div>
  );
}
