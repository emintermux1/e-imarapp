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
    );
  }
}
