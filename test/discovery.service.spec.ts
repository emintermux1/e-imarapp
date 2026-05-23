import { ProbeStatus } from '../src/connectors/connector.types';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';

describe('DiscoveryService', () => {
  it('builds connector-specific candidate endpoints for municipal GIS sources', () => {
    const service = new DiscoveryService({} as HttpProbeService);
    const source = service.getSource('pendik-keos-imar');

    expect(service.buildCandidateEndpoints(source)).toEqual(
      expect.arrayContaining([
        'https://keos.pendik.bel.tr/NetGIS/Services/MapService.ashx',
        'https://keos.pendik.bel.tr/geoserver/ows?service=WMS&request=GetCapabilities'
      ])
    );
  });

  it('preserves published ports while lowering file homepages to base paths', () => {
    const service = new DiscoveryService({} as HttpProbeService);
    const source = service.getSource('suleymanpasa-keos-imar');

    expect(service.buildCandidateEndpoints(source)).toEqual(
      expect.arrayContaining([
        'https://keos.suleymanpasa.bel.tr:8080/imardurumu/',
        'https://keos.suleymanpasa.bel.tr:8080/NetGIS/Services/MapService.ashx'
      ])
    );
  });

  it('keeps discovery results tied to registered real sources', async () => {
    const probe = {
      probe: jest.fn(async (endpoint: string) => ({
        endpoint,
        status: ProbeStatus.Available,
        detectedKinds: []
      }))
    } as unknown as HttpProbeService;
    const service = new DiscoveryService(probe);

    const result = await service.discoverSource('tucbs-public-api');

    expect(result.source.homepageUrl).toBe('https://tucbs-public-api.csb.gov.tr/');
    expect(result.generatedAt).toBeDefined();
    expect(probe.probe).toHaveBeenCalled();
  });

  it('expands municipality pattern discovery without inventing source data', async () => {
    const probe = {
      probe: jest.fn(async (endpoint: string) => ({
        endpoint,
        status: ProbeStatus.Unavailable,
        detectedKinds: []
      }))
    } as unknown as HttpProbeService;
    const service = new DiscoveryService(probe);

    const result = await service.discoverMunicipalityPatterns('pendik');

    expect(result.candidates.map((candidate) => candidate.endpoint)).toEqual(
      expect.arrayContaining([
        'https://keos.pendik.bel.tr/',
        'https://webgis.pendik.bel.tr/',
        'https://eimar.pendik.bel.tr/'
      ])
    );
    expect(result.note).toContain('does not imply permission');
  });
});
