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

  it('builds GetCapabilities URL without duplicate query delimiter', () => {
    const service = new OgcDiscoveryService(
      {} as DatabaseService,
      {} as DiscoveryService,
      {} as HttpProbeService
    ) as any;

    const withQuery = service.buildGetCapabilitiesUrl('https://keos.ornek.bel.tr', '/wms?');
    const noQuery = service.buildGetCapabilitiesUrl('https://keos.ornek.bel.tr', '/wms.ashx');

    expect(withQuery).toBe('https://keos.ornek.bel.tr/wms?&request=GetCapabilities&service=WMS');
    expect(noQuery).toBe('https://keos.ornek.bel.tr/wms.ashx?request=GetCapabilities&service=WMS');
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
});
