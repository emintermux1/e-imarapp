import * as React from "react";
import { RiskIndicator } from "@/components/gis/risk-indicator";
import { useSemanticParcelAction } from "@/lib/maplibre/semantic-focus";
import type { ParcelProps } from "@/types/parcel";

export function SectionRiskler({ parcel }: { parcel: ParcelProps }) {
  const handleSemantic = useSemanticParcelAction(parcel);
  return (
    <div className="grid grid-cols-2 gap-2">
      <RiskIndicator
        label="Deprem (AFAD)"
        value={parcel.riskler.deprem}
        scale={5}
        source="AFAD Deprem Tehlike Haritası"
        actionLabel="Haritada Göster"
        onClick={() => handleSemantic("Deprem (AFAD)", "risk")}
      />
      <RiskIndicator
        label="Heyelan"
        value={parcel.riskler.heyelan}
        scale={3}
        source="MTA Heyelan Envanteri"
        actionLabel="Haritada Göster"
        onClick={() => handleSemantic("Heyelan", "risk")}
      />
      <RiskIndicator
        label="Sel"
        value={parcel.riskler.sel}
        scale={3}
        source="DSİ Taşkın Risk Haritaları"
        actionLabel="Haritada Göster"
        onClick={() => handleSemantic("Sel", "risk")}
      />
      <RiskIndicator
        label="Yangın"
        value={parcel.riskler.yangin}
        scale={3}
        source="OGM Yangın Riski"
        actionLabel="Haritada Göster"
        onClick={() => handleSemantic("Yangın", "risk")}
      />
    </div>
  );
}
