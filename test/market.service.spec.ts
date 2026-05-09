import { ConfigService } from '@nestjs/config';
import { MarketAnalysisService } from '../src/market/market-analysis.service';
import { MarketService } from '../src/market/market.service';

describe('MarketAnalysisService', () => {
  it('returns requires_data when no listings are available', async () => {
    const service = new MarketAnalysisService({
      get: () => undefined
    } as unknown as ConfigService);

    const result = await service.analyze({
      request: { il: 'İstanbul', ilce: 'Beşiktaş' },
      listings: [],
      generatedAt: '2026-05-09T00:00:00.000Z'
    });

    expect(result.status).toBe('requires_data');
    expect(result.inputCount).toBe(0);
    expect(result.summary).toBeNull();
    expect(result.bullets).toEqual([]);
  });

  it('returns requires_credentials when listings exist but OpenAI is missing', async () => {
    const service = new MarketAnalysisService({
      get: () => undefined
    } as unknown as ConfigService);

    const result = await service.analyze({
      request: { il: 'İstanbul', ilce: 'Beşiktaş' },
      listings: [
        {
          id: 'x',
          providerId: 'sahibinden',
          providerName: 'Sahibinden',
          title: 'Test',
          listingType: 'sale',
          priceAmount: 1000000,
          currency: 'TRY',
          areaM2: 100,
          pricePerM2: 10000,
          location: {},
          url: null,
          publishedAt: null,
          capturedAt: '2026-05-09T00:00:00.000Z',
          match: { status: 'strong', score: 1, reason: 'ok', parcelKey: '1-2' },
          provenance: { source: 'provider_adapter', providerId: 'sahibinden', readinessStatus: 'requires_credentials', reason: 'missing' }
        }
      ],
      generatedAt: '2026-05-09T00:00:00.000Z'
    });

    expect(result.status).toBe('requires_credentials');
    expect(result.inputCount).toBe(1);
    expect(result.summary).toBeNull();
    expect(result.caveats[0]).toContain('OPENAI_API_KEY');
  });
});

describe('MarketService summary shape', () => {
  it('does not compute metrics from empty listings and preserves readiness', async () => {
    const analysis = {
      analyze: jest.fn().mockResolvedValue({
        status: 'requires_data',
        provider: null,
        generatedAt: '2026-05-09T00:00:00.000Z',
        inputCount: 0,
        confidence: null,
        summary: null,
        bullets: [],
        caveats: [],
        reason: 'no data'
      })
    } as unknown as MarketAnalysisService;

    const service = new MarketService({
      get: () => undefined
    } as unknown as ConfigService, analysis);

    (service as unknown as { providers: Array<{ inspect: () => Promise<any> }> }).providers = [
      {
        inspect: async () => ({
          providerId: 'sahibinden',
          providerName: 'Sahibinden',
          sourceUrl: 'https://www.sahibinden.com/',
          readiness: { status: 'blocked', reason: 'anti-bot', configured: false, source: 'adapter', checkedAt: '2026-05-09T00:00:00.000Z' },
          listings: []
        })
      }
    ];

    const result = await service.inspectParcelMarket({ il: 'İstanbul', ilce: 'Beşiktaş' });

    expect(result.summary).toBeNull();
    expect(result.listings).toEqual([]);
    expect(result.providers[0].readiness.status).toBe('blocked');
    expect(result.analysis.status).toBe('requires_data');
  });
});

