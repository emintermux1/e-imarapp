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
    this.yearApproved = 0,
    this.constructionArea = 0,
    this.unitCount = 0,
    this.latitude,
    this.longitude,
    this.geometry,
    this.sourceName = 'Yerel önbellek',
    this.sourceKind = ParcelSourceKind.localCache,
    this.providerId,
    this.providerStatus = 'metadata_only',
    this.providerCapabilities = const [],
    this.attributionUrl,
    this.official = false,
    this.restricted = false,
    this.fetchedAt,
    this.planFeatures = const [],
    this.unavailableReason,
  });

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
  final int yearApproved;
  final double constructionArea;
  final int unitCount;
  final double? latitude;
  final double? longitude;
  final List<GeoPoint>? geometry;
  final String sourceName;
  final ParcelSourceKind sourceKind;
  final String? providerId;
  final String providerStatus;
  final List<String> providerCapabilities;
  final String? attributionUrl;
  final bool official;
  final bool restricted;
  final DateTime? fetchedAt;
  final List<PlanFeature> planFeatures;
  final String? unavailableReason;

  String get id => '${city.toLowerCase()}_${district.toLowerCase()}_${neighborhood.toLowerCase()}_${block}_$parcel';
  String get displayAddress => '$city / $district / $neighborhood';
  bool get hasGeometry => geometry != null && geometry!.length >= 3;
  bool get hasPlanMetrics => taks > 0 || kaks > 0 || emsal > 0 || floorLimit > 0;
  bool get isSourceUnavailable => unavailableReason != null;

  ParcelDetail copyWith({
    String? city,
    String? district,
    String? neighborhood,
    String? block,
    String? parcel,
    String? titleType,
    String? zoningStatus,
    double? taks,
    double? kaks,
    double? emsal,
    int? floorLimit,
    String? coverageRatio,
    double? roadFrontage,
    int? yearApproved,
    double? constructionArea,
    int? unitCount,
    double? latitude,
    double? longitude,
    List<GeoPoint>? geometry,
    String? sourceName,
    ParcelSourceKind? sourceKind,
    String? providerId,
    String? providerStatus,
    List<String>? providerCapabilities,
    String? attributionUrl,
    bool? official,
    bool? restricted,
    DateTime? fetchedAt,
    List<PlanFeature>? planFeatures,
    String? unavailableReason,
  }) {
    return ParcelDetail(
      city: city ?? this.city,
      district: district ?? this.district,
      neighborhood: neighborhood ?? this.neighborhood,
      block: block ?? this.block,
      parcel: parcel ?? this.parcel,
      titleType: titleType ?? this.titleType,
      zoningStatus: zoningStatus ?? this.zoningStatus,
      taks: taks ?? this.taks,
      kaks: kaks ?? this.kaks,
      emsal: emsal ?? this.emsal,
      floorLimit: floorLimit ?? this.floorLimit,
      coverageRatio: coverageRatio ?? this.coverageRatio,
      roadFrontage: roadFrontage ?? this.roadFrontage,
      yearApproved: yearApproved ?? this.yearApproved,
      constructionArea: constructionArea ?? this.constructionArea,
      unitCount: unitCount ?? this.unitCount,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      geometry: geometry ?? this.geometry,
      sourceName: sourceName ?? this.sourceName,
      sourceKind: sourceKind ?? this.sourceKind,
      providerId: providerId ?? this.providerId,
      providerStatus: providerStatus ?? this.providerStatus,
      providerCapabilities: providerCapabilities ?? this.providerCapabilities,
      attributionUrl: attributionUrl ?? this.attributionUrl,
      official: official ?? this.official,
      restricted: restricted ?? this.restricted,
      fetchedAt: fetchedAt ?? this.fetchedAt,
      planFeatures: planFeatures ?? this.planFeatures,
      unavailableReason: unavailableReason ?? this.unavailableReason,
    );
  }

  static const sample = ParcelDetail(
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Fenerbahçe',
    block: '1247',
    parcel: '18',
    titleType: 'Arsa',
    zoningStatus: 'Konut + Ticaret',
    taks: .35,
    kaks: 1.75,
    emsal: 1.75,
    floorLimit: 8,
    coverageRatio: '%35',
    roadFrontage: 28.4,
    yearApproved: 2024,
    constructionArea: 2450,
    unitCount: 24,
    latitude: 40.9758,
    longitude: 29.0436,
    geometry: [
      GeoPoint(40.97535, 29.04295),
      GeoPoint(40.97620, 29.04305),
      GeoPoint(40.97612, 29.04422),
      GeoPoint(40.97528, 29.04410),
    ],
    sourceName: 'Yerel geliştirme verisi',
    sourceKind: ParcelSourceKind.localCache,
    providerStatus: 'metadata_only',
    official: false,
  );
}

class GeoPoint {
  const GeoPoint(this.latitude, this.longitude);
  final double latitude;
  final double longitude;
}

class PlanFeature {
  const PlanFeature({
    required this.title,
    required this.summary,
    this.layerName,
    this.attributes = const {},
  });

  final String title;
  final String summary;
  final String? layerName;
  final Map<String, Object?> attributes;
}

enum ParcelSourceKind {
  official,
  municipalPublic,
  publicMetadata,
  restrictedGateway,
  localCache,
  unavailable,
}

enum MapLayerType {
  satellite,
  terrain,
  threeD,
  earthquake,
  fault,
  landslide,
  flood,
  soil,
  agriculture,
  protectedArea
}
