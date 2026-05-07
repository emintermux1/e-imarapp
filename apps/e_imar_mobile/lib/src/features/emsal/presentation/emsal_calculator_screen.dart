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
  Widget build(BuildContext context) {
    final r = result;
    return Scaffold(
      appBar: AppBar(title: const Text('Emsal Hesapla')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        GlassCard(child: Column(children: [
          Row(children: [Expanded(child: TextField(controller: area, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Arsa Alanı (m²)'))), const SizedBox(width: 10), Expanded(child: TextField(controller: emsal, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Emsal (E)')))]),
          const SizedBox(height: 10),
          Row(children: [Expanded(child: TextField(controller: taks, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'TAKS (ops.)'))), const SizedBox(width: 10), Expanded(child: TextField(controller: floors, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Kat Sayısı')))]),
          const SizedBox(height: 10),
          TextField(controller: unitArea, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ortalama Daire m²')),
          const SizedBox(height: 14),
          GradientButton(label: '5000m² + E:1.5 hesapla', icon: Icons.calculate_rounded, onPressed: _calculate),
        ])),
        const SizedBox(height: 18),
        if (r != null) ...[
          GridView.count(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisCount: 2, childAspectRatio: 1.45, crossAxisSpacing: 10, mainAxisSpacing: 10, children: [
            MetricCard(title: 'Toplam İnşaat', value: '${r.totalConstructionArea.toStringAsFixed(0)} m²', icon: Icons.apartment_rounded),
            MetricCard(title: 'Daire Adedi', value: '${r.apartmentCount}', icon: Icons.meeting_room_rounded),
            MetricCard(title: 'Tahmini Maliyet', value: _money(r.estimatedCost), icon: Icons.account_balance_wallet_rounded),
            MetricCard(title: 'Satış Potansiyeli', value: _money(r.salesPotential), subtitle: 'Mock piyasa varsayımı', icon: Icons.trending_up_rounded),
          ]),
          const SizedBox(height: 16),
          GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('ROI Tahmini', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            ClipRRect(borderRadius: BorderRadius.circular(99), child: LinearProgressIndicator(value: (r.roi / 140).clamp(0, 1), minHeight: 16, color: AppColors.emerald, backgroundColor: AppColors.emerald.withOpacity(.14))),
            const SizedBox(height: 8),
            Text('%${r.roi.toStringAsFixed(1)} brüt potansiyel. Finansman, ruhsat ve satış hızı dahil değildir.'),
          ])),
        ],
      ]),
    );
  }

  void _calculate() {
    final input = EmsalInput(landArea: _d(area.text, 5000), emsal: _d(emsal.text, 1.5), taks: _d(taks.text, .35), floorCount: int.tryParse(floors.text), averageUnitArea: _d(unitArea.text, 115));
    setState(() => result = const EmsalCalculatorService().calculate(input));
  }

  double _d(String value, double fallback) => double.tryParse(value.replaceAll(',', '.')) ?? fallback;
  String _money(double value) => '₺${(value / 1000000).toStringAsFixed(1)}M';
}
