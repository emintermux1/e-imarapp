"use client";

import * as React from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";

export function PushSubscriptionForm() {
  const pushSubscribed = useNotificationStore((s) => s.pushSubscribed);
  const pushDenied = useNotificationStore((s) => s.pushDenied);
  const setPushSubscribed = useNotificationStore((s) => s.setPushSubscribed);
  const setPushDenied = useNotificationStore((s) => s.setPushDenied);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [unsupported, setUnsupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      setUnsupported(true);
      return;
    }
    if (!("PushManager" in window)) {
      setUnsupported(true);
      return;
    }
    if (Notification.permission === "denied") {
      setPushDenied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushDenied(true);
        setError("Tarayıcı bildirim izni vermedi.");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "") as Uint8Array<ArrayBuffer>,
        });
      }

      if (subscription) {
        setPushSubscribed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abonelik başlatılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      setPushSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abonelik iptal edilemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (unsupported) {
    return (
      <p className="text-[10px] text-fg-muted/60 text-center">
        Push bildirimleri bu tarayıcıda desteklenmiyor.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
          Push Bildirim
        </span>
        {loading ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-fg-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            İşleniyor…
          </span>
        ) : pushSubscribed ? (
          <button
            type="button"
            onClick={unsubscribe}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-2.5 py-0.5 text-[10px] font-medium text-fg-muted hover:text-status-error hover:border-status-error/30 transition-colors"
            )}
          >
            <BellOff className="h-3 w-3" />
            Aboneliği iptal
          </button>
        ) : pushDenied ? (
          <span className="text-[10px] text-status-error/80 font-medium">
            İzin reddedildi
          </span>
        ) : (
          <button
            type="button"
            onClick={subscribe}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-brand-blue/12 border border-brand-blue/30 px-2.5 py-0.5 text-[10px] font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors"
            )}
          >
            <BellRing className="h-3 w-3" />
            Abone ol
          </button>
        )}
      </div>
      {error && (
        <p className="text-[10px] text-status-error/80">{error}</p>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string) {
  if (!base64) return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Url);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}
