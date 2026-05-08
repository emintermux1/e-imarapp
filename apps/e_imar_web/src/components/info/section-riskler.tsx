import * as React from "react";
import { RiskIndicator } from "@/components/gis/risk-indicator";
import type { ParcelProps } from "@/types/parcel";

export function SectionRiskler({ parcel }: { parcel: ParcelProps }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <RiskIndicator
        label="Deprem (AFAD)"
        value={parcel.riskler.deprem}
        scale={5}
      />
      <RiskIndicator label="Heyelan" value={parcel.riskler.heyelan} scale={3} />
      <RiskIndicator label="Sel" value={parcel.riskler.sel} scale={3} />
      <RiskIndicator label="Yangın" value={parcel.riskler.yangin} scale={3} />
    </div>
  );
}
