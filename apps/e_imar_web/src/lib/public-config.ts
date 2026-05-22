const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

type PublicEnv = Record<string, string | undefined>;
export type PublicUrlResolution = {
  value: string;
  configured: boolean;
  valid: boolean;
  source: "env" | "fallback";
  envName?: string;
  reason?: string;
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePublicUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return stripTrailingSlash(parsed.toString());
  } catch {
    return undefined;
  }
}

function resolvePublicUrl(
  candidates: Array<{ name: string; value: string | undefined }>,
  fallback: string
): PublicUrlResolution {
  for (const candidate of candidates) {
    const rawValue = candidate.value?.trim();
    if (!rawValue) continue;
    const normalized = normalizePublicUrl(rawValue);
    if (normalized) {
      return {
        value: normalized,
        configured: true,
        valid: true,
        source: "env",
        envName: candidate.name
      };
    }
    return {
      value: fallback,
      configured: true,
      valid: false,
      source: "fallback",
      envName: candidate.name,
      reason: `${candidate.name} must be a valid http(s) URL.`
    };
  }

  return {
    value: fallback,
    configured: false,
    valid: true,
    source: "fallback"
  };
}

export function resolvePublicBackendBase(env: PublicEnv = process.env): PublicUrlResolution {
  return resolvePublicUrl(
    [
      { name: "NEXT_PUBLIC_API_BASE_URL", value: env.NEXT_PUBLIC_API_BASE_URL },
      { name: "NEXT_PUBLIC_EIMAR_API_BASE_URL", value: env.NEXT_PUBLIC_EIMAR_API_BASE_URL }
    ],
    DEFAULT_BACKEND_ORIGIN
  );
}

export function readPublicBackendBase(env: PublicEnv = process.env) {
  return resolvePublicBackendBase(env).value;
}

export function toApiOrigin(baseUrl: string) {
  return stripTrailingSlash(baseUrl).replace(/\/api\/v1$/i, "");
}

export function resolvePublicSiteUrl(env: PublicEnv = process.env): PublicUrlResolution {
  const vercelUrl = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined;
  return resolvePublicUrl(
    [
      { name: "NEXT_PUBLIC_EIMAR_SITE_URL", value: env.NEXT_PUBLIC_EIMAR_SITE_URL },
      { name: "VERCEL_URL", value: vercelUrl }
    ],
    DEFAULT_SITE_ORIGIN
  );
}

export function readPublicSiteUrl(env: PublicEnv = process.env) {
  return resolvePublicSiteUrl(env).value;
}

export function isPreviewDeployment(env: PublicEnv = process.env) {
  const vercelEnv = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  return Boolean(vercelEnv && vercelEnv !== "production");
}
