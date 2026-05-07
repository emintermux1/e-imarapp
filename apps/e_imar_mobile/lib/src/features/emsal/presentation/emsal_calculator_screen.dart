import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/emsal_calculator.dart';

class EmsalCalculatorScreen extends StatefulWidget {
  const EmsalCalculatorScreen({super.key});

  @override
  State<EmsalCalculatorScreen> createState() => _EmsalCalculatorScreenState();
}

class _EmsalCalculatorScreenState extends State<EmsalCalculatorScreen> {
  final area = TextEditingController(text: '5000');
  final emsal = TextEditingController(text: '1.5');
  final taks = TextEditingController(text: '0.35');
  final floors = TextEditingController(text: '8');
  final unitArea = TextEditingController(text: '115');
  EmsalResult? result;

  @override
  void initState() {
    super.initState();
    _calculate();
  }

  @override
  void dispose() {
    area.dispose();
    emsal.dispose();
    taks.dispose();
    floors.dispose();
    unitArea.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = result;
    return Scaffold(
      appBar: AppBar(title: const Text('Emsal Hesapla')),
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Theme.of(context).brightness == Brightness.dark
              ? null
              : AppGradients.sandSurface,
        ),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _EquationHero(area: area.text, emsal: emsal.text),
            const SizedBox(height: 16),
            _InputCard(
              area: area,
              emsal: emsal,
              taks: taks,
              floors: floors,
              unitArea: unitArea,
              onCalculate: _calculate,
            ),
            if (r != null) ...[
              const SizedBox(height: 18),
              _ResultsSection(result: r),
              const SizedBox(height: 18),
              _FloorBreakdownSection(result: r),
              const SizedBox(height: 18),
              _AssumptionsSection(),
              const SizedBox(height: 24),
              _StudyCtaSection(),
            ],
          ],
        ),
      ),
    );
  }

  void _calculate() {
    final input = EmsalInput(
      landArea: _d(area.text, 5000),
      emsal: _d(emsal.text, 1.5),
      taks: _d(taks.text, .35),
      floorCount: int.tryParse(floors.text),
      averageUnitArea: _d(unitArea.text, 115),
    );
    setState(() => result = const EmsalCalculatorService().calculate(input));
  }

  double _d(String value, double fallback) =>
      double.tryParse(value.replaceAll(',', '.')) ?? fallback;
}

class _EquationHero extends StatelessWidget {
  const _EquationHero({required this.area, required this.emsal});
  final String area;
  final String emsal;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppGradients.premium,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          boxShadow: AppShadows.glow(AppColors.emerald),
        ),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const StatusBadge(
                  label: 'Fintech hesaplayıcı',
                  tone: BadgeTone.info,
                  icon: Icons.lock_rounded),
              const SizedBox(height: 18),
              Text(
                '${area.isEmpty ? '5000' : area}m² + E:${emsal.isEmpty ? '1.5' : emsal}',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'İnşaat alanı, daire adedi, maliyet ve ROI potansiyelini tek ekranda gör.',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(color: Colors.white.withValues(alpha: .78)),
              ),
            ],
          ),
        ),
      );
}

class _InputCard extends StatelessWidget {
  const _InputCard({
    required this.area,
    required this.emsal,
    required this.taks,
    required this.floors,
    required this.unitArea,
    required this.onCalculate,
  });

  final TextEditingController area;
  final TextEditingController emsal;
  final TextEditingController taks;
  final TextEditingController floors;
  final TextEditingController unitArea;
  final VoidCallback onCalculate;

  @override
  Widget build(BuildContext context) => GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Proje girdileri',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _Input(
                    controller: area,
                    label: 'Arsa Alanı',
                    suffix: 'm²',
                    icon: Icons.square_foot_rounded,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Input(
                    controller: emsal,
                    label: 'Emsal (KAKS)',
                    suffix: 'E',
                    icon: Icons.functions_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _Input(
                    controller: taks,
                    label: 'TAKS',
                    suffix: 'ops.',
                    icon: Icons.pie_chart_rounded,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Input(
                    controller: floors,
                    label: 'Kat Adedi',
                    suffix: 'adet',
                    icon: Icons.layers_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _Input(
              controller: unitArea,
              label: 'Ortalama Daire',
              suffix: 'm²',
              icon: Icons.meeting_room_rounded,
            ),
            const SizedBox(height: 14),
            GradientButton(
              label: '5000m² + E:1.5 hesapla',
              icon: Icons.calculate_rounded,
              onPressed: onCalculate,
            ),
          ],
        ),
      );
}

class _ResultsSection extends StatelessWidget {
  const _ResultsSection({required this.result});
  final EmsalResult result;

  @override
  Widget build(BuildContext context) {
    String _m(double v) => '₺${(v / 1000000).toStringAsFixed(1)}M';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ValueScoreCard(
          score: result.roi.clamp(0, 99).round(),
          title: 'Brüt ROI Potansiyeli',
          subtitle:
              '%${result.roi.toStringAsFixed(1)} mock varsayım • finansman ve ruhsat dahil değil',
        ),
        const SizedBox(height: 14),
        if (result.tabanAlani != null && result.tabanAlani! > 0) ...[
          GlassCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.mint.withValues(alpha: .14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.foundation_rounded,
                      color: AppColors.mint, size: 21),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Taban Alanı (TAKS)',
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      Text(
                        '${result.tabanAlani!.toStringAsFixed(0)} m² taban oturumu (TAKS × arsa alanı)',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: AppColors.slate),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.36,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          children: [
            MetricCard(
              title: 'Toplam İnşaat',
              value: '${result.totalConstructionArea.toStringAsFixed(0)} m²',
              icon: Icons.apartment_rounded,
            ),
            MetricCard(
              title: 'Daire Adedi',
              value: '${result.apartmentCount}',
              icon: Icons.meeting_room_rounded,
            ),
            MetricCard(
              title: 'Tahmini Maliyet',
              value: _m(result.estimatedCost),
              icon: Icons.account_balance_wallet_rounded,
            ),
            MetricCard(
              title: 'Satış Potansiyeli',
              value: _m(result.salesPotential),
              subtitle: 'Mock piyasa varsayımı',
              icon: Icons.trending_up_rounded,
            ),
          ],
        ),
      ],
    );
  }
}

class _FloorBreakdownSection extends StatelessWidget {
  const _FloorBreakdownSection({required this.result});
  final EmsalResult result;

  @override
  Widget build(BuildContext context) {
    if (result.floorBreakdowns.isEmpty) return const SizedBox.shrink();

    return GlassCard(
      variant: GlassVariant.elevated,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Kat Bazında Kırılım',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
              const Spacer(),
              StatusBadge(
                label: '${result.floorBreakdowns.length} kat',
                tone: BadgeTone.success,
                icon: Icons.layers_rounded,
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...result.floorBreakdowns.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _FloorTile(breakdown: f),
              )),
        ],
      ),
    );
  }
}

class _FloorTile extends StatelessWidget {
  const _FloorTile({required this.breakdown});
  final FloorBreakdown breakdown;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(12),
        borderRadius: AppRadius.md,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    gradient: AppGradients.premium,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '${breakdown.floorNumber}',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '. Kat',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                Text(
                  '${breakdown.constructionArea.toStringAsFixed(0)} m²',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.slate,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _FloorMetric(label: 'Daire', value: '${breakdown.unitCount}'),
                const SizedBox(width: 16),
                _FloorMetric(
                  label: 'Maliyet',
                  value:
                      '₺${(breakdown.estimatedCost / 1000000).toStringAsFixed(1)}M',
                ),
                const SizedBox(width: 16),
                _FloorMetric(
                  label: 'Satış',
                  value:
                      '₺${(breakdown.salesPotential / 1000000).toStringAsFixed(1)}M',
                ),
              ],
            ),
            if (breakdown.apartmentMixes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: breakdown.apartmentMixes
                    .where((m) => m.count > 0)
                    .map((m) => StatusBadge(
                          label:
                              '${m.count}× ${m.label} (${m.areaSqm.toStringAsFixed(0)}m²)',
                          tone: BadgeTone.info,
                        ))
                    .toList(),
              ),
            ],
          ],
        ),
      );
}

class _FloorMetric extends StatelessWidget {
  const _FloorMetric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.slate,
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .labelLarge
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
        ],
      );
}

class _AssumptionsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Varsayımlar',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _AssumptionRow(label: 'İnşaat m² maliyeti', value: '₺18.500'),
                const SizedBox(height: 6),
                _AssumptionRow(label: 'Satış m² fiyatı', value: '₺38.500'),
                const SizedBox(height: 6),
                _AssumptionRow(label: 'Ortalama daire alanı', value: '115 m²'),
                const SizedBox(height: 6),
                _AssumptionRow(label: 'Veri kaynağı', value: 'Mock / Faz 2'),
                const SizedBox(height: 10),
                const InsightCard(
                  title: 'Fintech notu',
                  message:
                      'Gelir, maliyet ve satış potansiyeli mock katsayılarla hesaplanır; gerçek piyasa entegrasyonu Faz 2 kapsamındadır. Finansman, ruhsat harçları ve KDV dahil değildir.',
                  icon: Icons.insights_rounded,
                  color: AppColors.info,
                ),
              ],
            ),
          ),
        ],
      );
}

class _AssumptionRow extends StatelessWidget {
  const _AssumptionRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(
            child: Text(label,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.slate)),
          ),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w800)),
        ],
      );
}

class _StudyCtaSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: AppGradients.premium,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: AppShadows.glow(AppColors.emerald),
                  ),
                  child: const Icon(Icons.description_rounded,
                      color: Colors.white, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Etüt Hazırlama',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Profesyonel fizibilite raporu ve imar durumu etüdü talebi oluşturun.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: AppColors.slate, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: 'Etüt Talebi Oluştur',
              icon: Icons.arrow_forward_rounded,
              onPressed: () => context.push('/study-request'),
            ),
          ],
        ),
      );
}

class _Input extends StatelessWidget {
  const _Input({
    required this.controller,
    required this.label,
    required this.suffix,
    required this.icon,
  });

  final TextEditingController controller;
  final String label;
  final String suffix;
  final IconData icon;

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: label,
          suffixText: suffix,
          prefixIcon: Icon(icon),
        ),
      );
}
