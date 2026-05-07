import 'package:flutter/material.dart';

import '../../../core/services/ai_services.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../domain/valuation_models.dart';

class ValuationPreviewScreen extends StatelessWidget {
  const ValuationPreviewScreen(
      {super.key, this.service = const MockParcelAiService()});

  final MarketValuationService service;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('AI Değerleme Önizleme')),
        body: DecoratedBox(
          decoration: BoxDecoration(
              gradient: Theme.of(context).brightness == Brightness.dark
                  ? null
                  : AppGradients.sandSurface),
          child: ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: [ValuationPreviewPanel(service: service)]),
        ),
      );
}

class ValuationPreviewPanel extends StatelessWidget {
  const ValuationPreviewPanel(
      {super.key,
      this.service = const MockParcelAiService(),
      this.request = _mockRequest});

  final MarketValuationService service;
  final PriceEstimateRequest request;

  @override
  Widget build(BuildContext context) => FutureBuilder<PriceEstimateResponse>(
        future: service.estimatePrice(request),
        builder: (context, snapshot) {
          final estimate = snapshot.data;
          if (estimate == null) {
            return const GlassCard(
                child: SizedBox(
                    height: 220,
                    child: Center(child: CircularProgressIndicator())));
          }
          return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PremiumHeader(
                    title: 'AI piyasa değeri',
                    subtitle:
                        '${request.district}/${request.neighborhood} için mock GPT-4o/Grok hazır değerleme önizlemesi',
                    icon: Icons.auto_awesome_rounded,
                    badge: 'Premium mock'),
                const SizedBox(height: 16),
                ValueScoreCard(
                    score: estimate.investmentScore.score,
                    title: _money(estimate.estimatedTotalValue.amount),
                    subtitle:
                        '${_money(estimate.pricePerSquareMeter.amount)}/m² • ${estimate.investmentScore.label}'),
                const SizedBox(height: 14),
                GlassCard(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Text('Güven aralığı',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w900)),
                          const Spacer(),
                          StatusBadge(
                              label:
                                  '%${(estimate.confidenceInterval.confidence * 100).round()} güven',
                              tone: BadgeTone.info)
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          Expanded(
                              child: MetricTile(
                                  label: 'Alt bant',
                                  value: _money(
                                      estimate.confidenceInterval.low.amount),
                                  icon: Icons.south_west_rounded)),
                          const SizedBox(width: 10),
                          Expanded(
                              child: MetricTile(
                                  label: 'Orta tahmin',
                                  value: _money(
                                      estimate.confidenceInterval.mid.amount),
                                  icon: Icons.trip_origin_rounded)),
                          const SizedBox(width: 10),
                          Expanded(
                              child: MetricTile(
                                  label: 'Üst bant',
                                  value: _money(
                                      estimate.confidenceInterval.high.amount),
                                  icon: Icons.north_east_rounded)),
                        ]),
                      ]),
                ),
                const SizedBox(height: 14),
                InsightCard(
                    title: 'AI içgörü',
                    message: estimate.aiInsight,
                    icon: Icons.psychology_rounded,
                    color: AppColors.emerald),
                const SizedBox(height: 14),
                GlassCard(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Yakın emsaller',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.w900)),
                        const SizedBox(height: 10),
                        for (final comp in estimate.comparables)
                          _ComparableTile(comparable: comp),
                      ]),
                ),
                const SizedBox(height: 14),
                GlassCard(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Kaynak ve sınırlar',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.w900)),
                        const SizedBox(height: 10),
                        Wrap(spacing: 8, runSpacing: 8, children: [
                          for (final note in estimate.sourceNotes)
                            StatusBadge(
                                label: note.label,
                                tone: BadgeTone.neutral,
                                icon: Icons.verified_user_rounded)
                        ]),
                        const SizedBox(height: 12),
                        for (final caveat in estimate.riskCaveats)
                          Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.warning_amber_rounded,
                                        color: AppColors.warning, size: 18),
                                    const SizedBox(width: 8),
                                    Expanded(
                                        child: Text(caveat,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                    color: AppColors.slate,
                                                    height: 1.35)))
                                  ])),
                      ]),
                ),
              ]);
        },
      );

  String _money(double value) {
    if (value >= 1000000) return '₺${(value / 1000000).toStringAsFixed(1)}M';
    return '₺${value.toStringAsFixed(0)}';
  }
}

class _ComparableTile extends StatelessWidget {
  const _ComparableTile({required this.comparable});

  final MarketComparable comparable;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: GlassCard(
          padding: const EdgeInsets.all(12),
          variant: GlassVariant.light,
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: AppColors.emerald.withOpacity(.12),
                    borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.apartment_rounded,
                    color: AppColors.emerald, size: 21)),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Row(children: [
                    Expanded(
                        child: Text(comparable.locationLabel,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.w900))),
                    StatusBadge(
                        label: comparable.source.label, tone: BadgeTone.info)
                  ]),
                  const SizedBox(height: 5),
                  Text(
                      '${comparable.areaSquareMeters.toStringAsFixed(0)} m² • ${_money(comparable.pricePerSquareMeter.amount)}/m² • ${comparable.distanceMeters.toStringAsFixed(0)} m',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.slate)),
                  const SizedBox(height: 4),
                  Text(comparable.sourceNote,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.slate, height: 1.3)),
                ])),
          ]),
        ),
      );

  String _money(double value) => value >= 1000000
      ? '₺${(value / 1000000).toStringAsFixed(1)}M'
      : '₺${value.toStringAsFixed(0)}';
}

const _mockRequest = PriceEstimateRequest(
    parcelId: '34-34726-1247-18',
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Fenerbahçe',
    zoningStatus: 'Konut + Ticaret',
    parcelAreaSquareMeters: 500);
