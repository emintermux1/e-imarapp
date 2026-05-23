"use client";

import { SimulationPanel } from "@/components/SimulationPanel";
import { CesiumViewer } from "@/components/CesiumViewer";
import { NativeMapCanvas } from "@/components/NativeMapCanvas";
import { Building2, Globe } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="-mx-4 -my-4 min-h-[calc(100dvh-3.5rem)] space-y-4 bg-[#f6f1e6] p-4 text-[#17231f] md:-mx-8 md:-my-8 md:min-h-[100dvh] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-[#087d7f]" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.05em]">3D Simülasyon</h1>
            <p className="text-sm text-[#65726b]">Parsel üstünde yapı kütlesi, yükseklik ve uygunluk kontrolü.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
        <div className="h-[560px] min-h-[520px]">
          <CesiumViewer center={[28.9784, 41.0082, 700]} />
        </div>
        <div className="space-y-4">
          <NativeMapCanvas mode="simulation" compact status="2D parsel önizlemesi ve 3D yapı kütlesi aynı parsel referansıyla gösterilir." />
          <div className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-5 shadow-[0_16px_42px_rgba(37,48,42,0.12)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#17231f]">
              <Building2 className="h-4 w-4 text-[#087d7f]" />
              Simülasyon Parametreleri
            </div>
            <SimulationPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
