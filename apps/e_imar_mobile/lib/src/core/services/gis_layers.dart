import 'dart:convert';

import '../../features/map/domain/parcel.dart';

enum GisLayerTrust { official, publicMetadata, derived, unavailable }

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

  Map<String, String> toQueryParameters() => {
        'bbox': toBboxString(),
      };
}

class GisLayerQuery {
  const GisLayerQuery({
    required this.bbox,
    this.srs = 'EPSG:4326',
    this.format = 'geojson',
    this.maxFeatures = 250,
    this.extraParameters = const {},
  });

  final GisBoundingBox bbox;
  final String srs;
  final String format;
  final int maxFeatures;
  final Map<String, String> extraParameters;

  String toBboxString() => bbox.toBboxString();

  Map<String, String> toQueryParameters() => {
        ...bbox.toQueryParameters(),
        'srs': srs,
        'format': format,
        'maxFeatures': '$maxFeatures',
        ...extraParameters,
      };
}

class GisLayerDescriptor {
  const GisLayerDescriptor({
    required this.id,
    required this.name,
    required this.description,
    required this.endpoint,
    required this.providerName,
    required this.attribution,
    required this.trust,
    required this.cacheTtl,
    required this.capabilities,
    this.defaultFormat = 'geojson',
    this.metadataOnly = false,
    this.defaultQueryParameters = const {},
  });

  final String id;
  final String name;
  final String description;
  final Uri endpoint;
  final String providerName;
  final SourceAttribution attribution;
  final GisLayerTrust trust;
  final Duration cacheTtl;
  final List<String> capabilities;
  final String defaultFormat;
  final bool metadataOnly;
  final Map<String, String> defaultQueryParameters;

  bool get hasEndpoint => endpoint.scheme.isNotEmpty && endpoint.host.isNotEmpty;
  bool get isOperational => hasEndpoint && !metadataOnly;
}

class GisGeometry {
  const GisGeometry({required this.type, required this.coordinates});

  final String type;
  final Object? coordinates;

  factory GisGeometry.fromJson(Map<String, Object?> json) => GisGeometry(
        type: '${json['type'] ?? 'Unknown'}',
        coordinates: json['coordinates'],
      );

  Map<String, Object?> toJson() => {
        'type': type,
        'coordinates': coordinates,
      };
}

class GisFeature {
  const GisFeature({
    required this.id,
    required this.geometry,
    required this.properties,
    this.layerId,
    this.providerId,
    this.title,
    this.summary,
  });

  final String? id;
  final GisGeometry? geometry;
  final Map<String, Object?> properties;
  final String? layerId;
  final String? providerId;
  final String? title;
  final String? summary;

  factory GisFeature.fromJson(Map<String, Object?> json) => GisFeature(
        id: json['id']?.toString(),
        geometry: json['geometry'] is Map
            ? GisGeometry.fromJson((json['geometry'] as Map).cast<String, Object?>())
            : null,
        properties: json['properties'] is Map
            ? (json['properties'] as Map).cast<String, Object?>()
            : const <String, Object?>{},
        layerId: json['layerId']?.toString(),
        providerId: json['providerId']?.toString(),
        title: json['title']?.toString(),
        summary: json['summary']?.toString(),
      );

  Map<String, Object?> toJson() => {
        if (id != null) 'id': id,
        if (geometry != null) 'geometry': geometry!.toJson(),
        'properties': properties,
        if (layerId != null) 'layerId': layerId,
        if (providerId != null) 'providerId': providerId,
        if (title != null) 'title': title,
        if (summary != null) 'summary': summary,
      };
}

class GisFeatureCollection {
  const GisFeatureCollection({
    required this.features,
    this.metadata = const {},
    this.errorMessage,
    this.attribution = const [],
  });

  final List<GisFeature> features;
  final Map<String, Object?> metadata;
  final String? errorMessage;
  final List<SourceAttribution> attribution;

  bool get hasError => errorMessage != null;
  bool get isEmpty => features.isEmpty;

  factory GisFeatureCollection.withError(String message) => GisFeatureCollection(
        features: const [],
        errorMessage: message,
      );

  factory GisFeatureCollection.fromJson(Map<String, Object?> json) => GisFeatureCollection(
        features: json['features'] is List
            ? (json['features'] as List)
                .whereType<Map>()
                .map((item) => GisFeature.fromJson(item.cast<String, Object?>()))
                .toList(growable: false)
            : const [],
        metadata: json['metadata'] is Map
            ? (json['metadata'] as Map).cast<String, Object?>()
            : const {},
        errorMessage: json['error']?.toString(),
        attribution: json['attribution'] is List
            ? (json['attribution'] as List)
                .whereType<Map>()
                .map((item) => SourceAttribution.fromJson(item.cast<String, Object?>()))
                .toList(growable: false)
            : const [],
      );

  Map<String, Object?> toJson() => {
        'type': 'FeatureCollection',
        'features': features.map((feature) => feature.toJson()).toList(growable: false),
        if (metadata.isNotEmpty) 'metadata': metadata,
        if (errorMessage != null) 'error': errorMessage,
        if (attribution.isNotEmpty)
          'attribution': attribution
              .map(
                (item) => {
                  'name': item.name,
                  'url': item.url,
                  if (item.license != null) 'license': item.license,
                  if (item.termsUrl != null) 'termsUrl': item.termsUrl,
                },
              )
              .toList(growable: false),
      };
}

abstract class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query);
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query);
  Future<String> fetchGeoJson(
    GisLayerDescriptor layer, {
    required double latitude,
    required double longitude,
  });
}

String buildGisRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
  if (!layer.hasEndpoint || layer.metadataOnly) return '';
  final base = layer.endpoint;
  final merged = <String, String>{
    ...base.queryParameters,
    ...layer.defaultQueryParameters,
    ...query.toQueryParameters(),
  };
  return base.replace(queryParameters: merged).toString();
}

final officialRiskLayerPresets = <GisLayerDescriptor>[
  GisLayerDescriptor(
    id: 'zoning-plan',
    name: 'İmar Planı',
    description: 'Plan kullanım kararları ve lejant katmanı için katalog ögesi.',
    endpoint: Uri(),
    providerName: 'Kamu plan kataloğu',
    attribution: const SourceAttribution(name: 'Kamu plan katalogları', url: ''),
    trust: GisLayerTrust.publicMetadata,
    cacheTtl: const Duration(minutes: 20),
    capabilities: const ['zoning', 'parcel-context', 'plan-notes'],
    metadataOnly: true,
  ),
  GisLayerDescriptor(
    id: 'parcel-boundary',
    name: 'Parsel Sınırları',
    description: 'Konuma göre parsel sınır görünümü ve çevresel bağlam.',
    endpoint: Uri(),
    providerName: 'Harita katalogu',
    attribution: const SourceAttribution(name: 'Kamu harita katalogları', url: ''),
    trust: GisLayerTrust.publicMetadata,
    cacheTtl: const Duration(minutes: 20),
    capabilities: const ['parcel-boundary', 'context'],
    metadataOnly: true,
  ),
  GisLayerDescriptor(
    id: 'plan-notes',
    name: 'Plan Notları',
    description: 'Mekânsal plan notu özetleri ve erişim durumları.',
    endpoint: Uri(),
    providerName: 'Kamu plan kataloğu',
    attribution: const SourceAttribution(name: 'Açık plan metadatası', url: ''),
    trust: GisLayerTrust.publicMetadata,
    cacheTtl: const Duration(minutes: 30),
    capabilities: const ['plan-notes', 'metadata'],
    metadataOnly: true,
  ),
  GisLayerDescriptor(
    id: 'risk-overlay',
    name: 'Risk / Kısıt Katmanı',
    description: 'Taşkın, koruma veya kamusal kısıtlar için çevresel görünüm.',
    endpoint: Uri(),
    providerName: 'Kamu çevre kataloğu',
    attribution: const SourceAttribution(name: 'Kamu risk metadata', url: ''),
    trust: GisLayerTrust.publicMetadata,
    cacheTtl: const Duration(minutes: 30),
    capabilities: const ['risk', 'context'],
    metadataOnly: true,
  ),
  GisLayerDescriptor(
    id: 'aski-tracking',
    name: 'Askı İzleme',
    description: 'Askı süreci ve plan değişikliği takibi için izlenebilir yüzey.',
    endpoint: Uri(),
    providerName: 'Takip kataloğu',
    attribution: const SourceAttribution(name: 'Kamu takip metadatası', url: ''),
    trust: GisLayerTrust.publicMetadata,
    cacheTtl: const Duration(minutes: 60),
    capabilities: const ['tracking', 'notifications'],
    metadataOnly: true,
  ),
];

String gisFeatureCollectionToPrettyJson(GisFeatureCollection collection) {
  return const JsonEncoder.withIndent('  ').convert(collection.toJson());
}

