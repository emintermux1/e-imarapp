"use client";

import * as React from "react";
import { AlertTriangle, Clock3, DatabaseZap, LockKeyhole, PackageOpen, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";

export type StateCardKind =
  | "loading"
  | "empty"
  | "error"
  | "not_ready"
  | "requires_credentials"
  | "unavailable";

type StateCardProps = {
  kind: StateCardKind;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

const COPY: Record<StateCardKind, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  loading: {
    label: "Yükleniyor",
    icon: Clock3,
    className: "border-brand-blue/30 bg-[rgb(var(--accent-blue)/0.08)] text-brand-blue"
  },
  empty: {
    label: "Boş",
    icon: PackageOpen,
    className: "border-border-subtle bg-surface-2/94 text-fg-muted"
  },
  error: {
    label: "Hata",
    icon: AlertTriangle,
    className: "border-status-error/30 bg-status-error/10 text-status-error"
  },
  not_ready: {
    label: "Hazır değil",
    icon: DatabaseZap,
    className: "border-status-warning/35 bg-status-warning/10 text-status-warning"
  },
  requires_credentials: {
    label: "Yetki gerekiyor",
    icon: LockKeyhole,
    className: "border-status-warning/35 bg-status-warning/10 text-status-warning"
  },
  unavailable: {
    label: "Erişilemiyor",
    icon: ServerCrash,
    className: "border-status-error/30 bg-status-error/10 text-status-error"
  }
};

export function StateCard({ kind, title, description, action, className, compact = false }: StateCardProps) {
  const Icon = COPY[kind].icon;
  return (
    <section className={cn("rounded-[1.35rem] border p-4", COPY[kind].className, compact && "p-3", className)}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/25", compact && "h-8 w-8")}>
          <Icon className={cn("h-4 w-4", kind === "loading" && "animate-pulse")} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-fg-primary">{title}</h3>
            <span className="rounded-full border border-current/20 bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
              {COPY[kind].label}
            </span>
          </div>
          <p className={cn("mt-1 text-sm leading-relaxed text-fg-secondary", compact && "text-xs")}>{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function stateCardKindFromStatus(status?: string | null): StateCardKind | null {
  if (!status) return null;
  if (status === "loading") return "loading";
  if (status === "empty") return "empty";
  if (status === "not_ready") return "not_ready";
  if (status === "requires_credentials") return "requires_credentials";
  if (["unavailable", "provider_error", "invalid_input", "invalid_token", "expired_token", "error"].includes(status)) {
    return status === "invalid_input" ? "error" : "unavailable";
  }
  return null;
}
