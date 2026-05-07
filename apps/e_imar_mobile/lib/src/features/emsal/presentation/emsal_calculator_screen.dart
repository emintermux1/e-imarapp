import 'package:flutter/material.dart';

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
  void initState() { super.initState(); _calculate(); }

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
        decoration: BoxDecoration(gradient: Theme.of(context).brightness == Brightness.dark ? null : AppGradients.sandSurface),
        child: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
          _EquationHero(area: area.text, emsal: emsal.text),
          const SizedBox(height: 16),
          GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Proje girdileri', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 14),
            Row(children: [Expanded(child: _Input(controller: area, label: 'Arsa Alanı', suffix: 'm²', icon: Icons.square_foot_rounded)), const SizedBox(width: 10), Expanded(child: _Input(controller: emsal, label: 'Emsal', suffix: 'E', icon: Icons.functions_rounded))]),
            const SizedBox(height: 10),
            Row(children: [Expanded(child: _Input(controller: taks, label: 'TAKS', suffix: 'ops.', icon: Icons.pie_chart_rounded)), const SizedBox(width: 10), Expanded(child: _Input(controller: floors, label: 'Kat', suffix: 'adet', icon: Icons.layers_rounded))]),
            const SizedBox(height: 10),
            _Input(controller: unitArea, label: 'Ortalama Daire', suffix: 'm²', icon: Icons.meeting_room_rounded),
            const SizedBox(height: 14),
            GradientButton(label: '5000m² + E:1.5 hesapla', icon: Icons.calculate_rounded, onPressed: _calculate),
          ])),
          const SizedBox(height: 18),
          if (r != null) ...[
            ValueScoreCard(score: r.roi.clamp(0, 99).round(), title: 'Brüt ROI Potansiyeli', subtitle: '%${r.roi.toStringAsFixed(1)} mock varsayım • finansman ve ruhsat dahil değil'),
            const SizedBox(height: 14),
            GridView.count(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisCount: 2, childAspectRatio: 1.36, crossAxisSpacing: 10, mainAxisSpacing: 10, children: [
              MetricCard(title: 'Toplam İnşaat', value: '${r.totalConstructionArea.toStringAsFixed(0)} m²', icon: Icons.apartment_rounded),
              MetricCard(title: 'Daire Adedi', value: '${r.apartmentCount}', icon: Icons.meeting_room_rounded),
              MetricCard(title: 'Tahmini Maliyet', value: _money(r.estimatedCost), icon: Icons.account_balance_wallet_rounded),
              MetricCard(title: 'Satış Potansiyeli', value: _money(r.salesPotential), subtitle: 'Mock piyasa varsayımı', icon: Icons.trending_up_rounded),
            ]),
            const SizedBox(height: 16),
            GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Text('Yatırım ilerlemesi', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)), const Spacer(), StatusBadge(label: '%${r.roi.toStringAsFixed(1)}', tone: BadgeTone.success)]),
              const SizedBox(height: 12),
              ClipRRect(borderRadius: BorderRadius.circular(99), child: LinearProgressIndicator(value: (r.roi / 140).clamp(0, 1).toDouble(), minHeight: 16, color: AppColors.emerald, backgroundColor: AppColors.emerald.withOpacity(.14))),
              const SizedBox(height: 12),
              const InsightCard(title: 'Fintech notu', message: 'Gelir, maliyet ve satış potansiyeli mock katsayılarla hesaplanır; gerçek piyasa entegrasyonu Faz 2 kapsamındadır.', icon: Icons.insights_rounded, color: AppColors.info),
            ])),
          ],
        ]),
      ),
    );
  }

  void _calculate() {
    final input = EmsalInput(landArea: _d(area.text, 5000), emsal: _d(emsal.text, 1.5), taks: _d(taks.text, .35), floorCount: int.tryParse(floors.text), averageUnitArea: _d(unitArea.text, 115));
    setState(() => result = const EmsalCalculatorService().calculate(input));
  }

  double _d(String value, double fallback) => double.tryParse(value.replaceAll(',', '.')) ?? fallback;
  String _money(double value) => '₺${(value / 1000000).toStringAsFixed(1)}M';
}

class _EquationHero extends StatelessWidget {
  const _EquationHero({required this.area, required this.emsal});
  final String area;
  final String emsal;
  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(AppRadius.xl), boxShadow: AppShadows.glow(AppColors.emerald)),
        child: Padding(padding: const EdgeInsets.all(22), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const StatusBadge(label: 'Fintech hesaplayıcı', tone: BadgeTone.info, icon: Icons.lock_rounded),
          const SizedBox(height: 18),
          Text('${area.isEmpty ? '5000' : area}m² + E:${emsal.isEmpty ? '1.5' : emsal}', style: Theme.of(context).textTheme.displaySmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w900, height: 1.0)),
          const SizedBox(height: 8),
          Text('İnşaat alanı, daire adedi, maliyet ve ROI potansiyelini tek ekranda gör.', style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Colors.white.withOpacity(.78))),
        ])),
      );
}

class _Input extends StatelessWidget {
  const _Input({required this.controller, required this.label, required this.suffix, required this.icon});
  final TextEditingController controller;
  final String label;
  final String suffix;
  final IconData icon;
  @override
  Widget build(BuildContext context) => TextField(controller: controller, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: label, suffixText: suffix, prefixIcon: Icon(icon)));
}
