import { ConfigService } from '@nestjs/config';
import { AnalysisService } from '../src/analysis/analysis.service';
import { EplanService } from '../src/eplan/eplan.service';
import { IngestionService } from '../src/ingestion/ingestion.service';
import { MapService } from '../src/map/map.service';
import { ParcelsService } from '../src/parcels/parcels.service';
import { SimulationService } from '../src/simulation/simulation.service';
import { UserDataService } from '../src/user-data/user-data.service';
import { WebsiteService } from '../src/website/website.service';
import { SourcesService } from '../src/sources/sources.service';

describe('WebsiteService', () => {
  const makeService = (overrides: Partial<{ parcels: ParcelsService; analysis: AnalysisService; simulation: SimulationService; userData: UserDataService; sources: SourcesService }> = {}) => {
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
      overrides.sources ?? {} as SourcesService
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

    expect(result.status).toBe('method_contract_required');
    expect(result.query.municipalityId).toBe('pendik-keos-imar');
    expect(result.parcelGeometryAttempt.status).toBe('not_ready');
    expect(result.zoningAttempt.status).toBe('method_contract_required');
    expect(result.noDataReason).toBe('Kaynak bulundu ama method contract çözülmedi');
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
});
