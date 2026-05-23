"use client";

import Link from "next/link";
import { Home, RotateCcw, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-8 text-fg-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl items-center">
        <section className="w-full rounded-xl border border-border-strong bg-surface-2 p-6 shadow-card sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-status-error/30 bg-status-error/10 text-status-error">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <p className="mt-8 text-2xs font-bold uppercase tracking-[0.24em] text-status-error">
            Runtime guardrail
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] text-fg-primary sm:text-[40px] sm:leading-[0.98]">
            Bu ekran yüklenirken beklenmeyen bir hata oluştu.
          </h1>
          <p className="mt-4 max-w-2xl text-md leading-7 text-fg-secondary">
            Harita shell’i ayakta kalacak şekilde kurtarma aksiyonları sunuluyor. Yeniden deneme başarısız olursa ana çalışma alanına dönüp sorguyu tekrar başlatın.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className={buttonVariants({ variant: "primary", size: "lg" })}>
              <RotateCcw className="h-4 w-4" />
              Yeniden dene
            </button>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Home className="h-4 w-4" />
              Ana harita
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
