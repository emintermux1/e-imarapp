"use client";

import * as React from "react";
import {
  Layers,
  Star,
  Bookmark,
  History,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { LayerToggleList } from "@/components/map/layer-toggle-list";
import { WatchlistSection } from "./watchlist-section";
import { SavedQueriesSection } from "./saved-queries-section";
import { HistorySection } from "./history-section";
import { FiltersSection } from "./filters-section";
import { cn } from "@/lib/utils";

interface SectionDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  count?: number;
  body: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSections({ collapsed = false }: { collapsed?: boolean }) {
  const sections: SectionDef[] = [
    {
      id: "katmanlar",
      title: "Katmanlar",
      icon: <Layers className="h-4 w-4" />,
      body: <LayerToggleList />,
      defaultOpen: true
    },
    {
      id: "watchlist",
      title: "Watchlist",
      icon: <Star className="h-4 w-4" />,
      body: <WatchlistSection />,
      defaultOpen: true
    },
    {
      id: "saved",
      title: "Kayıtlı Sorgular",
      icon: <Bookmark className="h-4 w-4" />,
      body: <SavedQueriesSection />,
      defaultOpen: false
    },
    {
      id: "history",
      title: "Geçmiş Sorgular",
      icon: <History className="h-4 w-4" />,
      body: <HistorySection />,
      defaultOpen: false
    },
    {
      id: "filters",
      title: "Filtreler",
      icon: <SlidersHorizontal className="h-4 w-4" />,
      body: <FiltersSection />,
      defaultOpen: false
    }
  ];

  if (collapsed) return <CollapsedRail sections={sections} />;

  return (
    <div className="flex flex-col">
      {sections.map((s) => (
        <SidebarSection key={s.id} {...s} />
      ))}
    </div>
  );
}

function SidebarSection({ title, icon, body, defaultOpen }: SectionDef) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <section className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 h-10",
          "text-left text-sm font-medium text-fg-primary",
          "hover:bg-surface-1 transition-colors"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-fg-muted">{icon}</span>
          <span>{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-fg-muted transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-4 pt-1 bg-bg/40">
          {body}
        </div>
      )}
    </section>
  );
}

function CollapsedRail({ sections }: { sections: SectionDef[] }) {
  return (
    <div className="flex flex-col items-center pt-2 gap-0.5">
      {sections.map((s) => (
        <button
          key={s.id}
          aria-label={s.title}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-1 hover:text-fg-primary transition-colors"
          title={s.title}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}
