import { ConfigService } from '@nestjs/config';
import { MarketProviderId, MarketProviderReadiness, MarketReadinessStatus, ProviderMarketResult, type ParcelMarketContext } from './market.types';

export interface MarketProviderAdapter {
  readonly id: MarketProviderId;
  readonly name: string;
  readonly sourceUrl: string;
  inspect(input: ParcelMarketContext, checkedAt: string): Promise<ProviderMarketResult>;
}

function makeReadiness(status: MarketReadinessStatus, reason: string, checkedAt: string): MarketProviderReadiness {
  return {
    status,
    reason,
    configured: status === 'ok' || status === 'no_match',
    source: 'adapter',
    checkedAt
  };
}

abstract class BaseStaticProviderAdapter implements MarketProviderAdapter {
  abstract readonly id: MarketProviderId;
  abstract readonly name: string;
  abstract readonly sourceUrl: string;
  protected abstract readonly defaultStatus: MarketReadinessStatus;
  protected abstract readonly defaultReason: string;

  constructor(protected readonly config: ConfigService) {}

  async inspect(input: ParcelMarketContext, checkedAt: string): Promise<ProviderMarketResult> {
    const override = this.resolveOverride();
    const status = override.status ?? this.defaultStatus;
    const reason = override.reason ?? this.defaultReason;
    return {
      providerId: this.id,
      providerName: this.name,
      sourceUrl: this.sourceUrl,
      readiness: makeReadiness(status, this.withParcelContext(reason, input), checkedAt),
      listings: []
    };
  }

  protected resolveOverride(): { status?: MarketReadinessStatus; reason?: string } {
    const raw = this.config.get<string>(`MARKET_PROVIDER_${this.id.toUpperCase()}_STATUS`);
    const reason = this.config.get<string>(`MARKET_PROVIDER_${this.id.toUpperCase()}_REASON`);
    if (!raw) return {};
    const status = raw.trim() as MarketReadinessStatus;
    if (!['ok', 'blocked', 'unsupported', 'requires_credentials', 'not_configured', 'unavailable', 'no_match'].includes(status)) {
      return {};
    }
    if (status === 'ok') {
      return {
        status: 'unsupported',
        reason: reason ?? 'Connector scaffolding is present, but live listing fetching is intentionally not enabled.'
      };
    }
    return { status, reason };
  }

  protected withParcelContext(reason: string, input: ParcelMarketContext): string {
    const parts = [reason];
    const parcelBits = [input.il, input.ilce, input.mahalle, input.ada && input.parsel ? `${input.ada}/${input.parsel}` : null]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (parcelBits.length > 0) parts.push(`Context: ${parcelBits.join(' · ')}`);
    return parts.join(' ');
  }
}

class SahibindenAdapter extends BaseStaticProviderAdapter {
  readonly id = 'sahibinden' as const;
  readonly name = 'Sahibinden';
  readonly sourceUrl = 'https://www.sahibinden.com/';
  protected readonly defaultStatus = 'blocked';
  protected readonly defaultReason = 'Anti-bot and terms constraints keep live marketplace fetches disabled in this build.';
}

class EmlakjetAdapter extends BaseStaticProviderAdapter {
  readonly id = 'emlakjet' as const;
  readonly name = 'Emlakjet';
  readonly sourceUrl = 'https://www.emlakjet.com/';
  protected readonly defaultStatus = 'not_configured';
  protected readonly defaultReason = 'No configured listing connector or partner feed is available for Emlakjet.';
}

class HepsiemlakAdapter extends BaseStaticProviderAdapter {
  readonly id = 'hepsiemlak' as const;
  readonly name = 'Hepsiemlak';
  readonly sourceUrl = 'https://www.hepsiemlak.com/';
  protected readonly defaultStatus = 'requires_credentials';
  protected readonly defaultReason = 'Partner access or authenticated feed is required before any live listing read can be attempted.';
}

class ZingatAdapter extends BaseStaticProviderAdapter {
  readonly id = 'zingat' as const;
  readonly name = 'Zingat';
  readonly sourceUrl = 'https://www.zingat.com/';
  protected readonly defaultStatus = 'unsupported';
  protected readonly defaultReason = 'Zingat is tracked as a provider reference only; no live integration is wired.';
}

export function createMarketProviderAdapters(config: ConfigService): MarketProviderAdapter[] {
  return [
    new SahibindenAdapter(config),
    new EmlakjetAdapter(config),
    new HepsiemlakAdapter(config),
    new ZingatAdapter(config)
  ];
}

