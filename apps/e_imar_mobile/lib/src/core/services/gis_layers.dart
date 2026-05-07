enum GisLayerKind { wms, wfs, geoJson }

enum RiskLayer { deprem, fayHatti, heyelan, sel, zeminTipi, tarimAlani, sitAlani }

class GisLayerDescriptor {
  const GisLayerDescriptor({required this.id, required this.name, required this.kind, required this.endpoint, this.riskLayer});
  final String id;
  final String name;
  final GisLayerKind kind;
  final Uri endpoint;
  final RiskLayer? riskLayer;
}

abstract interface class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  Future<String> fetchGeoJson(GisLayerDescriptor layer, {required double latitude, required double longitude});
}

class MockGisLayerRepository implements GisLayerRepository {
  @override
  Future<List<GisLayerDescriptor>> availableLayers() async => [
        GisLayerDescriptor(id: 'afad-earthquake', name: 'Deprem Riski', kind: GisLayerKind.geoJson, endpoint: Uri.parse('mock://afad/earthquake'), riskLayer: RiskLayer.deprem),
        GisLayerDescriptor(id: 'fault-lines', name: 'Fay Hattı', kind: GisLayerKind.wfs, endpoint: Uri.parse('mock://mta/fault-lines'), riskLayer: RiskLayer.fayHatti),
        GisLayerDescriptor(id: 'municipality-zoning', name: 'Belediye İmar Planı', kind: GisLayerKind.wms, endpoint: Uri.parse('mock://municipality/zoning')),
      ];

  @override
  Future<String> fetchGeoJson(GisLayerDescriptor layer, {required double latitude, required double longitude}) async => '{"type":"FeatureCollection","features":[]}';
}
