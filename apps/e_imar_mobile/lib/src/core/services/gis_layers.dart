import 'dart:convert';

enum GisLayerKind { wms, wfs, geoJson }

enum GisQueryFormat { wms, wfs, geoJson, json, png }

enum RiskLayerCategory {
  jeofizik,
  jeolojik,
  idari,
  cevresel,
  seismic,
  geology,
  hydrology,
  soil,
  landUse,
  heritage,
  planning,
}

enum RiskLayer { deprem, fayHatti, heyelan, sel, zeminTipi, tarimAlani, sitAlani }

class GisBoundingBox {
  const GisBoundingBox({
    double? minLng,
    double? minLat,
    double? maxLng,
    double? maxLat,
    double? west,
    double? south,
    double? east,
    double? north,
  })  : minLng = minLng ?? west ?? 0,
        minLat = minLat ?? south ?? 0,
        maxLng = maxLng ?? east ?? 0,
        maxLat = maxLat ?? north ?? 0;

  final double minLng;
  final double minLat;
  final double maxLng;
  final double maxLat;

  double get west => minLng;
  double get south => minLat;
  double get east => maxLng;
  double get north => maxLat;

  String toBboxString() => '$minLng,$minLat,$maxLng,$maxLat';
  String toCommaSeparated() => toBboxString();
  String toWms130Bbox(String crs) =>
      crs.toUpperCase() == 'EPSG:4326' ? '$minLat,$minLng,$maxLat,$maxLng' : toBboxString();

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
  GisLayerQuery({
    GisBoundingBox? bbox,
    this.bounds,
    this.point,
    this.srs = 'EPSG:4326',
    this.width = 768,
    this.height = 768,
    this.format = GisQueryFormat.geoJson,
    this.maxFeatures = 500,
    this.extraParameters = const {},
  }) : bbox = bbox ?? bounds ?? _pointBounds(point);

  final GisBoundingBox bbox;
  final GisBoundingBox? bounds;
  final GisPoint? point;
  final String srs;
  final int width;
  final int height;
  final GisQueryFormat format;
  final int maxFeatures;
  final Map<String, String> extraParameters;

  GisBoundingBox get effectiveBounds => bounds ?? bbox;

  String toBboxString() => effectiveBounds.toBboxString();

  Uri buildUrl(GisLayerDescriptor layer) => buildGisRequestUrl(layer, this);

  static GisBoundingBox _pointBounds(GisPoint? point) {
    if (point == null) return GisBoundingBox.turkeyBounds;
    const delta = .015;
    return GisBoundingBox(
      minLng: point.longitude - delta,
      minLat: point.latitude - delta,
      maxLng: point.longitude + delta,
      maxLat: point.latitude + delta,
    );
  }
}

class GisFeature {
  const GisFeature({
    this.id,
    required this.properties,
    this.geometry,
    this.geometryType,
  });

  final String? id;
  final Map<String, Object?> properties;
  final Map<String, Object?>? geometry;
  final String? geometryType;

  factory GisFeature.fromJson(Map<String, dynamic> json) =>
      GisFeature.fromGeoJson(Map<String, Object?>.from(json));

  factory GisFeature.fromGeoJson(Map<String, Object?> json) {
    final geometry = json['geometry'];
    final properties = json['properties'];
    return GisFeature(
      id: (json['id'] ?? (properties is Map ? properties['id'] : null))?.toString(),
      geometryType: geometry is Map ? geometry['type']?.toString() : null,
      properties: properties is Map ? Map<String, Object?>.from(properties) : const {},
      geometry: geometry is Map ? Map<String, Object?>.from(geometry) : null,
    );
  }
}

class GisFeatureCollection {
  const GisFeatureCollection({
    required this.features,
    this.crs,
    this.metadata = const {},
    this.errorMessage,
    this.rawGeoJson,
  });

  final List<GisFeature> features;
  final String? crs;
  final Map<String, String> metadata;
  final String? errorMessage;
  final Map<String, Object?>? rawGeoJson;

  bool get hasError => errorMessage != null;
  bool get isEmpty => features.isEmpty;
  bool get isNotEmpty => features.isNotEmpty;

  static const empty = GisFeatureCollection(features: []);

  static GisFeatureCollection withError(String message) => GisFeatureCollection(
        features: const [],
        errorMessage: message,
        metadata: {'hata': message},
        rawGeoJson: {'type': 'FeatureCollection', 'features': const []},
      );

  factory GisFeatureCollection.fromJson(Map<String, dynamic> json) =>
      GisFeatureCollection.fromGeoJson(Map<String, Object?>.from(json));

  factory GisFeatureCollection.fromGeoJson(Map<String, Object?> json) {
    final rawFeatures = json['features'];
    final rawCrs = json['crs'];
    final features = rawFeatures is List
        ? rawFeatures
            .whereType<Map>()
            .map((item) => GisFeature.fromGeoJson(Map<String, Object?>.from(item)))
            .toList(growable: false)
        : const <GisFeature>[];
    return GisFeatureCollection(
      features: features,
      crs: _readCrsName(rawCrs),
      rawGeoJson: json,
    );
  }

  factory GisFeatureCollection.raw(Map<String, Object?> json) => GisFeatureCollection(
        features: const [],
        rawGeoJson: json,
      );

  static String? _readCrsName(Object? rawCrs) {
    if (rawCrs is! Map) return null;
    final properties = rawCrs['properties'];
    if (properties is! Map) return null;
    return properties['name']?.toString();
  }

  Map<String, dynamic> toJson() => rawGeoJson == null
      ? {
          'type': 'FeatureCollection',
          if (crs != null)
            'crs': {
              'type': 'name',
              'properties': {'name': crs},
            },
          'features': features
              .map((f) => {
                    'type': 'Feature',
                    if (f.id != null) 'id': f.id,
                    'properties': f.properties,
                    if (f.geometry != null) 'geometry': f.geometry,
                  })
              .toList(growable: false),
        }
      : Map<String, dynamic>.from(rawGeoJson!);
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
    this.layerName,
    this.category = RiskLayerCategory.jeolojik,
    this.cacheTtl = const Duration(minutes: 15),
    this.sourceAuthority = '',
    this.attribution = '',
    this.opacity = 1,
    this.defaultVisible = false,
  });

  final String id;
  final String name;
  final GisLayerKind kind;
  final Uri endpoint;
  final RiskLayer? riskLayer;
  final String? wmsLayerName;
  final String? wfsTypeName;
  final String? layerName;
  final RiskLayerCategory category;
  final Duration cacheTtl;
  final String sourceAuthority;
  final String attribution;
  final double opacity;
  final bool defaultVisible;

  bool get isRiskLayer => riskLayer != null;

  String get effectiveWmsLayerName => wmsLayerName ?? layerName ?? id;
  String get effectiveWfsTypeName => wfsTypeName ?? layerName ?? id;

  GisQueryFormat get defaultFormat => switch (kind) {
        GisLayerKind.wms => GisQueryFormat.wms,
        GisLayerKind.wfs => GisQueryFormat.wfs,
        GisLayerKind.geoJson => GisQueryFormat.geoJson,
      };
}

final officialRiskLayerPresets = List<GisLayerDescriptor>.unmodifiable([
  GisLayerDescriptor(
    id: 'afad-deprem-tehlike',
    name: 'Deprem Tehlike Haritası (AFAD)',
    kind: GisLayerKind.wms,
    endpoint: Uri.parse('https://tdth.afad.gov.tr/geoserver/ows'),
    riskLayer: RiskLayer.deprem,
    wmsLayerName: 'tdth:deprem_tehlike',
    category: RiskLayerCategory.jeofizik,
    cacheTtl: Duration(hours: 24),
    sourceAuthority: 'AFAD',
    attribution: 'Afet ve Acil Durum Yönetimi Başkanlığı deprem tehlike verisi.',
    opacity: .74,
    defaultVisible: true,
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
    sourceAuthority: 'MTA',
    attribution: 'Maden Tetkik ve Arama Genel Müdürlüğü diri fay haritası.',
    opacity: .88,
    defaultVisible: true,
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
    sourceAuthority: 'AFAD',
    attribution: 'AFAD heyelan envanteri.',
    opacity: .68,
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
    sourceAuthority: 'DSİ',
    attribution: 'Devlet Su İşleri sel ve taşkın tehlike verisi.',
    opacity: .64,
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
    sourceAuthority: 'MTA',
    attribution: 'MTA jeoloji ve zemin sınıflaması.',
    opacity: .7,
    defaultVisible: true,
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
    sourceAuthority: 'TOBB',
    attribution: 'TOBB arazi sınıflandırma servisi.',
    opacity: .58,
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
    sourceAuthority: 'Kültür ve Turizm Bakanlığı',
    attribution: 'Kültür varlıkları ve sit alanları resmi verisi.',
    opacity: .72,
  ),
  GisLayerDescriptor(
    id: 'cevre-arazi-ortusu',
    name: 'Arazi Örtüsü (CORINE Uyarlı)',
    kind: GisLayerKind.geoJson,
    endpoint: Uri.parse('https://land.copernicus.eu/api/clc/turkey'),
    category: RiskLayerCategory.cevresel,
    cacheTtl: Duration(hours: 8760),
    sourceAuthority: 'Copernicus',
    attribution: 'Copernicus arazi örtüsü verisi.',
    opacity: .58,
  ),
]);

Uri buildWmsRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final params = <String, String>{
    ...layer.endpoint.queryParameters,
    'service': 'WMS',
    'version': '1.3.0',
    'request': 'GetMap',
    'layers': layer.effectiveWmsLayerName,
    'styles': '',
    'crs': query.srs,
    'bbox': query.effectiveBounds.toWms130Bbox(query.srs),
    'width': query.width.toString(),
    'height': query.height.toString(),
    'format': 'image/png',
    'transparent': 'true',
    ...query.extraParameters,
  };
  return layer.endpoint.replace(queryParameters: params);
}

Uri buildWfsRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final params = <String, String>{
    ...layer.endpoint.queryParameters,
    'service': 'WFS',
    'version': '2.0.0',
    'request': 'GetFeature',
    'typeNames': layer.effectiveWfsTypeName,
    'srsName': query.srs,
    'bbox': '${query.effectiveBounds.toCommaSeparated()},${query.srs}',
    'outputFormat': 'application/json',
    'count': query.maxFeatures.toString(),
    ...query.extraParameters,
  };
  return layer.endpoint.replace(queryParameters: params);
}

Uri buildGeoJsonRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  final params = <String, String>{
    ...layer.endpoint.queryParameters,
    'bbox': query.effectiveBounds.toCommaSeparated(),
    'srs': query.srs,
    'format': 'application/geo+json',
    'limit': query.maxFeatures.toString(),
    ...query.extraParameters,
  };
  return layer.endpoint.replace(queryParameters: params);
}

Uri buildGisRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  return switch (query.format) {
    GisQueryFormat.wms || GisQueryFormat.png => buildWmsRequestUrl(layer, query),
    GisQueryFormat.wfs => buildWfsRequestUrl(layer, query),
    GisQueryFormat.geoJson || GisQueryFormat.json => buildGeoJsonRequestUrl(layer, query),
  };
}

abstract interface class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query);
  Uri buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query);

  Future<String> fetchGeoJson(
    GisLayerDescriptor layer, {
    required double latitude,
    required double longitude,
  }) async {
    final query = GisLayerQuery(
      bbox: GisBoundingBox(
        minLng: longitude - .015,
        minLat: latitude - .015,
        maxLng: longitude + .015,
        maxLat: latitude + .015,
      ),
      srs: 'EPSG:4326',
    );
    final collection = await fetchFeatures(layer, query);
    return jsonEncode(collection.toJson());
  }
}

class MockGisLayerRepository implements GisLayerRepository {
  const MockGisLayerRepository();

  @override
  Future<List<GisLayerDescriptor>> availableLayers() async => officialRiskLayerPresets;

  @override
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query) async =>
      GisFeatureCollection(
        features: [
          GisFeature(
            id: '${layer.id}-mock',
            geometryType: query.point == null ? 'Polygon' : 'Point',
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

  @override
  Uri buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) =>
      buildGisRequestUrl(layer, query);

  @override
  Future<String> fetchGeoJson(
    GisLayerDescriptor layer, {
    required double latitude,
    required double longitude,
  }) async =>
      '{"type":"FeatureCollection","features":[]}';
}
