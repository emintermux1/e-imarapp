"use client";

import type { ParcelMarketContext, ParcelMarketResponse } from "@/types/api";
import { originFetch } from "@/lib/api/backend-client";

export async function getParcelMarket(query: ParcelMarketContext): Promise<ParcelMarketResponse> {
  try {
    return await originFetch<ParcelMarketResponse>("/website/bff/parcel-market", {
      method: "POST",
      body: JSON.stringify({ query })
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Backend market endpoint is not available.";
    return {
      status: "unavailable",
      request: query,
      providers: [],
      listings: [],
      summary: null,
      analysis: {
        status: "unavailable",
        provider: null,
        generatedAt: new Date().toISOString(),
        inputCount: 0,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: [reason],
        reason
      },
      warnings: [reason],
      caveats: ["Unable to fetch marketplace payload."],
      generatedAt: new Date().toISOString(),
      freshness: { status: "no_data", checkedAt: new Date().toISOString(), listingCount: 0, providerCount: 0 }
    };
  }
}
