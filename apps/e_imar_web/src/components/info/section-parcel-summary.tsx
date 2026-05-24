"use client";

import * as React from "react";
import { AlertCircle, TrendingUp, MapPin, Satellite, FileSearch, Route, Mountain, Building2, Clock3 } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { sourceStatusLabel } from "@/lib/api/quality-labels";
import { metricValueTone } from "@/lib/ui/status-tones";
import { cn } from "@/lib/utils";
import type { ParcelProps } from "@/types/parcel";
import { PLAN_LAYER_LABELS, PLAN_STATUS_LABELS } from "@/data/zoning";
import { formatDate } from "@/lib/format";
import { getPlanChanges } from "@/data/historical-snapshots";

/**
 * Compact summary section that answers "what is this parcel?" at a glance.
 * Appears at the top of the right panel to help users quickly understand
 * the parcel's key characteristics and any critical issues.
 */
export function SectionParcelSummary({ parcel }: { parcel: ParcelProps }) {
  // Determine risk level from earthquake score (most critical)
  const riskLevel = getRiskLevel(parcel.riskler.deprem);
  
  // Identify top 1-2 constraints
  const topConstraints = (parcel.constraints ?? []).slice(0, 2);
  
  // Investment score interpretation
  const investmentGrade = getInvestmentGrade(parcel.yatirimSkoru);
  
  // Accessibility interpretation
  const accessibilityLevel = getAccessibilityLevel(parcel.cevre.ulasimSkoru);
  
  // Plan status interpretation
  const planStatusLabel = parcel.planStatus
    ? PLAN_STATUS_LABELS[parcel.planStatus] ?? parcel.planStatus
    : "Tanımlanmamış";

  const planLayerLabel = parcel.planLayer
    ? PLAN_LAYER_LABELS[parcel.planLayer] ?? parcel.planLayer
    : null;

  const hasCriticalIssue = topConstraints.length > 0 || riskLevel === "Yüksek";
  const planChanges = getPlanChanges(parcel.id);
  const latestChange = planChanges[planChanges.length - 1];
  const constructionScore = Math.max(0, Math.min(100, Math.round((parcel.yatirimSkoru * 0.55) + (parcel.cevre.ulasimSkoru * 0.25) + ((6 - parcel.riskler.deprem) * 4))));

  return (
    <section className="border-b border-border-subtle/80 bg-surface-1/50 px-3 py-3">
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {parcel.planScale && (
            <PlanContextBadge>{parcel.planScale}</PlanContextBadge>
          )}
          <PlanContextBadge>{planStatusLabel}</PlanContextBadge>
          {planLayerLabel && (
            <PlanContextBadge>{planLayerLabel}</PlanContextBadge>
          )}
        </div>
        {parcel.detailedUse && (
          <p className="text-xs leading-relaxed text-fg-secondary">
            <span className="font-medium text-fg-primary">{parcel.detailedUse}</span> olarak tanımlı
            {parcel.yapilasmaSekli === "Ayrik" && " ayrık nizam"}
            {parcel.yapilasmaSekli === "Bitisik" && " bitişik nizam"}
            {parcel.yapilasmaSekli === "Blok" && " blok nizam"} bölgede.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <MetricBadge
          label="Yatırım"
          value={investmentGrade}
          icon={<TrendingUp className="h-3 w-3" />}
          valueColor={metricValueTone(parcel.yatirimSkoru >= 75 ? "positive" : parcel.yatirimSkoru >= 50 ? "neutral" : "caution")}
        />
        <MetricBadge
          label="Risk"
          value={riskLevel}
          icon={<AlertCircle className="h-3 w-3" />}
          valueColor={metricValueTone(riskLevel === "Düşük" ? "positive" : riskLevel === "Orta" ? "caution" : "danger")}
        />
        <MetricBadge
          label="Erişim"
          value={accessibilityLevel}
          icon={<MapPin className="h-3 w-3" />}
          valueColor={metricValueTone(parcel.cevre.ulasimSkoru >= 75 ? "positive" : parcel.cevre.ulasimSkoru >= 50 ? "neutral" : "caution")}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoTile label="TAKS / KAKS" value={`${safeNumber(parcel.taks, 2)} / ${safeNumber(parcel.kaks, 2)}`} status="demo" />
        <InfoTile label="Kat sınırı" value={parcel.katSiniri > 0 ? `${parcel.katSiniri} kat` : "unavailable"} status={parcel.katSiniri > 0 ? "demo" : "unavailable"} />
        <InfoTile label="Son güncelleme" value={parcel.planOnayTarihi ? formatDate(parcel.planOnayTarihi) : "unavailable"} status={parcel.planOnayTarihi ? "demo" : "unavailable"} />
        <InfoTile label="Belediye" value={parcel.ilce ? `${parcel.ilce} / ${parcel.il}` : "unavailable"} status={parcel.ilce ? "public_metadata" : "unavailable"} />
        <InfoTile label="Risk skoru" value={`D${parcel.riskler.deprem} · S${parcel.riskler.sel}`} status="derived" icon={<AlertCircle className="h-3 w-3" />} />
        <InfoTile label="İnşaat uygunluğu" value={`${constructionScore}/100`} status="derived" icon={<Building2 className="h-3 w-3" />} />
        <InfoTile label="Yol cephesi" value={parcel.yolCephesiM > 0 ? `${parcel.yolCephesiM.toFixed(1)} m` : "unavailable"} status={parcel.yolCephesiM > 0 ? "demo" : "unavailable"} icon={<Route className="h-3 w-3" />} />
        <InfoTile label="Eğim yüzdesi" value="not_ready" status="not_ready" icon={<Mountain className="h-3 w-3" />} />
      </div>

      <div className="mt-3 grid gap-2">
        <PlaceholderCard
          icon={<FileSearch className="h-3.5 w-3.5" />}
          title="Resmi yorum özeti"
          status="not_ready"
          text="LLM servis sözleşmesi ve resmi veri kapsamı olmadan otomatik yorum üretilmez."
        />
        <PlaceholderCard
          icon={<MapPin className="h-3.5 w-3.5" />}
          title="Yakın projeler / POI"
          status="not_ready"
          text="Belediye proje ve POI kaynağı bağlı değil; yakın proje veya nokta adı uydurulmadı."
        />
        <PlaceholderCard
          icon={<Satellite className="h-3.5 w-3.5" />}
          title="Uydu önizleme"
          status="not_ready"
          text="Lisanslı uydu önizleme endpoint'i hazır değil; compare aracı placeholder yüzeyle sınırlı."
        />
        <PlaceholderCard
          icon={<Clock3 className="h-3.5 w-3.5" />}
          title="Tarihsel değişim"
          status={latestChange ? "demo" : "unavailable"}
          text={latestChange ? `${latestChange.yil}: ${latestChange.ozet}` : "Bu parsel için tarihsel kayıt bulunamadı."}
        />
      </div>

      {hasCriticalIssue && (
        <div className="rounded-md border border-[rgb(var(--status-warning))]/30 bg-[rgb(var(--status-warning))]/5 px-2.5 py-2">
          {topConstraints.length > 0 && (
            <div className="text-[10px] mb-1.5">
              <div className="uppercase tracking-wider text-fg-muted font-medium mb-1">
                Plan Kısıtı
              </div>
              <div className="flex flex-col gap-1">
                {topConstraints.map((constraint) => (
                  <div
                    key={constraint}
                    className="text-fg-secondary leading-snug"
                  >
                    · {constraint}
                  </div>
                ))}
              </div>
            </div>
          )}
          {riskLevel === "Yüksek" && (
            <div className="text-[10px] text-[rgb(var(--status-error))] font-medium">
              Deprem riski yüksek — ayrıntılar için Riskler sekmesini kontrol edin.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function InfoTile({
  label,
  value,
  status,
  icon
}: {
  label: string;
  value: string;
  status: "demo" | "derived" | "public_metadata" | "unavailable" | "not_ready";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 px-2 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]">
      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-fg-muted">
        {icon}
        {label}
      </span>
      <div className="mt-1 text-[12px] font-semibold tabular-nums text-fg-primary">{value}</div>
      <div className="mt-0.5 text-[9px] text-fg-muted">{sourceStatusLabel(status)}</div>
    </div>
  );
}

function PlaceholderCard({
  icon,
  title,
  status,
  text
}: {
  icon: React.ReactNode;
  title: string;
  status: "demo" | "not_ready" | "unavailable";
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-primary">
        <span className="text-fg-muted">{icon}</span>
        {title}
        <span className="ml-auto text-[9px] font-normal text-fg-muted">{sourceStatusLabel(status)}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{text}</p>
    </div>
  );
}

function safeNumber(value: number, digits: number) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(digits) : "unavailable";
}

function MetricBadge({
  label,
  value,
  icon,
  valueColor
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-2 px-2 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-fg-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("text-[11px] font-semibold text-fg-primary", valueColor)}>
        {value}
      </div>
    </div>
  );
}

function PlanContextBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-md border border-border-subtle bg-surface-1 px-1.5 text-[10px] font-medium text-fg-secondary">
      {children}
    </span>
  );
}

function getRiskLevel(depremLevel: 1 | 2 | 3 | 4 | 5): string {
  if (depremLevel >= 4) return "Yüksek";
  if (depremLevel === 3) return "Orta";
  return "Düşük";
}

function getInvestmentGrade(score: number): string {
  if (score >= 75) return "Yüksek";
  if (score >= 50) return "Orta";
  return "Düşük";
}

function getAccessibilityLevel(score: number): string {
  if (score >= 75) return "Çok İyi";
  if (score >= 60) return "İyi";
  if (score >= 40) return "Orta";
  return "Düşük";
}
