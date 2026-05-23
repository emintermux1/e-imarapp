"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BootstrapResponse, ParcelWorkflowResponse } from "@/lib/types";
import { LeftSidebar } from "../shell/LeftSidebar";
import { RightInfoPanel } from "../shell/RightInfoPanel";
import { MapViewport } from "../map/MapViewport";
import { DataCard } from "../domain/Cards";

export function WorkspaceClient({ parcelId }: { parcelId?: string }) {
  const { data: bootstrap } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api.getBootstrap<BootstrapResponse>(),
  });

  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ["workflow", parcelId ?? "default"],
    queryFn: () =>
      api.parcelWorkflow<ParcelWorkflowResponse>({
        userReference: "web-next-user",
        query: parcelId
          ? { type: "ada_parsel", ada: parcelId, parselNo: "1" }
          : { type: "coordinate", longitude: 29.06, latitude: 41.02, srid: 4326 },
      }),
  });

  return (
    <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
      <LeftSidebar />
      <section className="space-y-3">
        <MapViewport />
        <DataCard title="Çalışma Durumu">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge label={`bootstrap: ${bootstrap?.status ?? "loading"}`} />
            <Badge label={`workflow: ${workflow?.status ?? (isLoading ? "loading" : "idle")}`} />
            <Badge label={`tile: ${bootstrap?.map?.tileStatus?.status ?? "unknown"}`} />
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-700">
              {(error as Error).message}
            </p>
          ) : null}
        </DataCard>
      </section>
      <RightInfoPanel data={workflow ?? undefined} />
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
      {label}
    </span>
  );
}
