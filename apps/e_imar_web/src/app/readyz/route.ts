import { NextResponse } from "next/server";
import { resolvePublicBackendBase, resolvePublicSiteUrl } from "@/lib/public-config";

export const dynamic = "force-dynamic";

type ReadinessStatus = "ok" | "not_ready";
type SourceMode = "api" | "vector-tile" | "demo";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function truthy(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

function readSourceMode(): SourceMode {
  const mode = process.env.NEXT_PUBLIC_EIMAR_DATA_MODE;
  if (mode === "api" || mode === "vector-tile" || mode === "demo") return mode;
  return isProductionRuntime() ? "api" : "demo";
}

function check(key: string, ready: boolean, message: string) {
  return {
    key,
    status: ready ? "ok" : "not_ready",
    message
  };
}

export function GET() {
  const production = isProductionRuntime();
  const sourceMode = readSourceMode();
  const siteUrl = resolvePublicSiteUrl();
  const apiBaseUrl = resolvePublicBackendBase();
  const vectorTileUrl = process.env.NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL;
  const demoFallbackEnabled =
    truthy(process.env.NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK) || truthy(process.env.NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA);

  const checks = [
    check("site-url", siteUrl.valid, siteUrl.reason ?? "Canonical website URL can be resolved."),
    check(
      "parcel-source",
      sourceMode === "api"
        ? apiBaseUrl.configured && apiBaseUrl.valid
        : sourceMode === "vector-tile"
        ? Boolean(vectorTileUrl)
        : !production && sourceMode === "demo",
      sourceMode === "api"
        ? "API mode requires NEXT_PUBLIC_EIMAR_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL."
        : sourceMode === "vector-tile"
        ? "Vector tile mode requires NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL."
        : "Demo mode is allowed only outside production."
    ),
    check(
      "production-demo-fallback",
      !production || !demoFallbackEnabled,
      "Production must not silently fall back to demo parcel data."
    )
  ];
  const ready = checks.every((item) => item.status === "ok");
  const status: ReadinessStatus = ready ? "ok" : "not_ready";

  return NextResponse.json(
    {
      status,
      app: "e-imar-web",
      environment: production ? "production" : "non-production",
      sourceMode,
      siteUrl: siteUrl.value,
      apiBaseUrl: apiBaseUrl.configured ? apiBaseUrl.value : null,
      checks,
      generatedAt: new Date().toISOString()
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
