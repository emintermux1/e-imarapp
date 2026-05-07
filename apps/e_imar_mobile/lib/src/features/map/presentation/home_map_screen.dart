import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../../app/router/app_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/parcel.dart';
import 'widgets/mock_map_canvas.dart';
import 'widgets/parcel_detail_sheet.dart';

class HomeMapScreen extends ConsumerStatefulWidget {
  const HomeMapScreen({this.openParcelOnStart = false, super.key});
  final bool openParcelOnStart;

  @override
  ConsumerState<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends ConsumerState<HomeMapScreen> with SingleTickerProviderStateMixin {
  int tab = 0;

  @override
  void initState() {
    super.initState();
    if (widget.openParcelOnStart) WidgetsBinding.instance.addPostFrameCallback((_) => _openParcel());
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    return Scaffold(
      extendBody: true,
      body: Stack(children: [
        Positioned.fill(child: _MapSurface(config: config, onTap: _openParcel)),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _CommandBar(onTap: () => context.push(SearchRoute.path)),
              const SizedBox(height: 10),
              const _StatusRail(),
              const SizedBox(height: 12),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Spacer(),
                _LayerStack(onMap: () {}, onTerrain: () {}, onThreeD: () {}),
              ]),
              const Spacer(),
              _ParcelPreview(onTap: _openParcel),
              const SizedBox(height: 12),
              SizedBox(
                height: 104,
                child: ListView(scrollDirection: Axis.horizontal, clipBehavior: Clip.none, children: [
                  _QuickAction(label: 'Parsel Sorgula', subtitle: 'Ada, parsel, koordinat', icon: Icons.grid_on_rounded, onTap: () => context.push(SearchRoute.path)),
                  _QuickAction(label: 'Emsal Hesapla', subtitle: 'Proje potansiyeli', icon: Icons.calculate_rounded, onTap: () => context.push(EmsalRoute.path)),
                  _QuickAction(label: 'Risk Analizi', subtitle: 'Isı haritası mock', icon: Icons.shield_rounded, onTap: () => context.push(AnalysisRoute.path)),
                  _QuickAction(label: 'Fiyat Tahmini', subtitle: 'Fintech değerleme', icon: Icons.payments_rounded, onTap: () {}),
                  _QuickAction(label: '3D Görünüm', subtitle: 'Kütle simülasyonu', icon: Icons.view_in_ar_rounded, onTap: () {}),
                ]),
              ),
              const SizedBox(height: 80),
            ]),
          ),
        ),
        Positioned(right: 16, bottom: 214, child: _MapFab(icon: Icons.my_location_rounded, onTap: () {})),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) { setState(() => tab = i); if (i == 1) context.push(AnalysisRoute.path); if (i == 2) context.push(FavoritesRoute.path); if (i == 3) context.push(SettingsRoute.path); },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_rounded), label: 'Harita'),
          NavigationDestination(icon: Icon(Icons.analytics_rounded), label: 'Analiz'),
          NavigationDestination(icon: Icon(Icons.favorite_rounded), label: 'Favoriler'),
          NavigationDestination(icon: Icon(Icons.settings_rounded), label: 'Ayarlar'),
        ],
      ),
    );
  }

  void _openParcel() {
    final controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 220), reverseDuration: const Duration(milliseconds: 130));
    showModalBottomSheet<void>(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, transitionAnimationController: controller, builder: (_) => const ParcelDetailSheet(parcel: ParcelDetail.sample)).whenComplete(controller.dispose);
  }
}

class _MapSurface extends StatelessWidget {
  const _MapSurface({required this.config, required this.onTap});
  final AppConfig config;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    if (!config.hasMapbox) return GestureDetector(onTap: onTap, child: const MockMapCanvas());
    mapbox.MapboxOptions.setAccessToken(config.mapboxAccessToken);
    return RepaintBoundary(child: mapbox.MapWidget(onTapListener: (_) => onTap()));
  }
}

class _CommandBar extends StatelessWidget {
  const _CommandBar({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        variant: GlassVariant.elevated,
        borderRadius: AppRadius.xl,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        child: Row(children: [
          Container(width: 42, height: 42, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(15)), child: const Center(child: Text('E', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('E-İmar', style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900)), Text('Ada, parsel, adres veya koordinat ara', maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate))])),
          const _RoundIcon(icon: Icons.mic_rounded),
          const SizedBox(width: 8),
          const _RoundIcon(icon: Icons.qr_code_scanner_rounded),
        ]),
      );
}

class _StatusRail extends StatelessWidget {
  const _StatusRail();
  @override
  Widget build(BuildContext context) => SingleChildScrollView(scrollDirection: Axis.horizontal, clipBehavior: Clip.none, child: Row(children: const [
        StatusBadge(label: 'Canlı imar', tone: BadgeTone.success, icon: Icons.bolt_rounded),
        SizedBox(width: 8),
        StatusBadge(label: 'TKGM mock', tone: BadgeTone.info, icon: Icons.hub_rounded),
        SizedBox(width: 8),
        StatusBadge(label: '120Hz hazır', tone: BadgeTone.neutral, icon: Icons.speed_rounded),
        SizedBox(width: 8),
        StatusBadge(label: '24° açık', tone: BadgeTone.warning, icon: Icons.wb_sunny_rounded),
      ]));
}

class _LayerStack extends StatelessWidget {
  const _LayerStack({required this.onMap, required this.onTerrain, required this.onThreeD});
  final VoidCallback onMap;
  final VoidCallback onTerrain;
  final VoidCallback onThreeD;
  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(6),
        borderRadius: AppRadius.md,
        child: Column(children: [
          _LayerButton(icon: Icons.satellite_alt_rounded, label: 'Uydu', selected: true, onTap: onMap),
          _LayerButton(icon: Icons.terrain_rounded, label: 'Arazi', selected: false, onTap: onTerrain),
          _LayerButton(icon: Icons.view_in_ar_rounded, label: '3D', selected: false, onTap: onThreeD),
        ]),
      );
}

class _LayerButton extends StatelessWidget {
  const _LayerButton({required this.icon, required this.label, required this.selected, required this.onTap});
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(width: 58, padding: const EdgeInsets.symmetric(vertical: 9), decoration: BoxDecoration(color: selected ? AppColors.emerald.withOpacity(.18) : Colors.transparent, borderRadius: BorderRadius.circular(16)), child: Column(children: [Icon(icon, size: 20, color: selected ? AppColors.emerald : null), const SizedBox(height: 3), Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800))])),
      );
}

class _ParcelPreview extends StatelessWidget {
  const _ParcelPreview({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.emerald.withOpacity(.14), borderRadius: BorderRadius.circular(18)), child: const Icon(Icons.layers_rounded, color: AppColors.emerald)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Seçili parsel önizlemesi', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)), const SizedBox(height: 3), Text('Fenerbahçe 1247/18 • detay için haritaya dokun', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate))])),
          const Icon(Icons.keyboard_arrow_up_rounded),
        ]),
      );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.label, required this.subtitle, required this.icon, required this.onTap});
  final String label;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(
        width: 170,
        child: Padding(
          padding: const EdgeInsets.only(right: 10),
          child: GlassCard(
            onTap: onTap,
            variant: GlassVariant.elevated,
            padding: const EdgeInsets.all(13),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: 42, height: 42, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(16)), child: Icon(icon, color: Colors.white, size: 22)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, maxLines: 2, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900, height: 1.05)), const SizedBox(height: 5), Text(subtitle, maxLines: 2, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.2))])),
            ]),
          ),
        ),
      );
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({required this.icon});
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(width: 36, height: 36, decoration: BoxDecoration(color: AppColors.emerald.withOpacity(.12), shape: BoxShape.circle), child: Icon(icon, size: 19, color: AppColors.emerald));
}

class _MapFab extends StatelessWidget {
  const _MapFab({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GlassCard(onTap: onTap, padding: const EdgeInsets.all(13), borderRadius: AppRadius.pill, variant: GlassVariant.elevated, child: Icon(icon, color: AppColors.emerald));
}
