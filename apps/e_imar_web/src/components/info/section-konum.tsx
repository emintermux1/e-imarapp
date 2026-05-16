import * as React from "react";
import { DataRow } from "@/components/gis/data-card";
import { SourceBadge } from "@/components/gis/source-badge";
import { formatArea, formatLngLatPrecise } from "@/lib/format";
import type { ParcelProps } from "@/types/parcel";

interface SectionProps {
  parcel: ParcelProps;
}

export function SectionKonum({ parcel }: SectionProps) {
  const tm = approximateTurkeyTmCoordinate(parcel.centroid?.[0] ?? 0, parcel.centroid?.[1] ?? 0);
  return (
    <div className="grid gap-0">
      <DataRow
        label="Kaynak"
        value={<SourceBadge status={parcel.sourceStatus ?? "demo"} />}
        hint={parcel.sourceStatus === "live" ? "Tapu/parsel öznitelikleri canlı API'den gelir" : "Yerel örnek parsel seti"}
      />
      <DataRow label="Ada" value={parcel.ada} />
      <DataRow label="Parsel" value={parcel.parsel} />
      <DataRow label="Pafta" value={parcel.pafta ?? "—"} />
      <DataRow label="Mahalle" value={parcel.mahalle} />
      <DataRow label="İlçe" value={parcel.ilce} />
      <DataRow label="İl" value={parcel.il} />
      <DataRow label="Yüzölçümü" value={formatArea(parcel.yuzolcumuM2)} />
      <DataRow
        label="Tapu Tipi"
        value={tapuLabel(parcel.tapuTipi)}
      />
      <DataRow
        label="Koordinat"
        value={
          parcel.centroid
            ? formatLngLatPrecise(parcel.centroid[0], parcel.centroid[1])
            : "—"
        }
        hint="WGS84 / EPSG:4326"
      />
      <DataRow
        label="UTM"
        value={
          <span className="inline-flex items-center gap-2">
            {tm ?? "—"}
            {tm && <SourceBadge status="computed" label="Yaklaşık" />}
          </span>
        }
        hint="Yaklaşık gösterim; resmi koordinat dönüşümü değildir"
      />
    </div>
  );
}

function tapuLabel(t: ParcelProps["tapuTipi"]) {
  switch (t) {
    case "Bag":
      return "Bağ";
    case "Bahce":
      return "Bahçe";
    default:
      return t;
  }
}

function approximateTurkeyTmCoordinate(lng: number, lat: number) {
  if (!lng || !lat) return null;
  const zone = Math.floor((lng + 180) / 6) + 1;
  const x = Math.round(500_000 + (lng - (zone - 1) * 6 + 180) * 70_000);
  const y = Math.round(lat * 110_000);
  return `${x.toLocaleString("tr-TR")} E · ${y.toLocaleString("tr-TR")} N · TM${zone}`;
}
