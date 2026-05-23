export interface ProviderEnvDiagnostic {
  envName: string;
  configured: boolean;
  status: 'configured' | 'missing' | 'malformed';
  message?: string;
}

export const MAP_PROVIDER_ENV_NAMES = [
  'MAPTILER_API_KEY',
  'MAPBOX_ACCESS_TOKEN',
  'CESIUM_ION_TOKEN',
  'HERE_API_KEY'
] as const;

export const SOURCE_ACCESS_ENV_NAMES = [
  'TKGM_LEGAL_AGREEMENT_REF',
  'TKGM_SESSION_REF',
  'MAKS_LEGAL_AGREEMENT_REF',
  'MAKS_CREDENTIALS_REF',
  'EDEVLET_TUCBS_CREDENTIALS_REF',
  'EDEVLET_TUCBS_OAUTH_REF',
  'COPERNICUS_OAUTH_REF'
] as const;

export const OPTIONAL_SECRET_ENV_NAMES = [
  ...MAP_PROVIDER_ENV_NAMES,
  ...SOURCE_ACCESS_ENV_NAMES,
  'OPENAI_API_KEY'
] as const;

const PLACEHOLDER_SECRET_PATTERNS = [
  /^change-?me$/i,
  /^example$/i,
  /^placeholder$/i,
  /^your[-_]/i,
  /^test$/i,
  /^\.\.\.$/,
  /^<.+>$/,
  /^xxx+$/i
];

export function readOptionalSecret(rawValue: unknown): string | undefined {
  if (typeof rawValue !== 'string') return undefined;
  const value = rawValue.trim();
  return value.length > 0 ? value : undefined;
}

export function inspectOptionalSecret(envName: string, rawValue: unknown): ProviderEnvDiagnostic {
  const value = readOptionalSecret(rawValue);
  if (!value) {
    return {
      envName,
      configured: false,
      status: 'missing',
      message: `${envName} is not configured.`
    };
  }

  if (PLACEHOLDER_SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      envName,
      configured: false,
      status: 'malformed',
      message: `${envName} uses a placeholder value. Provide a real secret through environment variables or your secret manager.`
    };
  }

  return {
    envName,
    configured: true,
    status: 'configured'
  };
}
