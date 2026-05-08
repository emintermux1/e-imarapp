import { GatewayConfig, loadGatewayConfig, MunicipalProviderConfig } from './config';
import { ProviderDescriptor } from './types';

export class ProviderRegistry {
  private readonly config: GatewayConfig;

  constructor(config = loadGatewayConfig()) {
    this.config = config;
  }

  allProviders(): ProviderDescriptor[] {
    return [
      ...this.config.municipalProviders,
      ...this.config.cityMapProviders,
      this.config.tkgmProvider,
      this.config.ePlanProvider
    ].map(({ id, kind, displayName, status, enabled, regions, capabilities, attribution }) => ({
      id,
      kind,
      displayName,
      status,
      enabled,
      regions,
      capabilities,
      attribution
    }));
  }

  municipalForCity(city?: string): MunicipalProviderConfig[] {
    const normalizedCity = city?.trim().toLocaleLowerCase('tr-TR');
    return this.config.municipalProviders.filter((provider) => {
      if (!provider.enabled) {
        return false;
      }

      if (!normalizedCity) {
        return true;
      }

      return provider.regions.some((region) => region.toLocaleLowerCase('tr-TR') === normalizedCity);
    });
  }

  providersForCity(city?: string): ProviderDescriptor[] {
    const normalizedCity = city?.trim().toLocaleLowerCase('tr-TR');
    if (!normalizedCity) {
      return this.allProviders();
    }

    return this.allProviders().filter((provider) =>
      provider.regions.some((region) => {
        const normalizedRegion = region.toLocaleLowerCase('tr-TR');
        return normalizedRegion === normalizedCity || normalizedRegion === 'turkey';
      })
    );
  }

  tkgm() {
    return this.config.tkgmProvider;
  }

  ePlan() {
    return this.config.ePlanProvider;
  }

  turkeyOnly(): boolean {
    return this.config.turkeyOnly;
  }
}
