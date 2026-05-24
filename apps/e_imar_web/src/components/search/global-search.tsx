"use client";

import * as React from "react";
import {
  Search,
  ArrowRight,
  MapPin,
  Building2,
  Hash,
  Crosshair,
  LocateFixed,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CommandRoot,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useSearch, type SearchMode } from "@/hooks/use-search";
import { useHistoryStore } from "@/stores/history-store";
import { useMapStore } from "@/stores/map-store";
import { useMunicipalityStore } from "@/stores/municipality-store";
import { useUIStore } from "@/stores/ui-store";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { SourceBadge } from "@/components/gis/source-badge";
import { geometryLabel, matchStatusLabel } from "@/lib/api/quality-labels";
import type { SearchResult } from "@/types/geo";
import { cn } from "@/lib/utils";
import { getLocationBoundary } from "@/data/location-boundaries";
import { SearchResultSkeleton } from "@/components/search/search-result-skeleton";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";

const TABS: SearchMode[] = [
  "Hepsi",
  "AdaParsel",
  "Koordinat",
  "Adres",
  "Belediye",
];
const TAB_LABELS: Record<SearchMode, string> = {
  Hepsi: "Hepsi",
  AdaParsel: "Ada/Parsel",
  Koordinat: "Koordinat",
  Adres: "Adres",
  Belediye: "Belediye",
};
const SUGGESTIONS = [
  { primary: "Beşiktaş Levent 1234/2", mode: "AdaParsel" as SearchMode },
  { primary: "Çankaya Çukurambar", mode: "Adres" as SearchMode },
  { primary: "İstanbul Büyükşehir Belediyesi", mode: "Belediye" as SearchMode },
];

const PLACEHOLDERS: Record<SearchMode, string> = {
  Hepsi: "Ada/parsel, mahalle, koordinat veya belediye ara…",
  AdaParsel: "Örn. 1234/2 veya 1234-2",
  Koordinat: "Örn. 41.04321, 29.00821",
  Adres: "Mahalle, ilçe, il…",
  Belediye: "Belediye adı…",
};

export function GlobalSearch() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);
  const setSelectedMunicipality = useMunicipalityStore(
    (s) => s.setSelectedMunicipality,
  );

  const [mode, setMode] = React.useState<SearchMode>("Hepsi");
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [gpsPending, setGpsPending] = React.useState(false);
  const [gpsMessage, setGpsMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const searchState = useSearch({ query, mode, limit: 12 });
  const { results } = searchState;
  const history = useHistoryStore((s) => s.items);
  const pushHistory = useHistoryStore((s) => s.push);
  const upsertOverlayFromSearch = useBackendParcelStore(
    (s) => s.upsertOverlayFromSearch,
  );

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
      resultCount: results.length,
    });
    setSearchOpen(false);
    setQuery("");
    if (r.type === "parcel") {
      setSelectedArea(null);
      upsertOverlayFromSearch(r);
      if (r.municipalityId) {
        setSelectedMunicipality({
          municipalityId: r.municipalityId,
          municipalityName: r.secondary ?? r.primary,
          sourceId: r.municipalityId,
        });
      }
      setSelectedParcelId(r.parcelId);
      setRightPanelOpen(true);
      if (r.centroid) {
        flyTo({
          center: r.centroid,
          zoom: 16,
          parcelId: r.parcelId,
          bounds: r.bbox
            ? {
                west: r.bbox.west,
                south: r.bbox.south,
                east: r.bbox.east,
                north: r.bbox.north,
              }
            : undefined,
        });
      }
    } else if (r.type === "coordinate") {
      setSelectedArea(null);
      setSelectedParcelId(null);
      setSelectedPoint({
        lng: r.lng,
        lat: r.lat,
        source: "search",
      });
      setRightPanelOpen(true);
      flyTo({ center: [r.lng, r.lat], zoom: 14 });
      window.dispatchEvent(
        new CustomEvent("eimar:map:coordinate-query", {
          detail: { lng: r.lng, lat: r.lat },
        }),
      );
    } else if (r.centroid) {
      setSelectedParcelId(null);
      const boundary =
        r.type === "address" || r.type === "location"
          ? getLocationBoundary({ il: r.il, ilce: r.ilce, mahalle: r.mahalle })
          : undefined;
      if (r.type === "belediye" && r.municipalityId) {
        setSelectedMunicipality({
          municipalityId: r.municipalityId,
          municipalityName: r.primary,
          sourceId: r.municipalityId,
        });
      }
      setSelectedArea(
        boundary
          ? {
              id: boundary.id,
              kind: boundary.kind,
              label: boundary.label,
              il: boundary.il,
              ilce: boundary.ilce,
              mahalle: boundary.mahalle,
              feature: boundary.feature,
            }
          : null,
      );
      flyTo({
        center: r.centroid,
        bounds: r.bbox ?? boundary?.bounds,
        zoom: r.type === "address" ? 12 : 11,
      });
      if (r.type === "address") {
        setSelectedPoint({
          lng: r.centroid[0],
          lat: r.centroid[1],
          source: "search",
        });
      }
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

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGpsMessage("Tarayıcı konum servisini desteklemiyor.");
      return;
    }
    setGpsPending(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMode("Koordinat");
        setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setGpsPending(false);
        setGpsMessage("GPS konumu alındı. Enter ile haritada açın.");
        inputRef.current?.focus();
      },
      () => {
        setGpsPending(false);
        setGpsMessage("Konum izni reddedildi veya sinyal alınamadı.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
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
        <div className="mx-auto w-full max-w-[720px]">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "group flex h-11 w-full items-center gap-2 rounded-full px-4",
              "border border-white/60 bg-white/82 text-sm text-fg-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_14px_36px_-28px_rgb(var(--accent-navy)/0.7)]",
              "transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-brand-navy/35 hover:bg-white active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
            aria-label="Ara"
          >
            <Search className="h-4 w-4 text-fg-muted" />
            <span className="flex-1 text-left text-fg-muted truncate">
              Ada/parsel, mahalle, koordinat veya belediye ara…
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
            <Search className="h-4 w-4 text-fg-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              aria-label="Arama sorgusu"
              className="flex-1 h-11 bg-transparent border-0 outline-none text-sm text-fg-primary placeholder:text-fg-muted"
            />
            <button
              type="button"
              aria-label="GPS konumumu kullan"
              onClick={useMyLocation}
              disabled={gpsPending}
              className="touch-target shrink-0 rounded-full border border-border-subtle bg-surface-1 text-fg-secondary transition-colors hover:border-brand-navy/30 hover:text-fg-primary disabled:opacity-60"
            >
              {gpsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            </button>
            <Kbd combo={["Esc"]} />
          </div>
          {gpsMessage && (
            <p
              role="status"
              aria-live="polite"
              className="border-b border-border-subtle bg-brand-navy/6 px-3 py-2 text-[11px] leading-snug text-fg-secondary"
            >
              {gpsMessage}
            </p>
          )}
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
              {searchState.loading
                ? "API aranıyor…"
                : results.length > 0
                  ? `${results.length} sonuç`
                  : query
                    ? "Sonuç yok"
                    : "İmleciniz hazır"}
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
                        onSelectItem={() =>
                          handleSelectHistory(h.query, h.mode)
                        }
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
            ) : searchState.loading ? (
              <SearchResultSkeleton rows={5} />
            ) : results.length === 0 ? (
              <CommandEmpty>
                {searchState.message ??
                  "Sonuç bulunamadı. Farklı sekme veya ada/parsel formatı deneyin."}
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
              {searchState.message ?? "WGS84 / EPSG:4326"}
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
  groupedByType,
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
  const groupOrder: Array<SearchResult["type"]> = [
    "coordinate",
    "parcel",
    "address",
    "belediye",
  ];
  const headings: Record<SearchResult["type"], string> = {
    coordinate: "Koordinat",
    parcel: "Parsel",
    location: "Konum",
    address: "Adres",
    belediye: "Belediye",
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
  onSelect,
}: {
  result: SearchResult;
  selected: boolean;
  onSelect: () => void;
}) {
  const icon = (() => {
    if (result.type === "parcel") return <Hash className="h-3.5 w-3.5" />;
    if (result.type === "address") return <MapPin className="h-3.5 w-3.5" />;
    if (result.type === "coordinate")
      return <Crosshair className="h-3.5 w-3.5" />;
    return <Building2 className="h-3.5 w-3.5" />;
  })();
  return (
    <CommandItem selected={selected} onSelectItem={onSelect}>
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
        {result.type === "parcel" &&
          (result.meta ||
            result.qualityHints?.length ||
            result.ambiguityCount) && (
            <div className="mt-1 flex flex-wrap gap-1 overflow-hidden text-[9.5px] leading-none text-fg-muted">
              {result.meta && (
                <span className="truncate rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-1">
                  {result.meta}
                </span>
              )}
              {result.ambiguityCount && result.ambiguityCount > 1 && (
                <span className="rounded-sm border border-status-warning/30 bg-status-warning/10 px-1.5 py-1 text-status-warning">
                  Aynı ada/parsel farklı ilçelerde var
                </span>
              )}
              {result.qualityHints?.slice(0, 1).map((hint) => (
                <span
                  key={hint}
                  className="hidden max-w-[220px] truncate rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-1 sm:inline"
                >
                  {hint}
                </span>
              ))}
            </div>
          )}
      </div>
      {result.type === "parcel" && (
        <div className="flex max-w-[52%] shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1.5">
            {result.sourceStatus && (
              <SourceBadge status={result.sourceStatus} />
            )}
            <ZoningBadge type={result.zoningType} size="xs" />
          </span>
          <span className="hidden max-w-full items-center gap-1 overflow-hidden text-[9.5px] text-fg-muted sm:inline-flex">
            {result.geometryAvailable != null && (
              <span
                className={cn(
                  "truncate",
                  result.geometryAvailable
                    ? "text-status-success"
                    : "text-status-warning",
                )}
              >
                {geometryLabel(result.geometryAvailable)}
              </span>
            )}
            {result.planMatchStatus && (
              <span className="truncate">
                Plan {matchStatusLabel(result.planMatchStatus)}
              </span>
            )}
            {result.askiMatchStatus && (
              <span className="truncate">
                Askı {matchStatusLabel(result.askiMatchStatus)}
              </span>
            )}
          </span>
        </div>
      )}
      {result.type !== "parcel" && result.meta && (
        <span className="text-[11px] uppercase tracking-wider text-fg-muted">
          {result.meta}
        </span>
      )}
    </CommandItem>
  );
}
