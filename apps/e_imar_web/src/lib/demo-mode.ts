/** Next.js only inlines NEXT_PUBLIC_* when accessed literally on the client. */
export function readClientDemoEnv() {
  return {
    NEXT_PUBLIC_EIMAR_DATA_MODE: process.env.NEXT_PUBLIC_EIMAR_DATA_MODE,
    NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: process.env.NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK,
    NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA: process.env.NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV
  };
}

function currentDemoEnv(env?: ReturnType<typeof readClientDemoEnv>) {
  return env ?? readClientDemoEnv();
}

export function isTruthyEnv(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

export function isProductionRuntime(env?: ReturnType<typeof readClientDemoEnv>) {
  const resolved = currentDemoEnv(env);
  return resolved.NODE_ENV === "production" || resolved.NEXT_PUBLIC_VERCEL_ENV === "production";
}

export type PublicDataMode = "demo" | "api" | "vector-tile";

export function readDataMode(env?: ReturnType<typeof readClientDemoEnv>): PublicDataMode {
  const resolved = currentDemoEnv(env);
  const value = resolved.NEXT_PUBLIC_EIMAR_DATA_MODE;
  if (value === "api" || value === "vector-tile" || value === "demo") return value;
  return isProductionRuntime(resolved) ? "api" : "demo";
}

export function isDemoDataMode(env?: ReturnType<typeof readClientDemoEnv>) {
  return readDataMode(env) === "demo";
}

export function shouldUseDemoFixtures(env?: ReturnType<typeof readClientDemoEnv>) {
  return isDemoDataMode(env);
}

export function demoModeLabel() {
  return "Demo modu · canlı API kapalı";
}
