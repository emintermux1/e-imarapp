"use client";

import * as React from "react";
import { Layers3, Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LAYER_DESCRIPTORS, type LayerDescriptor } from "@/lib/maplibre/layers";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<LayerDescriptor["status"], string> = {
  official: "resmî",
  public_metadata: "public metadata",
  demo: "demo/açık kayıt",
  derived: "türetilmiş",
  not_ready: "hazır değil"
};

export function LayerCatalogDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = React.useState("");
  const visibility = useUIStore((s) => s.layerVisibility);
  const opacity = useUIStore((s) => s.layerOpacity);
  const setLayerVisibility = useUIStore((s) => s.setLayerVisibility);
  const setLayerOpacity = useUIStore((s) => s.setLayerOpacity);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const layers = LAYER_DESCRIPTORS.filter((layer) =>
    !normalizedQuery ||
    [layer.label, layer.description, layer.group, layer.status, layer.emptyReason]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(normalizedQuery))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" width="min(460px, calc(100vw - 1rem))" ariaLabel="Katman kataloğu">
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-green/10 text-brand-green">
            <Layers3 className="h-4 w-4" />
          </span>
          <div>
            <SheetTitle>Katman kataloğu</SheetTitle>
            <p className="text-[11px] text-fg-muted">{layers.length}/{LAYER_DESCRIPTORS.length} katman</p>
          </div>
        </div>
        <button type="button" aria-label="Kapat" onClick={() => onOpenChange(false)} className="rounded-full p-2 text-fg-muted hover:bg-surface-1 hover:text-fg-primary">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="border-b border-border-subtle p-4">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-border-subtle bg-surface-1 px-3">
          <Search className="h-4 w-4 text-fg-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-fg-primary placeholder:text-fg-muted" placeholder="Katman, durum veya grup ara" />
        </label>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {layers.map((layer) => {
            const visible = visibility[layer.id] ?? layer.defaultVisible;
            const currentOpacity = opacity[layer.id] ?? layer.defaultOpacity;
            return (
              <article key={layer.id} className="rounded-[1.35rem] border border-border-subtle bg-surface-1 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-fg-primary">{layer.label}</h3>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", statusClass(layer.status))}>
                        {STATUS_LABELS[layer.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{layer.description}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={visible}
                    onClick={() => setLayerVisibility(layer.id, !visible)}
                    className={cn("h-8 rounded-full px-3 text-xs font-black", visible ? "bg-[rgb(var(--accent-navy))] text-white" : "bg-surface-2 text-fg-secondary")}
                  >
                    {visible ? "Açık" : "Kapalı"}
                  </button>
                </div>
                {layer.emptyReason && <p className="mt-2 rounded-2xl bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-fg-muted">{layer.emptyReason}</p>}
                <label className="mt-3 flex items-center gap-3">
                  <SlidersHorizontal className="h-4 w-4 text-fg-muted" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={currentOpacity}
                    onChange={(event) => setLayerOpacity(layer.id, Number(event.target.value))}
                    className="min-w-0 flex-1 accent-[rgb(var(--accent-green))]"
                  />
                  <span className="w-10 text-right text-xs font-bold tabular-nums text-fg-muted">{Math.round(currentOpacity * 100)}%</span>
                </label>
              </article>
            );
          })}
        </div>
      </div>
      <div className="border-t border-border-subtle p-4">
        <Button type="button" variant="primary" className="w-full" onClick={() => onOpenChange(false)}>
          Haritaya uygula
        </Button>
      </div>
    </Sheet>
  );
}

function statusClass(status: LayerDescriptor["status"]) {
  if (status === "official") return "border-status-success/25 bg-status-success/10 text-status-success";
  if (status === "public_metadata") return "border-brand-blue/25 bg-brand-blue/10 text-brand-blue";
  if (status === "not_ready") return "border-status-warning/25 bg-status-warning/10 text-status-warning";
  return "border-border-subtle bg-surface-2 text-fg-secondary";
}
