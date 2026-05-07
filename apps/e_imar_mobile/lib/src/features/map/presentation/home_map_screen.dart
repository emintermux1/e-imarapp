import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/services/gateway_api.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/repositories/offline_parcel_repository.dart';
import '../../auth/presentation/auth_screen.dart';
import '../domain/parcel.dart';
import 'widgets/parcel_detail_sheet.dart';

enum MapMode { standard, satellite }

class HomeMapScreen extends ConsumerStatefulWidget {
  const HomeMapScreen({this.openParcelOnStart = false, this.selectedParcel, super.key});
  final bool openParcelOnStart;
  final ParcelDetail? selectedParcel;

  @override
  ConsumerState<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends ConsumerState<HomeMapScreen> with SingleTickerProviderStateMixin {
  ParcelDetail? selectedParcel;
  ProviderUnavailableState? unavailable;
  List<ProviderDescriptor> providers = const [];
  bool loading = false;
  MapMode mapMode = MapMode.standard;
  int tab = 0;

  @override
  void initState() {
    super.initState();
    selectedParcel = widget.selectedParcel;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProviderStatus();
      if (widget.openParcelOnStart && selectedParcel != null) _openParcel(selectedParcel!);
      if (selectedParcel != null) ref.read(offlineParcelRepositoryProvider).saveParcel(selectedParcel!).catchError((_) {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider).valueOrNull;
    final config = ref.watch(appConfigProvider);
    return Scaffold(
      body: Stack(children: [
        Positioned.fill(
          child: _TurkeyMapCanvas(
            parcel: selectedParcel,
            mode: mapMode,
            loading: loading,
            onTap: selectedParcel == null ? null : () => _openParcel(selectedParcel!),
          ),
        ),
        Positioned(
          top: MediaQuery.paddingOf(context).top + 10,
          left: 14,
          right: 14,
          child: _TopSearchBar(
            userLabel: auth?.phone ?? auth?.displayName ?? 'Güvenli oturum',
            gatewayConfigured: config.hasGateway,
            onSearch: () => context.push(SearchRoute.path),
            onAccount: () => context.push(SettingsRoute.path),
          ),
        ),
        Positioned(
          top: MediaQuery.paddingOf(context).top + 86,
          right: 14,
          child: _MapModeToggle(
            mode: mapMode,
            onChanged: (mode) => setState(() => mapMode = mode),
          ),
        ),
        Positioned(
          left: 14,
          right: 14,
          bottom: 94,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: loading
                ? const _MapSkeletonPanel()
                : selectedParcel != null
                    ? _SelectedParcelCard(
                        parcel: selectedParcel!,
                        onOpen: () => _openParcel(selectedParcel!),
                        onShare: () => _shareParcel(selectedParcel!),
                      )
                    : _DiscoveryPanel(
                        unavailable: unavailable,
                        providers: providers,
                        onSearch: () => context.push(SearchRoute.path),
                        onLocate: _locateAndQuery,
                      ),
          ),
        ),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) {
          setState(() => tab = i);
          if (i == 0) return;
          if (i == 1) context.push(SearchRoute.path);
          if (i == 2) context.push(FavoritesRoute.path);
          if (i == 3) context.push(SettingsRoute.path);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_rounded), label: 'Harita'),
          NavigationDestination(icon: Icon(Icons.search_rounded), label: 'Sorgu'),
          NavigationDestination(icon: Icon(Icons.bookmark_rounded), label: 'Kayıtlı'),
          NavigationDestination(icon: Icon(Icons.account_circle_rounded), label: 'Hesap'),
        ],
      ),
    );
  }

  Future<void> _loadProviderStatus() async {
    final api = ref.read(gatewayApiProvider);
    if (!api.isConfigured) {
      setState(() {
        unavailable = const ProviderUnavailableState(
          title: 'Veri geçidi bekleniyor',
          message: 'E_IMAR_GATEWAY_BASE_URL tanımlanınca ülke geneli sağlayıcı durumları burada listelenir.',
          code: 'not_configured',
        );
      });
      return;
    }
    try {
      final loaded = await api.providers();
      if (mounted) setState(() => providers = loaded);
    } catch (error) {
      if (mounted) {
        setState(() => unavailable = ProviderUnavailableState(title: 'Sağlayıcı durumu alınamadı', message: '$error'));
      }
    }
  }

  Future<void> _locateAndQuery() async {
    setState(() => loading = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw const _LocationUnavailable('Konum izni verilmedi. Koordinat veya ada/parsel sorgusu ile devam edin.');
      }
      final position = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      final result = await ref.read(gatewayApiProvider).lookupByPoint(latitude: position.latitude, longitude: position.longitude);
      if (!mounted) return;
      setState(() {
        selectedParcel = result.parcel;
        unavailable = result.unavailable;
        providers = result.providers;
      });
      if (result.parcel != null) await ref.read(offlineParcelRepositoryProvider).saveParcel(result.parcel!);
    } on _LocationUnavailable catch (error) {
      if (mounted) setState(() => unavailable = ProviderUnavailableState(title: 'Konum kullanılamıyor', message: error.message));
    } catch (error) {
      if (mounted) setState(() => unavailable = ProviderUnavailableState(title: 'Konumdan keşif tamamlanamadı', message: '$error'));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _openParcel(ParcelDetail selected) {
    final controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 240), reverseDuration: const Duration(milliseconds: 140));
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      transitionAnimationController: controller,
      builder: (_) => ParcelDetailSheet(parcel: selected),
    ).whenComplete(controller.dispose);
  }

  void _shareParcel(ParcelDetail parcel) {
    final text = '${parcel.displayAddress} ${parcel.block}/${parcel.parcel}\nKaynak: ${parcel.sourceName}\nDurum: ${parcel.providerStatus}';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Parsel özeti panoya kopyalandı.')));
  }
}

class _LocationUnavailable implements Exception {
  const _LocationUnavailable(this.message);
  final String message;
}

class _TopSearchBar extends StatelessWidget {
  const _TopSearchBar({required this.userLabel, required this.gatewayConfigured, required this.onSearch, required this.onAccount});
  final String userLabel;
  final bool gatewayConfigured;
  final VoidCallback onSearch;
  final VoidCallback onAccount;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        borderRadius: AppRadius.xl,
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(gradient: AppGradients.civicRed, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.map_rounded, color: Colors.white),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: InkWell(
              onTap: onSearch,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Ada, parsel, tapu veya koordinat ara', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
                Text(gatewayConfigured ? 'Türkiye geneli sağlayıcı geçidi aktif' : 'Veri geçidi yapılandırması bekleniyor',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: gatewayConfigured ? AppColors.civicRed : AppColors.slate, fontWeight: FontWeight.w800)),
              ]),
            ),
          ),
          IconButton(onPressed: onAccount, icon: const Icon(Icons.account_circle_rounded), tooltip: userLabel),
        ]),
      );
}

class _MapModeToggle extends StatelessWidget {
  const _MapModeToggle({required this.mode, required this.onChanged});
  final MapMode mode;
  final ValueChanged<MapMode> onChanged;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(4),
        borderRadius: AppRadius.pill,
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          _ModeButton(icon: Icons.map_outlined, selected: mode == MapMode.standard, onTap: () => onChanged(MapMode.standard)),
          _ModeButton(icon: Icons.satellite_alt_rounded, selected: mode == MapMode.satellite, onTap: () => onChanged(MapMode.satellite)),
        ]),
      );
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({required this.icon, required this.selected, required this.onTap});
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: Container(
          width: 42,
          height: 38,
          decoration: BoxDecoration(color: selected ? AppColors.civicRed : null, borderRadius: BorderRadius.circular(AppRadius.pill)),
          child: Icon(icon, color: selected ? Colors.white : AppColors.slate, size: 20),
        ),
      );
}

class _DiscoveryPanel extends StatelessWidget {
  const _DiscoveryPanel({required this.unavailable, required this.providers, required this.onSearch, required this.onLocate});
  final ProviderUnavailableState? unavailable;
  final List<ProviderDescriptor> providers;
  final VoidCallback onSearch;
  final VoidCallback onLocate;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('discovery'),
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            const StatusBadge(label: 'Türkiye geneli', tone: BadgeTone.danger, icon: Icons.public_rounded),
            const SizedBox(width: 8),
            StatusBadge(label: '${providers.length} sağlayıcı', tone: BadgeTone.neutral),
          ]),
          const SizedBox(height: 12),
          Text(unavailable?.title ?? 'Parsel keşfine başlayın', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 5),
          Text(
            unavailable?.message ?? 'Ada/parsel, tapu odaklı girişler veya konumdan keşif gateway sağlayıcı sözleşmelerine göre çalışır. Kısıtlı TKGM verileri sadece sunucu tarafında çözülür.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.35),
          ),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: GradientButton(label: 'Parsel ara', icon: Icons.search_rounded, onPressed: onSearch)),
            const SizedBox(width: 10),
            OutlinedButton.icon(onPressed: onLocate, icon: const Icon(Icons.my_location_rounded), label: const Text('Konum')),
          ]),
          if (providers.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 6, runSpacing: 6, children: providers.take(4).map((p) => StatusBadge(label: '${p.displayName} • ${p.status}', tone: _toneForStatus(p.status))).toList()),
          ],
        ]),
      );
}

class _SelectedParcelCard extends StatelessWidget {
  const _SelectedParcelCard({required this.parcel, required this.onOpen, required this.onShare});
  final ParcelDetail parcel;
  final VoidCallback onOpen;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('selected-parcel'),
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(16),
        onTap: onOpen,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            StatusBadge(label: _sourceLabel(parcel), tone: parcel.official ? BadgeTone.success : BadgeTone.warning, icon: parcel.official ? Icons.verified_rounded : Icons.info_rounded),
            const SizedBox(width: 8),
            StatusBadge(label: parcel.providerStatus, tone: _toneForStatus(parcel.providerStatus)),
            const Spacer(),
            IconButton(onPressed: onShare, icon: const Icon(Icons.ios_share_rounded)),
          ]),
          const SizedBox(height: 10),
          Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900, height: 1.02)),
          const SizedBox(height: 4),
          Text('${parcel.displayAddress} • ${parcel.titleType}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate)),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _TinyMetric(label: 'Plan', value: parcel.zoningStatus)),
            const SizedBox(width: 8),
            Expanded(child: _TinyMetric(label: 'Kaynak', value: parcel.sourceName)),
          ]),
        ]),
      );
}

class _TinyMetric extends StatelessWidget {
  const _TinyMetric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(color: AppColors.civicRed.withValues(alpha: .08), borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w800)),
            Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900)),
          ]),
        ),
      );
}

class _MapSkeletonPanel extends StatelessWidget {
  const _MapSkeletonPanel();

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('skeleton'),
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) => Padding(
              padding: EdgeInsets.only(bottom: i == 2 ? 0 : 10),
              child: DecoratedBox(
                decoration: BoxDecoration(color: AppColors.slate.withValues(alpha: .14), borderRadius: BorderRadius.circular(12)),
                child: SizedBox(height: i == 0 ? 18 : 44, width: double.infinity),
              ),
            ))),
      );
}

class _TurkeyMapCanvas extends StatelessWidget {
  const _TurkeyMapCanvas({required this.parcel, required this.mode, required this.loading, this.onTap});
  final ParcelDetail? parcel;
  final MapMode mode;
  final bool loading;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: mode == MapMode.satellite ? AppGradients.heroMap : const LinearGradient(colors: [Color(0xFFF4EFEF), Color(0xFFE7EEF4)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: CustomPaint(
            painter: _MapPainter(parcel: parcel, satellite: mode == MapMode.satellite, loading: loading),
            child: const SizedBox.expand(),
          ),
        ),
      );
}

class _MapPainter extends CustomPainter {
  _MapPainter({required this.parcel, required this.satellite, required this.loading});
  final ParcelDetail? parcel;
  final bool satellite;
  final bool loading;

  @override
  void paint(Canvas canvas, Size size) {
    final road = Paint()..color = (satellite ? Colors.white : const Color(0xFFC9CDD4)).withValues(alpha: satellite ? .20 : .66)..strokeWidth = 18..strokeCap = StrokeCap.round;
    final thin = Paint()..color = (satellite ? Colors.white : Colors.white).withValues(alpha: satellite ? .12 : .72)..strokeWidth = 2;
    for (var i = 0; i < 7; i++) {
      final y = size.height * (.18 + i * .13);
      canvas.drawLine(Offset(-20, y), Offset(size.width + 20, y - 46), i.isEven ? road : thin);
    }
    for (var i = 0; i < 6; i++) {
      final x = size.width * (.08 + i * .18);
      canvas.drawLine(Offset(x, -20), Offset(x + 60, size.height + 20), i.isOdd ? road : thin);
    }
    final selectedPaint = Paint()..color = AppColors.civicRed.withValues(alpha: satellite ? .40 : .22)..style = PaintingStyle.fill;
    final border = Paint()..color = AppColors.civicRed..strokeWidth = 2.4..style = PaintingStyle.stroke;
    final geometry = parcel?.geometry;
    if (geometry != null && geometry.length >= 3) {
      final path = Path();
      for (var i = 0; i < geometry.length; i++) {
        final point = _project(geometry[i], geometry, size);
        if (i == 0) path.moveTo(point.dx, point.dy); else path.lineTo(point.dx, point.dy);
      }
      path.close();
      canvas.drawPath(path, selectedPaint);
      canvas.drawPath(path, border);
    } else if (parcel != null) {
      final rect = RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(size.width * .54, size.height * .48), width: 110, height: 86), const Radius.circular(16));
      canvas.drawRRect(rect, selectedPaint);
      canvas.drawRRect(rect, border);
    }
    if (loading) {
      canvas.drawColor(Colors.black.withValues(alpha: .06), BlendMode.srcOver);
    }
  }

  Offset _project(GeoPoint point, List<GeoPoint> geometry, Size size) {
    final minLat = geometry.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
    final maxLat = geometry.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
    final minLng = geometry.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);
    final maxLng = geometry.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);
    final x = (point.longitude - minLng) / ((maxLng - minLng).abs() < .00001 ? .00001 : maxLng - minLng);
    final y = (point.latitude - minLat) / ((maxLat - minLat).abs() < .00001 ? .00001 : maxLat - minLat);
    return Offset(size.width * (.38 + x * .28), size.height * (.38 + (1 - y) * .22));
  }

  @override
  bool shouldRepaint(covariant _MapPainter oldDelegate) => parcel != oldDelegate.parcel || satellite != oldDelegate.satellite || loading != oldDelegate.loading;
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
