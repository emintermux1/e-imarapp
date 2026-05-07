final class ParcelId {
  const ParcelId({required this.city, required this.district, required this.neighborhood, required this.block, required this.parcel});

  final String city;
  final String district;
  final String neighborhood;
  final String block;
  final String parcel;

  String get display => '$city / $district / $neighborhood • Ada $block Parsel $parcel';
}

final class GeoCoordinate {
  const GeoCoordinate({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  bool get isInsideTurkey => latitude >= 35.8 && latitude <= 42.2 && longitude >= 25.5 && longitude <= 45.0;
}
