import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import type { NormalizedMarketListing, MarketAnalysisResult, ParcelMarketContext } from './market.types';

@Injectable()
export class MarketAnalysisService {
  constructor(private readonly config: ConfigService) {}

  async analyze(input: {
    request: ParcelMarketContext;
    listings: NormalizedMarketListing[];
    generatedAt: string;
  }): Promise<MarketAnalysisResult> {
    if (!input.listings.length) {
      return {
        status: 'requires_data',
        provider: null,
        generatedAt: input.generatedAt,
        inputCount: 0,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: ['AI market analysis is withheld until at least one real listing row is available.'],
        reason: 'At least one live, provider-backed listing is required before analysis can run.'
      };
    }

    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return {
        status: 'requires_credentials',
        provider: null,
        generatedAt: input.generatedAt,
        inputCount: input.listings.length,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: ['OPENAI_API_KEY is not configured.'],
        reason: 'OPENAI_API_KEY is not configured.'
      };
    }

    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You analyze Turkish real estate market listings only from the provided input. Do not invent inventory, prices, or trends. Return JSON with summary, bullets, caveats, and confidence.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              parcel: input.request,
              listings: input.listings.map((listing) => ({
                id: listing.id,
                providerName: listing.providerName,
                title: listing.title,
                listingType: listing.listingType,
                priceAmount: listing.priceAmount,
                areaM2: listing.areaM2,
                pricePerM2: listing.pricePerM2,
                publishedAt: listing.publishedAt,
                match: listing.match
              }))
            })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      return {
        status: 'provider_error',
        provider: 'openai',
        generatedAt: input.generatedAt,
        inputCount: input.listings.length,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: ['OpenAI request failed.'],
        reason: `OpenAI returned HTTP ${response.status}.`
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {
        status: 'provider_error',
        provider: 'openai',
        generatedAt: input.generatedAt,
        inputCount: input.listings.length,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: ['OpenAI returned an empty response.'],
        reason: 'No content returned.'
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, bullets: [], caveats: [], confidence: null };
    }

    const record = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    const bullets = Array.isArray(record.bullets)
      ? record.bullets.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
      : [];
    const caveats = Array.isArray(record.caveats)
      ? record.caveats.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
      : [];
    const summary = typeof record.summary === 'string' && record.summary.trim().length > 0 ? record.summary.trim() : null;
    const confidence = typeof record.confidence === 'number' && Number.isFinite(record.confidence) ? record.confidence : null;

    return {
      status: 'ok',
      provider: 'openai',
      generatedAt: input.generatedAt,
      inputCount: input.listings.length,
      confidence,
      summary,
      bullets,
      caveats,
      reason: summary ? undefined : 'Structured analysis returned no summary text.'
    };
  }
}

