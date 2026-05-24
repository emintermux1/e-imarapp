import { OgcDiscoveryService } from '../src/connectors/ogc-discovery.service';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { DatabaseService } from '../src/database/database.service';

describe('OgcDiscoveryService', () => {
  it('defines the OGC GetCapabilities discovery flow for Netcad KEOS', () => {
    const service = new OgcDiscoveryService(
      {} as DatabaseService,
      {} as DiscoveryService,
      {} as HttpProbeService
    );

    expect(service).toBeDefined();
  });

  it('builds GetCapabilities URL with service, request, and version params', () => {
    const service = new OgcDiscoveryService(
      {} as DatabaseService,
      {} as DiscoveryService,
      {} as HttpProbeService
    ) as any;

    const withQuery = service.buildGetCapabilitiesUrl('https://keos.ornek.bel.tr/', '/wms?', 'WMS', '1.3.0');
    const noQuery = service.buildGetCapabilitiesUrl('https://keos.ornek.bel.tr/', '/wms.ashx', 'WMS', '1.1.1');

    expect(withQuery).toContain('request=GetCapabilities');
    expect(withQuery).toContain('service=WMS');
    expect(withQuery).toContain('version=1.3.0');
    expect(noQuery).toBe('https://keos.ornek.bel.tr/wms.ashx?service=WMS&request=GetCapabilities&version=1.1.1');
  });

  it('splits combined SRS values into unique tokens', () => {
    const service = new OgcDiscoveryService(
      {} as DatabaseService,
      {} as DiscoveryService,
      {} as HttpProbeService
    ) as any;

    const srs = service.extractSrs({
      Capability: {
        Layer: {
          SRS: 'EPSG:4326 EPSG:3857',
          Layer: [{ CRS: 'EPSG:3857,EPSG:5254' }]
        }
      }
    });

    expect(srs).toEqual(['EPSG:4326', 'EPSG:3857', 'EPSG:5254']);
  });

  it('parses WMS layer catalog from GetCapabilities XML', () => {
    const service = new OgcDiscoveryService({} as DatabaseService, {} as DiscoveryService, {} as HttpProbeService);
    const xml = `<WMS_Capabilities><Capability><Layer><Title>Root</Title><Layer queryable="1"><Name>imar:plan</Name><Title>İmar Planı</Title><CRS>EPSG:4326 EPSG:3857</CRS><Abstract>Plan layer</Abstract><BoundingBox CRS="EPSG:4326" minx="1" miny="2" maxx="3" maxy="4"/></Layer></Layer></Capability></WMS_Capabilities>`;

    const layers = service.parseLayerCatalogXml(xml, 'WMS');

    expect(layers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'imar:plan', title: 'İmar Planı', queryable: true })]));
    expect(layers.find((layer) => layer.name === 'imar:plan')?.crs).toEqual(['EPSG:4326', 'EPSG:3857']);
  });

  it('parses WFS layer catalog from GetCapabilities XML', () => {
    const service = new OgcDiscoveryService({} as DatabaseService, {} as DiscoveryService, {} as HttpProbeService);
    const xml = `<WFS_Capabilities><FeatureTypeList><FeatureType><Name>parsel</Name><Title>Parsel</Title><DefaultCRS>EPSG:4326</DefaultCRS><Abstract>Parcel layer</Abstract></FeatureType></FeatureTypeList></WFS_Capabilities>`;

    const layers = service.parseLayerCatalogXml(xml, 'WFS');

    expect(layers).toEqual([expect.objectContaining({ name: 'parsel', title: 'Parsel', queryable: true, crs: ['EPSG:4326'] })]);
  });

  it('returns protected catalog status for login/captcha pages', async () => {
    const discovery = {
      getSource: jest.fn(() => ({ id: 'source-1', name: 'Source 1', homepageUrl: 'https://example.test', connectorKinds: [], access: { status: 'unknown', notes: '' }, capabilities: [] })),
      buildCandidateEndpoints: jest.fn(() => ['https://example.test/geoserver/ows?service=WMS&request=GetCapabilities'])
    } as unknown as DiscoveryService;
    const service = new OgcDiscoveryService({} as DatabaseService, discovery, {} as HttpProbeService);
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, text: async () => '<html>captcha login</html>' } as unknown as Response);

    const result = await service.catalog('source-1');

    expect(result.status).toBe('protected');
    fetchMock.mockRestore();
  });
});
