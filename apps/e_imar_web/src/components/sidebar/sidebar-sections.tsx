"use client";

import * as React from "react";
import {
  Layers,
  Star,
  Bookmark,
  History,
  SlidersHorizontal,
  ChevronDown,
  DatabaseZap,
  Database,
  FileText,
  UserCircle2
} from "lucide-react";
import Link from "next/link";
import { LayerToggleList } from "@/components/map/layer-toggle-list";
import { WatchlistSection } from "./watchlist-section";
import { SavedQueriesSection } from "./saved-queries-section";
import { HistorySection } from "./history-section";
import { FiltersSection } from "./filters-section";
import { SourceStatusPanel } from "./source-status-panel";
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
      id: "sources",
      title: "Canlı Veri Kaynakları",
      icon: <DatabaseZap className="h-4 w-4" />,
      body: <SourceStatusPanel />,
      defaultOpen: true
    },
    {
      id: "watchlist",
      title: "Parsel Alarm",
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
    },
    {
      id: "plan-note",
      title: "Plan Notu Açıklayıcı",
      icon: <FileText className="h-4 w-4" />,
      body: (
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-fg-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
          <p>BFF plan notu açıklama endpoint&apos;ini doğrudan dener; sağlayıcı hazır değilse durum kartını gösterir.</p>
          <Link href="/plan-notu" className="mt-2 inline-flex text-xs font-semibold text-[rgb(var(--accent-blue))] hover:underline">Plan notu ekranını aç</Link>
        </div>
      ),
      defaultOpen: false
    },
    {
      id: "workspace",
      title: "Çalışma Alanı",
      icon: <UserCircle2 className="h-4 w-4" />,
      body: (
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-fg-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
          <p>Backend workspace, session ve bildirim aboneliği durumlarını tek ekranda toplar.</p>
          <Link href="/calisma-alani" className="mt-2 inline-flex text-xs font-semibold text-[rgb(var(--accent-blue))] hover:underline">Çalışma alanını aç</Link>
        </div>
      ),
      defaultOpen: false
    },
    {
      id: "kaynaklar",
      title: "Kaynaklar Ekranı",
      icon: <Database className="h-4 w-4" />,
      body: (
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-fg-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
          <p>Canlı, yedek ve erişilemeyen kaynakları açıkça ayıran registry ekranı.</p>
          <Link href="/kaynaklar" className="mt-2 inline-flex text-xs font-semibold text-[rgb(var(--accent-blue))] hover:underline">Kaynaklar ekranını aç</Link>
        </div>
      ),
      defaultOpen: false
    }
  ];

  if (collapsed) return <CollapsedRail sections={sections} />;

  return (
    <div className="flex flex-col py-1">
      {sections.map((s) => (
        <SidebarSection key={s.id} {...s} />
      ))}
    </div>
  );
}

function SidebarSection({ title, icon, body, defaultOpen }: SectionDef) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <section className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 h-11",
          "text-left text-sm font-semibold text-white/88",
          "hover:bg-white/[0.08] transition-colors soft-press"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-white/56">{icon}</span>
          <span>{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-white/44 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-4 pt-1 text-fg-primary [&_*]:border-white/10">
          {body}
        </div>
      )}
    </section>
  );
}

function CollapsedRail({ sections }: { sections: SectionDef[] }) {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-3">
      {sections.map((s) => (
        <button
          key={s.id}
          aria-label={s.title}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/58 transition-colors hover:bg-white/10 hover:text-white soft-press"
          title={s.title}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}
