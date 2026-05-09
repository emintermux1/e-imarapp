import 'package:flutter/material.dart';

import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import 'domain/watchlist_item.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  static const _items = <WatchlistItem>[
    WatchlistItem(
      title: 'Askı değişikliği',
      subtitle: 'Seçili parselin plan notu veya askı durumu değişirse uyarı.',
      intent: WatchlistIntent.aski,
      provenance: 'metadata',
      statusLabel: 'Beklemede',
      nextAction: 'Parseli watchlist’e ekle',
    ),
    WatchlistItem(
      title: 'İmar kararı güncellemesi',
      subtitle: 'Plan notu ve kullanıma dair yeni kamu metadatası geldiğinde bildir.',
      intent: WatchlistIntent.zoningChange,
      provenance: 'public',
      statusLabel: 'Aktif',
      nextAction: 'Kaynak kapsama takibi yap',
    ),
    WatchlistItem(
      title: 'Sağlayıcı sağlık alarmı',
      subtitle: 'Gateway veya GIS sağlayıcısı hazır değilse kullanıcıya temiz durum göster.',
      intent: WatchlistIntent.providerHealth,
      provenance: 'unavailable',
      statusLabel: 'Kural yüklü',
      nextAction: 'Kapsam ekranına bağla',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          const SectionHeader(
            title: 'Askı ve takip yüzeyi',
            subtitle: 'Provenance temelli bildirimler ve eylem niyeti odaklı tasarım.',
          ),
          const SizedBox(height: 12),
          for (final item in _items) ...[
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.title, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text(item.subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
                          ],
                        ),
                      ),
                      StatusPill(label: item.statusLabel, color: scheme.primary),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatusPill(label: item.provenance, color: scheme.secondary),
                      StatusPill(label: item.intent.name, color: scheme.tertiary),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('Sonraki adım: ${item.nextAction}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant)),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
          const EmptyStateCard(
            title: 'Bildirimler henüz bağlanmadı',
            body: 'Bu yüzey, ileride gerçek askı verisi ve provenance olaylarına bağlanacak şekilde hazırlandı.',
            icon: Icons.notifications_none_rounded,
          ),
        ],
      ),
    );
  }
}

