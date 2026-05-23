import { ConnectorKind } from '../src/connectors/connector.types';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { OpenPublicSourceService } from '../src/connectors/open-public-source.service';
import { SourcesService } from '../src/sources/sources.service';

describe('OpenPublicSourceService', () => {
  let fetchMock: jest.SpyInstance;
  let service: OpenPublicSourceService;

  beforeEach(() => {
    service = new OpenPublicSourceService(new HttpProbeService());
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('verifies E-Plan WMS GetCapabilities when anonymous capabilities XML is reachable', async () => {
    fetchMock.mockResolvedValue(new Response('<WMS_Capabilities><Capability><Layer><Name>imar_plan</Name></Layer></Capability></WMS_Capabilities>', {
      status: 200,
      headers: { 'content-type': 'application/xml' }
    }));

    const result = await service.probeEPlanWms();

    expect(result.sourceId).toBe('csb-e-plan');
    expect(result.status).toBe('verified_live');
    expect(result.detectedKinds).toEqual(expect.arrayContaining([ConnectorKind.Wms, ConnectorKind.Ogc]));
    expect(result.message).toContain('Public capabilities metadata is reachable');
  });

  it('marks TUCBS public metadata discovery as captcha_required without bypassing protections', async () => {
    fetchMock.mockResolvedValue(new Response('<html><div>captcha güvenlik kodu</div></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const result = await service.probeTucbsPublicCatalog();

    expect(result.status).toBe('captcha_required');
    expect(result.verifiedLayers).toEqual([]);
    expect(result.message).toContain('automated discovery stopped');
  });

  it('discovers generic municipal GeoServer/MapServer candidates through mocked public metadata probes', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('geoserver')) {
        return new Response('<WMS_Capabilities><Service><Title>Municipal WMS</Title></Service></WMS_Capabilities>', { status: 200, headers: { 'content-type': 'application/xml' } });
      }
      return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
    });

    const result = await service.discoverMunicipalCapabilities({ baseUrl: 'https://cbs.example.bel.tr/viewer' });

    expect(result.status).toBe('verified_live');
    expect(result.checkedUrls).toEqual(expect.arrayContaining(['https://cbs.example.bel.tr/geoserver/ows?service=WMS&request=GetCapabilities']));
    expect(result.detectedKinds).toEqual(expect.arrayContaining([ConnectorKind.Geoserver, ConnectorKind.Wms, ConnectorKind.Ogc]));
  });

  it('returns Overpass rate-limit fallback messaging instead of retrying or bypassing limits', async () => {
    fetchMock.mockResolvedValue(new Response('too many requests', { status: 429, headers: { 'content-type': 'text/plain' } }));

    const result = await service.lookupOsmContext({ lat: 41.0082, lon: 28.9784, radiusMeters: 80, endpoint: 'https://overpass.test/api/interpreter' });

    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('rate limit');
    expect(result.fallback).toContain('avoid retry loops');
  });

  it('returns bounded OSM context as verified_live with non-official-use messaging', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ elements: [{ type: 'way', id: 1, tags: { building: 'yes' } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));

    const result = await service.lookupOsmContext({ lat: 41.0082, lon: 28.9784, endpoint: 'https://overpass.test/api/interpreter' });

    expect(result.status).toBe('verified_live');
    expect(result.elements).toHaveLength(1);
    expect(result.message).toContain('not official cadastral evidence');
  });
});

describe('source API readiness output', () => {
  it('exposes explicit public readiness statuses for frontend source display', () => {
    const result = new SourcesService().list() as any;
    const ePlan = result.sources.find((source: any) => source.id === 'csb-e-plan');
    const maks = result.sources.find((source: any) => source.id === 'maks');

    expect(result.readinessStatuses).toEqual(['verified_live', 'public_metadata', 'captcha_required', 'requires_credentials', 'requires_legal_agreement', 'unavailable']);
    expect(ePlan.publicReadiness.status).toBe('public_metadata');
    expect(maks.publicReadiness.status).toBe('requires_legal_agreement');
  });
});
