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
  const makeService = () => {
    const config = {
      get: (key: string) => (key === 'WEBSITE_SESSION_SECRET' ? 'test-secret' : undefined)
    } as unknown as ConfigService;
    return new WebsiteService(
      config,
      {} as ParcelsService,
      {} as AnalysisService,
      {} as SimulationService,
      {} as UserDataService,
      {} as EplanService,
      {} as MapService,
      {} as IngestionService,
      {} as SourcesService
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
});
