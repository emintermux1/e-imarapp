"use client";

import * as React from "react";
import { FileText, MapPin, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateBackendReport } from "@/lib/api/backend-client";
import { humanizeApiError } from "@/lib/api/backend-client";

export type ReportFormValues = {
  queryType: "ada_parsel" | "koordinat" | "belediye";
  ada?: string;
  parselNo?: string;
  province?: string;
  district?: string;
  mahalle?: string;
  lng?: string;
  lat?: string;
  municipalityId?: string;
  title?: string;
};

interface Props {
  defaultQuery?: Partial<ReportFormValues>;
  onReportCreated?: (reportId: string) => void;
}

const FORM_FIELDS = [
  { key: "ada", label: "Ada", placeholder: "1234", width: "w-24" },
  { key: "parselNo", label: "Parsel No", placeholder: "5", width: "w-24" },
  { key: "province", label: "İl", placeholder: "İstanbul", width: "w-32" },
  { key: "district", label: "İlçe", placeholder: "Kadıköy", width: "w-32" },
  { key: "mahalle", label: "Mahalle", placeholder: "Fenerbahçe", width: "w-36" }
] as const;

export function ReportRequestForm({ defaultQuery, onReportCreated }: Props) {
  const [queryType, setQueryType] = React.useState<ReportFormValues["queryType"]>(
    defaultQuery?.queryType || "ada_parsel"
  );
  const [values, setValues] = React.useState<ReportFormValues>({
    queryType: "ada_parsel",
    ...defaultQuery
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const update = (key: keyof ReportFormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const response = await generateBackendReport({
        query: {
          type: queryType,
          ada: values.ada,
          parselNo: values.parselNo,
          province: values.province,
          district: values.district,
          mahalle: values.mahalle,
          lng: values.lng,
          lat: values.lat,
          municipalityId: values.municipalityId
        },
        title: values.title || undefined
      });

      if (response.id) {
        setDone(true);
        onReportCreated?.(String(response.id));
      } else {
        setError("Rapor oluşturuldu ancak ID alınamadı.");
      }
    } catch (err) {
      setError(humanizeApiError(err, "Rapor isteği gönderilemedi."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] border border-white/45 bg-surface-2/94 p-4 shadow-[0_1px_0_rgb(255_255_255/0.58)_inset,0_20px_50px_-38px_rgb(var(--accent-navy)/0.44)] backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--accent-navy))] text-white">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <h2 className="section-eyebrow">
            Rapor Oluştur
          </h2>
          <p className="mt-0.5 text-[10px] text-fg-muted">
            Parsel bilgilerini girerek imar durum raporu talep edin.
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-1 p-0.5">
        {(["ada_parsel", "koordinat", "belediye"] as const).map((qt) => (
          <button
            key={qt}
            type="button"
            onClick={() => {
              setQueryType(qt);
              update("queryType", qt);
            }}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
              queryType === qt
                ? "bg-surface-2 text-fg-primary shadow-card border border-border-subtle"
                : "text-fg-muted hover:text-fg-secondary"
            )}
          >
            {qt === "ada_parsel" && "Ada/Parsel"}
            {qt === "koordinat" && "Koordinat"}
            {qt === "belediye" && "Belediye"}
          </button>
        ))}
      </div>

      {queryType === "ada_parsel" && (
        <div className="flex flex-wrap gap-2">
          {FORM_FIELDS.map(({ key, label, placeholder, width }) => (
            <div key={key} className={cn("flex flex-col gap-1", width)}>
              <label className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
                {label}
              </label>
              <input
                type="text"
                value={(values as Record<string, string>)[key] || ""}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="h-8 rounded-lg border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-primary placeholder:text-fg-muted/60 focus:border-brand-blue focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {queryType === "koordinat" && (
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Boylam</label>
            <input
              type="text"
              value={values.lng || ""}
              onChange={(e) => update("lng", e.target.value)}
              placeholder="28.98"
              className="h-8 rounded-lg border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-primary placeholder:text-fg-muted/60 focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Enlem</label>
            <input
              type="text"
              value={values.lat || ""}
              onChange={(e) => update("lat", e.target.value)}
              placeholder="41.01"
              className="h-8 rounded-lg border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-primary placeholder:text-fg-muted/60 focus:border-brand-blue focus:outline-none"
            />
          </div>
        </div>
      )}

      {queryType === "belediye" && (
        <div className="flex flex-col gap-1 w-48">
          <label className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Belediye ID</label>
          <input
            type="text"
            value={values.municipalityId || ""}
            onChange={(e) => update("municipalityId", e.target.value)}
            placeholder="kadikoy-belediyesi"
            className="h-8 rounded-lg border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-primary placeholder:text-fg-muted/60 focus:border-brand-blue focus:outline-none"
          />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
          Rapor başlığı (opsiyonel)
        </label>
        <input
          type="text"
          value={values.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Örn: Kadıköy 1234/5 İmar Durum Raporu"
          className="h-8 rounded-lg border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-primary placeholder:text-fg-muted/60 focus:border-brand-blue focus:outline-none"
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-status-error/35 bg-status-error/6 px-2.5 py-1.5 text-[11px] text-status-error">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {done && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-status-success/35 bg-status-success/6 px-2.5 py-1.5 text-[11px] text-status-success font-semibold">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          Rapor talebi oluşturuldu.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {loading ? "Gönderiliyor…" : "Rapor Talep Et"}
        </Button>
        {!done && (
          <span className="text-[10px] text-fg-muted inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Rapor isteği backend kuyruğuna eklenir.
          </span>
        )}
      </div>
    </form>
  );
}
