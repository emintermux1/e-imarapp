enum GisLayerKind { wms, wfs, geoJson }

enum RiskLayer {
  deprem,
  fayHatti,
  heyelan,
  sel,
  zeminTipi,
  tarimAlani,
  sitAlani
}

enum RiskLayerCategory {
  seismic,
  geology,
  hydrology,
  soil,
  landUse,
  heritage,
  planning
}

enum GisQueryFormat { geoJson, json, png }

class GisLayerDescriptor {
  const GisLayerDescriptor({
    required this.id,
    required this.name,
    required this.kind,
    required this.endpoint,
    required this.sourceAuthority,
    required this.attribution,
    required this.opacity,
    required this.defaultVisible,
    required this.category,
    required this.cacheTtl,
    this.riskLayer,
    this.layerName,
  });

  final String id;
  final String name;
  final GisLayerKind kind;
  final Uri endpoint;
  final String sourceAuthority;
  final String attribution;
  final double opacity;
  final bool defaultVisible;
  final RiskLayerCategory category;
  final Duration cacheTtl;
  final RiskLayer? riskLayer;
  final String? layerName;

  bool get isRiskLayer => riskLayer != null;
}

class GisBoundingBox {
  const GisBoundingBox(
      {required this.west,
      required this.south,
      required this.east,
      required this.north});

  final double west;
  final double south;
  final double east;
  final double north;

  String toCommaSeparated() => '$west,$south,$east,$north';

  String toWms130Bbox(String crs) => crs.toUpperCase() == 'EPSG:4326'
      ? '$south,$west,$north,$east'
      : toCommaSeparated();
}

class GisPoint {
  const GisPoint({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;
}

class GisLayerQuery {
  const GisLayerQuery(
      {this.bounds,
      this.point,
      this.srs = 'EPSG:4326',
      this.width = 768,
      this.height = 768,
      this.format = GisQueryFormat.geoJson,
      this.extraParameters = const {}});

  final GisBoundingBox? bounds;
  final GisPoint? point;
  final String srs;
  final int width;
  final int height;
  final GisQueryFormat format;
  final Map<String, String> extraParameters;

  Uri buildUrl(GisLayerDescriptor layer) => switch (layer.kind) {
        GisLayerKind.wms => buildWmsUrl(layer),
        GisLayerKind.wfs => buildWfsUrl(layer),
        GisLayerKind.geoJson => buildGeoJsonUrl(layer),
      };

  Uri buildWmsUrl(GisLayerDescriptor layer) {
    final bbox = bounds ?? _pointBounds(point);
    return layer.endpoint.replace(queryParameters: {
      ...layer.endpoint.queryParameters,
      'service': 'WMS',
      'request': 'GetMap',
      'version': '1.3.0',
      'layers': layer.layerName ?? layer.id,
      'styles': '',
      'crs': srs,
      'bbox': bbox.toWms130Bbox(srs),
      'width': '$width',
      'height': '$height',
      'format': _mimeType(GisQueryFormat.png),
      'transparent': 'true',
      ...extraParameters,
    });
  }

  Uri buildWfsUrl(GisLayerDescriptor layer) {
    final bbox = bounds ?? _pointBounds(point);
    return layer.endpoint.replace(queryParameters: {
      ...layer.endpoint.queryParameters,
      'service': 'WFS',
      'request': 'GetFeature',
      'version': '2.0.0',
      'typeNames': layer.layerName ?? layer.id,
      'srsName': srs,
      'bbox': '${bbox.toCommaSeparated()},$srs',
      'outputFormat': _mimeType(format),
      ...extraParameters,
    });
  }

  Uri buildGeoJsonUrl(GisLayerDescriptor layer) {
    final bbox = bounds ?? _pointBounds(point);
    return layer.endpoint.replace(queryParameters: {
      ...layer.endpoint.queryParameters,
      'bbox': bbox.toCommaSeparated(),
      'srs': srs,
      'format': _mimeType(GisQueryFormat.geoJson),
      ...extraParameters,
    });
  }

  static GisBoundingBox _pointBounds(GisPoint? point) {
    final center =
        point ?? const GisPoint(latitude: 41.0082, longitude: 28.9784);
    const delta = .015;
    return GisBoundingBox(
        west: center.longitude - delta,
        south: center.latitude - delta,
        east: center.longitude + delta,
        north: center.latitude + delta);
  }

  static String _mimeType(GisQueryFormat format) => switch (format) {
        GisQueryFormat.geoJson => 'application/geo+json',
        GisQueryFormat.json => 'application/json',
        GisQueryFormat.png => 'image/png',
      };
}

class GisFeatureCollection {
  const GisFeatureCollection({required this.features, this.rawGeoJson});

  final List<GisFeature> features;
  final Map<String, Object?>? rawGeoJson;

  factory GisFeatureCollection.fromGeoJson(Map<String, Object?> json) {
    final rawFeatures = json['features'];
    final features = rawFeatures is List
        ? rawFeatures
            .whereType<Map>()
            .map((item) =>
                GisFeature.fromGeoJson(Map<String, Object?>.from(item)))
            .toList(growable: false)
        : const <GisFeature>[];
    return GisFeatureCollection(features: features, rawGeoJson: json);
  }

  factory GisFeatureCollection.raw(Map<String, Object?> json) =>
      GisFeatureCollection(features: const [], rawGeoJson: json);
}

class GisFeature {
  const GisFeature(
      {required this.id,
      required this.geometryType,
      required this.properties,
      this.geometry});

  final String? id;
  final String? geometryType;
  final Map<String, Object?> properties;
  final Map<String, Object?>? geometry;

  factory GisFeature.fromGeoJson(Map<String, Object?> json) {
    final geometry = json['geometry'];
    final properties = json['properties'];
    return GisFeature(
      id: json['id']?.toString(),
      geometryType: geometry is Map ? geometry['type']?.toString() : null,
      geometry: geometry is Map ? Map<String, Object?>.from(geometry) : null,
      properties:
          properties is Map ? Map<String, Object?>.from(properties) : const {},
    );
  }
}

abstract interface class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  Uri buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query);
  Future<GisFeatureCollection> fetchFeatures(
      GisLayerDescriptor layer, GisLayerQuery query);
}

class MockGisLayerRepository implements GisLayerRepository {
  const MockGisLayerRepository();

  @override
  Future<List<GisLayerDescriptor>> availableLayers() async =>
      officialRiskLayerPresets;

  @override
  Uri buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) =>
      query.buildUrl(layer);

  @override
  Future<GisFeatureCollection> fetchFeatures(
          GisLayerDescriptor layer, GisLayerQuery query) async =>
      GisFeatureCollection(
        features: [
          GisFeature(
            id: '${layer.id}-mock',
            geometryType: query.bounds == null ? 'Point' : 'Polygon',
            properties: {
              'layerId': layer.id,
              'authority': layer.sourceAuthority,
              'riskLayer': layer.riskLayer?.name,
              'mock': true,
              'requestUrl': buildRequestUrl(layer, query).toString(),
            },
          ),
        ],
        rawGeoJson: const {'type': 'FeatureCollection', 'features': []},
      );
}

final officialRiskLayerPresets = <GisLayerDescriptor>[
  GisLayerDescriptor(
    id: 'afad-earthquake-hazard',
    name: 'Deprem Tehlike Haritası',
    kind: GisLayerKind.geoJson,
    endpoint:
        Uri.parse('https://example.afad.gov.tr/gis/earthquake-hazard.geojson'),
    sourceAuthority: 'AFAD',
    attribution:
        'Afet ve Acil Durum Yönetimi Başkanlığı deprem tehlike verisi esas alınacaktır.',
    opacity: .74,
    defaultVisible: true,
    category: RiskLayerCategory.seismic,
    cacheTtl: const Duration(days: 30),
    riskLayer: RiskLayer.deprem,
  ),
  GisLayerDescriptor(
    id: 'mta-active-faults',
    name: 'Diri Fay Hatları',
    kind: GisLayerKind.wfs,
    endpoint: Uri.parse('https://example.mta.gov.tr/geoserver/fay/ows'),
    sourceAuthority: 'MTA',
    attribution:
        'Maden Tetkik ve Arama Genel Müdürlüğü diri fay haritası referans alınacaktır.',
    opacity: .88,
    defaultVisible: true,
    category: RiskLayerCategory.geology,
    cacheTtl: const Duration(days: 90),
    riskLayer: RiskLayer.fayHatti,
    layerName: 'mta:diri_fay',
  ),
  GisLayerDescriptor(
    id: 'municipality-landslide',
    name: 'Heyelan Duyarlılığı',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://example.bel.tr/geoserver/afet/wms'),
    sourceAuthority: 'Belediye / İl Afet Envanteri',
    attribution:
        'Yerel yönetim WMS/WFS afet duyarlılık katmanları beklenmektedir.',
    opacity: .68,
    defaultVisible: false,
    category: RiskLayerCategory.geology,
    cacheTtl: const Duration(days: 14),
    riskLayer: RiskLayer.heyelan,
    layerName: 'afet:heyelan_duyarlilik',
  ),
  GisLayerDescriptor(
    id: 'municipality-flood',
    name: 'Sel ve Taşkın Alanı',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://example.bel.tr/geoserver/hidroloji/wms'),
    sourceAuthority: 'Belediye / DSİ entegrasyonu',
    attribution:
        'Taşkın sınırı ve dere koruma bandı için resmi belediye veya DSİ servisleri kullanılacaktır.',
    opacity: .64,
    defaultVisible: false,
    category: RiskLayerCategory.hydrology,
    cacheTtl: const Duration(days: 14),
    riskLayer: RiskLayer.sel,
    layerName: 'hidroloji:taskin_alani',
  ),
  GisLayerDescriptor(
    id: 'municipality-soil-class',
    name: 'Zemin Tipi',
    kind: GisLayerKind.wfs,
    endpoint: Uri.parse('https://example.bel.tr/geoserver/jeoloji/ows'),
    sourceAuthority: 'Belediye Jeolojik Etüt',
    attribution:
        'Mikrobölgeleme ve jeolojik-jeoteknik etüt verileri resmi kurumdan alınacaktır.',
    opacity: .7,
    defaultVisible: true,
    category: RiskLayerCategory.soil,
    cacheTtl: const Duration(days: 30),
    riskLayer: RiskLayer.zeminTipi,
    layerName: 'jeoloji:zemin_sinifi',
  ),
  GisLayerDescriptor(
    id: 'gateway-restricted-land-use',
    name: 'Tarım Alanı',
    kind: GisLayerKind.geoJson,
    endpoint: Uri.parse('/providers'),
    sourceAuthority: 'Kısıtlı sağlayıcı / E-İmar Gateway',
    attribution:
        'Kadastro ve tarımsal koruma kararları yalnızca yetkili sunucu adaptörü ve sağlayıcı durumu üzerinden gösterilecektir.',
    opacity: .58,
    defaultVisible: false,
    category: RiskLayerCategory.landUse,
    cacheTtl: const Duration(days: 30),
    riskLayer: RiskLayer.tarimAlani,
  ),
  GisLayerDescriptor(
    id: 'eplan-protected-sites',
    name: 'Sit Alanı',
    kind: GisLayerKind.wfs,
    endpoint: Uri.parse('https://example.e-plan.gov.tr/geoserver/koruma/ows'),
    sourceAuthority: 'e-Plan / Kültür Varlıkları',
    attribution:
        'Plan kararları ve koruma sınırları ilgili resmi portaldan lisanslı olarak alınacaktır.',
    opacity: .72,
    defaultVisible: false,
    category: RiskLayerCategory.heritage,
    cacheTtl: const Duration(days: 30),
    riskLayer: RiskLayer.sitAlani,
    layerName: 'koruma:sit_alani',
  ),
  GisLayerDescriptor(
    id: 'eplan-zoning-plan',
    name: 'e-Plan İmar Planı',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://example.e-plan.gov.tr/geoserver/imar/wms'),
    sourceAuthority: 'e-Plan / Belediye',
    attribution:
        'Plan paftaları ve notları resmi e-Plan veya belediye servislerinden doğrulanacaktır.',
    opacity: .78,
    defaultVisible: false,
    category: RiskLayerCategory.planning,
    cacheTtl: const Duration(days: 7),
    layerName: 'imar:plan_pafta',
  ),
];
