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
});
