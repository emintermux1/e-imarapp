import { DataCard, RiskIndicator, ZoningBadge } from "../domain/Cards";
import { ParcelWorkflowResponse } from "@/lib/types";

export function RightInfoPanel({ data }: { data?: ParcelWorkflowResponse | null }) {
  const parcel = data?.parcelQuery?.parcels?.[0] ?? {};
  const summary = data?.potentialSummary?.summary;

  return (
    <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Parsel Bilgisi</h2>
        <ZoningBadge label={(data?.status ?? "idle").toUpperCase()} tone="blue" />
      </div>

      <DataCard title="Temel Bilgiler">
        <dl className="space-y-1">
          <div className="flex justify-between"><dt>Ada</dt><dd>{String(parcel.ada ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>Parsel</dt><dd>{String(parcel.parsel_no ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>Zoning</dt><dd>{String(parcel.zoning_function ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>Emsal</dt><dd>{String(parcel.emsal ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>TAKS</dt><dd>{String(parcel.taks ?? "-")}</dd></div>
        </dl>
      </DataCard>

      <DataCard title="Analiz Özeti">
        <dl className="space-y-1">
          <div className="flex justify-between"><dt>Max Bina Tipi</dt><dd>{summary?.maxBuildingType ?? "-"}</dd></div>
          <div className="flex justify-between"><dt>Kat Sayısı</dt><dd>{String(summary?.estimatedFloors ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>Bağımsız Bölüm</dt><dd>{String(summary?.estimatedIndependentUnits ?? "-")}</dd></div>
          <div className="flex justify-between"><dt>Otopark</dt><dd>{String(summary?.estimatedParkingNeed ?? "-")}</dd></div>
        </dl>
        <div className="mt-3">
          <RiskIndicator score={summary?.riskScore} />
        </div>
      </DataCard>
    </aside>
  );
}
