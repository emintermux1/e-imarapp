"use client";

import * as React from "react";
import {
  BadgeCheck,
  Filter,
  Heart,
  Layers3,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/gis/data-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate, formatTL, formatTLDetailed, formatInt } from "@/lib/format";
import type { ParcelMarketResponse, NormalizedMarketListing, MarketProviderId } from "@/types/api";
import { useWatchlistStore } from "@/stores/watchlist-store";

type MarketFilters = {
  providerIds: MarketProviderId[];
  listingType: "all" | "sale" | "rent" | "lease";
  sortBy: "freshness" | "price_low" | "price_high" | "match";
};

const PROVIDER_ORDER: MarketProviderId[] = ["sahibinden", "emlakjet", "hepsiemlak", "zingat"];

export function MarketPanel({
  response,
  compact = false
}: {
  response: ParcelMarketResponse | null;
  compact?: boolean;
}) {
  const [filters, setFilters] = useWatchlistStore((s) => [s.marketFilters, s.setMarketFilters]);
  const favorites = useWatchlistStore((s) => s.listingFavorites);
  const toggleFavorite = useWatchlistStore((s) => s.toggleListingFavorite);
  const activeFilters = React.useMemo<MarketFilters>(
    () => filters ?? { providerIds: [], listingType: "all", sortBy: "freshness" },
    [filters]
  );
  const listings = React.useMemo(() => filterListings(response?.listings ?? [], activeFilters), [activeFilters, response?.listings]);

  if (!response) {
    return <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-4 text-xs text-fg-secondary">Market payload bekleniyor.</div>;
  }

  const summary = response.summary;
  const analysis = response.analysis;
  const noListings = response.listings.length === 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <DataCard
        title="Piyasa özeti"
        subtitle={response.freshness.status === "no_data" ? "Liste yok; metrikler hesaplanmadı" : "Gerçek listinglerden türetilen metrikler"}
        variant="raised"
        className="border-border-subtle"
        rightSlot={<MarketStatusChip status={response.status} />}
      >
        {summary ? (
          <div className="grid grid-cols-2 gap-2">
            <Metric label="İlan" value={formatInt(summary.listingCount)} />
            <Metric label="Fiyatlı" value={formatInt(summary.pricedListingCount)} />
            <Metric label="Medyan fiyat" value={summary.medianAskingPriceTRY ? formatTL(summary.medianAskingPriceTRY) : "-"} />
            <Metric label="Medyan m²" value={summary.medianPricePerM2TRY ? `${formatTLDetailed(summary.medianPricePerM2TRY)}/m²` : "-"} />
          </div>
        ) : (
          <EmptySummary />
        )}
      </DataCard>

      <DataCard title="Kaynak readiness" subtitle="Her sağlayıcı için dürüst durum" padding="sm">
        <div className="flex flex-wrap gap-2">
          {PROVIDER_ORDER.map((providerId) => {
            const provider = response.providers.find((item) => item.providerId === providerId);
            if (!provider) return null;
            return <ProviderChip key={providerId} provider={provider} />;
          })}
        </div>
      </DataCard>

      <DataCard title="Filtreler" subtitle="Sadece yerel görünüm; veri üretmez" padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton active={activeFilters.providerIds.length === 0} onClick={() => setFilters({ ...activeFilters, providerIds: [] })} label="Tümü" />
          {PROVIDER_ORDER.map((providerId) => (
            <FilterButton
              key={providerId}
              active={activeFilters.providerIds.includes(providerId)}
              onClick={() => {
                const next = activeFilters.providerIds.includes(providerId)
                  ? activeFilters.providerIds.filter((value) => value !== providerId)
                  : [...activeFilters.providerIds, providerId];
                setFilters({ ...activeFilters, providerIds: next });
              }}
              label={providerId}
            />
          ))}
          <FilterButton active={activeFilters.listingType === "all"} onClick={() => setFilters({ ...activeFilters, listingType: "all" })} label="Tip: tümü" />
          <FilterButton active={activeFilters.listingType === "sale"} onClick={() => setFilters({ ...activeFilters, listingType: "sale" })} label="Satılık" />
          <FilterButton active={activeFilters.listingType === "rent"} onClick={() => setFilters({ ...activeFilters, listingType: "rent" })} label="Kiralık" />
        </div>
      </DataCard>

      <DataCard title="AI market analysis" subtitle="Listesizken üretilmez" padding="sm">
        <AnalysisBlock analysis={analysis} hasListings={!noListings} />
      </DataCard>

      <DataCard
        title={`İlanlar ${listings.length ? `(${listings.length})` : ""}`}
        subtitle={noListings ? "Sağlayıcılardan ilan dönmedi." : "Filtrelenmiş listing satırları"}
        padding="none"
      >
        {listings.length ? (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y divide-border-subtle">
              {listings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  favorite={favorites.includes(listing.id)}
                  onToggleFavorite={() => toggleFavorite(listing.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="px-4 py-4">
            <EmptyListingState status={response.status} warnings={response.warnings} />
          </div>
        )}
      </DataCard>

      <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-2 text-[11px] text-fg-muted leading-relaxed">
        Marketplace intelligence only. Source counts, freshness, and analysis are shown only from returned provider data; no unavailable provider is implied live.
      </div>
    </div>
  );
}

function ListingRow({ listing, favorite, onToggleFavorite }: { listing: NormalizedMarketListing; favorite: boolean; onToggleFavorite: () => void }) {
  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">{listing.providerName}</span>
          <span className="text-xs text-fg-secondary">{listing.listingType}</span>
          <span className={cn("text-[10px] uppercase tracking-wider", matchClass(listing.match.status))}>{listing.match.status}</span>
        </div>
        <div className="mt-1 text-sm font-medium text-fg-primary">{listing.title}</div>
        <div className="mt-1 text-xs text-fg-secondary">{[listing.location.mahalle, listing.location.ilce, listing.location.il].filter(Boolean).join(" · ") || "Konum açıklanmadı"}</div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-fg-muted">
          <span>İlan tarihi: {listing.publishedAt ? formatDate(listing.publishedAt) : "bilinmiyor"}</span>
          <span>m²: {listing.areaM2 ? formatInt(listing.areaM2) : "-"}</span>
          <span>fiyat: {listing.priceAmount ? formatTL(listing.priceAmount) : "-"}</span>
          <span>m² fiyatı: {listing.pricePerM2 ? formatTLDetailed(listing.pricePerM2) : "-"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded border transition-colors",
                favorite ? "border-[rgb(var(--accent-red))]/40 bg-[rgb(var(--accent-red))]/10 text-[rgb(var(--accent-red))]" : "border-border-subtle bg-surface-1 text-fg-muted hover:text-fg-primary"
              )}
              aria-label={favorite ? "Favoriden kaldır" : "Favoriye ekle"}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{favorite ? "Favoriden kaldır" : "Favoriye ekle"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={listing.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!listing.url}
              className={cn(
                "inline-flex h-8 items-center rounded px-2 text-[11px] font-medium transition-colors",
                listing.url ? "border border-border-subtle bg-surface-1 text-fg-primary hover:bg-surface-2" : "cursor-not-allowed border border-border-subtle bg-surface-1 text-fg-muted"
              )}
            >
              Aç
            </a>
          </TooltipTrigger>
          <TooltipContent>{listing.url ? "Kaynak sayfası" : "Bağlantı yok"}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function AnalysisBlock({ analysis, hasListings }: { analysis: ParcelMarketResponse["analysis"]; hasListings: boolean }) {
  if (analysis.status === "requires_data" || !hasListings) {
    return <EmptyAnalysisState reason={analysis.reason ?? "Listing verisi yok."} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-fg-primary">
        <BadgeCheck className="h-4 w-4 text-[rgb(var(--accent-blue))]" />
        <span>{analysis.summary ?? "Özet üretilemedi."}</span>
      </div>
      {analysis.bullets.length > 0 && (
        <ul className="space-y-1 text-xs text-fg-secondary">
          {analysis.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-blue))]" />{bullet}</li>)}
        </ul>
      )}
      {analysis.caveats.length > 0 && (
        <div className="rounded-md border border-border-subtle bg-surface-1/50 px-2.5 py-2 text-[11px] text-fg-muted">
          {analysis.caveats.join(" · ")}
        </div>
      )}
    </div>
  );
}

function ProviderChip({ provider }: { provider: ParcelMarketResponse["providers"][number] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs", readinessClass(provider.readiness.status))}>
          <Layers3 className="h-3.5 w-3.5" />
          {provider.providerName}
          <span className="text-[10px] uppercase tracking-wider">{provider.readiness.status}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{provider.readiness.reason}</TooltipContent>
    </Tooltip>
  );
}

function MarketStatusChip({ status }: { status: ParcelMarketResponse["status"] }) {
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider", statusClass(status))}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border-subtle bg-surface-1 px-3 py-2"><div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div><div className="mt-1 text-sm font-semibold tabular-nums text-fg-primary">{value}</div></div>;
}

function EmptySummary() {
  return <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-4 text-xs text-fg-secondary">Summary metrics are empty because no provider returned a listing row.</div>;
}

function EmptyAnalysisState({ reason }: { reason: string }) {
  return <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-4 text-xs text-fg-secondary">{reason}</div>;
}

function EmptyListingState({ status, warnings }: { status: ParcelMarketResponse["status"]; warnings: string[] }) {
  return (
    <div className="space-y-2 text-xs text-fg-secondary">
      <div className="flex items-center gap-2 text-fg-primary"><ShieldAlert className="h-4 w-4 text-amber-600" />No live listings</div>
      <p>{status === "unavailable" ? "All providers are unavailable, blocked, or not configured." : "Providers returned no parcel-matched rows."}</p>
      {warnings.length > 0 && <div className="rounded-md border border-border-subtle bg-surface-1/50 px-2.5 py-2">{warnings.join(" · ")}</div>}
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] transition-colors", active ? "border-[rgb(var(--accent-blue))]/40 bg-[rgb(var(--accent-blue))]/10 text-[rgb(var(--accent-blue))]" : "border-border-subtle bg-surface-1 text-fg-secondary hover:text-fg-primary")}>{label}</button>;
}

function statusClass(status: ParcelMarketResponse["status"]) {
  if (status === "ok") return "border-brand-navy/30 bg-brand-navy/10 text-brand-navy";
  if (status === "degraded") return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  if (status === "empty") return "border-slate-500/30 bg-slate-500/10 text-slate-700";
  return "border-red-500/30 bg-red-500/10 text-red-700";
}

function readinessClass(status: string) {
  if (status === "ok" || status === "no_match") return "border-brand-navy/30 bg-brand-navy/10 text-brand-navy";
  if (status === "requires_credentials") return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  if (status === "blocked" || status === "unsupported") return "border-red-500/30 bg-red-500/10 text-red-700";
  return "border-border-subtle bg-surface-1 text-fg-muted";
}

function matchClass(status: string) {
  if (status === "strong") return "text-brand-navy";
  if (status === "partial") return "text-amber-700";
  return "text-fg-muted";
}

function filterListings(listings: NormalizedMarketListing[], filters: MarketFilters) {
  let result = listings.filter((listing) => (filters.providerIds.length ? filters.providerIds.includes(listing.providerId) : true));
  if (filters.listingType !== "all") result = result.filter((listing) => listing.listingType === filters.listingType);
  return [...result].sort((a, b) => {
    if (filters.sortBy === "price_low") return (a.priceAmount ?? Infinity) - (b.priceAmount ?? Infinity);
    if (filters.sortBy === "price_high") return (b.priceAmount ?? -Infinity) - (a.priceAmount ?? -Infinity);
    if (filters.sortBy === "match") return b.match.score - a.match.score;
    return new Date(b.publishedAt ?? b.capturedAt).getTime() - new Date(a.publishedAt ?? a.capturedAt).getTime();
  });
}
