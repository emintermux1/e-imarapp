"use client";

import * as React from "react";
import { AlertCircle, TrendingUp, MapPin } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { cn } from "@/lib/utils";
import type { ParcelProps } from "@/types/parcel";
import { PLAN_LAYER_LABELS, PLAN_STATUS_LABELS } from "@/data/zoning";

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

  return (
    <section className="px-3 py-3 border-b border-border-subtle bg-surface-1/50">
      {/* Plan context */}
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

      {/* Key metrics and warnings */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <MetricBadge
          label="Yatırım"
          value={investmentGrade}
          icon={<TrendingUp className="h-3 w-3" />}
          valueColor={
            parcel.yatirimSkoru >= 75
              ? "text-[rgb(var(--status-success))]"
              : parcel.yatirimSkoru >= 50
              ? "text-[rgb(var(--accent-blue))]"
              : "text-[rgb(var(--status-warning))]"
          }
        />
        <MetricBadge
          label="Risk"
          value={riskLevel}
          icon={<AlertCircle className="h-3 w-3" />}
          valueColor={
            riskLevel === "Düşük"
              ? "text-[rgb(var(--status-success))]"
              : riskLevel === "Orta"
              ? "text-[rgb(var(--status-warning))]"
              : "text-[rgb(var(--status-error))]"
          }
        />
        <MetricBadge
          label="Erişim"
          value={accessibilityLevel}
          icon={<MapPin className="h-3 w-3" />}
          valueColor={
            parcel.cevre.ulasimSkoru >= 75
              ? "text-[rgb(var(--status-success))]"
              : parcel.cevre.ulasimSkoru >= 50
              ? "text-[rgb(var(--accent-blue))]"
              : "text-[rgb(var(--status-warning))]"
          }
        />
      </div>

      {/* Critical constraints or warnings */}
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
    <div className="rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 flex flex-col gap-1">
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
    <span className="inline-flex h-5 items-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[10px] font-medium text-fg-secondary">
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
