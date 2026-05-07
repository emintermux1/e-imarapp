import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class ParcelDetailSheet extends StatelessWidget {
  const ParcelDetailSheet({required this.parcel, super.key});
  final ParcelDetail parcel;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      ('TAKS', parcel.taks.toStringAsFixed(2), Icons.square_foot_rounded),
      ('KAKS', parcel.kaks.toStringAsFixed(2), Icons.layers_rounded),
      ('Emsal', parcel.emsal.toStringAsFixed(2), Icons.functions_rounded),
      ('Kat', '${parcel.floorLimit}', Icons.apartment_rounded),
      ('Yapılaşma', parcel.coverageRatio, Icons.pie_chart_rounded),
      ('Yol Cephesi', '${parcel.roadFrontage} m', Icons.alt_route_rounded),
    ];
    return PremiumBottomSheetShell(
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: .80,
        minChildSize: .42,
        maxChildSize: .95,
        builder: (context, controller) => ListView(controller: controller, padding: const EdgeInsets.fromLTRB(20, 10, 20, 26), children: [
          Center(child: Container(width: 48, height: 5, decoration: BoxDecoration(color: AppColors.slate.withOpacity(.24), borderRadius: BorderRadius.circular(99)))),
          const SizedBox(height: 18),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900, height: 1.02)), const SizedBox(height: 7), Text('${parcel.city} / ${parcel.district} • ${parcel.titleType}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate))])),
            const StatusBadge(label: 'Güven %94', tone: BadgeTone.success, icon: Icons.verified_rounded),
          ]),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [StatusBadge(label: parcel.zoningStatus, tone: BadgeTone.info, icon: Icons.account_balance_rounded), const StatusBadge(label: 'İmara uygun', tone: BadgeTone.success, icon: Icons.check_circle_rounded), const StatusBadge(label: 'Mock veri', tone: BadgeTone.neutral, icon: Icons.hub_rounded)]),
          const SizedBox(height: 18),
          const ValueScoreCard(score: 86, title: 'Yatırım Skoru', subtitle: 'Merkezi konum, güçlü cephe ve emsal potansiyeli ile premium aday.'),
          const SizedBox(height: 16),
          GridView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), itemCount: metrics.length, gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.62, crossAxisSpacing: 10, mainAxisSpacing: 10), itemBuilder: (_, i) => MetricCard(title: metrics[i].$1, value: metrics[i].$2, icon: metrics[i].$3)),
          const SizedBox(height: 16),
          const _RiskStrip(),
          const SizedBox(height: 16),
          const InsightCard(title: 'AI değer artışı', message: 'Bölgede son 2 yılda yüksek değer artışı ve düşük arz baskısı görülüyor.', icon: Icons.trending_up_rounded, color: AppColors.emerald),
          const SizedBox(height: 10),
          const InsightCard(title: 'Proje potansiyeli', message: 'Bu arsaya tahmini 24 dairelik butik proje kurgusu yapılabilir.', icon: Icons.auto_awesome_rounded, color: AppColors.lime),
          const SizedBox(height: 10),
          const InsightCard(title: 'Dikkat notu', message: 'Ruhsat, terk ve plan notları gerçek entegrasyonla teyit edilmelidir.', icon: Icons.gpp_maybe_rounded, color: AppColors.warning),
          const SizedBox(height: 18),
          Text('Hızlı işlemler', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          GridView.count(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisCount: 3, childAspectRatio: 1.02, crossAxisSpacing: 10, mainAxisSpacing: 10, children: const [
            _ActionTile(label: 'Favoriye Ekle', icon: Icons.favorite_border_rounded),
            _ActionTile(label: 'Analizi Gör', icon: Icons.analytics_rounded),
            _ActionTile(label: 'PDF', icon: Icons.picture_as_pdf_rounded),
            _ActionTile(label: 'Paylaş', icon: Icons.ios_share_rounded),
            _ActionTile(label: 'Google Earth', icon: Icons.public_rounded),
            _ActionTile(label: 'Koordinat', icon: Icons.my_location_rounded),
          ]),
        ]),
      ),
    );
  }
}

class _RiskStrip extends StatelessWidget {
  const _RiskStrip();
  @override
  Widget build(BuildContext context) => GlassCard(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Risk özeti', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 10),
        const Wrap(spacing: 8, runSpacing: 8, children: [RiskChip(label: 'Deprem', level: 44), RiskChip(label: 'Likidite', level: 26), RiskChip(label: 'Plan', level: 18)]),
      ]));
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.label, required this.icon});
  final String label;
  final IconData icon;
  @override
  Widget build(BuildContext context) => GlassCard(padding: const EdgeInsets.all(10), onTap: () {}, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icon, color: AppColors.emerald), const SizedBox(height: 8), Text(label, textAlign: TextAlign.center, style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w800))]));
}
