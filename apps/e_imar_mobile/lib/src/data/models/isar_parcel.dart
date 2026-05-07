import '../../features/map/domain/parcel.dart';

class IsarParcel {
  IsarParcel({
    int? id,
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
    this.sourceName = 'Yerel önbellek',
    this.sourceKind = 'localCache',
    this.providerId,
    this.providerStatus = 'metadata_only',
    this.attributionUrl,
    this.official = false,
    this.restricted = false,
    this.unavailableReason,
    this.lastAccessed,
    this.isFavorite = false,
    this.isFollowed = false,
    this.cachedAt,
  })  : id = id ?? _nextId++,
        blockPlusParcel = '$block|$parcel';

  static int _nextId = 1;

  int id;
  late String blockPlusParcel;
  String district;
  String block;
  String parcel;
  String city;
  String neighborhood;
  String titleType;
  String zoningStatus;
  double taks;
  double kaks;
  double emsal;
  int floorLimit;
  String coverageRatio;
  double roadFrontage;
  int yearApproved;
  double constructionArea;
  int unitCount;
  double? latitude;
  double? longitude;
  String sourceName;
  String sourceKind;
  String? providerId;
  String providerStatus;
  String? attributionUrl;
  bool official;
  bool restricted;
  String? unavailableReason;
  DateTime? lastAccessed;
  bool isFavorite;
  bool isFollowed;
  DateTime? cachedAt;

  ParcelDetail toParcelDetail() {
    return ParcelDetail(
      city: city,
      district: district,
      neighborhood: neighborhood,
      block: block,
      parcel: parcel,
      titleType: titleType,
      zoningStatus: zoningStatus,
      taks: taks,
      kaks: kaks,
      emsal: emsal,
      floorLimit: floorLimit,
      coverageRatio: coverageRatio,
      roadFrontage: roadFrontage,
      yearApproved: yearApproved,
      constructionArea: constructionArea,
      unitCount: unitCount,
      latitude: latitude,
      longitude: longitude,
      sourceName: sourceName,
      sourceKind: _sourceKindFromString(sourceKind),
      providerId: providerId,
      providerStatus: providerStatus,
      attributionUrl: attributionUrl,
      official: official,
      restricted: restricted,
      fetchedAt: cachedAt,
      unavailableReason: unavailableReason,
    );
  }

  void updateFromParcelDetail(ParcelDetail d) {
    city = d.city;
    district = d.district;
    neighborhood = d.neighborhood;
    block = d.block;
    parcel = d.parcel;
    titleType = d.titleType;
    zoningStatus = d.zoningStatus;
    taks = d.taks;
    kaks = d.kaks;
    emsal = d.emsal;
    floorLimit = d.floorLimit;
    coverageRatio = d.coverageRatio;
    roadFrontage = d.roadFrontage;
    yearApproved = d.yearApproved;
    constructionArea = d.constructionArea;
    unitCount = d.unitCount;
    latitude = d.latitude;
    longitude = d.longitude;
    sourceName = d.sourceName;
    sourceKind = d.sourceKind.name;
    providerId = d.providerId;
    providerStatus = d.providerStatus;
    attributionUrl = d.attributionUrl;
    official = d.official;
    restricted = d.restricted;
    unavailableReason = d.unavailableReason;
    blockPlusParcel = '$block|$parcel';
  }

  static IsarParcel fromParcelDetail(ParcelDetail d) {
    return IsarParcel(
      city: d.city,
      district: d.district,
      neighborhood: d.neighborhood,
      block: d.block,
      parcel: d.parcel,
      titleType: d.titleType,
      zoningStatus: d.zoningStatus,
      taks: d.taks,
      kaks: d.kaks,
      emsal: d.emsal,
      floorLimit: d.floorLimit,
      coverageRatio: d.coverageRatio,
      roadFrontage: d.roadFrontage,
      yearApproved: d.yearApproved,
      constructionArea: d.constructionArea,
      unitCount: d.unitCount,
      latitude: d.latitude,
      longitude: d.longitude,
      sourceName: d.sourceName,
      sourceKind: d.sourceKind.name,
      providerId: d.providerId,
      providerStatus: d.providerStatus,
      attributionUrl: d.attributionUrl,
      official: d.official,
      restricted: d.restricted,
      unavailableReason: d.unavailableReason,
    );
  }
}

ParcelSourceKind _sourceKindFromString(String value) {
  return ParcelSourceKind.values.firstWhere(
    (kind) => kind.name == value,
    orElse: () => ParcelSourceKind.localCache,
  );
}
