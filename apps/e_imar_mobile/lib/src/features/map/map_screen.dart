import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/gis_connector.dart';
import '../../core/services/gis_layers.dart';
import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import 'domain/parcel.dart';

class MapWorkspaceScreen extends ConsumerWidget {
  const MapWorkspaceScreen({super.key, required this.onOpenParcel});

  final void Function(ParcelDetail parcel) onOpenParcel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final layers = ref.watch(gisOfficialLayersProvider);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          const SectionHeader(
            title: 'Harita workspace',
            subtitle:
                'Top search, kaynak güveni ve alt panel ile hızlı keşif alanı.',
          ),
          const SizedBox(height: 12),
          PremiumCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _TopSearchBar(),
                const SizedBox(height: 16),
                const _MapCanvas(),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    StatusPill(
                        label: 'Resmi / metadata ayrımı aktif',
                        color: Theme.of(context).colorScheme.primary,
                        icon: Icons.verified_rounded),
                    StatusPill(
                        label: 'Isolate GeoJSON parse',
                        color: Theme.of(context).colorScheme.secondary,
                        icon: Icons.bolt_rounded),
                    StatusPill(
                        label: 'Safe-area aware',
                        color: Theme.of(context).colorScheme.tertiary,
                        icon: Icons.phonelink_rounded),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const SectionHeader(
            title: 'Katman ve sağlayıcı durumu',
            subtitle:
                'Yalnızca katalogda görünen katmanlar; resmi veri yoksa açıkça belirtilir.',
          ),
          const SizedBox(height: 12),
          for (final layer in layers) ...[
            _LayerCard(layer: layer),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 4),
          EmptyStateCard(
            title: 'Bottom sheet hazır',
            body:
                'Canlı sonuç geldiğinde bu alanda parsel özeti, kaynak güveni ve sonraki adımlar görünür.',
            icon: Icons.space_dashboard_rounded,
            action: FilledButton.icon(
              onPressed: () => onOpenParcel(ParcelDetail.sampleMetadataOnly()),
              icon: const Icon(Icons.open_in_new_rounded),
              label: const Text('Örnek detay akışını aç'),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopSearchBar extends StatelessWidget {
  const _TopSearchBar();

  @override
  Widget build(BuildContext context) {
    return const TextField(
      decoration: InputDecoration(
        hintText: 'Ada, parsel, mahalle veya konum ara',
        prefixIcon: Icon(Icons.search_rounded),
      ),
    );
  }
}

class _MapCanvas extends StatelessWidget {
  const _MapCanvas();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 0.82,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      scheme.primary.withValues(alpha: 0.18),
                      scheme.surfaceContainerHighest.withValues(alpha: 0.8)
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            const Positioned.fill(
                child: GridPaper(
                    interval: 40, subdivisions: 2, color: Color(0x1AFFFFFF))),
            Center(
              child: Container(
                width: 138,
                height: 138,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: scheme.primary.withValues(alpha: 0.1),
                  border: Border.all(
                      color: scheme.primary.withValues(alpha: 0.3), width: 2),
                ),
                child:
                    Icon(Icons.place_rounded, color: scheme.primary, size: 58),
              ),
            ),
            Positioned(
              left: 16,
              top: 16,
              child: StatusPill(
                  label: 'Açık veri yoksa boş gösterim',
                  color: scheme.tertiary,
                  icon: Icons.visibility_off_rounded),
            ),
            Positioned(
              right: 16,
              bottom: 16,
              child: StatusPill(
                  label: 'Katmanlar hazır',
                  color: scheme.primary,
                  icon: Icons.layers_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

class _LayerCard extends StatelessWidget {
  const _LayerCard({required this.layer});

  final GisLayerDescriptor layer;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final trustColor = switch (layer.trust) {
      GisLayerTrust.official => scheme.primary,
      GisLayerTrust.publicMetadata => scheme.secondary,
      GisLayerTrust.derived => scheme.tertiary,
      GisLayerTrust.unavailable => scheme.outline,
    };
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
                    Text(layer.name,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(layer.description,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: scheme.onSurfaceVariant)),
                  ],
                ),
              ),
              StatusPill(label: layer.trust.name, color: trustColor),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final capability in layer.capabilities.take(4))
                StatusPill(
                    label: capability,
                    color: scheme.primary,
                    icon: Icons.check_rounded),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            layer.metadataOnly
                ? 'Sadece katalog metadatası — canlı sorgu endpointi tanımlı değil.'
                : 'Canlı katman isteği için endpoint hazır.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
