import 'package:flutter/foundation.dart';

class GeoPoint {
  const GeoPoint(this.latitude, this.longitude);

  final double latitude;
  final double longitude;

  Map<String, Object?> toJson() => {'lat': latitude, 'lng': longitude};

  factory GeoPoint.fromJson(Map<String, Object?> json) => GeoPoint(
        _asDouble(json['lat']) ?? 0,
        _asDouble(json['lng']) ?? 0,
      );
}

enum ParcelSourceKind {
  official,
  municipalPublic,
  publicMetadata,
  derived,
  demo,
  unavailable,
}

enum ProviderStateLevel { official, publicMetadata, derived, unavailable }

class SourceAttribution {
  const SourceAttribution({
    required this.name,
    required this.url,
    this.license,
    this.termsUrl,
  });

  factory SourceAttribution.fromJson(Map<String, Object?> json) =>
      SourceAttribution(
        name: '${json['name'] ?? 'Kaynak'}',
        url: '${json['url'] ?? ''}',
        license: json['license'] as String?,
        termsUrl: json['termsUrl'] as String?,
      );

  final String name;
  final String url;
  final String? license;
  final String? termsUrl;

  bool get hasUrl => url.trim().isNotEmpty;
}

class ProviderDescriptor {
  const ProviderDescriptor({
    required this.id,
    required this.kind,
    required this.displayName,
    required this.status,
    required this.enabled,
    required this.regions,
    required this.capabilities,
    required this.attribution,
  });

  factory ProviderDescriptor.fromJson(Map<String, Object?> json) =>
      ProviderDescriptor(
        id: '${json['id'] ?? ''}',
        kind: '${json['kind'] ?? ''}',
        displayName: '${json['displayName'] ?? json['id'] ?? 'Sağlayıcı'}',
        status: '${json['status'] ?? 'not_configured'}',
        enabled: json['enabled'] == true,
        regions: json['regions'] is List
            ? (json['regions'] as List).map((e) => '$e').toList(growable: false)
            : const [],
        capabilities: json['capabilities'] is List
            ? (json['capabilities'] as List)
                .map((e) => '$e')
                .toList(growable: false)
            : const [],
        attribution: json['attribution'] is Map
            ? SourceAttribution.fromJson(
                (json['attribution'] as Map).cast<String, Object?>())
            : const SourceAttribution(name: 'Bilinmeyen kaynak', url: ''),
      );

  final String id;
  final String kind;
  final String displayName;
  final String status;
  final bool enabled;
  final List<String> regions;
  final List<String> capabilities;
  final SourceAttribution attribution;

  ProviderStateLevel get stateLevel => switch (status) {
        'official' => ProviderStateLevel.official,
        'public_metadata' => ProviderStateLevel.publicMetadata,
        'derived' => ProviderStateLevel.derived,
        _ => ProviderStateLevel.unavailable,
      };

  String get stateLabel => switch (stateLevel) {
        ProviderStateLevel.official => 'Resmi',
        ProviderStateLevel.publicMetadata => 'Kamu metadata',
        ProviderStateLevel.derived => 'Türetilmiş',
        ProviderStateLevel.unavailable => 'Hazır değil',
      };
}

class PlanFeature {
  const PlanFeature({
    required this.title,
    required this.summary,
    required this.attributes,
    this.layerName,
    this.sourceName,
    this.official = false,
    this.provenance = 'metadata',
  });

  final String title;
  final String summary;
  final String? layerName;
  final Map<String, Object?> attributes;
  final String? sourceName;
  final bool official;
  final String provenance;
}

class ParcelDetail {
  const ParcelDetail({
    required this.city,
    required this.district,
    required this.neighborhood,
    required this.block,
    required this.parcel,
    required this.titleType,
    required this.zoningStatus,
    required this.taks,
    required this.kaks,
    required this.emsal,
    required this.floorLimit,
    required this.coverageRatio,
    required this.roadFrontage,
    required this.latitude,
    required this.longitude,
    required this.sourceName,
    required this.sourceKind,
    required this.providerId,
    required this.providerStatus,
    required this.providerCapabilities,
    required this.attributionUrl,
    required this.official,
    required this.restricted,
    required this.fetchedAt,
    required this.planFeatures,
    required this.unavailableReason,
    required this.geometry,
    this.siteAreaSquareMeters,
    this.gabariMeters,
  });

  factory ParcelDetail.sampleMetadataOnly() => ParcelDetail(
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Caferağa',
        block: '1234',
        parcel: '2',
        titleType: 'Konut + ticaret',
        zoningStatus: 'Örnek metadata kaydı — resmi parsel servisi bağlı değil',
        taks: .35,
        kaks: 1.8,
        emsal: 1.8,
        floorLimit: 5,
        coverageRatio: 'TAKS 0.35',
        roadFrontage: 18,
        latitude: 40.991,
        longitude: 29.025,
        sourceName: 'E-İmar mobil demo metadata',
        sourceKind: ParcelSourceKind.publicMetadata,
        providerId: 'mobile-preview',
        providerStatus: 'metadata_only',
        providerCapabilities: const [
          'parcel-context',
          'plan-notes',
          'readiness-preview'
        ],
        attributionUrl: null,
        official: false,
        restricted: false,
        fetchedAt: DateTime(2026, 1, 1),
        planFeatures: const [
          PlanFeature(
            title: 'Plan koşulları',
            summary: 'KAKS 1.80 • TAKS 0.35 • yaklaşık 5 kat sınırı',
            attributes: {'kaks': 1.8, 'taks': .35, 'floorLimit': 5},
            layerName: 'metadata-preview',
            provenance: 'public_metadata',
          ),
        ],
        unavailableReason:
            'Canlı resmi parsel adaptörü bağlanınca bu örnek kayıt yerine gerçek sonuç açılır.',
        geometry: smallViewportPolygon(40.991, 29.025),
        siteAreaSquareMeters: 640,
        gabariMeters: 15.5,
      );

  final String city;
  final String district;
  final String neighborhood;
  final String block;
  final String parcel;
  final String titleType;
  final String zoningStatus;
  final double taks;
  final double kaks;
  final double emsal;
  final int floorLimit;
  final String coverageRatio;
  final double roadFrontage;
  final double latitude;
  final double longitude;
  final String sourceName;
  final ParcelSourceKind sourceKind;
  final String? providerId;
  final String providerStatus;
  final List<String> providerCapabilities;
  final String? attributionUrl;
  final bool official;
  final bool restricted;
  final DateTime fetchedAt;
  final List<PlanFeature> planFeatures;
  final String? unavailableReason;
  final List<GeoPoint> geometry;
  final double? siteAreaSquareMeters;
  final double? gabariMeters;

  bool get hasLiveConfidence => official && !restricted;
  bool get hasSourceUrl => (attributionUrl ?? '').trim().isNotEmpty;
  bool get hasPlanFeatures => planFeatures.isNotEmpty;
  bool get hasArea => siteAreaSquareMeters != null && siteAreaSquareMeters! > 0;
  bool get hasEmsalMath => hasArea || taks > 0 || kaks > 0 || emsal > 0;

  String get trustLabel {
    if (restricted) return 'Kısıtlı erişim';
    return switch (sourceKind) {
      ParcelSourceKind.official => 'Resmi kaynak',
      ParcelSourceKind.municipalPublic => 'Kamu belediye kaynağı',
      ParcelSourceKind.publicMetadata => 'Kamu metadata',
      ParcelSourceKind.derived => 'Türetilmiş',
      ParcelSourceKind.demo => 'Demo',
      ParcelSourceKind.unavailable => 'Kullanılamıyor',
    };
  }

  String get provenanceLabel {
    if (restricted) return 'Kısıtlı';
    return switch (sourceKind) {
      ParcelSourceKind.official => 'official',
      ParcelSourceKind.municipalPublic => 'public',
      ParcelSourceKind.publicMetadata => 'metadata',
      ParcelSourceKind.derived => 'derived',
      ParcelSourceKind.demo => 'demo',
      ParcelSourceKind.unavailable => 'unavailable',
    };
  }

  double? get estimatedFootprintSquareMeters =>
      hasArea && taks > 0 ? siteAreaSquareMeters! * taks : null;

  double? get estimatedFloorAreaSquareMeters =>
      hasArea && kaks > 0 ? siteAreaSquareMeters! * kaks : null;

  double? get estimatedBuildableAreaSquareMeters =>
      hasArea && emsal > 0 ? siteAreaSquareMeters! * emsal : null;

  String get parcelLabel => '$city / $district / $neighborhood';
}

class ProviderUnavailableState {
  const ProviderUnavailableState({
    required this.title,
    required this.message,
    this.providerId,
    this.code,
  });

  final String title;
  final String message;
  final String? providerId;
  final String? code;
}

class ParcelLookupResult {
  const ParcelLookupResult._({
    this.parcel,
    this.unavailable,
    this.providers = const [],
  });

  factory ParcelLookupResult.found(
    ParcelDetail parcel, {
    List<ProviderDescriptor> providers = const [],
  }) =>
      ParcelLookupResult._(parcel: parcel, providers: providers);

  factory ParcelLookupResult.unavailable({
    required String title,
    required String message,
    String? providerId,
    String? code,
    List<ProviderDescriptor> providers = const [],
  }) =>
      ParcelLookupResult._(
        unavailable: ProviderUnavailableState(
          title: title,
          message: message,
          providerId: providerId,
          code: code,
        ),
        providers: providers,
      );

  final ParcelDetail? parcel;
  final ProviderUnavailableState? unavailable;
  final List<ProviderDescriptor> providers;

  bool get hasParcel => parcel != null;
}

double? _asDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value.replaceAll(',', '.'));
  return null;
}

int? _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

double? readFirstDouble(Map<String, Object?> attributes, List<String> keys) {
  for (final key in keys) {
    final value = attributes[key];
    final parsed = _asDouble(value);
    if (parsed != null) return parsed;
  }
  return null;
}

int? readFirstInt(Map<String, Object?> attributes, List<String> keys) {
  for (final key in keys) {
    final value = attributes[key];
    final parsed = _asInt(value);
    if (parsed != null) return parsed;
  }
  return null;
}

String titleCaseTr(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return trimmed;
  return trimmed
      .split(RegExp(r'\s+'))
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}

List<GeoPoint> smallViewportPolygon(double latitude, double longitude) {
  const delta = .00055;
  return [
    GeoPoint(latitude - delta, longitude - delta),
    GeoPoint(latitude + delta, longitude - delta),
    GeoPoint(latitude + delta, longitude + delta),
    GeoPoint(latitude - delta, longitude + delta),
  ];
}

void debugDomain(String message) {
  if (kDebugMode) {
    debugPrint(message);
  }
}
