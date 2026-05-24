import { MunicipalGisDiscoveryService } from '../src/municipalities/municipal-gis-discovery.service';
import { OgcDiscoveryService } from '../src/connectors/ogc-discovery.service';
import { DatabaseService } from '../src/database/database.service';
import { SourcesService } from '../src/sources/sources.service';

describe('MunicipalGisDiscoveryService', () => {
  it('resolves municipal slug to registry and source metadata', () => {
    const ogc = {
      discoverMunicipalEndpoints: jest.fn(),
      buildNetcadCandidateRoots: jest.fn(() => ['https://keos.pendik.bel.tr/'])
    } as unknown as OgcDiscoveryService;
    const service = new MunicipalGisDiscoveryService(ogc, { isConfigured: () => false } as DatabaseService, new SourcesService());

    const resolved = service.resolve('pendik');
    expect(resolved.registry?.id).toBe('pendik');
    expect(resolved.source?.id).toBe('pendik-keos-imar');
  });

  it('picks parcel-like OGC layer names before generic layers', () => {
    const service = new MunicipalGisDiscoveryService(
      {} as OgcDiscoveryService,
      { isConfigured: () => false } as DatabaseService,
      new SourcesService()
    );

    expect(
      service.pickParcelLayer([
        { name: 'PLAN_PAFTA', title: 'Plan Paftası' },
        { name: 'PARS_EL', title: 'Parsel' }
      ])
    ).toBe('PARS_EL');
  });
});
