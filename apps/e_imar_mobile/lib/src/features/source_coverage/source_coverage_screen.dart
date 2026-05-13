import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/gateway_api.dart';
import '../../core/services/gateway_providers.dart';
import '../../core/services/gis_connector.dart';
import '../../core/services/gis_layers.dart';
import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import '../map/domain/parcel.dart';

class SourceCoverageScreen extends ConsumerWidget {
  const SourceCoverageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(gatewayHealthProvider);
    final providers = ref.watch(gatewayProvidersProvider);
    final layers = ref.watch(gisOfficialLayersProvider);
    final scheme = Theme.of(context).colorScheme;

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(gatewayHealthProvider);
          ref.invalidate(gatewayProvidersProvider);
          await Future<void>.delayed(const Duration(milliseconds: 250));
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          children: [
            SectionHeader(
              title: 'Kaynak kapsamı',
              subtitle:
                  'Gateway, sağlayıcı ve katman hazırlığını tek ekranda gösterir; veri yoksa bunu açıkça söyler.',
              trailing: IconButton.filledTonal(
                onPressed: () {
                  ref.invalidate(gatewayHealthProvider);
                  ref.invalidate(gatewayProvidersProvider);
                },
                icon: const Icon(Icons.refresh_rounded),
                tooltip: 'Yenile',
              ),
            ),
            const SizedBox(height: 12),
            _HealthCard(health: health),
            const SizedBox(height: 16),
            const SectionHeader(
              title: 'Sağlayıcılar',
              subtitle:
                  'Resmi, metadata, türetilmiş ve hazır değil durumları ayrı tutulur.',
            ),
            const SizedBox(height: 12),
            providers.when(
              data: (items) => items.isEmpty
                  ? EmptyStateCard(
                      title: 'Gateway yapılandırılmadı',
                      body:
                          'E_IMAR_GATEWAY_BASE_URL verilmediği için canlı sağlayıcı listesi alınmadı. Uygulama yine metadata/dürüst boş durumlarla çalışır.',
                      icon: Icons.cloud_off_rounded,
                      action: OutlinedButton.icon(
                        onPressed: () {
                          ref.invalidate(gatewayProvidersProvider);
                        },
                        icon: const Icon(Icons.sync_rounded),
                        label: const Text('Tekrar dene'),
                      ),
                    )
                  : Column(
                      children: [
                        for (final provider in items) ...[
                          _ProviderCard(provider: provider),
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
              loading: () => const _LoadingCard(label: 'Sağlayıcılar okunuyor'),
              error: (error, _) => EmptyStateCard(
                title: 'Sağlayıcı listesi alınamadı',
                body: '$error',
                icon: Icons.warning_amber_rounded,
              ),
            ),
            const SizedBox(height: 4),
            const SectionHeader(
              title: 'Mobil katman hazırlığı',
              subtitle:
                  'Harita yüzeyinde gösterilecek katalog katmanları ve yetenekleri.',
            ),
            const SizedBox(height: 12),
            for (final layer in layers) ...[
              _LayerReadinessCard(layer: layer),
              const SizedBox(height: 12),
            ],
            PremiumCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.verified_user_rounded, color: scheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Mobil uygulama resmi veriyi taklit etmez: gateway yoksa, izinli TKGM adaptörü kapalıysa veya belediye katmanı metadata-only ise kullanıcıya hazır değil durumu gösterilir.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HealthCard extends StatelessWidget {
  const _HealthCard({required this.health});

  final AsyncValue<GatewayHealth> health;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return health.when(
      data: (value) => PremiumCard(
        child: Row(
          children: [
            Icon(Icons.monitor_heart_rounded, color: scheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gateway durumu',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(
                    'status: ${value.status} · Turkey-only: ${value.turkeyOnly ? 'aktif' : 'kapalı'}',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            StatusPill(
              label: value.status == 'healthy' ? 'canlı' : value.status,
              color:
                  value.status == 'healthy' ? scheme.primary : scheme.tertiary,
            ),
          ],
        ),
      ),
      loading: () => const _LoadingCard(label: 'Gateway kontrol ediliyor'),
      error: (error, _) => EmptyStateCard(
        title: 'Gateway sağlık kontrolü başarısız',
        body: '$error',
        icon: Icons.warning_amber_rounded,
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  const _ProviderCard({required this.provider});

  final ProviderDescriptor provider;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = switch (provider.stateLevel) {
      ProviderStateLevel.official => scheme.primary,
      ProviderStateLevel.publicMetadata => scheme.secondary,
      ProviderStateLevel.derived => scheme.tertiary,
      ProviderStateLevel.unavailable => scheme.outline,
    };

    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(provider.displayName,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Text(
                      provider.id,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              StatusPill(label: provider.stateLabel, color: color),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              StatusPill(
                label: provider.enabled ? 'enabled' : 'disabled',
                color: provider.enabled ? scheme.primary : scheme.outline,
                icon: provider.enabled
                    ? Icons.check_circle_rounded
                    : Icons.lock_outline_rounded,
              ),
              for (final capability in provider.capabilities.take(3))
                StatusPill(label: capability, color: scheme.secondary),
            ],
          ),
          if (provider.regions.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'Bölge: ${provider.regions.take(5).join(', ')}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: scheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}

class _LayerReadinessCard extends StatelessWidget {
  const _LayerReadinessCard({required this.layer});

  final GisLayerDescriptor layer;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = switch (layer.trust) {
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(layer.name,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Text(
                      layer.description,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              StatusPill(label: layer.trust.name, color: color),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              StatusPill(
                label: layer.metadataOnly ? 'metadata-only' : 'endpoint-ready',
                color: layer.isOperational ? scheme.primary : scheme.tertiary,
                icon: layer.isOperational
                    ? Icons.cloud_done_rounded
                    : Icons.info_outline_rounded,
              ),
              for (final capability in layer.capabilities.take(4))
                StatusPill(label: capability, color: scheme.secondary),
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      child: Row(
        children: [
          const SizedBox(
            height: 18,
            width: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
