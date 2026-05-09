"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { DataRow } from "@/components/gis/data-card";
import { formatArea, formatLngLatPrecise } from "@/lib/format";
import {
  buildFlyTargetFromLocationTarget,
  findBestLocationTarget,
} from "@/data/location-navigation";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import type { ParcelProps } from "@/types/parcel";
import { cn } from "@/lib/utils";
import type { LocationTarget } from "@/data/location-navigation";

interface SectionProps {
  parcel: ParcelProps;
}

export function SectionKonum({ parcel }: SectionProps) {
  const utm = mockUTM(parcel.centroid?.[0] ?? 0, parcel.centroid?.[1] ?? 0);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const mahalleTarget = React.useMemo(
    () => findBestLocationTarget({ il: parcel.il, ilce: parcel.ilce, mahalle: parcel.mahalle }),
    [parcel.il, parcel.ilce, parcel.mahalle]
  );
  const ilceTarget = React.useMemo(
    () => findBestLocationTarget({ il: parcel.il, ilce: parcel.ilce }),
    [parcel.il, parcel.ilce]
  );
  const ilTarget = React.useMemo(
    () => findBestLocationTarget({ il: parcel.il }),
    [parcel.il]
  );

  function goToTarget(
    target: LocationTarget | undefined,
    zoomOverride?: number
  ) {
    if (!target) return;
    setSelectedParcelId(parcel.id);
    setRightPanelOpen(true);
    flyTo(buildFlyTargetFromLocationTarget(target, { zoom: zoomOverride }));
  }

  return (
    <div className="grid gap-0">
      <DataRow label="Ada" value={parcel.ada} />
      <DataRow label="Parsel" value={parcel.parsel} />
      <DataRow label="Pafta" value={parcel.pafta ?? "—"} />
      <JumpRow
        label="Mahalle"
        value={parcel.mahalle}
        affordance="Haritada Aç"
        onClick={() => goToTarget(mahalleTarget, 14.5)}
        disabled={!mahalleTarget}
      />
      <JumpRow
        label="İlçe"
        value={parcel.ilce}
        affordance="Git"
        onClick={() => goToTarget(ilceTarget, 12.5)}
        disabled={!ilceTarget}
      />
      <JumpRow
        label="İl"
        value={parcel.il}
        affordance="Git"
        onClick={() => goToTarget(ilTarget, 10)}
        disabled={!ilTarget}
      />
      <DataRow label="Yüzölçümü" value={formatArea(parcel.yuzolcumuM2)} />
      <DataRow
        label="Tapu Tipi"
        value={tapuLabel(parcel.tapuTipi)}
      />
      <JumpRow
        label="Koordinat"
        value={
          parcel.centroid
            ? formatLngLatPrecise(parcel.centroid[0], parcel.centroid[1])
            : "—"
        }
        hint="WGS84 / EPSG:4326"
        affordance="Merkeze Git"
        onClick={() =>
          parcel.centroid &&
          goToTarget(
            {
              label: `${parcel.ada}/${parcel.parsel}`,
              center: parcel.centroid,
              zoom: 17,
              kind: "parcel",
              il: parcel.il,
              ilce: parcel.ilce,
              mahalle: parcel.mahalle,
              parcelId: parcel.id
            },
            17
          )
        }
        disabled={!parcel.centroid}
      />
      <DataRow
        label="UTM"
        value={utm ?? "—"}
        hint="Yaklaşık ETRS89 / TM Zone"
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

function mockUTM(lng: number, lat: number) {
  if (!lng || !lat) return null;
  // Compute a fake but plausible TM zone coordinate. Türkiye için 6 derecelik
  // dilim (Zone 30..38), TM_30 başlangıç meridyeni 27°.
  const zone = Math.floor((lng + 180) / 6) + 1;
  const x = Math.round(500_000 + (lng - (zone - 1) * 6 + 180) * 70_000);
  const y = Math.round(lat * 110_000);
  return `${x.toLocaleString("tr-TR")} E · ${y.toLocaleString("tr-TR")} N · TM${zone}`;
}

function JumpRow({
  label,
  value,
  hint,
  affordance,
  onClick,
  disabled
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  affordance: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[100px_1fr] items-baseline gap-3 py-1.5 border-b border-border-subtle/60 last:border-b-0",
        disabled ? "opacity-60" : ""
      )}
    >
      <dt className="text-[11px] uppercase tracking-wider text-fg-muted">
        {label}
      </dt>
      <dd className="min-w-0">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={disabled ? undefined : "Haritada bu konuma git"}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-sm text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-inset",
            disabled
              ? "cursor-not-allowed"
              : "hover:bg-surface-1 hover:text-fg-primary"
          )}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm tabular-nums text-fg-primary truncate">
              {value}
            </span>
            {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-secondary">
            {affordance}
            <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </dd>
    </div>
  );
}
