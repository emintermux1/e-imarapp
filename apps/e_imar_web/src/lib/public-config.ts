const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

type PublicEnv = Record<string, string | undefined>;

/** Next.js only inlines NEXT_PUBLIC_* when accessed literally on the client. */
export function readClientPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_EIMAR_API_BASE_URL: process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL,
    NEXT_PUBLIC_EIMAR_SITE_URL: process.env.NEXT_PUBLIC_EIMAR_SITE_URL,
    NEXT_PUBLIC_EIMAR_DATA_MODE: process.env.NEXT_PUBLIC_EIMAR_DATA_MODE,
    NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL: process.env.NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL,
    NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: process.env.NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK,
    NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA: process.env.NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV
  };
}

function currentPublicEnv(env?: PublicEnv) {
  return env ?? readClientPublicEnv();
}
export type PublicUrlResolution = {
  value: string;
  configured: boolean;
  valid: boolean;
  source: "env" | "fallback";
  envName?: string;
  reason?: string;
  ignoredInvalid?: Array<{ envName: string; reason: string }>;
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
  const ignoredInvalid: Array<{ envName: string; reason: string }> = [];
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
        envName: candidate.name,
        ignoredInvalid: ignoredInvalid.length ? ignoredInvalid : undefined
      };
    }
    ignoredInvalid.push({
      envName: candidate.name,
      reason: `${candidate.name} must be a valid http(s) URL.`
    });
  }

  const firstInvalid = ignoredInvalid[0];
  return {
    value: fallback,
    configured: ignoredInvalid.length > 0,
    valid: ignoredInvalid.length === 0,
    source: "fallback",
    envName: firstInvalid?.envName,
    reason: firstInvalid?.reason,
    ignoredInvalid: ignoredInvalid.length ? ignoredInvalid : undefined
  };
}

export function resolvePublicBackendBase(env?: PublicEnv): PublicUrlResolution {
  const resolvedEnv = currentPublicEnv(env);
  return resolvePublicUrl(
    [
      { name: "NEXT_PUBLIC_API_BASE_URL", value: resolvedEnv.NEXT_PUBLIC_API_BASE_URL },
      { name: "NEXT_PUBLIC_EIMAR_API_BASE_URL", value: resolvedEnv.NEXT_PUBLIC_EIMAR_API_BASE_URL }
    ],
    DEFAULT_BACKEND_ORIGIN
  );
}

export function readPublicBackendBase(env?: PublicEnv) {
  return resolvePublicBackendBase(env).value;
}

export function toApiOrigin(baseUrl: string) {
  return stripTrailingSlash(baseUrl).replace(/\/api\/v1$/i, "");
}

export function resolvePublicSiteUrl(env?: PublicEnv): PublicUrlResolution {
  const resolvedEnv = currentPublicEnv(env);
  const vercelUrl = resolvedEnv.VERCEL_URL ? `https://${resolvedEnv.VERCEL_URL}` : undefined;
  return resolvePublicUrl(
    [
      { name: "NEXT_PUBLIC_EIMAR_SITE_URL", value: resolvedEnv.NEXT_PUBLIC_EIMAR_SITE_URL },
      { name: "VERCEL_URL", value: vercelUrl }
    ],
    DEFAULT_SITE_ORIGIN
  );
}

export function readPublicSiteUrl(env?: PublicEnv) {
  return resolvePublicSiteUrl(env).value;
}

export function isPreviewDeployment(env?: PublicEnv) {
  const resolvedEnv = currentPublicEnv(env);
  const vercelEnv = resolvedEnv.NEXT_PUBLIC_VERCEL_ENV ?? resolvedEnv.VERCEL_ENV;
  return Boolean(vercelEnv && vercelEnv !== "production");
}
