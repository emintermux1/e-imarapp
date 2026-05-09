"use client";

import * as React from "react";
import { Search, ArrowRight, MapPin, Building2, Hash, Crosshair, Navigation } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CommandRoot,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useSearch, type SearchMode } from "@/hooks/use-search";
import { useHistoryStore } from "@/stores/history-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { getLocationBoundary } from "@/data/location-boundaries";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import type { SearchResult } from "@/types/geo";
import { cn } from "@/lib/utils";

const TABS: SearchMode[] = ["Hepsi", "AdaParsel", "Koordinat", "Adres", "Belediye"];
const TAB_LABELS: Record<SearchMode, string> = {
  Hepsi: "Hepsi",
  AdaParsel: "Ada/Parsel",
  Koordinat: "Koordinat",
  Adres: "Adres",
  Belediye: "Belediye"
};
const SUGGESTIONS = [
  { primary: "İstanbul Şişli Mecidiyeköy 1983/3", mode: "Hepsi" as SearchMode },
  { primary: "Şişli Mecidiyeköy ticaret", mode: "Hepsi" as SearchMode },
  { primary: "İstanbul TİCK MİA", mode: "Hepsi" as SearchMode },
  { primary: "kıyı kenar çizgisi kontrolü", mode: "Hepsi" as SearchMode },
  { primary: "1/1000 revizyon", mode: "Hepsi" as SearchMode }
];

const PLACEHOLDERS: Record<SearchMode, string> = {
  Hepsi: "Ada/parsel, mahalle, koordinat veya belediye ara…",
  AdaParsel: "Örn. 1234/2 veya 1234-2",
  Koordinat: "Örn. 41.04321, 29.00821",
  Adres: "Mahalle, ilçe, il…",
  Belediye: "Belediye adı…"
};

export function GlobalSearch() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);

  const [mode, setMode] = React.useState<SearchMode>("Hepsi");
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const results = useSearch({ query, mode, limit: 12 });
  const history = useHistoryStore((s) => s.items);
  const pushHistory = useHistoryStore((s) => s.push);

  // Cmd/Ctrl+K listener
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  // Reset highlighted index whenever results change
  React.useEffect(() => {
    setActive(0);
  }, [results.length, mode, query]);

  // Focus input when open
  React.useEffect(() => {
    if (searchOpen) {
      // microtask focus after popover content mounts
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [searchOpen]);

  const showEmpty = !query && results.length === 0;
  const totalSelectable = showEmpty
    ? Math.max(history.length, 0) + SUGGESTIONS.length
    : results.length;

  function handleSelectResult(r: SearchResult) {
    pushHistory({
      query: r.primary,
      mode: mode === "AdaParsel" ? "AdaParsel" : mode,
      resultCount: results.length
    });
    setSearchOpen(false);
    setQuery("");
    if (r.type === "parcel") {
      setSelectedArea(null);
      setSelectedParcelId(r.parcelId);
      setRightPanelOpen(true);
      if (r.centroid) {
        flyTo({
          center: r.centroid,
          bounds: r.bbox,
          zoom: 16,
          parcelId: r.parcelId
        });
      }
    } else if (r.type === "coordinate") {
      setSelectedArea(null);
      setSelectedParcelId(null);
      setRightPanelOpen(false);
      flyTo({ center: [r.lng, r.lat], zoom: 14 });
    } else if (r.type === "location" && r.centroid) {
      const boundary = getLocationBoundary({ il: r.il, ilce: r.ilce, mahalle: r.mahalle });
      setSelectedArea(boundary ? {
        id: boundary.id,
        kind: boundary.kind,
        label: boundary.label,
        il: boundary.il,
        ilce: boundary.ilce,
        mahalle: boundary.mahalle,
        feature: boundary.feature
      } : null);
      setSelectedParcelId(null);
      setRightPanelOpen(false);
      flyTo({ center: r.centroid, bounds: r.bbox ?? boundary?.bounds, zoom: r.zoom });
    } else if (r.centroid) {
      const boundary = r.type === "address" ? getLocationBoundary({ il: r.il, ilce: r.ilce, mahalle: r.mahalle }) : undefined;
      setSelectedArea(boundary ? {
        id: boundary.id,
        kind: boundary.kind,
        label: boundary.label,
        il: boundary.il,
        ilce: boundary.ilce,
        mahalle: boundary.mahalle,
        feature: boundary.feature
      } : null);
      setSelectedParcelId(null);
      setRightPanelOpen(false);
      flyTo({ center: r.centroid, bounds: r.bbox ?? boundary?.bounds, zoom: r.type === "address" ? 12 : 11 });
    }
  }

  function handleSelectSuggestion(s: { primary: string; mode: SearchMode }) {
    setMode(s.mode);
    setQuery(s.primary);
    inputRef.current?.focus();
  }

  function handleSelectHistory(q: string, m: SearchMode | "AdaParsel") {
    setQuery(q);
    if (m === "AdaParsel") setMode("AdaParsel");
    else setMode(m as SearchMode);
    inputRef.current?.focus();
  }

  function moveActive(delta: number) {
    if (totalSelectable === 0) return;
    setActive((a) => (a + delta + totalSelectable) % totalSelectable);
  }

  function activateSelection() {
    if (showEmpty) {
      const histLen = history.length;
      if (active < histLen) {
        const h = history[active];
        if (h) handleSelectHistory(h.query, h.mode);
      } else {
        const sug = SUGGESTIONS[active - histLen];
        if (sug) handleSelectSuggestion(sug);
      }
    } else {
      const r = results[active];
      if (r) handleSelectResult(r);
    }
  }

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverAnchor asChild>
        <div className="w-full max-w-[720px] mx-auto">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "group flex w-full items-center gap-2 h-9 px-2.5 rounded-md",
              "border border-border-subtle bg-surface-1 text-fg-secondary text-sm",
              "hover:bg-surface-2 hover:border-border-strong transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            )}
            aria-label="Ara"
          >
            <Search className="h-4 w-4 text-fg-muted" />
            <span className="flex-1 text-left text-fg-muted truncate">
              Ada/parsel, mahalle, TİCK, MİA veya detaylı sorgu ara…
            </span>
            <Kbd combo={["⌘", "K"]} />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-[min(720px,90vw)] p-0 overflow-hidden"
      >
        <CommandRoot
          onArrowDown={() => moveActive(1)}
          onArrowUp={() => moveActive(-1)}
          onEnter={activateSelection}
          onEscape={() => setSearchOpen(false)}
        >
          <div className="flex items-center gap-2 px-3 border-b border-border-subtle">
            <Search className="h-4 w-4 text-fg-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              className="flex-1 h-11 bg-transparent border-0 outline-none text-sm text-fg-primary placeholder:text-fg-muted"
            />
            <Kbd combo={["Esc"]} />
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-1/50">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SearchMode)}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t} value={t}>
                    {TAB_LABELS[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-[11px] text-fg-muted hidden sm:inline">
              {results.length > 0 ? `${results.length} sonuç` : query ? "Sonuç yok" : "İmleciniz hazır"}
            </span>
          </div>

          <CommandList className="max-h-[55vh]">
            {showEmpty ? (
              <>
                {history.length > 0 && (
                  <CommandGroup heading="Son Aramalar">
                    {history.slice(0, 5).map((h, idx) => (
                      <CommandItem
                        key={h.id}
                        selected={active === idx}
                        onSelectItem={() => handleSelectHistory(h.query, h.mode)}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border-subtle bg-surface-1 text-fg-muted shrink-0">
                          <Hash className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate">{h.query}</span>
                        <span className="text-[11px] uppercase tracking-wider text-fg-muted">
                          {TAB_LABELS[h.mode] ?? h.mode}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="Sık Aranan">
                  {SUGGESTIONS.map((s, idx) => {
                    const itemIdx = (history.length || 0) + idx;
                    return (
                      <CommandItem
                        key={s.primary}
                        selected={active === itemIdx}
                        onSelectItem={() => handleSelectSuggestion(s)}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border-subtle bg-surface-1 text-fg-muted shrink-0">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate">{s.primary}</span>
                        <span className="text-[11px] uppercase tracking-wider text-fg-muted">
                          {TAB_LABELS[s.mode]}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : results.length === 0 ? (
              <CommandEmpty>
                Sonuç bulunamadı. “İstanbul Şişli Mecidiyeköy 1983/3”, TİCK, MİA, kıyı kenar çizgisi veya koordinat deneyin.
              </CommandEmpty>
            ) : (
              <ResultGroups
                results={results}
                activeIndex={active}
                onSelect={handleSelectResult}
                groupedByType={mode === "Hepsi"}
              />
            )}
          </CommandList>

          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border-subtle bg-surface-1/40 text-[11px] text-fg-muted">
            <span className="inline-flex items-center gap-2">
              <Kbd combo={["↑", "↓"]} /> gez
              <Kbd combo={["Enter"]} /> seç
            </span>
            <span className="inline-flex items-center gap-1.5">
              Türkiye çalışma alanı · WGS84 / EPSG:4326
            </span>
          </div>
        </CommandRoot>
      </PopoverContent>
    </Popover>
  );
}

function ResultGroups({
  results,
  activeIndex,
  onSelect,
  groupedByType
}: {
  results: SearchResult[];
  activeIndex: number;
  onSelect: (r: SearchResult) => void;
  groupedByType: boolean;
}) {
  if (!groupedByType) {
    return (
      <CommandGroup heading="Sonuçlar">
        {results.map((r, i) => (
          <ResultRow
            key={r.id}
            result={r}
            selected={i === activeIndex}
            onSelect={() => onSelect(r)}
          />
        ))}
      </CommandGroup>
    );
  }
  const groupOrder: Array<SearchResult["type"]> = ["coordinate", "parcel", "location", "address", "belediye"];
  const headings: Record<SearchResult["type"], string> = {
    coordinate: "Koordinat",
    parcel: "Parsel",
    location: "Konum",
    address: "Adres",
    belediye: "Belediye"
  };
  let runningIdx = 0;
  return (
    <>
      {groupOrder.map((type) => {
        const subset = results.filter((r) => r.type === type);
        if (subset.length === 0) return null;
        return (
          <CommandGroup key={type} heading={headings[type]}>
            {subset.map((r) => {
              const i = runningIdx++;
              return (
                <ResultRow
                  key={r.id}
                  result={r}
                  selected={i === activeIndex}
                  onSelect={() => onSelect(r)}
                />
              );
            })}
          </CommandGroup>
        );
      })}
    </>
  );
}

function ResultRow({
  result,
  selected,
  onSelect
}: {
  result: SearchResult;
  selected: boolean;
  onSelect: () => void;
}) {
  const icon = (() => {
    if (result.type === "parcel") return <Hash className="h-3.5 w-3.5" />;
    if (result.type === "address") return <MapPin className="h-3.5 w-3.5" />;
    if (result.type === "location") return <Navigation className="h-3.5 w-3.5" />;
    if (result.type === "coordinate") return <Crosshair className="h-3.5 w-3.5" />;
    return <Building2 className="h-3.5 w-3.5" />;
  })();
  return (
    <CommandItem
      selected={selected}
      onSelectItem={onSelect}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border-subtle bg-surface-1 text-fg-muted shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-fg-primary truncate">{result.primary}</div>
        {result.secondary && (
          <div className="text-[11px] text-fg-muted truncate">
            {result.secondary}
          </div>
        )}
      </div>
      {result.type === "parcel" && (
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {result.meta && (
            <span className="max-w-[120px] truncate text-[11px] text-fg-muted">
              {result.meta}
            </span>
          )}
          <ZoningBadge type={result.zoningType} size="xs" />
        </div>
      )}
      {result.type !== "parcel" && result.meta && (
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-fg-muted max-w-[120px] truncate">
          {result.meta}
        </span>
      )}
    </CommandItem>
  );
}
