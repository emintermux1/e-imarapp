class ParcelDetail {
  const ParcelDetail({required this.city, required this.district, required this.neighborhood, required this.block, required this.parcel, required this.titleType, required this.zoningStatus, required this.taks, required this.kaks, required this.emsal, required this.floorLimit, required this.coverageRatio, required this.roadFrontage});

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

  static const sample = ParcelDetail(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe', block: '1247', parcel: '18', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: .35, kaks: 1.75, emsal: 1.75, floorLimit: 8, coverageRatio: '%35', roadFrontage: 28.4);
}

enum MapLayerType { satellite, terrain, threeD, earthquake, fault, landslide, flood, soil, agriculture, protectedArea }

class HistoricalTimelineState {
  const HistoricalTimelineState({required this.year, required this.label, required this.description, required this.color});
  final int year;
  final String label;
  final String description;
  final Color color;

  static const defaultYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  static HistoricalTimelineState fromYear(int year) {
    switch (year) {
      case 2019:
        return HistoricalTimelineState(year: 2019, label: '2019 öncesi', description: 'Kadıköy-Fenerbahçe bölgesi ağırlıklı olarak düşük yoğunluklu konut dokusu gösteriyor. Parsel üzerinde eski yapı stoğu mevcut.', color: const Color(0xFF6C7A73));
      case 2020:
        return HistoricalTimelineState(year: 2020, label: '2020 dönüşüm başlangıcı', description: 'Kentsel dönüşüm kapsamında bölgede yapılaşma hareketliliği başladı. Parsel çevresinde yeni projelerin temelleri atıldı.', color: const Color(0xFF8FAF8A));
      case 2021:
        return HistoricalTimelineState(year: 2021, label: '2021 imar planı güncellemesi', description: 'Belediye meclisi imar planı değişikliğini onayladı. Parsel TAKS: 0.35, KAKS: 1.75 olarak güncellendi. Yakın çevrede altyapı iyileştirmeleri tamamlandı.', color: const Color(0xFF74C7EC));
      case 2022:
        return HistoricalTimelineState(year: 2022, label: '2022 yapılaşma artışı', description: 'Bölgede yapı ruhsatı başvuruları %38 arttı. Parsel çevresindeki 3 proje inşaat aşamasına geçti. Ulaşım bağlantıları güçlendi.', color: const Color(0xFF9CC96A));
      case 2023:
        return HistoricalTimelineState(year: 2023, label: '2023 değer ivmesi', description: 'Gayrimenkul değerleme raporlarına göre bölge ortalaması %42 değer kazandı. Parsel için emsal karşılaştırmalı değer artışı sürüyor.', color: const Color(0xFFF6B84B));
      case 2024:
        return HistoricalTimelineState(year: 2024, label: '2024 yoğun inşaat dönemi', description: 'Parselin 500 m çapında 7 aktif şantiye mevcut. Bölgeye metro bağlantısı projesi onaylandı. Ticari aks canlandı.', color: const Color(0xFFC6F66F));
      case 2025:
        return HistoricalTimelineState(year: 2025, label: '2025 güncel durum', description: 'Parsel boş arsa olarak duruyor. Çevredeki tamamlanan projeler bölge karakterini yükseltti. Emsal değeri 1.75 ile avantajlı konumda.', color: const Color(0xFF16C784));
      case 2026:
        return HistoricalTimelineState(year: 2026, label: '2026 projeksiyonu', description: 'Öngörü: metro hattının açılmasıyla parsel değerinde %25–30 ek artış bekleniyor. Bölge premium konut + ticaret kimliğine evriliyor.', color: const Color(0xFF38D996));
      default:
        return HistoricalTimelineState(year: year, label: '$year', description: 'Bu yıl için uydu görüntüsü ve gelişim verisi henüz işlenmedi.', color: const Color(0xFF6C7A73));
    }
  }
}

class RiskLayerToggle {
  const RiskLayerToggle({required this.id, required this.label, required this.icon, required this.category, this.isActive = false, this.opacity = 0.7});
  final String id;
  final String label;
  final IconData icon;
  final String category;
  final bool isActive;
  final double opacity;

  RiskLayerToggle copyWith({bool? isActive, double? opacity}) => RiskLayerToggle(id: id, label: label, icon: icon, category: category, isActive: isActive ?? this.isActive, opacity: opacity ?? this.opacity);

  static const defaults = [
    RiskLayerToggle(id: 'deprem', label: 'Deprem', icon: Icons.waves_rounded, category: 'Sismik', isActive: true),
    RiskLayerToggle(id: 'fayHatti', label: 'Fay Hattı', icon: Icons.timeline_rounded, category: 'Jeoloji', isActive: true),
    RiskLayerToggle(id: 'heyelan', label: 'Heyelan', icon: Icons.landslide_rounded, category: 'Jeoloji'),
    RiskLayerToggle(id: 'sel', label: 'Sel', icon: Icons.water_drop_rounded, category: 'Hidroloji'),
    RiskLayerToggle(id: 'zeminTipi', label: 'Zemin Tipi', icon: Icons.terrain_rounded, category: 'Zemin', isActive: true),
    RiskLayerToggle(id: 'tarimAlani', label: 'Tarım Alanı', icon: Icons.agriculture_rounded, category: 'Arazi'),
    RiskLayerToggle(id: 'sitAlani', label: 'Sit Alanı', icon: Icons.account_balance_rounded, category: 'Koruma'),
  ];
}
