import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { EmsalDialogContent } from "@/components/emsal/emsal-dialog-content";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emsal Hesaplayıcı"
};

export default function EmsalPage() {
  return (
    <div className="min-h-dvh bg-bg text-fg-primary">
      <header className="h-14 border-b border-border-subtle bg-surface-2 flex items-center px-4 gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-fg-secondary hover:text-fg-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Haritaya Dön
        </Link>
        <span className="h-6 w-px bg-border-subtle" />
        <BrandMark />
        <span className="hidden md:inline-flex items-center gap-2 text-xs text-fg-muted ml-2">
          <Calculator className="h-3.5 w-3.5" /> Emsal & Yapılaşma Hesaplayıcı
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Parsel Seç
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-[1180px] mx-auto p-4 md:p-6">
        <div className="rounded-md border border-border-strong bg-surface-2 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <h1 className="text-xl font-semibold text-fg-primary tracking-tight">
              Emsal Hesabı
            </h1>
            <p className="text-xs text-fg-muted">
              TKGM ve İmar Yönetmeliği temelli, tek pencerede yapı kütlesi ve yatırım simülasyonu.
            </p>
          </div>
          <EmsalDialogContent />
        </div>
        <p className="mt-4 text-[11px] text-fg-muted">
          Sonuçlar yaklaşık değerdir; gerçek projede ilgili belediyenin uygulama
          esasları ve yönetmelik istisnaları belirleyicidir.
        </p>
      </main>
    </div>
  );
}
