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
        initialChildSize: .78,
        minChildSize: .42,
        maxChildSize: .94,
        builder: (context, controller) => ListView(controller: controller, padding: const EdgeInsets.fromLTRB(20, 10, 20, 24), children: [
          Center(child: Container(width: 44, height: 5, decoration: BoxDecoration(color: AppColors.slate.withOpacity(.25), borderRadius: BorderRadius.circular(99)))),
          const SizedBox(height: 18),
          Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
          Text('${parcel.city} / ${parcel.district} • ${parcel.titleType} • ${parcel.zoningStatus}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate)),
          const SizedBox(height: 18),
          GridView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), itemCount: metrics.length, gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.9, crossAxisSpacing: 10, mainAxisSpacing: 10), itemBuilder: (_, i) => MetricCard(title: metrics[i].$1, value: metrics[i].$2, icon: metrics[i].$3)),
          const SizedBox(height: 16),
          _Insight(text: 'Bu bölgede son 2 yılda yüksek değer artışı görüldü.', icon: Icons.trending_up_rounded),
          const SizedBox(height: 10),
          _Insight(text: 'Bu arsaya tahmini 24 dairelik proje yapılabilir.', icon: Icons.auto_awesome_rounded),
          const SizedBox(height: 18),
          Wrap(spacing: 8, runSpacing: 8, children: const [
            IconActionChip(label: 'Favoriye Ekle', icon: Icons.favorite_border_rounded),
            IconActionChip(label: 'Analizi Gör', icon: Icons.analytics_rounded),
            IconActionChip(label: 'PDF', icon: Icons.picture_as_pdf_rounded),
            IconActionChip(label: 'Paylaş', icon: Icons.ios_share_rounded),
            IconActionChip(label: 'Google Earth', icon: Icons.public_rounded),
            IconActionChip(label: 'Koordinat', icon: Icons.my_location_rounded),
          ]),
        ]),
      ),
    );
  }
}

class _Insight extends StatelessWidget {
  const _Insight({required this.text, required this.icon});
  final String text;
  final IconData icon;
  @override
  Widget build(BuildContext context) => GlassCard(child: Row(children: [Icon(icon, color: AppColors.emerald), const SizedBox(width: 12), Expanded(child: Text(text, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)))]));
}
