"use client";

import * as React from "react";
import { Bell, MapPin, FileText, AlertTriangle, CheckCircle, Info, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/stores/notification-store";

const severityIcon: Record<AppNotification["severity"], React.FC<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
  success: CheckCircle
};

const severityTone: Record<AppNotification["severity"], string> = {
  info: "border-l-brand-blue text-fg-primary bg-surface-1/60",
  warning: "border-l-status-warning/70 text-fg-primary bg-surface-1/60",
  critical: "border-l-status-error text-fg-primary bg-status-error/6",
  success: "border-l-status-success text-fg-primary bg-surface-1/60"
};

const channelBadge: Record<AppNotification["channel"], { label: string; tone: string }> = {
  push: { label: "Push", tone: "bg-brand-blue/10 text-brand-blue" },
  email: { label: "E-posta", tone: "bg-status-warning/10 text-status-warning" },
  inapp: { label: "Uygulama", tone: "bg-fg-muted/15 text-fg-muted" }
};

const contextIcon = (n: AppNotification) => {
  if (n.parcelId) return <MapPin className="h-3 w-3" />;
  if (n.reportId) return <FileText className="h-3 w-3" />;
  return <Bell className="h-3 w-3" />;
};

interface Props {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification: n, onRead, onDismiss, compact = false }: Props) {
  const Icon = severityIcon[n.severity];
  const channel = channelBadge[n.channel];

  const handleClick = () => {
    if (!n.read) onRead(n.id);
  };

  return (
    <article
      role="listitem"
      className={cn(
        "relative border-l-[3px] rounded-r-lg py-2.5 pl-3 pr-8 transition-colors cursor-pointer group",
        severityTone[n.severity],
        !n.read && "font-semibold",
        n.dismissed && "opacity-35"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">
          <Icon className={cn("h-4 w-4", n.severity === "critical" && "text-status-error")} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] leading-snug">{n.title}</span>
            {!compact && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-medium uppercase tracking-wider",
                  channel.tone
                )}
              >
                {channel.label}
              </span>
            )}
          </div>
          {!compact && (
            <p className="mt-0.5 text-[11px] text-fg-muted leading-relaxed line-clamp-2">
              {n.body}
            </p>
          )}
          {!compact && n.actionHref && n.actionLabel && (
            <a
              href={n.actionHref}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-blue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {n.actionLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <time className="mt-1 block text-[9px] text-fg-muted/70 tabular-nums">
            {relativeTime(n.createdAt)}
          </time>
        </div>

        {!compact && n.parcelId && (
          <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 rounded border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[9px] font-medium text-fg-muted">
            {contextIcon(n)}
            Parsel
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(n.id);
        }}
        className="absolute right-2 top-2 h-5 w-5 inline-flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-fg-muted hover:text-fg-primary hover:bg-surface-1 transition-all"
        aria-label="Bildirimi kapat"
      >
        <X className="h-3 w-3" />
      </button>
    </article>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Az önce";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} s önce`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} g önce`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short"
  });
}
