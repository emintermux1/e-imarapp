import * as React from "react";
import { DataRow } from "@/components/gis/data-card";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { formatArea, formatDate } from "@/lib/format";
import type { ParcelProps } from "@/types/parcel";

const YAPILASMA_LABEL: Record<ParcelProps["yapilasmaSekli"], string> = {
  Ayrik: "Ayrık Nizam",
  Bitisik: "Bitişik Nizam",
  Blok: "Blok Nizam"
};

export function SectionImar({ parcel }: { parcel: ParcelProps }) {
  return (
    <div className="grid gap-0">
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
        value={parcel.taks.toFixed(2)}
        hint={`Maks. taban alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.taks)}`}
      />
      <DataRow
        label="KAKS · Emsal"
        value={parcel.kaks.toFixed(2)}
        hint={`Toplam yapı alanı ≈ ${formatArea(parcel.yuzolcumuM2 * parcel.kaks)}`}
      />
      <DataRow
        label="Gabari"
        value={`${parcel.gabariM.toFixed(1)} m`}
      />
      <DataRow
        label="Kat Sınırı"
        value={`${parcel.katSiniri} kat`}
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
