import { ConnectorKind, ProbeStatus } from '../src/connectors/connector.types';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { NetcadKeosService } from '../src/connectors/netcad-keos.service';

describe('NetcadKeosService', () => {
  it('documents the real KEOS data pull flow', () => {
    const service = new NetcadKeosService({} as DiscoveryService, {} as HttpProbeService);

    expect(service.strategy().flow).toEqual(
      expect.arrayContaining([
        'Fetch the public imar page.',
        'Extract same-origin JavaScript and service references.',
        'For ASMX endpoints, inspect ?WSDL and method pages before calling methods.'
      ])
    );
  });

  it('discovers Netcad endpoints from public HTML and common candidates', async () => {
    const source = {
      id: 'pendik-keos-imar',
      name: 'Pendik Belediyesi KEOS İmar Durumu',
      jurisdiction: 'municipal' as const,
      category: 'municipal_gis' as const,
      homepageUrl: 'https://keos.pendik.bel.tr/imardurumu/',
      connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
      access: { status: 'unknown' as const, notes: 'test source' },
      capabilities: ['zoning_status']
    };
    const discovery = {
      getSource: jest.fn(() => source),
      buildCandidateEndpoints: jest.fn(() => ['https://keos.pendik.bel.tr/NetGIS/Services/MapService.ashx'])
    } as unknown as DiscoveryService;
    const probe = {
      probe: jest.fn(async (endpoint: string) => ({
        endpoint,
        status: ProbeStatus.Available,
        detectedKinds: endpoint.includes('NetGIS') ? [ConnectorKind.NetcadKeos] : []
      }))
    } as unknown as HttpProbeService;
    const service = new NetcadKeosService(discovery, probe);
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: async () => '<script src="/app.js"></script>"Services/ImarDurumu.asmx"'
    } as unknown as Response);

    const result = await service.discover('pendik-keos-imar');

    expect(JSON.stringify(result)).toContain('https://keos.pendik.bel.tr/imardurumu/Services/ImarDurumu.asmx');
    expect(probe.probe).toHaveBeenCalledWith('https://keos.pendik.bel.tr/NetGIS/Services/MapService.ashx');
    fetchMock.mockRestore();
  });

  it('parses WSDL methods and identifies imar/ada-parsel candidates', () => {
    const service = new NetcadKeosService({} as DiscoveryService, {} as HttpProbeService);
    const wsdl = `<?xml version="1.0"?><definitions><portType><operation name="Ping"/><operation name="GetImarDurumu"/><operation name="AdaParselSorgu"/></portType></definitions>`;

    const methods = service.extractWsdlMethods(wsdl);

    expect(methods).toEqual(expect.arrayContaining(['Ping', 'GetImarDurumu', 'AdaParselSorgu']));
  });

  it('extracts sanitized payload hints from public JavaScript', () => {
    const service = new NetcadKeosService({} as DiscoveryService, {} as HttpProbeService);
    const hints = service.extractPayloadHints(`$.ajax({url:'/Services/ImarDurumu.asmx/GetImarDurumu', method:'POST', data: JSON.stringify({ ada: ada, parsel: parsel, mahalle: mahalle, token: 'secret' })});`);

    expect(hints).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'method', value: 'GetImarDurumu' })]));
    expect(hints.some((hint) => hint.kind === 'query_param' && hint.value === 'ada')).toBe(true);
    expect(JSON.stringify(hints)).not.toContain('secret');
  });

  it('resolves methods with protected status when WSDL page is login/captcha gated', async () => {
    const source = {
      id: 'protected-keos',
      name: 'Protected KEOS',
      jurisdiction: 'municipal' as const,
      category: 'municipal_gis' as const,
      homepageUrl: 'https://keos.protected.bel.tr/imardurumu/',
      connectorKinds: [ConnectorKind.NetcadKeos],
      access: { status: 'unknown' as const, notes: 'test' },
      capabilities: ['zoning_status']
    };
    const discovery = {
      getSource: jest.fn(() => source),
      buildCandidateEndpoints: jest.fn(() => ['https://keos.protected.bel.tr/imardurumu/Services/ImarDurumu.asmx'])
    } as unknown as DiscoveryService;
    const service = new NetcadKeosService(discovery, {} as HttpProbeService);
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, text: async () => '<html>captcha login</html>' } as unknown as Response);

    const result = await service.resolveMethods('protected-keos');

    expect(result.status).toBe('protected');
    fetchMock.mockRestore();
  });
});
