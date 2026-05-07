class StudyRequest {
  const StudyRequest({
    required this.deliveryTime,
    required this.city,
    required this.district,
    required this.ada,
    required this.parsel,
    required this.landArea,
    required this.description,
  });

  final String deliveryTime;
  final String city;
  final String district;
  final String ada;
  final String parsel;
  final double landArea;
  final String description;

  static const deliveryOptions = ['1 hafta', '2 hafta', '1 ay', '2 ay'];

  bool get isValid =>
      deliveryTime.isNotEmpty &&
      city.trim().isNotEmpty &&
      district.trim().isNotEmpty &&
      ada.trim().isNotEmpty &&
      parsel.trim().isNotEmpty &&
      landArea > 0 &&
      description.trim().isNotEmpty;
}
