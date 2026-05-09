"use client";

import * as React from "react";
import { LayerToggle } from "@/components/gis/layer-toggle";
import { useUIStore } from "@/stores/ui-store";
import { LAYER_DESCRIPTORS, type LayerDescriptor } from "@/lib/maplibre/layers";

const GROUPS: LayerDescriptor["group"][] = [
  "İmar",
  "Risk",
  "Uydu / Hibrit",
  "Tarihsel",
  "Belediye",
  "Altyapı",
  "Çevre",
  "İdari"
];

const STATUS_LABELS: Record<LayerDescriptor["status"], string> = {
  official: "official",
  public_metadata: "public metadata",
  demo: "demo",
  derived: "derived",
  not_ready: "not ready"
};

export function LayerToggleList() {
  const visibility = useUIStore((s) => s.layerVisibility);
  const opacity = useUIStore((s) => s.layerOpacity);
  const setLayerVisibility = useUIStore((s) => s.setLayerVisibility);
  const setLayerOpacity = useUIStore((s) => s.setLayerOpacity);

  return (
    <div className="flex flex-col gap-3">
      {GROUPS.map((group) => {
        const layers = LAYER_DESCRIPTORS.filter((l) => l.group === group);
        if (layers.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                {group}
              </span>
              <span className="text-[10px] tabular-nums text-fg-muted">
                {layers.filter((l) => visibility[l.id] ?? l.defaultVisible).length}/{layers.length}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {layers.map((l) => (
                <LayerToggle
                  key={l.id}
                  id={l.id}
                  label={l.label}
                  description={l.description}
                  statusLabel={STATUS_LABELS[l.status]}
                  status={l.status}
                  emptyReason={l.emptyReason}
                  visible={visibility[l.id] ?? l.defaultVisible}
                  opacity={opacity[l.id] ?? l.defaultOpacity}
                  onToggle={(v) => setLayerVisibility(l.id, v)}
                  onOpacity={(v) => setLayerOpacity(l.id, v)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
