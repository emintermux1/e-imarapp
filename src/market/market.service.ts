import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketAnalysisService } from './market-analysis.service';
import { createMarketProviderAdapters } from './market.providers';
import type {
  MarketSummary,
  ParcelMarketContext,
  ParcelMarketResponse,
  ProviderMarketResult,
  NormalizedMarketListing
} from './market.types';

@Injectable()
export class MarketService {
  private readonly providers: ReturnType<typeof createMarketProviderAdapters>;

  constructor(
    private readonly config: ConfigService,
    private readonly analysis: MarketAnalysisService
  ) {
    this.providers = createMarketProviderAdapters(this.config);
  }

  async inspectParcelMarket(request: ParcelMarketContext): Promise<ParcelMarketResponse> {
    const generatedAt = new Date().toISOString();
    const providers = await Promise.all(this.providers.map((provider) => provider.inspect(request, generatedAt)));
    const manualListings = this.manualListings(request, generatedAt);
    const listings = [...providers.flatMap((provider) => provider.listings), ...manualListings];
    const summary = this.buildSummary(listings, providers);
    const analysis = await this.analysis.analyze({ request, listings, generatedAt });
    const warnings = this.buildWarnings(providers, listings.length);
    const caveats = [
      'Marketplace intelligence is not cadastral truth.',
      'No listing row is shown unless it is returned by a provider adapter.',
      ...warnings.filter((value) => value.length > 0)
    ];

    const status = listings.length > 0
      ? 'ok'
      : providers.some((provider) => provider.readiness.status === 'no_match')
        ? 'empty'
        : providers.some((provider) => provider.readiness.status === 'ok')
          ? 'degraded'
          : 'unavailable';

    return {
      status,
      request: this.normalizeRequest(request),
      providers,
      listings,
      summary,
      analysis,
      warnings,
      caveats,
      generatedAt,
      freshness: {
        status: listings.length > 0 ? 'fresh' : 'no_data',
        checkedAt: generatedAt,
        listingCount: listings.length,
        providerCount: providers.length
      }
    };
  }

  private normalizeRequest(request: ParcelMarketContext): ParcelMarketContext {
    return {
      parcelId: request.parcelId ?? null,
      il: request.il?.trim() ?? null,
      ilce: request.ilce?.trim() ?? null,
      mahalle: request.mahalle?.trim() ?? null,
      ada: request.ada?.trim() ?? null,
      parsel: request.parsel?.trim() ?? null,
      areaM2: this.toFiniteNumber(request.areaM2),
      zoningType: request.zoningType?.trim() ?? null,
      centroid: Array.isArray(request.centroid) && request.centroid.length === 2
        ? [Number(request.centroid[0]), Number(request.centroid[1])]
        : null,
      manualListingLinks: Array.isArray(request.manualListingLinks)
        ? request.manualListingLinks.filter((url): url is string => typeof url === 'string' && url.trim().length > 0).slice(0, 10)
        : null
    };
  }

  private manualListings(request: ParcelMarketContext, capturedAt: string): NormalizedMarketListing[] {
    const normalized = this.normalizeRequest(request);
    return (normalized.manualListingLinks ?? [])
      .map((url) => this.manualListing(url, normalized, capturedAt))
      .filter((listing): listing is NormalizedMarketListing => Boolean(listing));
  }

  private manualListing(url: string, request: ParcelMarketContext, capturedAt: string): NormalizedMarketListing | null {
    const provider = this.providerFromUrl(url);
    if (!provider) return null;
    const parcelKey = [request.il, request.ilce, request.mahalle, request.ada && request.parsel ? `${request.ada}/${request.parsel}` : null]
      .filter(Boolean)
      .join(' · ');
    return {
      id: `manual:${provider.id}:${Buffer.from(url).toString('base64url').slice(0, 16)}`,
      providerId: provider.id,
      providerName: provider.name,
      title: `Manuel ilan linki · ${provider.name}`,
      listingType: 'sale',
      priceAmount: null,
      currency: 'TRY',
      areaM2: null,
      pricePerM2: null,
      location: {
        il: request.il ?? null,
        ilce: request.ilce ?? null,
        mahalle: request.mahalle ?? null,
        address: parcelKey || null,
        centroid: request.centroid ?? null
      },
      url,
      publishedAt: null,
      capturedAt,
      match: {
        status: parcelKey ? 'partial' : 'weak',
        score: parcelKey ? 0.5 : 0.25,
        reason: 'Manual link supplied by user/operator; listing content is not scraped.',
        parcelKey
      },
      provenance: {
        source: 'manual_link',
        providerId: provider.id,
        readinessStatus: 'ok',
        reason: 'Manual/partner link only; no automated scraping performed.'
      }
    };
  }

  private providerFromUrl(url: string): { id: NormalizedMarketListing['providerId']; name: string } | null {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes('sahibinden.com')) return { id: 'sahibinden', name: 'Sahibinden' };
      if (host.includes('emlakjet.com')) return { id: 'emlakjet', name: 'Emlakjet' };
      if (host.includes('hepsiemlak.com')) return { id: 'hepsiemlak', name: 'Hepsiemlak' };
      if (host.includes('zingat.com')) return { id: 'zingat', name: 'Zingat' };
      return null;
    } catch {
      return null;
    }
  }

  private buildSummary(listings: NormalizedMarketListing[], providers: ProviderMarketResult[]): MarketSummary | null {
    if (listings.length === 0) return null;

    const prices = listings.map((listing) => listing.priceAmount).filter((value): value is number => Number.isFinite(value));
    const pricePerM2 = listings.map((listing) => listing.pricePerM2).filter((value): value is number => Number.isFinite(value));
    const providerListingCount = providers.reduce((acc, provider) => {
      acc[provider.providerId] = provider.listings.length;
      return acc;
    }, {
      sahibinden: 0,
      emlakjet: 0,
      hepsiemlak: 0,
      zingat: 0
    });

    return {
      listingCount: listings.length,
      pricedListingCount: prices.length,
      providerCount: providers.length,
      providerListingCount,
      medianAskingPriceTRY: this.median(prices),
      averageAskingPriceTRY: this.average(prices),
      medianPricePerM2TRY: this.median(pricePerM2),
      averagePricePerM2TRY: this.average(pricePerM2),
      minAskingPriceTRY: prices.length ? Math.min(...prices) : null,
      maxAskingPriceTRY: prices.length ? Math.max(...prices) : null
    };
  }

  private buildWarnings(providers: ProviderMarketResult[], listingCount: number): string[] {
    const warnings = providers
      .filter((provider) => provider.readiness.status !== 'ok' && provider.readiness.status !== 'no_match')
      .map((provider) => `${provider.providerName}: ${provider.readiness.status} — ${provider.readiness.reason}`);
    if (listingCount === 0) {
      warnings.unshift('No provider adapter returned live listings for this parcel context.');
    }
    return warnings;
  }

  private median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private average(values: number[]): number | null {
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return null;
  }
}
