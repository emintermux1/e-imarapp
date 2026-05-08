"use client";

import * as React from "react";
import { Calculator, RotateCcw, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { simulateBackendCompliance } from "@/lib/api/backend-client";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { computeEmsal, validateEmsalInput, EMSAL_DEFAULTS } from "@/lib/math/emsal";
import {
  formatTL,
  formatInt,
  formatPercent,
  formatArea
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { ParcelProps } from "@/types/parcel";
import { EmsalResultCard } from "./emsal-result-card";

interface NumericFieldProps {
  id: string;
  label: string;
  hint?: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
  max?: number;
  inputMode?: "decimal" | "numeric";
  warning?: boolean;
}

function NumericField({
  id,
  label,
  hint,
  unit,
  value,
  onChange,
  step,
  min,
  max,
  inputMode = "decimal",
  warning
}: NumericFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[11px] uppercase tracking-wider text-fg-muted"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md border bg-surface-2 transition-colors",
          warning ? "border-status-warning" : "border-border-strong focus-within:border-fg-secondary"
        )}
      >
        <input
          id={id}
          inputMode={inputMode}
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-9 w-full bg-transparent px-2.5 text-sm tabular-nums text-fg-primary",
            "outline-none focus-visible:outline-none"
          )}
        />
        {unit && (
          <span className="px-2 text-[11px] tabular-nums text-fg-muted shrink-0">
            {unit}
          </span>
        )}
      </div>
      {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
    </div>
  );
}

function parseInput(raw: string): number {
  const v = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

export interface EmsalDialogContentProps {
  parcel?: ParcelProps;
  embed?: boolean;
}

export function EmsalDialogContent({ parcel, embed }: EmsalDialogContentProps) {
  const getBackendGeometry = useBackendParcelStore((s) => s.getGeometry);
  const initial = React.useMemo(() => {
    if (parcel) {
      return {
        arsa: String(parcel.yuzolcumuM2),
        taks: parcel.taks.toString().replace(".", ","),
        kaks: parcel.kaks.toString().replace(".", ","),
        gabari: parcel.gabariM.toString().replace(".", ","),
        katYuksekligi: "3",
        ortDaire: "90",
        insMaliyet: "28000",
        satisFiyati: "85000",
        yolCephesi: parcel.yolCephesiM.toString().replace(".", ",")
      };
    }
    return {
      arsa: "1.000",
      taks: "0,40",
      kaks: "2,40",
      gabari: "24,5",
      katYuksekligi: "3",
      ortDaire: "90",
      insMaliyet: "28000",
      satisFiyati: "85000",
      yolCephesi: "10"
    };
  }, [parcel]);

  const [arsa, setArsa] = React.useState(initial.arsa);
  const [taks, setTaks] = React.useState(initial.taks);
  const [kaks, setKaks] = React.useState(initial.kaks);
  const [gabari, setGabari] = React.useState(initial.gabari);
  const [katYuksekligi, setKatYuksekligi] = React.useState(initial.katYuksekligi);
  const [ortDaire, setOrtDaire] = React.useState(initial.ortDaire);
  const [insMaliyet, setInsMaliyet] = React.useState(initial.insMaliyet);
  const [satisFiyati, setSatisFiyati] = React.useState(initial.satisFiyati);
  const [yolCephesi, setYolCephesi] = React.useState(initial.yolCephesi);

  const input = {
    arsaM2: parseInput(arsa),
    taks: parseInput(taks),
    kaks: parseInput(kaks),
    gabariM: parseInput(gabari),
    katYuksekligiM: parseInput(katYuksekligi),
    ortalamaDaireM2: parseInput(ortDaire),
    insaatMaliyetiM2: parseInput(insMaliyet),
    satisFiyatiM2: parseInput(satisFiyati),
    yolCephesiM: parseInput(yolCephesi)
  };

  const errors = validateEmsalInput(input);
  const result = errors.length === 0 ? computeEmsal(input) : null;
  const backendGeometry = parcel?.id ? getBackendGeometry(parcel.id) : null;
  const [compliance, setCompliance] = React.useState<{
    state: "idle" | "loading" | "success" | "error";
    compliant?: boolean;
    messages: string[];
  }>({ state: "idle", messages: [] });

  function reset() {
    setArsa(initial.arsa);
    setTaks(initial.taks);
    setKaks(initial.kaks);
    setGabari(initial.gabari);
    setKatYuksekligi(initial.katYuksekligi);
    setOrtDaire(initial.ortDaire);
    setInsMaliyet(initial.insMaliyet);
    setSatisFiyati(initial.satisFiyati);
    setYolCephesi(initial.yolCephesi);
  }

  async function validateWithBackend() {
    if (!parcel || !backendGeometry || !result) return;
    setCompliance({ state: "loading", messages: ["Canlı API uygunluk kontrolü çalışıyor…"] });
    try {
      const response = await simulateBackendCompliance({
        parcel_id: parcel.backendId,
        geometry: backendGeometry,
        parcel_area_m2: input.arsaM2,
        emsal: input.kaks,
        kaks: input.kaks,
        taks: input.taks,
        gabari_m: input.gabariM,
        floors: result.hesaplananKatSayisi,
        floor_height_m: input.katYuksekligiM
      });
      const violations = [...(response.violations ?? []), ...(response.warnings ?? [])]
        .map((item) => typeof item === "string" ? item : item.message ?? item.rule ?? JSON.stringify(item));
      const compliant = response.compliant ?? response.is_compliant ?? violations.length === 0;
      setCompliance({
        state: "success",
        compliant,
        messages: violations.length > 0 ? violations : [compliant ? "API kontrolü: belirgin ihlal bulunmadı" : "API kontrolü tamamlandı"]
      });
    } catch {
      setCompliance({
        state: "error",
        messages: ["Uygunluk API'sine ulaşılamıyor — yerel hesap sonuçları korunuyor"]
      });
    }
  }

  return (
    <div
      className={cn(
        "grid gap-0",
        embed
          ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
      )}
    >
      {/* Inputs */}
      <section className="p-5 border-b lg:border-b-0 lg:border-r border-border-subtle bg-surface-2">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-fg-primary">
              Parametreler
            </h3>
            <p className="text-[11px] text-fg-muted">
              Tüm değerler Türkçe ondalık (virgül) formatında girilir.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Sıfırla">
            <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumericField id="arsa" label="Arsa Yüzölçümü" unit="m²" value={arsa} onChange={setArsa} />
          <NumericField id="yolCephesi" label="Yol Cephesi" unit="m" value={yolCephesi} onChange={setYolCephesi} />
          <NumericField id="taks" label="TAKS" hint="0–1 arası" value={taks} onChange={setTaks} />
          <NumericField id="kaks" label="KAKS · Emsal" hint="m²/m²" value={kaks} onChange={setKaks} />
          <NumericField id="gabari" label="Gabari" unit="m" value={gabari} onChange={setGabari} />
          <NumericField
            id="katYuksek"
            label="Ortalama Kat Yüksekliği"
            unit="m"
            hint={`Varsayılan ${EMSAL_DEFAULTS.katYuksekligiM} m`}
            value={katYuksekligi}
            onChange={setKatYuksekligi}
          />
          <NumericField
            id="ortDaire"
            label="Ortalama Daire"
            unit="m²"
            hint={`Varsayılan ${EMSAL_DEFAULTS.ortalamaDaireM2} m²`}
            value={ortDaire}
            onChange={setOrtDaire}
          />
          <div />
          <NumericField
            id="insMaliyet"
            label="m² İnşaat Maliyeti"
            unit="₺/m²"
            value={insMaliyet}
            onChange={setInsMaliyet}
          />
          <NumericField
            id="satisFiyati"
            label="m² Satış Fiyatı"
            unit="₺/m²"
            value={satisFiyati}
            onChange={setSatisFiyati}
          />
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-[12px] text-status-warning flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Düzeltilmesi gerekenler
            </span>
            {errors.map((e, i) => (
              <span key={i} className="ml-5 list-disc text-fg-secondary">
                · {e}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Outputs */}
      <section className="p-5 bg-surface-1/30">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-fg-primary inline-flex items-center gap-2">
            <Calculator className="h-4 w-4 text-fg-muted" /> Hesap Sonuçları
          </h3>
          <p className="text-[11px] text-fg-muted">
            Sonuçlar gerçek zamanlı güncellenir. Yatırım kararı için profesyonel destek alınız.
          </p>
        </header>

        {!result ? (
          <div className="rounded-md border border-dashed border-border-subtle bg-surface-2 p-6 text-center text-[13px] text-fg-muted">
            Geçerli giriş bekleniyor.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <EmsalResultCard
                label="Toplam Yapı Alanı"
                value={formatArea(result.toplamYapiAlaniM2)}
                hint={`Taban alanı ≈ ${formatArea(result.tabanAlaniM2)}`}
              />
              <EmsalResultCard
                label="Kat Sayısı"
                value={`${result.hesaplananKatSayisi} kat`}
                hint={`Kat yüksekliği ${parseInput(katYuksekligi).toFixed(1)} m varsayıldı`}
              />
              <EmsalResultCard
                label="Daire Sayısı"
                value={`${formatInt(result.daireSayisi)} adet`}
                hint={`Ortalama daire ${parseInput(ortDaire).toFixed(0)} m²`}
              />
              <EmsalResultCard
                label="Daire Başı Brüt Kar"
                value={formatTL(result.daireBasiBrutKarTL)}
                tone={result.daireBasiBrutKarTL >= 0 ? "success" : "error"}
              />
              <EmsalResultCard
                label="Tahmini İnşaat Maliyeti"
                value={formatTL(result.insaatMaliyetiTL)}
              />
              <EmsalResultCard
                label="Tahmini Satış Geliri"
                value={formatTL(result.tahminiSatisGeliriTL)}
              />
              <EmsalResultCard
                label="Brüt Kar"
                value={formatTL(result.brutKarTL)}
                tone={result.brutKarTL >= 0 ? "success" : "error"}
              />
              <EmsalResultCard
                label="ROI"
                value={formatPercent(result.roiYuzde, 1)}
                tone={
                  result.roiYuzde >= 15
                    ? "success"
                    : result.roiYuzde >= 5
                    ? "warning"
                    : "error"
                }
                hint="Brüt kar / inşaat maliyeti"
              />
            </div>
            {result.uyarilar.length > 0 && (
              <div className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2.5">
                <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                  Yapılaşma Uyarıları
                </span>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {result.uyarilar.map((u, i) => (
                    <li
                      key={i}
                      className="text-[12px] leading-relaxed text-fg-secondary inline-flex items-start gap-2"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-status-warning shrink-0 mt-0.5" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                    Resmi Uygunluk Kontrolü
                  </span>
                  <p className="text-[11px] text-fg-muted">
                    {backendGeometry
                      ? "Canlı geometri ile FastAPI simülasyonu"
                      : "Canlı API geometrisi olmayan parsellerde doğrulama kapalı"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateWithBackend}
                  disabled={!backendGeometry || !result || compliance.state === "loading"}
                >
                  {compliance.state === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  API ile doğrula
                </Button>
              </div>
              {compliance.messages.length > 0 && (
                <div
                  className={cn(
                    "mt-2 rounded-sm border px-2 py-1.5 text-[12px]",
                    compliance.state === "success" && compliance.compliant
                      ? "border-status-success/40 bg-status-success/10 text-status-success"
                      : compliance.state === "error" || compliance.compliant === false
                      ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                      : "border-border-subtle bg-surface-1 text-fg-secondary"
                  )}
                >
                  {compliance.messages.map((message, index) => (
                    <div key={`${message}-${index}`}>{message}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
