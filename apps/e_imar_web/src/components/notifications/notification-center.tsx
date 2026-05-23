"use client";

import * as React from "react";
import { Bell, BellOff, CheckCheck, Filter, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotificationStore, type NotificationChannel, type NotificationSeverity } from "@/stores/notification-store";
import { NotificationItem } from "./notification-item";
import { PushSubscriptionForm } from "./push-subscription-form";

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "email", label: "E-posta" },
  { value: "inapp", label: "Uygulama" }
];

const SEVERITY_OPTIONS: { value: NotificationSeverity; label: string }[] = [
  { value: "critical", label: "Kritik" },
  { value: "warning", label: "Uyarı" },
  { value: "info", label: "Bilgi" },
  { value: "success", label: "Başarılı" }
];

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const showCenter = useNotificationStore((s) => s.showCenter);
  const toggleCenter = useNotificationStore((s) => s.toggleCenter);
  const setShowCenter = useNotificationStore((s) => s.setShowCenter);

  return (
    <>
      <button
        type="button"
        onClick={toggleCenter}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-fg-primary hover:bg-surface-1 transition-colors"
        aria-label={`Bildirimler ${unreadCount > 0 ? `(${unreadCount} okunmamış)` : ""}`}
      >
        {unreadCount > 0 ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4 opacity-50" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-status-error px-1 text-[10px] font-black leading-none text-white shadow-[0_0_6px_rgba(255,70,90,0.55)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showCenter && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/15"
              onClick={() => setShowCenter(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "fixed right-3 top-[3.5rem] z-50 w-[min(400px,calc(100vw-2rem))]",
                "rounded-[1.35rem] border border-white/48 bg-surface-2/97 shadow-[0_1px_0_rgb(255_255_255/0.65)_inset,0_28px_66px_-38px_rgb(var(--accent-navy)/0.5)] backdrop-blur-md",
                "flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden"
              )}
              role="dialog"
              aria-label="Bildirim merkezi"
            >
              <NotificationCenterInner onClose={() => setShowCenter(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NotificationCenterInner({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const channelFilters = useNotificationStore((s) => s.channelFilters);
  const severityFilters = useNotificationStore((s) => s.severityFilters);
  const setChannelFilters = useNotificationStore((s) => s.setChannelFilters);

  const [showFilters, setShowFilters] = React.useState(false);
  const [activeSeverityFilters, setSeverityFilters] = React.useState<NotificationSeverity[]>([]);

  const visible = notifications.filter((n) => {
    if (n.dismissed) return false;
    if (channelFilters.length > 0 && !channelFilters.includes(n.channel)) return false;
    if (activeSeverityFilters.length > 0 && !activeSeverityFilters.includes(n.severity)) return false;
    return true;
  });

  const toggleChannelFilter = (ch: NotificationChannel) => {
    setChannelFilters(
      channelFilters.includes(ch)
        ? channelFilters.filter((c) => c !== ch)
        : [...channelFilters, ch]
    );
  };

  const toggleSeverityFilter = (sev: NotificationSeverity) => {
    setSeverityFilters((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  return (
    <>
      <header className="shrink-0 flex items-center justify-between gap-2 border-b border-border-subtle/80 bg-surface-1/72 px-3.5 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-blue" />
            <h2 className="text-[13px] font-black uppercase tracking-[0.16em] text-fg-primary">
              Bildirimler
            </h2>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-fg-muted">
            {unreadCount > 0
              ? `${unreadCount} okunmamış · ${notifications.filter((n) => !n.dismissed).length} toplam`
              : `${notifications.filter((n) => !n.dismissed).length} bildirim`}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:text-fg-primary hover:bg-surface-1 transition-colors",
              (channelFilters.length > 0 || activeSeverityFilters.length > 0) && "text-brand-blue bg-brand-blue/10"
            )}
            aria-label="Filtrele"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:text-fg-primary hover:bg-surface-1 transition-colors"
              aria-label="Tümünü okundu işaretle"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:text-status-error hover:bg-status-error/8 transition-colors"
            aria-label="Tümünü temizle"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:text-fg-primary hover:bg-surface-1 transition-colors ml-1"
            aria-label="Kapat"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border-subtle/60 bg-surface-1/50 px-3.5 py-2.5"
          >
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleChannelFilter(opt.value)}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors",
                    channelFilters.includes(opt.value)
                      ? "border-brand-blue/50 bg-brand-blue/10 text-brand-blue"
                      : "border-border-subtle text-fg-muted hover:border-border-strong"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <span className="w-px bg-border-subtle mx-0.5 self-stretch" />
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSeverityFilter(opt.value)}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors",
                    activeSeverityFilters.includes(opt.value)
                      ? "border-status-warning/50 bg-status-warning/10 text-status-warning"
                      : "border-border-subtle text-fg-muted hover:border-border-strong"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <BellOff className="h-10 w-10 text-fg-muted/30" />
            <p className="text-[12px] text-fg-muted font-medium">
              {notifications.length === 0
                ? "Henüz bildirim yok."
                : "Filtrelere uygun bildirim yok."}
            </p>
            {notifications.length === 0 && (
              <p className="text-[10px] text-fg-muted/70 max-w-[240px]">
                Parsel alarmı, askı değişikliği veya plan güncellemesi olduğunda burada görünür.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markRead}
                onDismiss={dismiss}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-border-subtle/60 bg-surface-1/50 px-3.5 py-2.5">
        <PushSubscriptionForm />
      </footer>
    </>
  );
}
