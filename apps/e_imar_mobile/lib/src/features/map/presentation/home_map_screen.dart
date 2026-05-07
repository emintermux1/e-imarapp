import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/parcel.dart';
import 'widgets/parcel_detail_sheet.dart';

class HomeMapScreen extends ConsumerStatefulWidget {
  const HomeMapScreen(
      {this.openParcelOnStart = false, this.selectedParcel, super.key});
  final bool openParcelOnStart;
  final ParcelDetail? selectedParcel;

  @override
  ConsumerState<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends ConsumerState<HomeMapScreen>
    with SingleTickerProviderStateMixin {
  int tab = 0;

  ParcelDetail get parcel => widget.selectedParcel ?? ParcelDetail.sample;

  @override
  void initState() {
    super.initState();
    if (widget.openParcelOnStart) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _openParcel(parcel));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('E-İmar Önizleme'),
        actions: [
          TextButton.icon(
            onPressed: () => context.push(SearchRoute.path),
            icon: const Icon(Icons.search_rounded),
            label: const Text('Parsel seç'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 96),
        children: [
          _SelectedParcelSummary(
            parcel: parcel,
            onOpenDetail: () => _openParcel(parcel),
            onSearch: () => context.push(SearchRoute.path),
          ),
          const SizedBox(height: 14),
          _CoreActions(
            parcel: parcel,
            onDetail: () => _openParcel(parcel),
          ),
          const SizedBox(height: 14),
          _CivicMapPreview(onTap: () => _openParcel(parcel)),
          const SizedBox(height: 14),
          const InsightCard(
            title: 'Önizleme verisi',
            message:
                'Bu ekrandaki imar ve risk bilgileri örnek veriyle gösterilir. Resmi sonuç için belediye/TKGM entegrasyonu gerekir.',
            icon: Icons.info_outline_rounded,
            color: AppColors.info,
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) {
          setState(() => tab = i);
          if (i == 1) context.push(AnalysisRoute.path);
          if (i == 2) context.push(FavoritesRoute.path);
          if (i == 3) context.push(SettingsRoute.path);
        },
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_work_rounded), label: 'Parsel'),
          NavigationDestination(
              icon: Icon(Icons.analytics_rounded), label: 'Analiz'),
          NavigationDestination(
              icon: Icon(Icons.favorite_rounded), label: 'Favoriler'),
          NavigationDestination(
              icon: Icon(Icons.settings_rounded), label: 'Ayarlar'),
        ],
      ),
    );
  }

  void _openParcel(ParcelDetail selected) {
    final controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
      reverseDuration: const Duration(milliseconds: 130),
    );
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      transitionAnimationController: controller,
      builder: (_) => ParcelDetailSheet(parcel: selected),
    ).whenComplete(controller.dispose);
  }
}

class _SelectedParcelSummary extends StatelessWidget {
  const _SelectedParcelSummary({
    required this.parcel,
    required this.onOpenDetail,
    required this.onSearch,
  });
  final ParcelDetail parcel;
  final VoidCallback onOpenDetail;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.light,
        padding: const EdgeInsets.all(18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: const [
            StatusBadge(
              label: 'Seçili parsel',
              tone: BadgeTone.info,
              icon: Icons.check_circle_rounded,
            ),
            SizedBox(width: 8),
            StatusBadge(label: 'Örnek veri', tone: BadgeTone.neutral),
          ]),
          const SizedBox(height: 14),
          Text(
            '${parcel.neighborhood} ${parcel.block}/${parcel.parcel}',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w900, height: 1.05),
          ),
          const SizedBox(height: 6),
          Text(
            '${parcel.city} / ${parcel.district} • ${parcel.titleType}',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppColors.slate),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              StatusBadge(
                label: parcel.zoningStatus,
                tone: BadgeTone.success,
                icon: Icons.account_balance_rounded,
              ),
              StatusBadge(
                label: 'TAKS ${parcel.taks.toStringAsFixed(2)}',
                tone: BadgeTone.neutral,
              ),
              StatusBadge(
                label: 'KAKS ${parcel.kaks.toStringAsFixed(2)}',
                tone: BadgeTone.neutral,
              ),
              StatusBadge(
                label: 'Plan yılı ${parcel.yearApproved}',
                tone: BadgeTone.neutral,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: GradientButton(
                label: 'Parsel detayını aç',
                icon: Icons.article_rounded,
                onPressed: onOpenDetail,
              ),
            ),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              onPressed: onSearch,
              icon: const Icon(Icons.search_rounded),
              label: const Text('Değiştir'),
            ),
          ]),
        ]),
      );
}

class _CoreActions extends StatelessWidget {
  const _CoreActions({required this.parcel, required this.onDetail});
  final ParcelDetail parcel;
  final VoidCallback onDetail;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('İşlemler',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.35,
            children: [
              _ServiceAction(
                title: 'İmar analizi',
                subtitle: 'Risk özeti ve plan notları',
                icon: Icons.analytics_rounded,
                onTap: () => context.push(AnalysisRoute.path),
              ),
              _ServiceAction(
                title: 'Rapor önizle',
                subtitle: 'PDF rapor akışı',
                icon: Icons.picture_as_pdf_rounded,
                onTap: () =>
                    context.push(ParcelReportRoute.path, extra: parcel),
              ),
              _ServiceAction(
                title: 'Emsal hesapla',
                subtitle: 'TAKS/KAKS girdileri',
                icon: Icons.calculate_rounded,
                onTap: () => context.push(EmsalRoute.path),
              ),
              _ServiceAction(
                title: 'Detay fişi',
                subtitle: 'Ada/parsel bilgileri',
                icon: Icons.fact_check_rounded,
                onTap: onDetail,
              ),
            ],
          ),
        ],
      );
}

class _ServiceAction extends StatelessWidget {
  const _ServiceAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: AppColors.emerald.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.emerald, size: 21),
          ),
          const Spacer(),
          Text(title,
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 3),
          Text(subtitle,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.slate)),
        ]),
      );
}

class _CivicMapPreview extends StatelessWidget {
  const _CivicMapPreview({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        padding: EdgeInsets.zero,
        clipChild: true,
        child: SizedBox(
          height: 190,
          child: Stack(children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2F3),
                  border: Border.all(color: AppColors.outlineLight),
                ),
                child: CustomPaint(painter: _ParcelPreviewPainter()),
              ),
            ),
            Positioned(
              left: 14,
              top: 14,
              child: StatusBadge(
                label: 'Harita önizlemesi',
                tone: BadgeTone.info,
                icon: Icons.map_rounded,
              ),
            ),
            Positioned(
              left: 18,
              bottom: 16,
              right: 18,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .92),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.outlineLight),
                ),
                child: Row(children: const [
                  Icon(Icons.touch_app_rounded, color: AppColors.emerald),
                  SizedBox(width: 8),
                  Expanded(child: Text('Parsele dokunarak detay fişini açın.')),
                  Icon(Icons.keyboard_arrow_up_rounded),
                ]),
              ),
            ),
          ]),
        ),
      );
}

class _ParcelPreviewPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final roadPaint = Paint()
      ..color = const Color(0xFFC9D8DE)
      ..strokeWidth = 22
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: .82)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final parcelPaint = Paint()
      ..color = AppColors.emerald.withValues(alpha: .20)
      ..style = PaintingStyle.fill;
    final parcelBorder = Paint()
      ..color = AppColors.emerald
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    canvas.drawLine(Offset(-20, size.height * .32),
        Offset(size.width + 20, size.height * .18), roadPaint);
    canvas.drawLine(Offset(size.width * .14, -10),
        Offset(size.width * .45, size.height + 20), roadPaint);
    for (var i = 0; i < 5; i++) {
      final y = size.height * (.34 + i * .13);
      canvas.drawLine(Offset(0, y), Offset(size.width, y - 26), linePaint);
    }
    for (var i = 0; i < 4; i++) {
      final x = size.width * (.20 + i * .18);
      canvas.drawLine(Offset(x, 0), Offset(x + 28, size.height), linePaint);
    }
    final selected = RRect.fromRectAndRadius(
      Rect.fromLTWH(size.width * .46, size.height * .34, size.width * .24,
          size.height * .28),
      const Radius.circular(12),
    );
    canvas.drawRRect(selected, parcelPaint);
    canvas.drawRRect(selected, parcelBorder);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
