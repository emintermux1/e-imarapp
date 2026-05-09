import 'package:flutter/material.dart';

import '../../app/router.dart';
import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import '../map/domain/parcel.dart';

class ParcelDetailScreen extends StatelessWidget {
  const ParcelDetailScreen({super.key, this.parcel});

  final ParcelDetail? parcel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final data = parcel;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parsel Detayı'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.bookmark_add_rounded)),
        ],
      ),
      body: SafeArea(
        child: data == null
            ? Padding(
                padding: const EdgeInsets.all(16),
                child: EmptyStateCard(
                  title: 'Parsel verisi seçilmedi',
                  body: 'Arama sonucundan bir kayıt açıldığında burada güven seviyesi, emsal hesabı ve kaynak açıklaması görünür.',
                  action: FilledButton(
                    onPressed: () => Navigator.of(context).popUntil((route) => route.settings.name == AppRoutes.root),
                    child: const Text('Geri dön'),
                  ),
                ),
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                children: [
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
                                  Text(data.parcelLabel, style: Theme.of(context).textTheme.titleLarge),
                                  const SizedBox(height: 8),
                                  Text(data.zoningStatus, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
                                ],
                              ),
                            ),
                            StatusPill(label: data.trustLabel, color: data.official ? scheme.primary : scheme.tertiary),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            StatusPill(label: 'Ada ${data.block}', color: scheme.primary, icon: Icons.confirmation_number_rounded),
                            StatusPill(label: 'Parsel ${data.parcel}', color: scheme.secondary, icon: Icons.crop_square_rounded),
                            StatusPill(label: data.provenanceLabel, color: scheme.tertiary, icon: Icons.verified_rounded),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionHeader(
                    title: 'TAKS / KAKS / gabari / kat hesabı',
                    subtitle: 'Alan verisi gelirse otomatik hesaplanır; gelmezse yüzey buna dürüstçe işaret eder.',
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _MetricCard(label: 'TAKS', value: data.taks == 0 ? '—' : data.taks.toStringAsFixed(2))),
                      const SizedBox(width: 12),
                      Expanded(child: _MetricCard(label: 'KAKS', value: data.kaks == 0 ? '—' : data.kaks.toStringAsFixed(2))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _MetricCard(label: 'Emsal', value: data.emsal == 0 ? '—' : data.emsal.toStringAsFixed(2))),
                      const SizedBox(width: 12),
                      Expanded(child: _MetricCard(label: 'Gabari', value: data.gabariMeters == null ? '—' : '${data.gabariMeters!.toStringAsFixed(1)} m')),
                      const SizedBox(width: 12),
                      Expanded(child: _MetricCard(label: 'Kat sınırı', value: data.floorLimit == 0 ? '—' : '${data.floorLimit} kat')),
                    ],
                  ),
                  const SizedBox(height: 12),
                  PremiumCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Alan temelli hesap', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 10),
                        _CalcRow(label: 'Parsel alanı', value: data.siteAreaSquareMeters == null ? 'Alan gelmedi' : '${data.siteAreaSquareMeters!.toStringAsFixed(1)} m²'),
                        _CalcRow(label: 'Olası oturum', value: data.estimatedFootprintSquareMeters == null ? 'Hesaplanamıyor' : '${data.estimatedFootprintSquareMeters!.toStringAsFixed(1)} m²'),
                        _CalcRow(label: 'Toplam inşaat alanı', value: data.estimatedBuildableAreaSquareMeters == null ? 'Hesaplanamıyor' : '${data.estimatedBuildableAreaSquareMeters!.toStringAsFixed(1)} m²'),
                        _CalcRow(label: 'Tahmini döşeme alanı', value: data.estimatedFloorAreaSquareMeters == null ? 'Hesaplanamıyor' : '${data.estimatedFloorAreaSquareMeters!.toStringAsFixed(1)} m²'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionHeader(
                    title: 'Kaynak durumu',
                    subtitle: 'Resmi / metadata / demo / unavailable ayrımı kullanıcıya her zaman görünür olmalı.',
                  ),
                  const SizedBox(height: 12),
                  PremiumCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(data.sourceName, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('Sağlayıcı durumu: ${data.providerStatus}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
                        if (data.unavailableReason != null) ...[
                          const SizedBox(height: 10),
                          Text(data.unavailableReason!, style: TextStyle(color: scheme.error)),
                        ],
                        if (data.hasSourceUrl) ...[
                          const SizedBox(height: 10),
                          Text('Atıf: ${data.attributionUrl}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionHeader(
                    title: 'Plan feature özetleri',
                    subtitle: 'Sorgudan dönen öznitelikler açık ve okunabilir biçimde listelenir.',
                  ),
                  const SizedBox(height: 12),
                  if (data.planFeatures.isEmpty)
                    EmptyStateCard(
                      title: 'Plan feature yok',
                      body: 'Şu an için sağlayıcı öznitelik göndermedi. Bu boşluk bir hata değil, veri durumudur.',
                    )
                  else
                    for (final feature in data.planFeatures) ...[
                      PremiumCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(feature.title, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 8),
                            Text(feature.summary, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                StatusPill(label: feature.provenance, color: scheme.primary),
                                if (feature.layerName != null) StatusPill(label: feature.layerName!, color: scheme.secondary),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                ],
              ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _CalcRow extends StatelessWidget {
  const _CalcRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, color: scheme.onSurface)),
        ],
      ),
    );
  }
}

