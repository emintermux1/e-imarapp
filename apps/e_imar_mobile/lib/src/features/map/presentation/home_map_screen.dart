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
        SafeArea(child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SearchBar(onTap: () => context.push(SearchRoute.path)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            FloatingActionPill(label: 'Yakınımda Ara', icon: Icons.near_me_rounded, onTap: () {}),
            FloatingActionPill(label: 'Uydu', icon: Icons.satellite_alt_rounded, onTap: () {}),
            FloatingActionPill(label: 'Arazi', icon: Icons.terrain_rounded, onTap: () {}),
            FloatingActionPill(label: '3D', icon: Icons.view_in_ar_rounded, onTap: () {}),
          ]),
          const Spacer(),
          SizedBox(height: 96, child: ListView(scrollDirection: Axis.horizontal, children: [
            _QuickAction('Parsel Sorgula', Icons.grid_on_rounded, () => context.push(SearchRoute.path)),
            _QuickAction('Emsal Hesapla', Icons.calculate_rounded, () => context.push(EmsalRoute.path)),
            _QuickAction('Risk Analizi', Icons.shield_rounded, () => context.push(AnalysisRoute.path)),
            _QuickAction('Fiyat Tahmini', Icons.payments_rounded, () {}),
            _QuickAction('3D Görünüm', Icons.view_in_ar_rounded, () {}),
          ])),
          const SizedBox(height: 80),
        ]))),
        Positioned(right: 16, bottom: 184, child: FloatingActionButton.small(heroTag: 'loc', onPressed: () {}, child: const Icon(Icons.my_location_rounded))),
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

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GlassCard(onTap: onTap, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12), child: Row(children: [const Icon(Icons.search_rounded), const SizedBox(width: 10), Expanded(child: Text('Ada, parsel, adres veya koordinat ara', style: Theme.of(context).textTheme.titleMedium)), const Icon(Icons.mic_rounded)]));
}

class _QuickAction extends StatelessWidget {
  const _QuickAction(this.label, this.icon, this.onTap);
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(width: 138, child: Padding(padding: const EdgeInsets.only(right: 10), child: GlassCard(onTap: onTap, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: AppColors.emerald), const Spacer(), Text(label, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800))]))));
}
