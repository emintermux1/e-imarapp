"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PremiumModuleState } from "@/types/api";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "./workspace-utils";

export function PremiumModulePanel({
  modules,
  loading
}: {
  modules: PremiumModuleState[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border-subtle bg-surface-2/94 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">Premium / readiness</p>
          <h2 className="mt-1 text-base font-black text-fg-primary">Bağlı backend modülleri</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg-secondary">
            Analiz, yapı zarfı, tevhid, e-plan ve abonelik uçları gerçek durumlarıyla gösterilir; parsel gerektiren modüller seçim yoksa `not_ready` kalır.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(modules.length ? modules : fallbackPremiumModules()).map((module) => (
          <section key={module.key} className={cn("rounded-2xl border p-3", statusTone(module.status))}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-fg-primary">{module.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{module.detail}</p>
              </div>
              <span className="rounded-full border border-current/20 bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                {statusLabel(module.status)}
              </span>
            </div>
            {module.href && (
              <Link href={module.href} className="mt-3 inline-flex text-xs font-bold text-fg-primary underline decoration-border-strong underline-offset-4">
                {module.actionLabel ?? "Aç"}
              </Link>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function fallbackPremiumModules(): PremiumModuleState[] {
  return [
    {
      key: "loading",
      title: "Modüller okunuyor",
      status: "loading",
      detail: "Canlı endpoint durumları bekleniyor."
    }
  ];
}
