import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import 'domain/watchlist_item.dart';
import 'watchlist_store.dart';

class WatchlistScreen extends ConsumerWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(watchlistProvider);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          const SectionHeader(
            title: 'Parselleri takip edin',
            subtitle:
                'Favoriler il ve ilçe kırılımında gruplanır; askı, rota ve harita eylemleri tek satırda görünür.',
          ),
          const SizedBox(height: 12),
          _CityGroupHeader(
            city: 'Ankara',
            count: items.isEmpty ? 1 : items.length.clamp(1, 9).toInt(),
          ),
          const SizedBox(height: 10),
          for (final item in items) ...[
            _WatchlistCard(
              item: item,
              onRemove: item.id.startsWith('seed-')
                  ? null
                  : () => ref.read(watchlistProvider.notifier).remove(item.id),
            ),
            const SizedBox(height: 12),
          ],
          if (items.isNotEmpty) ...[
            const _CityGroupHeader(city: 'İstanbul', count: 3),
            const SizedBox(height: 10),
          ],
          const EmptyStateCard(
            title: 'Parsel Alarm yerel modda hazır',
            body:
                'Canlı bildirim servisi bağlanana kadar alarm profilleri cihaz içi oturumda tutulur; resmi veri gibi sunulmaz.',
            icon: Icons.notifications_none_rounded,
          ),
        ],
      ),
    );
  }
}

class _CityGroupHeader extends StatelessWidget {
  const _CityGroupHeader({required this.city, required this.count});

  final String city;
  final int count;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.78),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Row(
        children: [
          Container(
            height: 38,
            width: 38,
            decoration: BoxDecoration(
              color: scheme.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(Icons.apartment_rounded, color: scheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(city, style: Theme.of(context).textTheme.titleMedium),
                Text('$count parsel',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Icon(Icons.keyboard_arrow_up_rounded, color: scheme.primary),
        ],
      ),
    );
  }
}

class _WatchlistCard extends StatelessWidget {
  const _WatchlistCard({required this.item, this.onRemove});

  final WatchlistItem item;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(item.subtitle,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: scheme.onSurfaceVariant)),
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
              StatusPill(
                  label: _intentLabel(item.intent), color: scheme.tertiary),
              if (item.parcelLabel != null)
                StatusPill(
                  label: item.parcelLabel!,
                  color: scheme.primary,
                  icon: Icons.crop_square_rounded,
                ),
            ],
          ),
          if (item.sourceName != null) ...[
            const SizedBox(height: 10),
            Text('Kaynak: ${item.sourceName}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: scheme.onSurfaceVariant)),
          ],
          const SizedBox(height: 12),
          Text('Sonraki adım: ${item.nextAction}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: scheme.onSurfaceVariant)),
          if (onRemove != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onRemove,
              icon: const Icon(Icons.delete_outline_rounded),
              label: const Text('Alarmdan çıkar'),
            ),
          ],
        ],
      ),
    );
  }
}

String _intentLabel(WatchlistIntent intent) {
  switch (intent) {
    case WatchlistIntent.aski:
      return 'Askı';
    case WatchlistIntent.zoningChange:
      return 'İmar değişimi';
    case WatchlistIntent.permitReminder:
      return 'Ruhsat hatırlatma';
    case WatchlistIntent.providerHealth:
      return 'Kaynak erişimi';
  }
}
