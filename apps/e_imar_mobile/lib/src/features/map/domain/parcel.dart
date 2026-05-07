class ParcelDetail {
  const ParcelDetail({required this.city, required this.district, required this.neighborhood, required this.block, required this.parcel, required this.titleType, required this.zoningStatus, required this.taks, required this.kaks, required this.emsal, required this.floorLimit, required this.coverageRatio, required this.roadFrontage, this.yearApproved = 2026, this.constructionArea = 0, this.unitCount = 0});

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

  static const sample = ParcelDetail(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe', block: '1247', parcel: '18', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: .35, kaks: 1.75, emsal: 1.75, floorLimit: 8, coverageRatio: '%35', roadFrontage: 28.4, yearApproved: 2024, constructionArea: 2450, unitCount: 24);
}

enum MapLayerType { satellite, terrain, threeD, earthquake, fault, landslide, flood, soil, agriculture, protectedArea }
