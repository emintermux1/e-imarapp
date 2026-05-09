"use client";

import { SimulationPanel } from "@/components/SimulationPanel";
import { CesiumViewer } from "@/components/CesiumViewer";
import { Globe } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Globe size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">3D Simülasyon</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">Simülasyon Parametreleri</h2>
            <SimulationPanel />
          </div>
        </div>
        <div className="lg:col-span-2 h-[500px] lg:h-auto min-h-[500px]">
          <CesiumViewer center={[28.9784, 41.0082, 500]} />
        </div>
      </div>
    </div>
  );
}
