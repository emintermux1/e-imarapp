import * as React from "react";
import { DataRow } from "@/components/gis/data-card";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { SourceBadge } from "@/components/gis/source-badge";
import { formatArea, formatDate } from "@/lib/format";
import type { ParcelProps } from "@/types/parcel";

const YAPILASMA_LABEL: Record<ParcelProps["yapilasmaSekli"], string> = {
  Ayrik: "Ayrık Nizam",
  Bitisik: "Bitişik Nizam",
  Blok: "Blok Nizam"
};

export function SectionImar({ parcel }: { parcel: ParcelProps }) {
  const isLiveUnknown = parcel.sourceStatus === "live" && parcel.taks === 0 && parcel.kaks === 0;
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
          <span className="inline-flex items-center gap-2">
            <ZoningBadge type={parcel.zoningType} size="xs" />
          </span>
        }
      />
      <DataRow
        label="Yapılaşma"
        value={YAPILASMA_LABEL[parcel.yapilasmaSekli]}
      />
      <DataRow
        label="TAKS"
        value={isLiveUnknown ? "Bilinmiyor" : parcel.taks.toFixed(2)}
        hint={isLiveUnknown ? "Canlı parsel kaydında imar parametresi yok" : `Maks. taban alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.taks)}`}
      />
      <DataRow
        label="KAKS · Emsal"
        value={isLiveUnknown ? "Bilinmiyor" : parcel.kaks.toFixed(2)}
        hint={isLiveUnknown ? "Plan servisi eşleşmesi bekleniyor" : `Toplam yapı alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.kaks)}`}
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
      <DataRow label="Plan Adı" value={parcel.planAdi} />
      <DataRow
        label="Onay Tarihi"
        value={formatDate(parcel.planOnayTarihi)}
      />
    </div>
  );
}
