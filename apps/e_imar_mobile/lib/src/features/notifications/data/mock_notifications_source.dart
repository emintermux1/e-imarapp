import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/notification_item.dart';

final mockNotificationsProvider = Provider<MockNotificationsSource>(
  (_) => MockNotificationsSource(),
);

class MockNotificationsSource {
  final _notifications = List<NotificationItem>.unmodifiable(_seed());
  bool _allRead = false;

  List<NotificationItem> get notifications =>
      _allRead
          ? _notifications.map((n) => n.copyWith(read: true)).toList()
          : _notifications;

  int get unreadCount => notifications.where((n) => !n.read).length;

  void markAllRead() => _allRead = true;
}

List<NotificationItem> _seed() => [
      NotificationItem(
        id: 'n1',
        type: NotificationType.zoningChange,
        title: 'İmar durumu değişikliği',
        message:
            'Fikirtepe 3408/12 için belediye plan notu güncellemesi algılandı. Emsal 1.75 → 2.10.',
        parcelId: '3408/12',
        parcelLabel: 'Fikirtepe 3408/12',
        createdAt: DateTime.now().subtract(const Duration(minutes: 24)),
      ),
      NotificationItem(
        id: 'n2',
        type: NotificationType.priceChange,
        title: 'Değer artışı',
        message:
            'Alacaatlı 62841/7 için son 30 günde tahmini m² değeri %12 arttı. Güncel ortalama: ₺42.100/m².',
        parcelId: '62841/7',
        parcelLabel: 'Alacaatlı 62841/7',
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
      ),
      NotificationItem(
        id: 'n3',
        type: NotificationType.newListing,
        title: 'Yeni benzer ilan',
        message:
            'Beşiktaş Etiler bölgesinde izlediğin parsele benzer 3 yeni ilan tespit edildi. Ortalama fiyat: ₺48.500/m².',
        parcelId: '1452/9',
        parcelLabel: 'Etiler 1452/9',
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
      ),
      NotificationItem(
        id: 'n4',
        type: NotificationType.riskChange,
        title: 'Risk skoru güncellendi',
        message:
            'Urla 151/3 için deprem risk seviyesi AFAD verisiyle yeniden değerlendirildi. Yeni skor: düşük → orta.',
        parcelId: '151/3',
        parcelLabel: 'Urla 151/3',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      NotificationItem(
        id: 'n5',
        type: NotificationType.aiSuggestion,
        title: 'AI yatırım önerisi',
        message:
            'Fenerbahçe 1247/18 için yeni belediye verileriyle AI analiz güncellemesi hazır. Yatırım skoru 78 → 86.',
        parcelId: '1247/18',
        parcelLabel: 'Fenerbahçe 1247/18',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
        read: true,
      ),
      NotificationItem(
        id: 'n6',
        type: NotificationType.zoningChange,
        title: 'Plan notu askı süreci',
        message:
            'Bursa Nilüfer 7821/4 için yapı yaklaşma mesafesi notu güncellendi. Askı süresi 15 gün içinde sona eriyor.',
        parcelId: '7821/4',
        parcelLabel: 'Nilüfer 7821/4',
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
        read: true,
      ),
    ];
