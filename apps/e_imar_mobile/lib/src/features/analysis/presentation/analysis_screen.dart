import 'package:flutter/material.dart';

import '../../../core/services/gis_layers.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/risk_scoring_service.dart';

class AnalysisScreen extends StatefulWidget {
  const AnalysisScreen({super.key});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> {
  final RiskScoringService _scoringService = const RiskScoringService();
  final Set<RiskLayer> _selectedLayers = {
    RiskLayer.deprem,
    RiskLayer.fayHatti,
    RiskLayer.zeminTipi,
  };

  @override
  Widget build(BuildContext context) {
    final layers = officialRiskLayerPresets
        .where((layer) => layer.riskLayer != null)
        .toList(growable: false);
    final score = _scoringService.score(selectedLayers: _selectedLayers);
    final activeLayers = layers
        .where((layer) => _selectedLayers.contains(layer.riskLayer))
        .toList(growable: false);

    return Scaffold(
      appBar: AppBar(title: const Text('Analiz')),
      body: DecoratedBox(
        decoration: BoxDecoration(
            gradient: Theme.of(context).brightness == Brightness.dark
                ? null
                : AppGradients.sandSurface),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const PremiumHeader(
              title: 'Yıllara Göre Analiz',
              subtitle:
                  'Parsel çevresindeki resmi risk katmanlarını tek ekranda izleyen premium mock analiz paneli.',
              icon: Icons.analytics_rounded,
              badge: 'Phase 2B',
            ),
            const SizedBox(height: 16),
            _RiskScoreCard(result: score),
            const SizedBox(height: 16),
            _AiExplanationCard(result: score),
            const SizedBox(height: 24),
            _SectionHeader(
                title: 'Risk Katmanları',
                trailing: StatusBadge(
                    label: '${_selectedLayers.length} aktif',
                    tone: BadgeTone.success,
                    icon: Icons.layers_rounded)),
            const SizedBox(height: 12),
            for (final layer in layers)
              Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _LayerToggleCard(
                      layer: layer,
                      selected: _selectedLayers.contains(layer.riskLayer),
                      onChanged: () => _toggle(layer.riskLayer!))),
            const SizedBox(height: 14),
            _SourceBadges(layers: activeLayers),
            const SizedBox(height: 24),
            const _SectionHeader(
                title: 'Isı Haritası Özeti',
                trailing: StatusBadge(
                    label: 'Mock veri',
                    tone: BadgeTone.warning,
                    icon: Icons.science_rounded)),
            const SizedBox(height: 12),
            _HeatmapSummaryGrid(result: score),
            const SizedBox(height: 14),
            const InsightCard(
              title: 'Canlı servis modu hazır değil',
              message:
                  'Bu panel ağ çağrısı yapmaz; WMS/WFS/GeoJSON URL inşası ve deterministik risk modeliyle entegrasyon yüzeyi hazırlar.',
              icon: Icons.hub_rounded,
              color: AppColors.info,
            ),
          ],
        ),
      ),
    );
  }

  void _toggle(RiskLayer layer) {
    setState(() {
      if (_selectedLayers.contains(layer)) {
        _selectedLayers.remove(layer);
      } else {
        _selectedLayers.add(layer);
      }
    });
  }
}

class _RiskScoreCard extends StatelessWidget {
  const _RiskScoreCard({required this.result});

  final RiskScoreResult result;

  @override
  Widget build(BuildContext context) => ValueScoreCard(
        score: result.score,
        title: result.label,
        subtitle:
            'Güven ${(result.confidence * 100).round()}% • ${result.signals.length} katman ile hesaplandı',
        trailing:
            const Icon(Icons.radar_rounded, color: Colors.white, size: 30),
      );
}

class _AiExplanationCard extends StatelessWidget {
  const _AiExplanationCard({required this.result});

  final RiskScoreResult result;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            StatusBadge(
                label: 'AI tarzı açıklama',
                tone: BadgeTone.info,
                icon: Icons.auto_awesome_rounded),
            Spacer(),
            StatusBadge(label: 'API yok', tone: BadgeTone.neutral)
          ]),
          const SizedBox(height: 12),
          Text(result.explanation,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(height: 1.45, fontWeight: FontWeight.w600)),
        ]),
      );
}

class _LayerToggleCard extends StatelessWidget {
  const _LayerToggleCard(
      {required this.layer, required this.selected, required this.onChanged});

  final GisLayerDescriptor layer;
  final bool selected;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final color = _layerColor(layer.riskLayer!);
    return GlassCard(
      onTap: onChanged,
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
                color: color.withValues(alpha: .14),
                borderRadius: BorderRadius.circular(17)),
            child: Icon(_layerIcon(layer.riskLayer!), color: color, size: 25)),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                  child: Text(_layerTitle(layer.riskLayer!),
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w900))),
              StatusBadge(
                  label: layer.kind.name.toUpperCase(), tone: BadgeTone.neutral)
            ]),
            const SizedBox(height: 5),
            Text(layer.sourceAuthority,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.slate, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Row(children: [
              StatusBadge(
                  label: selected ? 'Aktif' : 'Pasif',
                  tone: selected ? BadgeTone.success : BadgeTone.neutral,
                  icon: selected
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_unchecked_rounded),
              const SizedBox(width: 8),
              StatusBadge(
                  label: 'TTL ${_ttlLabel(layer.cacheTtl)}',
                  tone: BadgeTone.info)
            ]),
          ]),
        ),
        const SizedBox(width: 10),
        Switch.adaptive(value: selected, onChanged: (_) => onChanged()),
      ]),
    );
  }
}

class _SourceBadges extends StatelessWidget {
  const _SourceBadges({required this.layers});

  final List<GisLayerDescriptor> layers;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Kaynak ve durum',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final authority
                in layers.map((layer) => layer.sourceAuthority).toSet())
              StatusBadge(
                  label: authority,
                  tone: BadgeTone.info,
                  icon: Icons.verified_rounded),
            const StatusBadge(
                label: 'Deterministik mock',
                tone: BadgeTone.warning,
                icon: Icons.lock_clock_rounded),
            const StatusBadge(
                label: 'Atıf zorunlu',
                tone: BadgeTone.neutral,
                icon: Icons.policy_rounded),
          ]),
        ]),
      );
}

class _HeatmapSummaryGrid extends StatelessWidget {
  const _HeatmapSummaryGrid({required this.result});

  final RiskScoreResult result;

  @override
  Widget build(BuildContext context) {
    final high = result.signals.where((signal) => signal.severity >= 70).length;
    final medium = result.signals
        .where((signal) => signal.severity >= 44 && signal.severity < 70)
        .length;
    final low = result.signals.where((signal) => signal.severity < 44).length;
    return Column(children: [
      Row(children: [
        Expanded(
            child: _HeatmapMetric(
                title: 'Kırmızı hücre',
                value: '$high',
                subtitle: 'yüksek yoğunluk',
                color: AppColors.riskHigh,
                icon: Icons.local_fire_department_rounded)),
        const SizedBox(width: 10),
        Expanded(
            child: _HeatmapMetric(
                title: 'Sarı hücre',
                value: '$medium',
                subtitle: 'izleme alanı',
                color: AppColors.warning,
                icon: Icons.warning_amber_rounded)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(
            child: _HeatmapMetric(
                title: 'Yeşil hücre',
                value: '$low',
                subtitle: 'düşük sinyal',
                color: AppColors.riskLow,
                icon: Icons.eco_rounded)),
        const SizedBox(width: 10),
        Expanded(
            child: _HeatmapMetric(
                title: 'Kapsam',
                value: '${result.signals.length}/7',
                subtitle: 'risk katmanı',
                color: AppColors.info,
                icon: Icons.grid_4x4_rounded)),
      ]),
    ]);
  }
}

class _HeatmapMetric extends StatelessWidget {
  const _HeatmapMetric(
      {required this.title,
      required this.value,
      required this.subtitle,
      required this.color,
      required this.icon});

  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                  color: color.withValues(alpha: .15),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 20)),
          const SizedBox(height: 10),
          Text(title,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.slate, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w900)),
          Text(subtitle,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.slate)),
        ]),
      );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.trailing});

  final String title;
  final Widget trailing;

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
            child: Text(title,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w900))),
        trailing
      ]);
}

IconData _layerIcon(RiskLayer layer) => switch (layer) {
      RiskLayer.deprem => Icons.vibration_rounded,
      RiskLayer.fayHatti => Icons.timeline_rounded,
      RiskLayer.heyelan => Icons.terrain_rounded,
      RiskLayer.sel => Icons.water_drop_rounded,
      RiskLayer.zeminTipi => Icons.layers_rounded,
      RiskLayer.tarimAlani => Icons.agriculture_rounded,
      RiskLayer.sitAlani => Icons.account_balance_rounded,
    };

Color _layerColor(RiskLayer layer) => switch (layer) {
      RiskLayer.deprem => AppColors.riskHigh,
      RiskLayer.fayHatti => AppColors.warning,
      RiskLayer.heyelan => AppColors.mapOlive,
      RiskLayer.sel => AppColors.info,
      RiskLayer.zeminTipi => AppColors.emerald,
      RiskLayer.tarimAlani => AppColors.lime,
      RiskLayer.sitAlani => AppColors.sky,
    };

String _layerTitle(RiskLayer layer) => switch (layer) {
      RiskLayer.deprem => 'Deprem',
      RiskLayer.fayHatti => 'Fay Hattı',
      RiskLayer.heyelan => 'Heyelan',
      RiskLayer.sel => 'Sel',
      RiskLayer.zeminTipi => 'Zemin Tipi',
      RiskLayer.tarimAlani => 'Tarım Alanı',
      RiskLayer.sitAlani => 'Sit Alanı',
    };

String _ttlLabel(Duration ttl) =>
    ttl.inDays >= 1 ? '${ttl.inDays}g' : '${ttl.inHours}s';
