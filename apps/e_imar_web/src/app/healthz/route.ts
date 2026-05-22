import { NextResponse } from "next/server";
import { readPublicBackendBase, readPublicSiteUrl } from "@/lib/public-config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "e-imar-web",
      siteUrl: readPublicSiteUrl(),
      apiBaseUrl: readPublicBackendBase(),
      generatedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
