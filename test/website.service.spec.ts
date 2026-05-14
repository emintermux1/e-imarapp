import { ConfigService } from '@nestjs/config';
import { AnalysisService } from '../src/analysis/analysis.service';
import { EplanService } from '../src/eplan/eplan.service';
import { IngestionService } from '../src/ingestion/ingestion.service';
import { MapService } from '../src/map/map.service';
import { MarketService } from '../src/market/market.service';
import { ParcelsService } from '../src/parcels/parcels.service';
import { SimulationService } from '../src/simulation/simulation.service';
import { UserDataService } from '../src/user-data/user-data.service';
import { WebsiteService } from '../src/website/website.service';
import { SourcesService } from '../src/sources/sources.service';
import { SourceActivationService } from '../src/sources/source-activation.service';

describe('WebsiteService', () => {
  const makeService = (overrides: Partial<{ parcels: ParcelsService; analysis: AnalysisService; simulation: SimulationService; userData: UserDataService; sources: SourcesService; sourceActivation: SourceActivationService; market: MarketService }> = {}) => {
    const config = {
      get: (key: string) => (key === 'WEBSITE_SESSION_SECRET' ? 'test-secret' : undefined)
    } as unknown as ConfigService;
    return new WebsiteService(
      config,
      overrides.parcels ?? {} as ParcelsService,
      overrides.analysis ?? {} as AnalysisService,
      overrides.simulation ?? {} as SimulationService,
      overrides.userData ?? {} as UserDataService,
      {} as EplanService,
      {} as MapService,
      {} as IngestionService,
      overrides.sources ?? {} as SourcesService,
      overrides.sourceActivation ?? new SourceActivationService(),
      (overrides.market ?? {
        inspectParcelMarket: async () => ({
          status: 'unavailable',
          request: {},
          providers: [],
          listings: [],
          summary: null,
          analysis: { status: 'requires_data', provider: null, generatedAt: '2026-05-09T00:00:00.000Z', inputCount: 0, confidence: null, summary: null, bullets: [], caveats: [], reason: 'no data' },
          warnings: [],
          caveats: [],
          generatedAt: '2026-05-09T00:00:00.000Z',
          freshness: { status: 'no_data', checkedAt: '2026-05-09T00:00:00.000Z', listingCount: 0, providerCount: 0 }
        })
      }) as unknown as MarketService
    );
  };

  it('creates and verifies website session token', () => {
    const service = makeService();
    const started = service.startSession({ userReference: 'u-1', roles: ['user'] }) as { status: string; token: string };
    expect(started.status).toBe('ok');
    const verified = service.verifySession(started.token) as { status: string; payload: { userReference: string } };
    expect(verified.status).toBe('ok');
    expect(verified.payload.userReference).toBe('u-1');
  });

  it('rejects tampered token', () => {
    const service = makeService();
    const started = service.startSession({ userReference: 'u-1' }) as { token: string };
    const tampered = `${started.token}x`;
    const result = service.verifySession(tampered) as { status: string };
    expect(result.status).toBe('invalid_token');
  });

  it('returns honest municipal parcel workflow when method contract is unresolved', async () => {
    const service = makeService({ sources: new SourcesService() });

    const result = await service.municipalParcelWorkflow({ province: 'İstanbul', district: 'Pendik', ada: '1', parsel: '2' }) as any;

    expect(result.status).toBe('needs_contract');
    expect(result.query.municipalityId).toBe('pendik-keos-imar');
    expect(result.parcelGeometryAttempt.status).toBe('not_ready');
    expect(result.zoningAttempt.status).toBe('method_contract_required');
    expect(result.noDataReason).toContain('Public discovery');
    expect(result.sourceActivation.activationStatus).toBe('needs_contract');
    expect(result.provenance[0]).toEqual(expect.objectContaining({ sourceId: 'pendik-keos-imar', dataType: 'public_metadata', confidence: expect.any(Number) }));
    expect(result.provenance[0]).not.toHaveProperty('responseHash');
  });

  it('returns source_not_found without fake parcel data', async () => {
    const service = makeService({ sources: new SourcesService() });

    const result = await service.municipalParcelWorkflow({ province: 'Yok', district: 'Yok', ada: '1', parsel: '2' }) as any;

    expect(result.status).toBe('source_not_found');
    expect(result.parcelGeometryAttempt.status).toBe('not_ready');
    expect(result.provenance).toEqual([]);
  });

  it('returns truthful parcel market payload from the BFF path', async () => {
    const market = {
      inspectParcelMarket: jest.fn().mockResolvedValue({
        status: 'unavailable',
        request: { il: 'İstanbul', ilce: 'Beşiktaş', ada: '1', parsel: '2' },
        providers: [
          {
            providerId: 'sahibinden',
            providerName: 'Sahibinden',
            sourceUrl: 'https://www.sahibinden.com/',
            readiness: { status: 'blocked', reason: 'anti-bot', configured: false, source: 'adapter', checkedAt: '2026-05-09T00:00:00.000Z' },
            listings: []
          }
        ],
        listings: [],
        summary: null,
        analysis: { status: 'requires_data', provider: null, generatedAt: '2026-05-09T00:00:00.000Z', inputCount: 0, confidence: null, summary: null, bullets: [], caveats: [], reason: 'no data' },
        warnings: ['No provider adapter returned live listings for this parcel context.'],
        caveats: ['Marketplace intelligence is not cadastral truth.'],
        generatedAt: '2026-05-09T00:00:00.000Z',
        freshness: { status: 'no_data', checkedAt: '2026-05-09T00:00:00.000Z', listingCount: 0, providerCount: 1 }
      })
    } as unknown as MarketService;
    const service = makeService({ market });

    const result = await service.parcelMarket({ query: { il: 'İstanbul', ilce: 'Beşiktaş', ada: '1', parsel: '2' } }) as any;

    expect(result.status).toBe('unavailable');
    expect(result.summary).toBeNull();
    expect(result.listings).toEqual([]);
    expect(result.providers[0].readiness.status).toBe('blocked');
  });
});
