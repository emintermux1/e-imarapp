import { ConnectorKind } from '../src/connectors/connector.types';
import { ConnectorPluginRegistryService } from '../src/connectors/connector-plugin-registry.service';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { SourcesService } from '../src/sources/sources.service';

describe('ConnectorPluginRegistryService', () => {
  const service = new ConnectorPluginRegistryService(new DiscoveryService(new HttpProbeService()));

  it('lists plugin contracts with mandatory attribution fields', () => {
    const result = service.list();

    expect(result.plugins.map((plugin) => plugin.kind)).toEqual(expect.arrayContaining([
      ConnectorKind.NetcadKeos,
      ConnectorKind.Keos,
      ConnectorKind.Webgis,
      ConnectorKind.Ekent,
      ConnectorKind.ArcgisRest,
      ConnectorKind.Geoserver,
      ConnectorKind.Wms,
      ConnectorKind.Wfs
    ]));
    for (const plugin of result.plugins) {
      expect(plugin.outputContract.requiredFields).toEqual(['sourceUrl', 'retrievedAt', 'provenance', 'confidence', 'limitations']);
      expect(plugin.legalBoundary).toEqual(expect.any(String));
    }
  });

  it('plans Netcad/KEOS and WMS/WFS plugins for a registered public municipality', () => {
    const result = service.planForSource('pendik-keos-imar') as any;

    expect(result.status).toBe('ok');
    expect(result.plugins.map((plugin: { kind: ConnectorKind }) => plugin.kind)).toEqual(expect.arrayContaining([
      ConnectorKind.NetcadKeos,
      ConnectorKind.Keos,
      ConnectorKind.Wms,
      ConnectorKind.Wfs
    ]));
    expect(result.nextAction).toContain('provenance');
    expect(result.candidates.some((candidate: string) => candidate.includes('ImarDurumu'))).toBe(true);
  });
});

describe('municipal source connector kind expansion', () => {
  it('keeps canonical source registry compatible with plugin discovery', () => {
    const source = new SourcesService().get('pendik-keos-imar');

    expect(source.connectorKinds).toEqual(expect.arrayContaining([
      ConnectorKind.NetcadKeos,
      ConnectorKind.Keos,
      ConnectorKind.Wms,
      ConnectorKind.Wfs
    ]));
  });
});
