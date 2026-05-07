import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/notification_item.dart';

final mockNotificationsProvider = Provider<List<NotificationItem>>((_) => _mock);

final _mock = [
  NotificationItem(
    id: 'n1',
    type: NotificationType.zoningChange,
    title: 'İmar plan değişikliği',
    message: 'Kadıköy Fenerbahçe 1247/18 parselinde plan notu değişikliği tespit edildi. Emsal 1.75 → 2.10 olarak güncellendi.',
    parcelId: '1247/18',
    parcelLabel: 'Fenerbahçe 1247/18',
    timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
  ),
  NotificationItem(
    id: 'n2',
    type: NotificationType.priceChange,
    title: 'Fiyat değişimi uyarısı',
    message: 'Takip ettiğiniz Alacaatlı 8912/4 parselinde tahmini m² değeri ₺18.500 → ₺22.300 yükseldi (%20.5 artış).',
    parcelId: '8912/4',
    parcelLabel: 'Alacaatlı 8912/4',
    timestamp: DateTime.now().subtract(const Duration(hours: 3)),
  ),
  NotificationItem(
    id: 'n3',
    type: NotificationType.newListing,
    title: 'Yeni ilan eklendi',
    message: 'Bölgenizde yatırım profilinize uyan yeni bir arsa ilanı yayınlandı. Urla Kuşçular mevkiinde deniz manzaralı 850 m² imarlı arsa.',
    parcelId: 'Urla/Kuşçular',
    parcelLabel: 'Urla Kuşçular',
    timestamp: DateTime.now().subtract(const Duration(hours: 8)),
  ),
  NotificationItem(
    id: 'n4',
    type: NotificationType.riskChange,
    title: 'Risk profili güncellendi',
    message: 'Fenerbahçe 1247/18 parselinde deprem risk skoru %44 → %38 düştü. Yeni mikro-bölgeleme raporu baz alındı.',
    parcelId: '1247/18',
    parcelLabel: 'Fenerbahçe 1247/18',
    read: true,
    timestamp: DateTime.now().subtract(const Duration(days: 1)),
  ),
  NotificationItem(
    id: 'n5',
    type: NotificationType.aiSuggestion,
    title: 'AI yatırım önerisi',
    message: 'Portföy analizi: Kadıköy bölgesinde son 6 ayda benzer profilli 3 arsada ortalama %34 değer artışı. Mevcut parseliniz için satış zamanlaması uygun olabilir.',
    parcelId: '1247/18',
    parcelLabel: 'Fenerbahçe 1247/18',
    read: true,
    timestamp: DateTime.now().subtract(const Duration(days: 2)),
  ),
  NotificationItem(
    id: 'n6',
    type: NotificationType.zoningChange,
    title: 'Yeni imar planı onaylandı',
    message: 'Ankara Çankaya Alacaatlı bölgesinde 1/1000 ölçekli uygulama imar planı revizyonu onaylandı. Takip ettiğiniz parselleri etkileyebilir.',
    parcelId: '8912/4',
    parcelLabel: 'Alacaatlı 8912/4',
    timestamp: DateTime.now().subtract(const Duration(days: 3)),
  ),
];
