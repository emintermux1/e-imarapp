export type MarketProviderId = 'sahibinden' | 'emlakjet' | 'hepsiemlak' | 'zingat';

export type MarketReadinessStatus =
  | 'ok'
  | 'blocked'
  | 'unsupported'
  | 'requires_credentials'
  | 'not_configured'
  | 'unavailable'
  | 'no_match';

export type MarketListingType = 'sale' | 'rent' | 'lease';

export interface ParcelMarketContext {
  parcelId?: string | null;
  il?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  ada?: string | null;
  parsel?: string | null;
  areaM2?: number | null;
  zoningType?: string | null;
  centroid?: [number, number] | null;
}

export interface MarketProviderReadiness {
  status: MarketReadinessStatus;
  reason: string;
  configured: boolean;
  source: 'adapter';
  checkedAt: string;
}

export interface MarketListingMatch {
  status: 'strong' | 'partial' | 'weak' | 'none';
  score: number;
  reason: string;
  parcelKey: string;
}

export interface MarketListingLocation {
  il?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  address?: string | null;
  centroid?: [number, number] | null;
}

export interface NormalizedMarketListing {
  id: string;
  providerId: MarketProviderId;
  providerName: string;
  title: string;
  listingType: MarketListingType;
  priceAmount: number | null;
  currency: 'TRY';
  areaM2: number | null;
  pricePerM2: number | null;
  location: MarketListingLocation;
  url: string | null;
  publishedAt: string | null;
  capturedAt: string;
  match: MarketListingMatch;
  provenance: {
    source: 'provider_adapter';
    providerId: MarketProviderId;
    readinessStatus: MarketReadinessStatus;
    reason: string;
  };
}

export interface ProviderMarketResult {
  providerId: MarketProviderId;
  providerName: string;
  sourceUrl: string;
  readiness: MarketProviderReadiness;
  listings: NormalizedMarketListing[];
}

export interface MarketSummary {
  listingCount: number;
  pricedListingCount: number;
  providerCount: number;
  providerListingCount: Record<MarketProviderId, number>;
  medianAskingPriceTRY: number | null;
  averageAskingPriceTRY: number | null;
  medianPricePerM2TRY: number | null;
  averagePricePerM2TRY: number | null;
  minAskingPriceTRY: number | null;
  maxAskingPriceTRY: number | null;
}

export interface MarketAnalysisResult {
  status: 'ok' | 'requires_data' | 'requires_credentials' | 'provider_error' | 'unavailable';
  provider: 'openai' | 'local' | null;
  generatedAt: string;
  inputCount: number;
  confidence: number | null;
  summary: string | null;
  bullets: string[];
  caveats: string[];
  reason?: string;
}

export interface ParcelMarketResponse {
  status: 'ok' | 'empty' | 'unavailable' | 'degraded';
  request: ParcelMarketContext;
  providers: ProviderMarketResult[];
  listings: NormalizedMarketListing[];
  summary: MarketSummary | null;
  analysis: MarketAnalysisResult;
  warnings: string[];
  caveats: string[];
  generatedAt: string;
  freshness: {
    status: 'fresh' | 'no_data' | 'stale';
    checkedAt: string;
    listingCount: number;
    providerCount: number;
  };
}

