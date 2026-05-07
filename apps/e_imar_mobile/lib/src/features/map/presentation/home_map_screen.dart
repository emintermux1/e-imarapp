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
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _SearchBar(onTap: () => context.push(SearchRoute.path)),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: [
                FloatingActionPill(label: 'Yakınımda Ara', icon: Icons.near_me_rounded, onTap: () {}),
                FloatingActionPill(label: 'Uydu', icon: Icons.satellite_alt_rounded, onTap: () => _onStyleSwitch(MapboxStylePreset.satellite)),
                FloatingActionPill(label: 'Arazi', icon: Icons.terrain_rounded, onTap: () => _onStyleSwitch(MapboxStylePreset.streets)),
                FloatingActionPill(label: '3D', icon: Icons.view_in_ar_rounded, onTap: () {}),
              ]),
              const Spacer(),
              SizedBox(
                height: 96,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  _QuickAction('Parsel Sorgula', Icons.grid_on_rounded, () => context.push(SearchRoute.path)),
                  _QuickAction('Emsal Hesapla', Icons.calculate_rounded, () => context.push(EmsalRoute.path)),
                  _QuickAction('Risk Analizi', Icons.shield_rounded, () => context.push(AnalysisRoute.path)),
                  _QuickAction('Fiyat Tahmini', Icons.payments_rounded, () {}),
                  _QuickAction('3D Görünüm', Icons.view_in_ar_rounded, () {}),
                ]),
              ),
              const SizedBox(height: 80),
            ]),
          ),
        ),
        Positioned(
          right: 16,
          bottom: 184,
          child: FloatingActionButton.small(heroTag: 'loc', onPressed: () {}, child: const Icon(Icons.my_location_rounded)),
        ),
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
                      border: Border.all(color: AppColors.danger.withOpacity(1.0 - value), width: 2.5),
                      color: AppColors.warning.withOpacity((1.0 - value) * 0.35),
                    ),
                    child: Center(
                      child: Container(
                        width: 14 + value * 12,
                        height: 14 + value * 12,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.danger.withOpacity(1.0 - value * 0.6),
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
              color: Colors.black.withOpacity(0.45),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '© Mapbox © OpenStreetMap',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
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

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          const Icon(Icons.search_rounded),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Ada, parsel, adres veya koordinat ara',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const Icon(Icons.mic_rounded),
        ]),
      );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction(this.label, this.icon, this.onTap);
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 138,
        child: Padding(
          padding: const EdgeInsets.only(right: 10),
          child: GlassCard(
            onTap: onTap,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(icon, color: AppColors.emerald),
              const Spacer(),
              Text(
                label,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
            ]),
          ),
        ),
      );
}