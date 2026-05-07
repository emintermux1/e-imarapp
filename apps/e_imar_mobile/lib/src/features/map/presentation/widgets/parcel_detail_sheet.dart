import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_router.dart';
import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../../data/repositories/offline_parcel_repository.dart';
import '../../domain/parcel.dart';

class ParcelDetailSheet extends ConsumerWidget {
  const ParcelDetailSheet({required this.parcel, super.key});
  final ParcelDetail parcel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metrics = [
      ('TAKS', parcel.taks > 0 ? parcel.taks.toStringAsFixed(2) : '—', Icons.square_foot_rounded),
      ('KAKS', parcel.kaks > 0 ? parcel.kaks.toStringAsFixed(2) : '—', Icons.layers_rounded),
      ('Emsal', parcel.emsal > 0 ? parcel.emsal.toStringAsFixed(2) : '—', Icons.functions_rounded),
      ('Kat', parcel.floorLimit > 0 ? '${parcel.floorLimit}' : '—', Icons.apartment_rounded),
      ('Yapılaşma', parcel.coverageRatio, Icons.pie_chart_rounded),
      ('Yol cephesi', parcel.roadFrontage > 0 ? '${parcel.roadFrontage} m' : '—', Icons.alt_route_rounded),
    ];
    return PremiumBottomSheetShell(
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: .82,
        minChildSize: .46,
        maxChildSize: .95,
        builder: (context, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 26),
          children: [
            Center(child: Container(width: 48, height: 5, decoration: BoxDecoration(color: AppColors.slate.withValues(alpha: .24), borderRadius: BorderRadius.circular(99)))),
            const SizedBox(height: 18),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900, height: 1.02)),
                  const SizedBox(height: 7),
                  Text('${parcel.displayAddress} • ${parcel.titleType}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate)),
                ]),
              ),
              StatusBadge(label: parcel.official ? 'Resmi/kamu' : 'Doğrulanmamış', tone: parcel.official ? BadgeTone.success : BadgeTone.warning, icon: parcel.official ? Icons.verified_rounded : Icons.info_rounded),
            ]),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              StatusBadge(label: parcel.zoningStatus, tone: parcel.hasPlanMetrics ? BadgeTone.info : BadgeTone.neutral, icon: Icons.account_balance_rounded),
              StatusBadge(label: _sourceLabel(parcel), tone: _toneForSource(parcel), icon: Icons.source_rounded),
              StatusBadge(label: parcel.providerStatus, tone: _toneForStatus(parcel.providerStatus), icon: Icons.route_rounded),
              if (parcel.yearApproved > 0) StatusBadge(label: 'Plan yılı: ${parcel.yearApproved}', tone: BadgeTone.neutral, icon: Icons.calendar_today_rounded),
            ]),
            const SizedBox(height: 16),
            _SourceCard(parcel: parcel),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: metrics.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.58, crossAxisSpacing: 10, mainAxisSpacing: 10),
              itemBuilder: (_, i) => MetricCard(title: metrics[i].$1, value: metrics[i].$2, icon: metrics[i].$3),
            ),
            const SizedBox(height: 16),
            _GeometryCard(parcel: parcel),
            if (parcel.planFeatures.isNotEmpty) ...[
              const SizedBox(height: 16),
              _PlanFeatures(features: parcel.planFeatures),
            ],
            if (parcel.unavailableReason != null) ...[
              const SizedBox(height: 16),
              InsightCard(title: 'Kısıtlı kaynak notu', message: parcel.unavailableReason!, icon: Icons.lock_rounded, color: AppColors.warning),
            ],
            const SizedBox(height: 16),
            const InsightCard(
              title: 'Hukuki kullanım notu',
              message: 'Bu ekran sağlayıcıdan gelen kaynak ve durum bilgisini açıkça gösterir. Resmi işlem için yetkili kurum kayıtları esas alınır.',
              icon: Icons.gavel_rounded,
              color: AppColors.civicRed,
            ),
            const SizedBox(height: 18),
            Wrap(spacing: 8, runSpacing: 8, children: [
              IconActionChip(label: 'Favoriye ekle', icon: Icons.favorite_border_rounded, onTap: () => _toggleFavorite(context, ref, parcel)),
              IconActionChip(label: 'Paylaş', icon: Icons.ios_share_rounded, onTap: () => _share(context, parcel)),
              IconActionChip(label: 'Rapor yüzeyi', icon: Icons.picture_as_pdf_rounded, onTap: () => context.push(ParcelReportRoute.path, extra: parcel)),
              IconActionChip(label: 'Analiz', icon: Icons.analytics_rounded, onTap: () => context.push(AnalysisRoute.path)),
              if (parcel.latitude != null && parcel.longitude != null) IconActionChip(label: 'Koordinat kopyala', icon: Icons.my_location_rounded, onTap: () => _copyCoordinates(context, parcel)),
            ]),
          ],
        ),
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  const _SourceCard({required this.parcel});
  final ParcelDetail parcel;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Kaynak ve sağlayıcı', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          _SourceRow(label: 'Kaynak', value: parcel.sourceName),
          _SourceRow(label: 'Sağlayıcı', value: parcel.providerId ?? 'Belirtilmedi'),
          _SourceRow(label: 'Yetenekler', value: parcel.providerCapabilities.isEmpty ? 'Metadata bekleniyor' : parcel.providerCapabilities.join(', ')),
          if (parcel.attributionUrl != null) _SourceRow(label: 'Atıf', value: parcel.attributionUrl!),
        ]),
      );
}

class _SourceRow extends StatelessWidget {
  const _SourceRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 7),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 82, child: Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w800))),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700))),
        ]),
      );
}

class _GeometryCard extends StatelessWidget {
  const _GeometryCard({required this.parcel});
  final ParcelDetail parcel;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: EdgeInsets.zero,
        clipChild: true,
        child: SizedBox(
          height: 154,
          child: Stack(children: [
            Positioned.fill(child: CustomPaint(painter: _GeometryPainter(parcel: parcel))),
            Positioned(left: 12, top: 12, child: StatusBadge(label: parcel.hasGeometry ? 'Geometri mevcut' : 'Geometri bekleniyor', tone: parcel.hasGeometry ? BadgeTone.success : BadgeTone.warning, icon: Icons.polyline_rounded)),
          ]),
        ),
      );
}

class _GeometryPainter extends CustomPainter {
  _GeometryPainter({required this.parcel});
  final ParcelDetail parcel;

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFFF2E7E9);
    canvas.drawRect(Offset.zero & size, bg);
    final grid = Paint()..color = Colors.white.withValues(alpha: .72)..strokeWidth = 1.4;
    for (var i = 0; i < 6; i++) {
      canvas.drawLine(Offset(0, size.height * i / 5), Offset(size.width, size.height * i / 5 - 18), grid);
      canvas.drawLine(Offset(size.width * i / 5, 0), Offset(size.width * i / 5 + 18, size.height), grid);
    }
    final fill = Paint()..color = AppColors.civicRed.withValues(alpha: .22)..style = PaintingStyle.fill;
    final stroke = Paint()..color = AppColors.civicRed..strokeWidth = 2.2..style = PaintingStyle.stroke;
    final rect = RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(size.width * .56, size.height * .56), width: size.width * .34, height: size.height * .34), const Radius.circular(14));
    canvas.drawRRect(rect, fill);
    canvas.drawRRect(rect, stroke);
  }

  @override
  bool shouldRepaint(covariant _GeometryPainter oldDelegate) => parcel != oldDelegate.parcel;
}

class _PlanFeatures extends StatelessWidget {
  const _PlanFeatures({required this.features});
  final List<PlanFeature> features;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Plan katmanı sonuçları', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          for (final feature in features.take(5))
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.layers_rounded, color: AppColors.civicRed, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(feature.title, style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900)),
                  Text(feature.summary, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.3)),
                ])),
              ]),
            ),
        ]),
      );
}

Future<void> _toggleFavorite(BuildContext context, WidgetRef ref, ParcelDetail parcel) async {
  final messenger = ScaffoldMessenger.of(context);
  try {
    final repo = ref.read(offlineParcelRepositoryProvider);
    await repo.saveParcel(parcel);
    await repo.toggleFavorite(parcel.block, parcel.parcel);
    messenger.showSnackBar(const SnackBar(content: Text('Favori durumu güncellendi.')));
  } catch (_) {
    messenger.showSnackBar(const SnackBar(content: Text('Favori kaydedilemedi.')));
  }
}

void _share(BuildContext context, ParcelDetail parcel) {
  final text = '${parcel.displayAddress} ${parcel.block}/${parcel.parcel}\nKaynak: ${parcel.sourceName}\nDurum: ${parcel.providerStatus}';
  Clipboard.setData(ClipboardData(text: text));
  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paylaşılabilir parsel özeti panoya kopyalandı.')));
}

void _copyCoordinates(BuildContext context, ParcelDetail parcel) {
  final text = '${parcel.latitude}, ${parcel.longitude}';
  Clipboard.setData(ClipboardData(text: text));
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Koordinat panoya kopyalandı: $text')));
}

BadgeTone _toneForSource(ParcelDetail parcel) {
  if (parcel.official) return BadgeTone.success;
  if (parcel.sourceKind == ParcelSourceKind.unavailable) return BadgeTone.danger;
  if (parcel.sourceKind == ParcelSourceKind.localCache) return BadgeTone.warning;
  return BadgeTone.info;
}

BadgeTone _toneForStatus(String status) => switch (status) {
      'live' => BadgeTone.success,
      'metadata_only' => BadgeTone.info,
      'permission_required' => BadgeTone.warning,
      'not_configured' => BadgeTone.warning,
      'disabled' => BadgeTone.neutral,
      _ => BadgeTone.neutral,
    };

String _sourceLabel(ParcelDetail parcel) => switch (parcel.sourceKind) {
      ParcelSourceKind.official => 'Resmi kaynak',
      ParcelSourceKind.municipalPublic => 'Belediye/kamu',
      ParcelSourceKind.publicMetadata => 'Kamu metadata',
      ParcelSourceKind.restrictedGateway => 'Kısıtlı gateway',
      ParcelSourceKind.localCache => 'Yerel önbellek',
      ParcelSourceKind.unavailable => 'Kullanılamıyor',
    };
