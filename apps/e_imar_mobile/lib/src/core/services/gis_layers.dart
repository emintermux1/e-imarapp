import 'dart:convert';

enum GisLayerKind { wms, wfs, geoJson }

enum GisQueryFormat { wms, wfs, geoJson }

enum RiskLayerCategory { jeofizik, jeolojik, idari, cevresel }

enum RiskLayer { deprem, fayHatti, heyelan, sel, zeminTipi, tarimAlani, sitAlani }

class GisBoundingBox {
  const GisBoundingBox({
    required this.minLng,
    required this.minLat,
    required this.maxLng,
    required this.maxLat,
  });

  final double minLng;
  final double minLat;
  final double maxLng;
  final double maxLat;

  String toBboxString() => '$minLng,$minLat,$maxLng,$maxLat';

  static const turkeyBounds = GisBoundingBox(
    minLng: 25.5,
    minLat: 35.8,
    maxLng: 45.0,
    maxLat: 42.2,
  );
}

class GisPoint {
  const GisPoint({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;
}

class GisLayerQuery {
  const GisLayerQuery({
    required this.bbox,
    required this.srs,
    this.format = GisQueryFormat.geoJson,
    this.maxFeatures = 500,
  });

  final GisBoundingBox bbox;
  final String srs;
  final GisQueryFormat format;
  final int maxFeatures;

  String toBboxString() => bbox.toBboxString();
}

class GisFeature {
  const GisFeature({
    required this.id,
    required this.properties,
    this.geometry,
  });

  final String id;
  final Map<String, Object?> properties;
  final Map<String, Object?>? geometry;

  factory GisFeature.fromJson(Map<String, dynamic> json) {
    return GisFeature(
      id: (json['id'] ?? json['properties']?['id'] ?? '').toString(),
      properties: Map<String, Object?>.from(json['properties'] as Map? ?? {}),
      geometry: json['geometry'] is Map ? Map<String, Object?>.from(json['geometry'] as Map) : null,
    );
  }
}

class GisFeatureCollection {
  const GisFeatureCollection({
    required this.features,
    this.crs,
    this.metadata = const {},
    this.errorMessage,
  });

  final List<GisFeature> features;
  final String? crs;
  final Map<String, String> metadata;
  final String? errorMessage;

  bool get hasError => errorMessage != null;
  bool get isEmpty => features.isEmpty;
  bool get isNotEmpty => features.isNotEmpty;

  static const empty = GisFeatureCollection(features: []);

  static GisFeatureCollection withError(String message) =>
      GisFeatureCollection(features: [], errorMessage: message, metadata: {'hata': message});

  factory GisFeatureCollection.fromJson(Map<String, dynamic> json) {
    final rawFeatures = json['features'] as List<dynamic>? ?? [];
    final features = rawFeatures
        .whereType<Map<String, dynamic>>()
        .map((f) => GisFeature.fromJson(f))
        .toList(growable: false);
    return GisFeatureCollection(
      features: features,
      crs: json['crs']?['properties']?['name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'type': 'FeatureCollection',
        if (crs != null)
          'crs': {
            'type': 'name',
            'properties': {'name': crs},
          },
        'features': features
            .map((f) => {
                  'type': 'Feature',
                  'id': f.id,
                  'properties': f.properties,
                  if (f.geometry != null) 'geometry': f.geometry,
                })
            .toList(growable: false),
      };
}

class GisLayerDescriptor {
  const GisLayerDescriptor({
    required this.id,
    required this.name,
    required this.kind,
    required this.endpoint,
    this.riskLayer,
    this.wmsLayerName,
    this.wfsTypeName,
    this.category,
    this.cacheTtl = const Duration(minutes: 15),
  });

  final String id;
  final String name;
  final GisLayerKind kind;
  final Uri endpoint;
  final RiskLayer? riskLayer;
  final String? wmsLayerName;
  final String? wfsTypeName;
  final RiskLayerCategory? category;
  final Duration cacheTtl;

  GisQueryFormat get defaultFormat => switch (kind) {
        GisLayerKind.wms => GisQueryFormat.wms,
        GisLayerKind.wfs => GisQueryFormat.wfs,
        GisLayerKind.geoJson => GisQueryFormat.geoJson,
      };
}

const officialRiskLayerPresets = <GisLayerDescriptor>[
  GisLayerDescriptor(
    id: 'afad-deprem-tehlike',
    name: 'Deprem Tehlike Haritası (AFAD)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://tdth.afad.gov.tr/geoserver/ows'),
    riskLayer: RiskLayer.deprem,
    wmsLayerName: 'tdth:deprem_tehlike',
    category: RiskLayerCategory.jeofizik,
    cacheTtl: Duration(hours: 24),
  ),
  GisLayerDescriptor(
    id: 'mta-diri-fay',
    name: 'Diri Fay Hatları (MTA)',
    kind: GisLayerKind.wfs,
    endpoint: Uri.parse('https://yerbilimleri.mta.gov.tr/geoserver/wfs'),
    riskLayer: RiskLayer.fayHatti,
    wfsTypeName: 'mta:diri_fay',
    category: RiskLayerCategory.jeolojik,
    cacheTtl: Duration(hours: 168),
  ),
  GisLayerDescriptor(
    id: 'afad-heyelan',
    name: 'Heyelan Envanteri (AFAD)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://tdth.afad.gov.tr/geoserver/ows'),
    riskLayer: RiskLayer.heyelan,
    wmsLayerName: 'tdth:heyelan',
    category: RiskLayerCategory.jeolojik,
    cacheTtl: Duration(hours: 168),
  ),
  GisLayerDescriptor(
    id: 'dsi-sel-tehlike',
    name: 'Sel ve Taşkın Tehlike Haritası (DSİ)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://geoportal.dsi.gov.tr/geoserver/ows'),
    riskLayer: RiskLayer.sel,
    wmsLayerName: 'dsi:sel_tehlike',
    category: RiskLayerCategory.jeofizik,
    cacheTtl: Duration(hours: 72),
  ),
  GisLayerDescriptor(
    id: 'mta-zemin',
    name: 'Jeoloji ve Zemin Sınıflaması (MTA)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://yerbilimleri.mta.gov.tr/geoserver/wms'),
    riskLayer: RiskLayer.zeminTipi,
    wmsLayerName: 'mta:jeoloji',
    category: RiskLayerCategory.jeolojik,
    cacheTtl: Duration(hours: 720),
  ),
  GisLayerDescriptor(
    id: 'tobb-tarim',
    name: 'Tarım Alanları (TOBB Arazi Sınıflandırma)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://cbsservis.tobb.org.tr/geoserver/wms'),
    riskLayer: RiskLayer.tarimAlani,
    wmsLayerName: 'tobb:tarim_arazi',
    category: RiskLayerCategory.cevresel,
    cacheTtl: Duration(hours: 720),
  ),
  GisLayerDescriptor(
    id: 'kultur-sit',
    name: 'Sit Alanları (Kültür ve Turizm Bakanlığı)',
    kind: GisLayerKind.wfs,
    endpoint: Uri.parse('https://korumakurullari.ktb.gov.tr/geoserver/wfs'),
    riskLayer: RiskLayer.sitAlani,
    wfsTypeName: 'ktb:sit_alanlari',
    category: RiskLayerCategory.idari,
    cacheTtl: Duration(hours: 720),
  ),
  GisLayerDescriptor(
    id: 'cevre-arazi-ortusu',
    name: 'Arazi Örtüsü (CORINE Uyarlı)',
    kind: GisLayerKind.geoJson,
    endpoint: Uri.parse('https://land.copernicus.eu/api/clc/turkey'),
    category: RiskLayerCategory.cevresel,
    cacheTtl: Duration(hours: 8760),
  ),
];

String buildWmsRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final params = <String, String>{
    'service': 'WMS',
    'version': '1.3.0',
    'request': 'GetMap',
    'layers': layer.wmsLayerName ?? layer.id,
    'styles': '',
    'crs': query.srs,
    'bbox': query.toBboxString(),
    'width': '1024',
    'height': '1024',
    'format': 'image/png',
    'transparent': 'true',
  };
  return '${layer.endpoint}?${Uri(queryParameters: params).query}';
}

String buildWfsRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final params = <String, String>{
    'service': 'WFS',
    'version': '2.0.0',
    'request': 'GetFeature',
    'typeNames': layer.wfsTypeName ?? layer.id,
    'srsName': query.srs,
    'bbox': '${query.toBboxString()},${query.srs}',
    'outputFormat': 'application/json',
    'count': query.maxFeatures.toString(),
  };
  return '${layer.endpoint}?${Uri(queryParameters: params).query}';
}

String buildGeoJsonRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  return '${layer.endpoint}?bbox=${query.toBboxString()}&limit=${query.maxFeatures}';
}

String buildGisRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final format = query.format;
  return switch (format) {
    GisQueryFormat.wms => buildWmsRequestUrl(layer, query),
    GisQueryFormat.wfs => buildWfsRequestUrl(layer, query),
    GisQueryFormat.geoJson => buildGeoJsonRequestUrl(layer, query),
  };
}

abstract interface class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query);
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query);

  Future<String> fetchGeoJson(GisLayerDescriptor layer, {required double latitude, required double longitude}) async {
    const query = GisLayerQuery(bbox: GisBoundingBox(minLng: 0, minLat: 0, maxLng: 0, maxLat: 0), srs: 'EPSG:4326');
    final collection = await fetchFeatures(layer, query);
    return jsonEncode(collection.toJson());
  }
}

class MockGisLayerRepository implements GisLayerRepository {
  @override
  Future<List<GisLayerDescriptor>> availableLayers() async => [
        GisLayerDescriptor(
          id: 'afad-earthquake',
          name: 'Deprem Riski',
          kind: GisLayerKind.geoJson,
          endpoint: Uri.parse('mock://afad/earthquake'),
          riskLayer: RiskLayer.deprem,
          cacheTtl: const Duration(minutes: 15),
        ),
        GisLayerDescriptor(
          id: 'fault-lines',
          name: 'Fay Hattı',
          kind: GisLayerKind.wfs,
          endpoint: Uri.parse('mock://mta/fault-lines'),
          riskLayer: RiskLayer.fayHatti,
          cacheTtl: const Duration(minutes: 15),
        ),
        GisLayerDescriptor(
          id: 'municipality-zoning',
          name: 'Belediye İmar Planı',
          kind: GisLayerKind.wms,
          endpoint: Uri.parse('mock://municipality/zoning'),
          cacheTtl: const Duration(minutes: 15),
        ),
      ];

  @override
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query) async =>
      const GisFeatureCollection(features: []);

  @override
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) =>
      buildGisRequestUrl(layer, query);

  @override
  Future<String> fetchGeoJson(GisLayerDescriptor layer, {required double latitude, required double longitude}) async =>
      '{"type":"FeatureCollection","features":[]}';
}
