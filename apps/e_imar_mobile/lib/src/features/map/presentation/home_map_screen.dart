import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../../app/router/app_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/services/mapbox_style_service.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/parcel.dart';
import 'widgets/map_controls_panel.dart';
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
  Offset? _tapScreenPosition;
  int _pulseGeneration = 0;
  final _controlsKey = GlobalKey<_MapControlsPanelState>();

  @override
  void initState() {
    super.initState();
    if (widget.openParcelOnStart) WidgetsBinding.instance.addPostFrameCallback((_) => _openParcel());
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final style = ref.watch(mapboxStyleProvider);
    return Scaffold(
      extendBody: true,
      body: Stack(children: [
        Positioned.fill(
          child: _MapSurface(
            config: config,
            onMockTap: _openParcel,
            onMapTap: _onMapTap,
            stylePreset: style,
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _CommandBar(
                onTap: () => context.push(SearchRoute.path),
                onTimeline: () => _controlsKey.currentState?.setMode(MapControlMode.timeline),
                onRisk: () => _controlsKey.currentState?.setMode(MapControlMode.riskLayers),
              ),
              const SizedBox(height: 10),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const _StatusRail(),
                const Spacer(),
                _LayerStack(
                  selected: style,
                  onMap: () => _onStyleSwitch(MapboxStylePreset.satellite),
                  onTerrain: () => _onStyleSwitch(MapboxStylePreset.streets),
                  onThreeD: () => _controlsKey.currentState?.setMode(MapControlMode.threeD),
                ),
              ]),
              const SizedBox(height: 10),
              _ControlsRow(key: _controlsKey),
              const Spacer(),
              _ParcelPreview(onTap: _openParcel),
              const SizedBox(height: 12),
              SizedBox(
                height: 104,
                child: ListView(scrollDirection: Axis.horizontal, clipBehavior: Clip.none, children: [
                  _QuickAction(label: 'Parsel Sorgula', subtitle: 'Ada, parsel, koordinat', icon: Icons.grid_on_rounded, onTap: () => context.push(SearchRoute.path)),
                  _QuickAction(label: 'Emsal Hesapla', subtitle: 'Proje potansiyeli', icon: Icons.calculate_rounded, onTap: () => context.push(EmsalRoute.path)),
                  _QuickAction(label: 'Risk Analizi', subtitle: 'Isı haritası mock', icon: Icons.shield_rounded, onTap: () => context.push(AnalysisRoute.path)),
                  _QuickAction(label: 'Fiyat Tahmini', subtitle: 'Fintech değerleme', icon: Icons.payments_rounded, onTap: () => context.push(AiValuationRoute.path)),
                  _QuickAction(label: '3D Görünüm', subtitle: 'Kütle simülasyonu', icon: Icons.view_in_ar_rounded, onTap: () => _controlsKey.currentState?.setMode(MapControlMode.threeD)),
                ]),
              ),
              const SizedBox(height: 80),
            ]),
          ),
        ),
        Positioned(right: 16, bottom: 214, child: _MapFab(icon: Icons.my_location_rounded, onTap: () {})),
        if (_tapScreenPosition != null)
          Positioned(
            left: _tapScreenPosition!.dx - 28,
            top: _tapScreenPosition!.dy - 28,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 1400),
              curve: Curves.easeOut,
              key: ValueKey('pulse_$_pulseGeneration'),
              builder: (context, value, child) {
                return IgnorePointer(
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.danger.withValues(alpha: 1.0 - value), width: 2.5),
                      color: AppColors.warning.withValues(alpha: (1.0 - value) * 0.35),
                    ),
                    child: Center(
                      child: Container(
                        width: 14 + value * 12,
                        height: 14 + value * 12,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.danger.withValues(alpha: 1.0 - value * 0.6),
                        ),
                      ),
                    ),
                  ),
                );
              },
              onEnd: () {
                if (mounted) setState(() => _tapScreenPosition = null);
              },
            ),
          ),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) {
          setState(() => tab = i);
          if (i == 1) context.push(AnalysisRoute.path);
          if (i == 2) context.push(FavoritesRoute.path);
          if (i == 3) context.push(SettingsRoute.path);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_rounded), label: 'Harita'),
          NavigationDestination(icon: Icon(Icons.analytics_rounded), label: 'Analiz'),
          NavigationDestination(icon: Icon(Icons.favorite_rounded), label: 'Favoriler'),
          NavigationDestination(icon: Icon(Icons.settings_rounded), label: 'Ayarlar'),
        ],
      ),
    );
  }

  void _onMapTap(mapbox.MapContentGestureContext context) {
    final lat = context.point.coordinates.lat;
    final lng = context.point.coordinates.lng;
    final parcel = ParcelHitTestHelper.hitTest(lat, lng);
    setState(() {
      _tapScreenPosition = Offset(context.touchPosition.x.toDouble(), context.touchPosition.y.toDouble());
      _pulseGeneration++;
    });
    _openParcelWithParcel(parcel);
  }

  void _onStyleSwitch(MapboxStylePreset preset) {
    ref.read(mapboxStyleProvider.notifier).state = preset;
    MapboxStyleService.current = preset;
  }

  void _openParcel() {
    _openParcelWithParcel(ParcelDetail.sample);
  }

  void _openParcelWithParcel(ParcelDetail parcel) {
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
      builder: (_) => ParcelDetailSheet(parcel: parcel),
    ).whenComplete(controller.dispose);
  }
}

class _ControlsRow extends StatefulWidget {
  const _ControlsRow({super.key});
  @override
  State<_ControlsRow> createState() => _MapControlsPanelState();
}

class _MapControlsPanelState extends State<_ControlsRow> {
  MapControlMode _mode = MapControlMode.timeline;

  void setMode(MapControlMode mode) => setState(() => _mode = mode);

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_mode) {
      case MapControlMode.timeline:
        return SizedBox(key: const ValueKey('timeline'), child: MapControlsPanel(parcel: ParcelDetail.sample));
      case MapControlMode.riskLayers:
        return SizedBox(key: const ValueKey('risk'), child: MapControlsPanel(parcel: ParcelDetail.sample, activeMode: MapControlMode.riskLayers));
      case MapControlMode.threeD:
        return SizedBox(key: const ValueKey('3d'), child: MapControlsPanel(parcel: ParcelDetail.sample, activeMode: MapControlMode.threeD));
    }
  }
}

class _MapSurface extends StatelessWidget {
  const _MapSurface({
    required this.config,
    required this.onMockTap,
    required this.onMapTap,
    required this.stylePreset,
  });
  final AppConfig config;
  final VoidCallback onMockTap;
  final void Function(mapbox.MapContentGestureContext) onMapTap;
  final MapboxStylePreset stylePreset;

  @override
  Widget build(BuildContext context) {
    if (!config.hasMapbox) {
      return GestureDetector(onTap: onMockTap, child: const MockMapCanvas());
    }
    mapbox.MapboxOptions.setAccessToken(config.mapboxAccessToken);
    return Stack(
      children: [
        RepaintBoundary(
          child: mapbox.MapWidget(
            key: ValueKey('mapbox_${stylePreset.name}'),
            styleUri: MapboxStyleService.styleUrl(stylePreset),
            onTapListener: onMapTap,
            onMapCreated: (map) => MapboxCameraHelper.attach(map),
          ),
        ),
        Positioned(
          left: 8,
          bottom: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '© Mapbox © OpenStreetMap',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 9,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CommandBar extends StatelessWidget {
  const _CommandBar({required this.onTap, required this.onTimeline, required this.onRisk});
  final VoidCallback onTap;
  final VoidCallback onTimeline;
  final VoidCallback onRisk;

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
          _RoundIcon(icon: Icons.timeline_rounded, onTap: onTimeline),
          const SizedBox(width: 8),
          _RoundIcon(icon: Icons.shield_rounded, onTap: onRisk),
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
      ]));
}

class _LayerStack extends StatelessWidget {
  const _LayerStack({required this.selected, required this.onMap, required this.onTerrain, required this.onThreeD});
  final MapboxStylePreset selected;
  final VoidCallback onMap;
  final VoidCallback onTerrain;
  final VoidCallback onThreeD;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(6),
        borderRadius: AppRadius.md,
        child: Column(children: [
          _LayerButton(icon: Icons.satellite_alt_rounded, label: 'Uydu', selected: selected == MapboxStylePreset.satellite, onTap: onMap),
          _LayerButton(icon: Icons.terrain_rounded, label: 'Arazi', selected: selected == MapboxStylePreset.streets, onTap: onTerrain),
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
        child: Container(width: 58, padding: const EdgeInsets.symmetric(vertical: 9), decoration: BoxDecoration(color: selected ? AppColors.emerald.withValues(alpha: .18) : Colors.transparent, borderRadius: BorderRadius.circular(16)), child: Column(children: [Icon(icon, size: 20, color: selected ? AppColors.emerald : null), const SizedBox(height: 3), Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800))])),
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
          Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: .14), borderRadius: BorderRadius.circular(18)), child: const Icon(Icons.layers_rounded, color: AppColors.emerald)),
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
  const _RoundIcon({required this.icon, this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(width: 36, height: 36, decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: .12), shape: BoxShape.circle), child: Icon(icon, size: 19, color: AppColors.emerald)),
      );
}

class _MapFab extends StatelessWidget {
  const _MapFab({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GlassCard(onTap: onTap, padding: const EdgeInsets.all(13), borderRadius: AppRadius.pill, variant: GlassVariant.elevated, child: Icon(icon, color: AppColors.emerald));
}
