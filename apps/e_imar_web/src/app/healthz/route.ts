import { NextResponse } from "next/server";
import { resolvePublicBackendBase, resolvePublicSiteUrl } from "@/lib/public-config";

export const dynamic = "force-dynamic";

export function GET() {
  const siteUrl = resolvePublicSiteUrl();
  const apiBaseUrl = resolvePublicBackendBase();
  return NextResponse.json(
    {
      status: "ok",
      app: "e-imar-web",
      siteUrl: siteUrl.value,
      apiBaseUrl: apiBaseUrl.configured ? apiBaseUrl.value : null,
      generatedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
