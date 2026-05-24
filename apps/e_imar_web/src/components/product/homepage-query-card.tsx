"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateParcelQuery, type ParcelQueryInput } from "@/lib/validation/parcel-schema";
import { slugify } from "@/data/parcels";
import { cn } from "@/lib/utils";

export function HomepageQueryCard({ className }: { className?: string }) {
  const router = useRouter();
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ParcelQueryInput>({
    defaultValues: { il: "İstanbul", ilce: "Pendik", ada: "", parsel: "", requesterEmail: "" }
  });

  function onSubmit(values: ParcelQueryInput) {
    setFormMessage(null);
    const result = validateParcelQuery(values);
    if (!result.ok) {
      Object.entries(result.errors).forEach(([name, message]) => {
        if (message) setError(name as keyof ParcelQueryInput, { type: "validate", message });
      });
      setFormMessage("Sorgu başlamadan önce kırmızı alanları düzeltin.");
      return;
    }
    router.push(`/sorgu/${result.data.ada}-${result.data.parsel}?il=${slugify(result.data.il)}&ilce=${slugify(result.data.ilce)}`);
  }

  return (
    <section className={cn("overflow-hidden rounded-[2rem] border border-white/60 bg-surface-2/95 shadow-[0_28px_90px_-62px_rgb(var(--accent-navy)/0.9)]", className)}>
      <div className="border-b border-border-subtle bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-navy)/0.10),transparent_38%),rgb(var(--surface-1)/0.72)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--accent-navy))] text-white">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <p className="section-eyebrow">MVP sorgu</p>
            <h2 className="text-xl font-black tracking-[-0.04em] text-fg-primary">Ada/parsel ile imar durumunu başlat</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-secondary">
          Önce 5 belediye/gerçek kaynak odağı: parsel kimliği, kaynak durumu, plan notu özeti ve “resmî belge değildir” uyarısı aynı akışta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="İl" error={errors.il?.message}>
            <input {...register("il")} className={inputClass(errors.il?.message)} autoComplete="address-level1" />
          </Field>
          <Field label="İlçe / belediye" error={errors.ilce?.message}>
            <input {...register("ilce")} className={inputClass(errors.ilce?.message)} autoComplete="address-level2" />
          </Field>
          <Field label="Ada" error={errors.ada?.message}>
            <input {...register("ada")} inputMode="numeric" className={inputClass(errors.ada?.message)} placeholder="Örn. 1245" />
          </Field>
          <Field label="Parsel" error={errors.parsel?.message}>
            <input {...register("parsel")} inputMode="numeric" className={inputClass(errors.parsel?.message)} placeholder="Örn. 17" />
          </Field>
        </div>
        <Field label="Bildirim e-postası (opsiyonel)" error={errors.requesterEmail?.message}>
          <input {...register("requesterEmail")} type="email" className={inputClass(errors.requesterEmail?.message)} placeholder="degisirse@haber.ver" />
        </Field>
        {formMessage && (
          <div className="rounded-2xl border border-status-warning/25 bg-status-warning/10 px-3 py-2 text-xs font-semibold text-status-warning">
            {formMessage}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Sorguyu aç
            <ArrowRight className="h-4 w-4" />
          </Button>
          <a href="/kaynaklar" className="inline-flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 text-sm font-bold text-fg-primary hover:bg-white">
            <ShieldCheck className="h-4 w-4 text-fg-secondary" />
            Kaynak durumunu gör
          </a>
        </div>
        <div className="flex items-start gap-2 rounded-2xl border border-border-subtle bg-surface-1/70 px-3 py-2 text-xs leading-relaxed text-fg-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fg-secondary" />
          Sorgu sonucu resmi belge yerine kaynaklı ön inceleme üretir; resmi belge için ilgili belediye/TKGM bağlantısı gösterilir.
        </div>
      </form>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-fg-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-semibold text-status-error">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return cn(
    "h-11 w-full rounded-2xl border bg-surface-2 px-3 text-sm font-semibold text-fg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] placeholder:text-fg-muted/70",
    error ? "border-status-error/45 bg-status-error/5" : "border-border-subtle focus:border-brand-navy"
  );
}
