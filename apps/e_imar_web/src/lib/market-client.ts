"use client";

import type { ParcelMarketContext, ParcelMarketResponse } from "@/types/api";

const apiBase = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL;

export async function getParcelMarket(query: ParcelMarketContext): Promise<ParcelMarketResponse> {
  if (!apiBase) {
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
        caveats: ["Backend market endpoint is not configured."],
        reason: "NEXT_PUBLIC_EIMAR_API_BASE_URL is not configured."
      },
      warnings: ["Backend market endpoint is not configured."],
      caveats: ["No live marketplace data can be requested without API base URL."],
      generatedAt: new Date().toISOString(),
      freshness: { status: "no_data", checkedAt: new Date().toISOString(), listingCount: 0, providerCount: 0 }
    };
  }

  const response = await fetch(`${apiBase.replace(/\/$/, "")}/website/bff/parcel-market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ query })
  });
  if (!response.ok) {
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
        caveats: [`Market endpoint failed with ${response.status}`],
        reason: `HTTP ${response.status}`
      },
      warnings: [`Market endpoint failed with ${response.status}`],
      caveats: ["Unable to fetch marketplace payload."],
      generatedAt: new Date().toISOString(),
      freshness: { status: "no_data", checkedAt: new Date().toISOString(), listingCount: 0, providerCount: 0 }
    };
  }
  return (await response.json()) as ParcelMarketResponse;
}
