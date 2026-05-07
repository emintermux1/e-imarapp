import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/services/gateway_api.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/repositories/offline_parcel_repository.dart';
import '../../map/domain/parcel.dart';

enum SearchMode { admin, titleDeed, coordinate }

class ParcelSearchScreen extends ConsumerStatefulWidget {
  const ParcelSearchScreen({super.key});

  @override
  ConsumerState<ParcelSearchScreen> createState() => _ParcelSearchScreenState();
}

class _ParcelSearchScreenState extends ConsumerState<ParcelSearchScreen> {
  SearchMode mode = SearchMode.admin;
  bool loading = false;
  ProviderUnavailableState? unavailable;
  List<ProviderDescriptor> providers = const [];
  List<ParcelDetail> recent = const [];

  final city = TextEditingController(text: 'İstanbul');
  final district = TextEditingController();
  final neighborhood = TextEditingController();
  final block = TextEditingController();
  final parcel = TextEditingController();
  final deedCity = TextEditingController(text: 'İstanbul');
  final deedQuery = TextEditingController();
  final lat = TextEditingController();
  final lng = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadInitial());
  }

  @override
  void dispose() {
    city.dispose();
    district.dispose();
    neighborhood.dispose();
    block.dispose();
    parcel.dispose();
    deedCity.dispose();
    deedQuery.dispose();
    lat.dispose();
    lng.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gatewayConfigured = ref.watch(gatewayApiProvider).isConfigured;
    return Scaffold(
      appBar: AppBar(title: const Text('Parsel keşfi')),
      body: RefreshIndicator(
        onRefresh: _loadInitial,
        child: ListView(padding: const EdgeInsets.fromLTRB(18, 8, 18, 28), children: [
          PremiumHeader(
            title: 'Türkiye geneli kaynak odaklı sorgu',
            subtitle: gatewayConfigured
                ? 'Sorgular veri geçidi üzerinden sağlayıcı sözleşmesine göre çalışır. TKGM ve kısıtlı kaynaklar istemciden doğrudan çağrılmaz.'
                : 'Veri geçidi yapılandırılmadığı için canlı parsel sonucu üretilmez.',
            icon: Icons.travel_explore_rounded,
            badge: gatewayConfigured ? 'Gateway hazır' : 'Gateway gerekli',
          ),
          const SizedBox(height: 14),
          if (providers.isNotEmpty) _ProviderStrip(providers: providers),
          if (providers.isNotEmpty) const SizedBox(height: 14),
          AppSegmentedControl<SearchMode>(
            values: SearchMode.values,
            selected: mode,
            labelBuilder: (value) => switch (value) {
              SearchMode.admin => 'Ada/Parsel',
              SearchMode.titleDeed => 'Tapu',
              SearchMode.coordinate => 'Koordinat',
            },
            onChanged: (value) => setState(() {
              mode = value;
              unavailable = null;
            }),
          ),
          const SizedBox(height: 14),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: switch (mode) {
              SearchMode.admin => _AdminForm(city: city, district: district, neighborhood: neighborhood, block: block, parcel: parcel),
              SearchMode.titleDeed => _TitleDeedForm(city: deedCity, query: deedQuery),
              SearchMode.coordinate => _CoordinateForm(lat: lat, lng: lng),
            },
          ),
          if (unavailable != null) ...[
            const SizedBox(height: 12),
            _UnavailableBanner(state: unavailable!),
          ],
          const SizedBox(height: 14),
          GradientButton(label: loading ? 'Kaynaklar sorgulanıyor' : 'Gateway üzerinden sorgula', icon: Icons.route_rounded, onPressed: loading ? null : _submit),
          if (recent.isNotEmpty) ...[
            const SizedBox(height: 22),
            Text('Son görüntülenenler', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 10),
            ...recent.map((parcel) => _RecentParcelTile(parcel: parcel, onTap: () => _open(parcel))),
          ],
        ]),
      ),
    );
  }

  Future<void> _loadInitial() async {
    final api = ref.read(gatewayApiProvider);
    final cached = await ref.read(offlineParcelRepositoryProvider).getRecent(8);
    if (mounted) setState(() => recent = cached);
    if (!api.isConfigured) return;
    try {
      final loaded = await api.providers();
      if (mounted) setState(() => providers = loaded);
    } catch (_) {}
  }

  Future<void> _submit() async {
    setState(() {
      loading = true;
      unavailable = null;
    });
    try {
      final api = ref.read(gatewayApiProvider);
      final ParcelLookupResult result;
      if (mode == SearchMode.admin) {
        _require(city.text, 'İl');
        _require(district.text, 'İlçe');
        _require(neighborhood.text, 'Mahalle');
        _require(block.text, 'Ada');
        _require(parcel.text, 'Parsel');
        result = await api.lookupByAdmin(
          city: city.text.trim(),
          district: district.text.trim(),
          neighborhood: neighborhood.text.trim(),
          block: block.text.trim(),
          parcel: parcel.text.trim(),
        );
      } else if (mode == SearchMode.coordinate) {
        final latitude = double.tryParse(lat.text.replaceAll(',', '.'));
        final longitude = double.tryParse(lng.text.replaceAll(',', '.'));
        if (latitude == null || longitude == null) throw const _SearchValidation('Enlem ve boylam sayısal olmalıdır.');
        if (latitude < 35.8 || latitude > 42.2 || longitude < 25.5 || longitude > 45.0) {
          throw const _SearchValidation('Koordinat Türkiye sınırları içinde olmalıdır.');
        }
        result = await api.lookupByPoint(latitude: latitude, longitude: longitude, city: city.text.trim().isEmpty ? null : city.text.trim());
      } else {
        _require(deedCity.text, 'İl');
        _require(deedQuery.text, 'Tapu sorgu girdisi');
        result = ParcelLookupResult.unavailable(
          title: 'Tapu odaklı arama beklemede',
          message: 'Tapu/bağımsız bölüm girdileri için gateway sözleşmesi hazır olduğunda bu form aynı provider-driven sonuç modelini kullanacak. İstemci TKGM çağrısı yapmaz ve sonuç uydurmaz.',
          code: 'unsupported_operation',
          providers: providers,
        );
      }
      if (!mounted) return;
      setState(() {
        providers = result.providers.isEmpty ? providers : result.providers;
        unavailable = result.unavailable;
      });
      if (result.parcel != null) await _open(result.parcel!);
    } on _SearchValidation catch (error) {
      if (mounted) setState(() => unavailable = ProviderUnavailableState(title: 'Eksik veya hatalı giriş', message: error.message, code: 'bad_request'));
    } catch (error) {
      if (mounted) setState(() => unavailable = ProviderUnavailableState(title: 'Sorgu tamamlanamadı', message: '$error'));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _require(String value, String label) {
    if (value.trim().isEmpty) throw _SearchValidation('$label alanı zorunludur.');
  }

  Future<void> _open(ParcelDetail selected) async {
    await ref.read(offlineParcelRepositoryProvider).saveParcel(selected);
    if (!mounted) return;
    context.push(ParcelDetailRoute.path, extra: selected);
  }
}

class _SearchValidation implements Exception {
  const _SearchValidation(this.message);
  final String message;
}

class _ProviderStrip extends StatelessWidget {
  const _ProviderStrip({required this.providers});
  final List<ProviderDescriptor> providers;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Sağlayıcı durumu', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: providers.map((p) => StatusBadge(label: '${p.displayName} • ${p.status}', tone: _toneForStatus(p.status))).toList()),
        ]),
      );
}

class _AdminForm extends StatelessWidget {
  const _AdminForm({required this.city, required this.district, required this.neighborhood, required this.block, required this.parcel});
  final TextEditingController city, district, neighborhood, block, parcel;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('admin'),
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _Input(controller: city, label: 'İl', icon: Icons.location_city_rounded, textCapitalization: TextCapitalization.words),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _Input(controller: district, label: 'İlçe', icon: Icons.apartment_rounded, textCapitalization: TextCapitalization.words)),
            const SizedBox(width: 10),
            Expanded(child: _Input(controller: neighborhood, label: 'Mahalle', icon: Icons.holiday_village_rounded, textCapitalization: TextCapitalization.words)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _Input(controller: block, label: 'Ada', icon: Icons.grid_view_rounded, keyboardType: TextInputType.number)),
            const SizedBox(width: 10),
            Expanded(child: _Input(controller: parcel, label: 'Parsel', icon: Icons.crop_square_rounded, keyboardType: TextInputType.number)),
          ]),
        ]),
      );
}

class _TitleDeedForm extends StatelessWidget {
  const _TitleDeedForm({required this.city, required this.query});
  final TextEditingController city, query;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('deed'),
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _Input(controller: city, label: 'İl', icon: Icons.location_city_rounded, textCapitalization: TextCapitalization.words),
          const SizedBox(height: 10),
          _Input(controller: query, label: 'Tapu odaklı sorgu girdisi', icon: Icons.fact_check_rounded, hint: 'Yevmiye, cilt/sayfa veya yetkili gateway girdisi'),
          const SizedBox(height: 10),
          const InsightCard(
            title: 'Kısıtlı veri ilkesi',
            message: 'Tapu/TKGM kaynakları yalnızca yetkili sunucu adaptörüyle çözümlenir. Mobil istemci doğrudan TKGM çağrısı yapmaz.',
            icon: Icons.gpp_good_rounded,
            color: AppColors.civicRed,
          ),
        ]),
      );
}

class _CoordinateForm extends StatelessWidget {
  const _CoordinateForm({required this.lat, required this.lng});
  final TextEditingController lat, lng;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('coordinate'),
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(child: _Input(controller: lat, label: 'Enlem', icon: Icons.north_rounded, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true))),
          const SizedBox(width: 10),
          Expanded(child: _Input(controller: lng, label: 'Boylam', icon: Icons.east_rounded, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true))),
        ]),
      );
}

class _Input extends StatelessWidget {
  const _Input({required this.controller, required this.label, required this.icon, this.hint, this.keyboardType, this.textCapitalization = TextCapitalization.none});
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final String? hint;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        keyboardType: keyboardType,
        textCapitalization: textCapitalization,
        inputFormatters: keyboardType == TextInputType.number ? [FilteringTextInputFormatter.digitsOnly] : null,
        decoration: InputDecoration(labelText: label, hintText: hint, prefixIcon: Icon(icon)),
      );
}

class _UnavailableBanner extends StatelessWidget {
  const _UnavailableBanner({required this.state});
  final ProviderUnavailableState state;

  @override
  Widget build(BuildContext context) => InsightCard(
        title: state.title,
        message: [state.message, if (state.providerId != null) 'Sağlayıcı: ${state.providerId}', if (state.code != null) 'Kod: ${state.code}'].join('\n'),
        icon: Icons.info_outline_rounded,
        color: state.code == 'bad_request' ? AppColors.warning : AppColors.civicRed,
      );
}

class _RecentParcelTile extends StatelessWidget {
  const _RecentParcelTile({required this.parcel, required this.onTap});
  final ParcelDetail parcel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: GlassCard(
          onTap: onTap,
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.civicRed.withValues(alpha: .12), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.bookmark_rounded, color: AppColors.civicRed)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
              Text('${parcel.displayAddress} • ${parcel.sourceName}', maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
            ])),
            const Icon(Icons.chevron_right_rounded),
          ]),
        ),
      );
}

BadgeTone _toneForStatus(String status) => switch (status) {
      'live' => BadgeTone.success,
      'metadata_only' => BadgeTone.info,
      'permission_required' => BadgeTone.warning,
      'not_configured' => BadgeTone.warning,
      'disabled' => BadgeTone.neutral,
      _ => BadgeTone.neutral,
    };
