import { inspectOptionalSecret, OPTIONAL_SECRET_ENV_NAMES, readOptionalSecret } from './provider-env';

export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  MINIO_ENDPOINT?: string;
  MINIO_ROOT_USER?: string;
  MINIO_ROOT_PASSWORD?: string;
  OPENSEARCH_URL?: string;
  PG_TILESERV_URL?: string;
  PUSH_GATEWAY_URL?: string;
  MAPTILER_API_KEY?: string;
  MAPBOX_ACCESS_TOKEN?: string;
  CESIUM_ION_TOKEN?: string;
  HERE_API_KEY?: string;
  TKGM_LEGAL_AGREEMENT_REF?: string;
  TKGM_SESSION_REF?: string;
  MAKS_LEGAL_AGREEMENT_REF?: string;
  MAKS_CREDENTIALS_REF?: string;
  EDEVLET_TUCBS_CREDENTIALS_REF?: string;
  EDEVLET_TUCBS_OAUTH_REF?: string;
  COPERNICUS_OAUTH_REF?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  CORS_ORIGIN?: string;
}

const HTTP_URL_ENV_NAMES = ['MINIO_ENDPOINT', 'OPENSEARCH_URL', 'PG_TILESERV_URL', 'PUSH_GATEWAY_URL'] as const;
const CONNECTION_URL_RULES = {
  DATABASE_URL: ['postgres:', 'postgresql:'],
  REDIS_URL: ['redis:', 'rediss:']
} as const;
const NODE_ENV_VALUES = new Set(['development', 'test', 'production']);

export function validateEnv(rawEnv: Record<string, unknown>): AppEnvironment {
  const errors: string[] = [];
  const env: AppEnvironment = {
    NODE_ENV: parseNodeEnv(rawEnv.NODE_ENV, errors),
    PORT: parsePort(rawEnv.PORT, errors),
    RATE_LIMIT_WINDOW_MS: parsePositiveInteger(rawEnv.RATE_LIMIT_WINDOW_MS, 'RATE_LIMIT_WINDOW_MS', 60_000, errors),
    RATE_LIMIT_MAX: parsePositiveInteger(rawEnv.RATE_LIMIT_MAX, 'RATE_LIMIT_MAX', 120, errors)
  };

  for (const [envName, protocols] of Object.entries(CONNECTION_URL_RULES) as Array<
    [keyof typeof CONNECTION_URL_RULES, readonly string[]]
  >) {
    const value = parseOptionalUrl(rawEnv[envName], envName, protocols, errors);
    if (value) env[envName] = value;
  }

  for (const envName of HTTP_URL_ENV_NAMES) {
    const value = parseOptionalUrl(rawEnv[envName], envName, ['http:', 'https:'], errors);
    if (value) env[envName] = value;
  }

  env.MINIO_ROOT_USER = parseOptionalNonEmptyString(rawEnv.MINIO_ROOT_USER);
  env.MINIO_ROOT_PASSWORD = parseOptionalNonEmptyString(rawEnv.MINIO_ROOT_PASSWORD);
  env.OPENAI_MODEL = parseOptionalNonEmptyString(rawEnv.OPENAI_MODEL);
  env.CORS_ORIGIN = parseOptionalNonEmptyString(rawEnv.CORS_ORIGIN);

  for (const envName of OPTIONAL_SECRET_ENV_NAMES) {
    const diagnostic = inspectOptionalSecret(envName, rawEnv[envName]);
    if (diagnostic.status === 'malformed' && diagnostic.message) {
      errors.push(diagnostic.message);
    }

    const value = readOptionalSecret(rawEnv[envName]);
    if (value) {
      env[envName] = value;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return env;
}

function parseNodeEnv(rawValue: unknown, errors: string[]): AppEnvironment['NODE_ENV'] {
  const value = parseOptionalNonEmptyString(rawValue) ?? 'development';
  if (!NODE_ENV_VALUES.has(value)) {
    errors.push(`NODE_ENV must be one of development, test, or production. Received '${value}'.`);
    return 'development';
  }

  return value as AppEnvironment['NODE_ENV'];
}

function parsePort(rawValue: unknown, errors: string[]): number {
  const value = parseOptionalNonEmptyString(rawValue) ?? '3000';
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be an integer between 1 and 65535. Received '${value}'.`);
    return 3000;
  }

  return port;
}

function parsePositiveInteger(rawValue: unknown, envName: string, fallback: number, errors: string[]): number {
  const value = parseOptionalNonEmptyString(rawValue);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${envName} must be a positive integer. Received '${value}'.`);
    return fallback;
  }
  return parsed;
}

function parseOptionalUrl(
  rawValue: unknown,
  envName: string,
  protocols: readonly string[],
  errors: string[]
): string | undefined {
  const value = parseOptionalNonEmptyString(rawValue);
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) {
      errors.push(`${envName} must use ${protocols.join(' or ')}. Received '${parsed.protocol}'.`);
    }
    return value;
  } catch {
    errors.push(`${envName} must be a valid URL. Received '${value}'.`);
    return value;
  }
}

function parseOptionalNonEmptyString(rawValue: unknown): string | undefined {
  if (typeof rawValue !== 'string') return undefined;
  const value = rawValue.trim();
  return value.length > 0 ? value : undefined;
}
