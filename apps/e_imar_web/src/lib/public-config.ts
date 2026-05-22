const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

type PublicEnv = Record<string, string | undefined>;

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function readUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return stripTrailingSlash(parsed.toString());
  } catch {
    return fallback;
  }
}

export function readPublicBackendBase(env: PublicEnv = process.env) {
  return readUrl(env.NEXT_PUBLIC_EIMAR_API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL, DEFAULT_BACKEND_ORIGIN);
}

export function toApiOrigin(baseUrl: string) {
  return stripTrailingSlash(baseUrl).replace(/\/api\/v1$/i, "");
}

export function toApiV1Base(baseUrl: string) {
  const cleaned = stripTrailingSlash(baseUrl);
  return /\/api\/v1$/i.test(cleaned) ? cleaned : `${cleaned}/api/v1`;
}

export function readPublicSiteUrl(env: PublicEnv = process.env) {
  const vercelUrl = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined;
  return readUrl(env.NEXT_PUBLIC_EIMAR_SITE_URL ?? vercelUrl, DEFAULT_SITE_ORIGIN);
}

export function isPreviewDeployment(env: PublicEnv = process.env) {
  const vercelEnv = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  return Boolean(vercelEnv && vercelEnv !== "production");
}
