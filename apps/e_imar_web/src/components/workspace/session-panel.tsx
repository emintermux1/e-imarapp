"use client";

import * as React from "react";
import { CheckCircle2, KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { StateLoading } from "@/components/states/state-loading";
import { StateRequiresCredentials } from "@/components/states/state-requires-credentials";
import { StateUnavailable } from "@/components/states/state-unavailable";
import type { WebsiteSessionStartResponse, WebsiteSessionVerifyResponse } from "@/types/api";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "./workspace-utils";

export function SessionPanel({
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
  const message = error ?? verification?.message ?? session?.message ?? "WEBSITE_SESSION_SECRET tanımlıysa token üretilip hemen verify edilir.";

  if (status === "loading") {
    return <StateLoading title="Oturum deneniyor" description="/website/session/start ve /website/session/verify yanıtları bekleniyor." />;
  }

  if (status === "requires_credentials") {
    return <StateRequiresCredentials title="Oturum secret gerekiyor" description={message} />;
  }

  if (status === "unavailable") {
    return <StateUnavailable title="Oturum endpoint'i erişilemiyor" description={message} />;
  }

  return (
    <section className={cn("rounded-[1.5rem] border p-4", statusTone(status))}>
      <div className="flex items-start gap-3">
        {status === "ok" ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : status === "idle" ? <KeyRound className="mt-0.5 h-5 w-5" /> : <TriangleAlert className="mt-0.5 h-5 w-5" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-black text-fg-primary">{status === "ok" ? "Oturum doğrulandı" : status === "idle" ? "Oturum denenmedi" : "Oturum hazır değil"}</h2>
            <span className="rounded-full border border-current/20 bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
              {statusLabel(status)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-fg-secondary">{message}</p>
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
