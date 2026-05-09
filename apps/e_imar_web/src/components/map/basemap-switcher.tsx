"use client";

import * as React from "react";
import { Map as MapIcon, Layers, Mountain, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useMapStore } from "@/stores/map-store";
import { BASEMAPS, type BasemapId } from "@/lib/maplibre/styles";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<BasemapId, React.ReactNode> = {
  voyager: <MapIcon className="h-3.5 w-3.5" />,
  dark: <Moon className="h-3.5 w-3.5" />,
  satellite: <Layers className="h-3.5 w-3.5" />,
  topographic: <Mountain className="h-3.5 w-3.5" />
};

export function BasemapSwitcher() {
  const basemap = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md border border-border-subtle bg-surface-2 text-xs text-fg-primary hover:bg-surface-3 transition-colors"
          aria-label="Zemin haritası seç"
        >
          {ICONS[basemap]}
          <span className="font-medium">{BASEMAPS[basemap].label}</span>
          <ChevronDown className="h-3 w-3 text-fg-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[240px]">
        <DropdownMenuLabel>Zemin Haritası</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
          <DropdownMenuItem
            key={id}
            onSelect={() => setBasemap(id)}
            className={cn(
              "gap-3 items-center",
              id === basemap && "bg-surface-1"
            )}
          >
            <span className="text-fg-muted">{ICONS[id]}</span>
            <div className="flex flex-col">
              <span className="text-sm">{BASEMAPS[id].label}</span>
              <span className="text-[11px] leading-4 text-fg-muted">{BASEMAPS[id].description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
