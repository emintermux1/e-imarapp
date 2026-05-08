import { ProviderDescriptor } from './types';

export type MunicipalProviderConfig = ProviderDescriptor & {
  serviceUrl: string;
  serviceType: 'ArcGISFeatureServer' | 'ArcGISMapServer' | 'WMS' | 'WFS';
};

export type CityMapProviderConfig = ProviderDescriptor & {
  developerUrl: string;
  apiKey?: string;
};

export type RestrictedTkgmProviderConfig = ProviderDescriptor & {
  baseUrl?: string;
  permissionReference?: string;
};

export type EPlanProviderConfig = ProviderDescriptor & {
  pageUrl: string;
};

export type GatewayConfig = {
  turkeyOnly: boolean;
  municipalProviders: MunicipalProviderConfig[];
  cityMapProviders: CityMapProviderConfig[];
  tkgmProvider: RestrictedTkgmProviderConfig;
  ePlanProvider: EPlanProviderConfig;
};

const env = process.env;

const boolFromEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const publicMunicipalDefaults = (): MunicipalProviderConfig[] => [
  {
    id: 'kastamonu-il-ozel-idare-imar',
    kind: 'public_municipal_gis',
    displayName: 'Kastamonu İl Özel İdaresi İmar Planları',
    status: 'live',
    enabled: true,
    regions: ['kastamonu'],
    capabilities: ['layers', 'plan_by_point'],
    serviceType: 'ArcGISFeatureServer',
    serviceUrl: 'https://e-imar.kastamonuozelidare.gov.tr/arcgis/rest/services/IDARE_PUBLIC/IMAR_PUBLIC/FeatureServer',
    attribution: {
      name: 'Kastamonu İl Özel İdaresi ArcGIS REST Services',
      url: 'https://e-imar.kastamonuozelidare.gov.tr/arcgis/rest/services/IDARE_PUBLIC/IMAR_PUBLIC/FeatureServer'
    }
  },
  {
    id: 'artvin-il-ozel-idare-imar',
    kind: 'public_municipal_gis',
    displayName: 'Artvin İl Özel İdaresi İmar Planları',
    status: 'live',
    enabled: true,
    regions: ['artvin'],
    capabilities: ['layers', 'plan_by_point'],
    serviceType: 'ArcGISMapServer',
    serviceUrl: 'https://cbs.artvinozelidare.gov.tr/servergis/rest/services/IDARE_PUBLIC/IMAR_PUBLIC/MapServer',
    attribution: {
      name: 'Artvin İl Özel İdaresi ArcGIS REST Services',
      url: 'https://cbs.artvinozelidare.gov.tr/servergis/rest/services/IDARE_PUBLIC/IMAR_PUBLIC/MapServer/layers'
    }
  }
];

const configuredMunicipalProviders = (): MunicipalProviderConfig[] => {
  const raw = env.MUNICIPAL_GIS_PROVIDERS_JSON?.trim();
  if (!raw) {
    return publicMunicipalDefaults();
  }

  const parsed = JSON.parse(raw) as MunicipalProviderConfig[];
  return parsed.map((provider) => ({
    ...provider,
    kind: 'public_municipal_gis',
    status: provider.enabled ? provider.status : 'disabled'
  }));
};

export const loadGatewayConfig = (): GatewayConfig => {
  const tkgmEnabled = boolFromEnv(env.TKGM_PROVIDER_ENABLED, false);
  const permissionReference = env.TKGM_PERMISSION_REFERENCE?.trim();
  const tkgmBaseUrl = env.TKGM_PROVIDER_BASE_URL?.trim();
  const tkgmUsable = tkgmEnabled && Boolean(permissionReference) && Boolean(tkgmBaseUrl);

  return {
    turkeyOnly: boolFromEnv(env.GATEWAY_TURKEY_ONLY, true),
    municipalProviders: configuredMunicipalProviders(),
    cityMapProviders: [
      {
        id: 'ibb-city-map',
        kind: 'public_city_map',
        displayName: 'İBB Şehir Haritası API',
        status: env.IBB_CITY_MAP_API_KEY?.trim() ? 'metadata_only' : 'not_configured',
        enabled: boolFromEnv(env.IBB_CITY_MAP_PROVIDER_ENABLED, true),
        regions: ['istanbul'],
        capabilities: ['city_map_metadata'],
        developerUrl: 'https://sehirharitasiapi.ibb.gov.tr/developer/',
        apiKey: env.IBB_CITY_MAP_API_KEY?.trim(),
        attribution: {
          name: 'İstanbul Büyükşehir Belediyesi Şehir Haritası API',
          url: 'https://data.ibb.gov.tr/en/dataset/sehir-haritasi-api',
          termsUrl: 'https://sehirharitasiapi.ibb.gov.tr/developer/'
        }
      }
    ],
    tkgmProvider: {
      id: 'tkgm-restricted',
      kind: 'restricted_tkgm',
      displayName: 'TKGM MEGSİS restricted parcel services',
      status: tkgmUsable ? 'not_configured' : 'permission_required',
      enabled: tkgmUsable,
      regions: ['turkey'],
      capabilities: tkgmUsable ? ['parcel_by_admin', 'parcel_by_point'] : [],
      baseUrl: tkgmBaseUrl,
      permissionReference,
      attribution: {
        name: 'Tapu ve Kadastro Genel Müdürlüğü',
        url: 'https://www.tkgm.gov.tr/'
      }
    },
    ePlanProvider: {
      id: 'e-plan-public-page',
      kind: 'public_e_plan',
      displayName: 'e-Plan public imar durumu page',
      status: 'metadata_only',
      enabled: boolFromEnv(env.EPLAN_PROVIDER_ENABLED, true),
      regions: ['turkey'],
      capabilities: ['plan_metadata'],
      pageUrl: 'https://e-plan.gov.tr/e-plan/html/imarDurumu.html',
      attribution: {
        name: 'e-Plan',
        url: 'https://e-plan.gov.tr/e-plan/html/imarDurumu.html'
      }
    }
  };
};
