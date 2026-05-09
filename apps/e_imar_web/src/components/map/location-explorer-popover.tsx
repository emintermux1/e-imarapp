"use client";

import * as React from "react";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import {
  buildFlyTargetFromLocationTarget,
  getCoveredCities,
  getDistrictTargets,
  getNeighborhoodTargets,
  type LocationExplorerTarget
} from "@/data/location-navigation";

export function LocationExplorerPopover() {
  const [open, setOpen] = React.useState(false);
  const [selectedCity, setSelectedCity] = React.useState<LocationExplorerTarget | null>(null);
  const [selectedDistrict, setSelectedDistrict] = React.useState<LocationExplorerTarget | null>(null);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  const cities = React.useMemo(() => getCoveredCities(), []);
  const districts = React.useMemo(
    () => (selectedCity ? getDistrictTargets(selectedCity.il ?? selectedCity.label) : []),
    [selectedCity]
  );
  const neighborhoods = React.useMemo(
    () =>
      selectedCity && selectedDistrict
        ? getNeighborhoodTargets(selectedCity.il ?? selectedCity.label, selectedDistrict.ilce ?? selectedDistrict.label)
        : [],
    [selectedCity, selectedDistrict]
  );

  function navigate(target: LocationExplorerTarget) {
    setSelectedParcelId(null);
    setRightPanelOpen(false);
    flyTo(buildFlyTargetFromLocationTarget(target));
  }

  function selectCity(target: LocationExplorerTarget) {
    setSelectedCity(target);
    setSelectedDistrict(null);
    navigate(target);
  }

  function selectDistrict(target: LocationExplorerTarget) {
    setSelectedDistrict(target);
    navigate(target);
  }

  function selectNeighborhood(target: LocationExplorerTarget) {
    navigate(target);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-3 text-sm shadow-card",
            "text-fg-secondary hover:bg-surface-3 hover:text-fg-primary transition-colors"
          )}
          aria-label="Yerler"
        >
          <Building2 className="h-4 w-4" />
          <span className="font-medium">Yerler</span>
          <span className="rounded-full bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            Explorer
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(840px,92vw)] p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-1/50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">Belediye / Mahalle</p>
            <p className="text-sm font-medium text-fg-primary">Demo kapsamdaki yerlerde süratli gezinme</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-fg-muted">
            <MapPin className="h-3.5 w-3.5" />
            Harita üstünden de tıklanabilir
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border-subtle md:grid-cols-3">
          <ExplorerColumn
            title="İller"
            subtitle={`${cities.length} merkez`}
            icon={<Building2 className="h-3.5 w-3.5" />}
            items={cities}
            activeLabel={selectedCity?.label}
            onSelect={(item) => selectCity(item)}
          />
          <ExplorerColumn
            title={selectedCity ? `${selectedCity.label} ilçeleri` : "İlçe"}
            subtitle={selectedCity ? `${districts.length} seçenek` : "Bir il seç"}
            icon={<ChevronRight className="h-3.5 w-3.5" />}
            items={districts}
            activeLabel={selectedDistrict?.label}
            onSelect={(item) => selectDistrict(item)}
            disabled={!selectedCity}
          />
          <ExplorerColumn
            title={selectedDistrict ? `${selectedDistrict.label} mahalleleri` : "Mahalle"}
            subtitle={selectedDistrict ? `${neighborhoods.length} seçenek` : "Bir ilçe seç"}
            icon={<MapPin className="h-3.5 w-3.5" />}
            items={neighborhoods}
            activeLabel={undefined}
            onSelect={(item) => selectNeighborhood(item)}
            disabled={!selectedDistrict}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ExplorerColumn({
  title,
  subtitle,
  icon,
  items,
  activeLabel,
  onSelect,
  disabled
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: LocationExplorerTarget[];
  activeLabel: string | undefined;
  onSelect: (item: LocationExplorerTarget) => void;
  disabled?: boolean;
}) {
  return (
    <section className={cn("bg-surface-2", disabled && "opacity-75")}>
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg-primary truncate">{title}</p>
          <p className="text-[11px] text-fg-muted">{subtitle}</p>
        </div>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border-subtle bg-surface-1 text-fg-muted">
          {icon}
        </span>
      </header>
      <ScrollArea className="h-[340px]">
        <div className="p-2">
          {items.length === 0 ? (
            <div className="grid place-items-center rounded-md border border-dashed border-border-subtle bg-surface-1/50 px-3 py-10 text-center text-[12px] text-fg-muted">
              <div>
                <p>Seçim bekleniyor</p>
                <p className="mt-1">Harita veya üst düzey bir öğe seçin</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => {
                const active = activeLabel === item.label;
                return (
                  <li key={`${item.kind}:${item.il ?? ""}:${item.ilce ?? ""}:${item.mahalle ?? item.label}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
                        "border-border-subtle bg-surface-1/40 hover:bg-surface-1 hover:border-border-strong",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
                        active && "border-brand-blue/40 bg-brand-blue/6"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-fg-primary">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] text-fg-muted">
                          {item.kind === "il"
                            ? "İl"
                            : item.kind === "ilce"
                            ? `${item.il} · İlçe`
                            : `${item.il} · ${item.ilce} · Mahalle`}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-fg-secondary">
                        ~{item.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
