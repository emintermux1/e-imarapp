import * as React from "react";
import { DataRow } from "@/components/gis/data-card";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { SourceBadge } from "@/components/gis/source-badge";
import { formatArea, formatDate } from "@/lib/format";
import { PLAN_LAYER_LABELS, PLAN_STATUS_LABELS } from "@/data/zoning";
import type { ParcelProps } from "@/types/parcel";
import { resolveSemanticParcelAction, useSemanticParcelAction } from "@/lib/maplibre/semantic-focus";

const YAPILASMA_LABEL: Record<ParcelProps["yapilasmaSekli"], string> = {
  Ayrik: "Ayrık Nizam",
  Bitisik: "Bitişik Nizam",
  Blok: "Blok Nizam"
};

export function SectionImar({ parcel }: { parcel: ParcelProps }) {
  const isLiveUnknown = parcel.sourceStatus === "live" && parcel.taks === 0 && parcel.kaks === 0;
  const constraints = (parcel.constraints ?? []).slice(0, 6);
  const handleSemantic = useSemanticParcelAction(parcel);

  return (
    <div className="grid gap-0">
      <DataRow
        label="Veri Kaynağı"
        value={<SourceBadge status={parcel.sourceStatus ?? "demo"} />}
        hint={parcel.sourceNote}
      />
      <DataRow
        label="Plan Kullanımı"
        value={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <ZoningBadge type={parcel.zoningType} size="xs" />
            {parcel.detailedUse && (
              <span className="text-[12px] font-semibold text-fg-primary">
                {parcel.detailedUse}
              </span>
            )}
          </span>
        }
      />
      {(parcel.planScale || parcel.planStatus || parcel.planLayer) && (
        <DataRow
          label="Plan Katmanı"
          value={
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              {parcel.planScale && <PlanBadge>{parcel.planScale}</PlanBadge>}
              {parcel.planStatus && (
                <PlanBadge>{PLAN_STATUS_LABELS[parcel.planStatus]}</PlanBadge>
              )}
              {parcel.planLayer && (
                <PlanBadge>{PLAN_LAYER_LABELS[parcel.planLayer]}</PlanBadge>
              )}
            </span>
          }
        />
      )}
      <DataRow
        label="Yapılaşma"
        value={YAPILASMA_LABEL[parcel.yapilasmaSekli]}
      />
      <DataRow
        label="TAKS"
        value={isLiveUnknown ? "Bilinmiyor" : parcel.taks.toFixed(2)}
        hint={
          isLiveUnknown
            ? "Canlı parsel kaydında imar parametresi yok"
            : `Maks. taban alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.taks)}`
        }
      />
      <DataRow
        label="KAKS · Emsal"
        value={isLiveUnknown ? "Bilinmiyor" : parcel.kaks.toFixed(2)}
        hint={
          isLiveUnknown
            ? "Plan servisi eşleşmesi bekleniyor"
            : `Toplam yapı alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.kaks)}`
        }
      />
      <DataRow
        label="Gabari"
        value={isLiveUnknown ? "Bilinmiyor" : `${parcel.gabariM.toFixed(1)} m`}
      />
      <DataRow
        label="Kat Sınırı"
        value={isLiveUnknown ? "Bilinmiyor" : `${parcel.katSiniri} kat`}
      />
      <DataRow
        label="Yol Cephesi"
        value={`${parcel.yolCephesiM.toFixed(1)} m`}
      />
      {constraints.length > 0 && (
        <div className="px-3 py-3 border-b border-border-subtle bg-surface-1/35">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-muted">
            Plan Kısıtları
          </div>
          <div className="mt-2 grid gap-1.5">
            {constraints.map((constraint) =>
              resolveSemanticParcelAction(constraint, "constraint") ? (
                <button
                  key={constraint}
                  type="button"
                  onClick={() => handleSemantic(constraint, "constraint")}
                  className="group flex items-start justify-between gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 text-left text-[11px] leading-snug text-fg-secondary transition-colors hover:border-border-strong hover:bg-surface-1"
                >
                  <span className="flex items-start gap-2 min-w-0">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-navy))]" />
                    <span>{constraint}</span>
                  </span>
                  <span className="shrink-0 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted group-hover:text-fg-primary">
                    Katmanı Aç
                  </span>
                </button>
              ) : (
                <div
                  key={constraint}
                  className="flex items-start gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 text-[11px] leading-snug text-fg-secondary"
                >
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-navy))]" />
                  <span>{constraint}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
      <DataRow label="Plan Adı" value={parcel.planAdi} />
      <DataRow
        label="Onay Tarihi"
        value={formatDate(parcel.planOnayTarihi)}
      />
    </div>
  );
}

function PlanBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[10px] font-medium text-fg-secondary">
      {children}
    </span>
  );
}
