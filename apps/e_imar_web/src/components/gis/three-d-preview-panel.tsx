"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Box, Maximize2, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataCard } from "./data-card";
import { Switch } from "@/components/ui/switch";
import { CesiumMiniLazy } from "@/components/cesium/cesium-canvas-lazy";
import type { ParcelProps } from "@/types/parcel";
import { useUIStore } from "@/stores/ui-store";

interface ThreeDPreviewPanelProps {
  /** Selected parcel — required to render the mini scene. */
  parcel: ParcelProps;
  className?: string;
}

/**
 * Embedded 320×220 Cesium scene that mirrors the selected parcel + emsal
 * envelope wireframe.
 *
 * For performance, the mini viewer is only mounted when this panel is
 * actually visible (which is true once the user expands the "Geçmiş" or
 * "İmar Durumu" accordion). Repeat selections destroy and recreate the
 * scene; in practice this stays well under 200ms on a modern laptop.
 */
export function ThreeDPreviewPanel({
  parcel,
  className
}: ThreeDPreviewPanelProps) {
  const emsalWireframe = useUIStore((s) => s.emsalWireframe);
  const setEmsalWireframe = useUIStore((s) => s.setEmsalWireframe);
  const setMapMode = useUIStore((s) => s.setMapMode);

  return (
    <DataCard
      title={
        <span className="inline-flex items-center gap-1.5">
          <Box className="h-3.5 w-3.5 text-fg-muted" /> 3D Önizleme
        </span>
      }
      subtitle="Cesium tabanlı kütle modeli + emsal envelope"
      padding="sm"
      variant="subtle"
      rightSlot={
        <button
          type="button"
          onClick={() => setMapMode("3d")}
          className="inline-flex items-center gap-1 px-1.5 h-6 rounded-sm border border-border-subtle bg-surface-2 text-[10px] uppercase tracking-wider text-fg-secondary hover:bg-surface-3 hover:text-fg-primary transition-colors"
        >
          <Maximize2 className="h-3 w-3" />
          3D Mod
        </button>
      }
      className={cn(className)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="relative h-[220px] w-full rounded-sm border border-border-subtle bg-[#0B0F14] overflow-hidden"
      >
        <CesiumMiniLazy parcel={parcel} emsalWireframe={emsalWireframe} />
        {/* Lower-left annotation */}
        <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-sm border border-border-strong bg-surface-2/90 text-[10px] tabular-nums text-fg-secondary">
          <span className="text-fg-muted uppercase tracking-wider">Yapı</span>
          <span className="font-semibold text-fg-primary">
            ~{Math.round((parcel.gabariM ?? 12) * 10) / 10} m
          </span>
        </span>
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-sm border border-border-strong bg-surface-2/90 text-[10px] tabular-nums text-fg-secondary">
          <span className="text-fg-muted uppercase tracking-wider">Emsal</span>
          <span className="font-semibold text-fg-primary">
            {parcel.kaks.toFixed(2)}
          </span>
        </span>
      </motion.div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-fg-secondary">
        <label className="inline-flex items-center gap-1.5">
          <Layers3 className="h-3 w-3 text-fg-muted" />
          Emsal Envelope
          <Switch
            checked={emsalWireframe}
            onCheckedChange={setEmsalWireframe}
            aria-label="Emsal envelope göster"
          />
        </label>
        <span className="text-[10px] tabular-nums text-fg-muted">
          {parcel.katSiniri} kat × 3 m = {(parcel.katSiniri * 3).toFixed(1)} m
        </span>
      </div>
    </DataCard>
  );
}
