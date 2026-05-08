export type ProviderKind =
  | 'public_municipal_gis'
  | 'public_city_map'
  | 'restricted_tkgm'
  | 'public_e_plan';

export type ProviderStatus =
  | 'live'
  | 'metadata_only'
  | 'not_configured'
  | 'permission_required'
  | 'disabled';

export type SourceAttribution = {
  name: string;
  url: string;
  license?: string;
  termsUrl?: string;
};

export type ProviderDescriptor = {
  id: string;
  kind: ProviderKind;
  displayName: string;
  status: ProviderStatus;
  enabled: boolean;
  regions: string[];
  capabilities: string[];
  attribution: SourceAttribution;
};

export type GatewayErrorCode =
  | 'bad_request'
  | 'not_configured'
  | 'provider_requires_permission'
  | 'provider_unavailable'
  | 'provider_error'
  | 'unsupported_operation'
  | 'outside_turkey_bounds';

export type GatewayError = {
  code: GatewayErrorCode;
  message: string;
  providerId?: string;
  details?: unknown;
};

export type GatewayResponse<T> = {
  status: 'ok' | 'error';
  data?: T;
  error?: GatewayError;
  attribution?: SourceAttribution[];
};
