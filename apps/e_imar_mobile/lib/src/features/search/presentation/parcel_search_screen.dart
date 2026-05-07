import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/services/firebase_repositories.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../map/domain/parcel.dart';

enum SearchMode { parcel, coordinate }

class ParcelSearchScreen extends ConsumerStatefulWidget {
  const ParcelSearchScreen({super.key});

  @override
  ConsumerState<ParcelSearchScreen> createState() => _ParcelSearchScreenState();
}

class _ParcelSearchScreenState extends ConsumerState<ParcelSearchScreen> {
  SearchMode mode = SearchMode.parcel;
  final block = TextEditingController(text: '1247');
  final parcel = TextEditingController(text: '18');
  final lat = TextEditingController(text: '40.9758');
  final lng = TextEditingController(text: '29.0436');
  String? validation;
  bool validationIsError = false;

  @override
  void dispose() {
    block.dispose();
    parcel.dispose();
    lat.dispose();
    lng.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isParcel = mode == SearchMode.parcel;
    return Scaffold(
      appBar: AppBar(title: const Text('Parsel Sorgula')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        PremiumHeader(
          title: 'Ada / parsel ile sorgu',
          subtitle:
              'Önizleme verisi çevrimdışı örnek kayıttır. Ada/parsel seçin, imar durumu ve risk özetini açın.',
          icon: Icons.account_balance_rounded,
          badge: 'Önizleme verisi',
        ),
        const SizedBox(height: 16),
        Text('Hızlı örnek parseller',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 10),
        for (final item in _PreviewParcel.presets)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _ParcelResultTile(
              item: item,
              onTap: () => _openParcel(item.parcel),
            ),
          ),
        const SizedBox(height: 12),
        AppSegmentedControl(
          values: SearchMode.values,
          selected: mode,
          labelBuilder: (m) =>
              m == SearchMode.parcel ? 'Ada / Parsel' : 'Koordinat',
          onChanged: (value) => setState(() {
            mode = value;
            validation = null;
            validationIsError = false;
          }),
        ),
        const SizedBox(height: 16),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 160),
          child: isParcel
              ? _ParcelForm(block: block, parcel: parcel)
              : _CoordinateForm(lat: lat, lng: lng),
        ),
        if (validation != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: _ValidationBanner(
              message: validation!,
              isError: validationIsError,
            ),
          ),
        const SizedBox(height: 16),
        GradientButton(
          label:
              isParcel ? 'Parsel detayını aç' : 'Koordinattan örnek parseli aç',
          icon: Icons.search_rounded,
          onPressed: _validateAndOpen,
        ),
      ]),
    );
  }

  void _validateAndOpen() {
    ParcelDetail selected = ParcelDetail.sample;
    var isError = false;
    var message = 'Parsel bulundu. Detay ekranı açılıyor.';

    if (mode == SearchMode.parcel) {
      final blockText = block.text.trim();
      final parcelText = parcel.text.trim();
      if (blockText.isEmpty || parcelText.isEmpty) {
        isError = true;
        message = 'Ada ve parsel numarası zorunludur.';
      } else {
        selected = _matchParcel(blockText, parcelText);
      }
    } else {
      final la = double.tryParse(lat.text.replaceAll(',', '.'));
      final lo = double.tryParse(lng.text.replaceAll(',', '.'));
      final invalid = la == null ||
          lo == null ||
          la < 35.8 ||
          la > 42.2 ||
          lo < 25.5 ||
          lo > 45.0;
      if (invalid) {
        isError = true;
        message = 'Koordinatlar Türkiye sınırları içinde olmalıdır.';
      } else {
        message = 'Koordinat doğrulandı. Yakın örnek parsel açılıyor.';
      }
    }

    setState(() {
      validation = message;
      validationIsError = isError;
    });
    if (isError) return;
    _saveQuery(selected);
    _openParcel(selected);
  }

  ParcelDetail _matchParcel(String blockText, String parcelText) {
    return _PreviewParcel.presets.map((item) => item.parcel).firstWhere(
          (item) => item.block == blockText && item.parcel == parcelText,
          orElse: () => ParcelDetail(
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Fenerbahçe',
            block: blockText,
            parcel: parcelText,
            titleType: 'Arsa',
            zoningStatus: 'Konut Alanı',
            taks: .35,
            kaks: 1.75,
            emsal: 1.75,
            floorLimit: 8,
            coverageRatio: '%35',
            roadFrontage: 24,
            yearApproved: 2024,
            constructionArea: 2100,
            unitCount: 20,
          ),
        );
  }

  void _openParcel(ParcelDetail selected) {
    context.push(ParcelDetailRoute.path, extra: selected);
  }

  void _saveQuery(ParcelDetail selected) {
    final query =
        '${selected.city} / ${selected.district} / ${selected.neighborhood} ${selected.block}/${selected.parcel}';
    final repo = ref.read(savedSearchRepositoryProvider);
    repo.saveSearch(query).catchError((_) {});
  }
}

class _PreviewParcel {
  const _PreviewParcel({required this.parcel, required this.note});
  final ParcelDetail parcel;
  final String note;

  static const presets = [
    _PreviewParcel(
      parcel: ParcelDetail.sample,
      note: 'Konut + ticaret • TAKS 0.35 • KAKS 1.75',
    ),
    _PreviewParcel(
      parcel: ParcelDetail(
        city: 'Ankara',
        district: 'Çankaya',
        neighborhood: 'Alacaatlı',
        block: '8912',
        parcel: '4',
        titleType: 'Arsa',
        zoningStatus: 'Konut Alanı',
        taks: .30,
        kaks: 1.20,
        emsal: 1.20,
        floorLimit: 6,
        coverageRatio: '%30',
        roadFrontage: 32.5,
        yearApproved: 2023,
        constructionArea: 1840,
        unitCount: 18,
      ),
      note: 'Konut alanı • plan yılı 2023 • 6 kat',
    ),
    _PreviewParcel(
      parcel: ParcelDetail(
        city: 'İzmir',
        district: 'Urla',
        neighborhood: 'Kuşçular',
        block: '312',
        parcel: '9',
        titleType: 'Tarla',
        zoningStatus: 'Gelişme Alanı',
        taks: .20,
        kaks: .50,
        emsal: .50,
        floorLimit: 2,
        coverageRatio: '%20',
        roadFrontage: 18.2,
        yearApproved: 2022,
        constructionArea: 620,
        unitCount: 4,
      ),
      note: 'Gelişme alanı • düşük yoğunluk • 2 kat',
    ),
  ];
}

class _ParcelResultTile extends StatelessWidget {
  const _ParcelResultTile({required this.item, required this.onTap});
  final _PreviewParcel item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.emerald.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(14),
            ),
            child:
                const Icon(Icons.grid_view_rounded, color: AppColors.emerald),
          ),
          const SizedBox(width: 12),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                '${item.parcel.city} / ${item.parcel.district} / ${item.parcel.neighborhood}',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 3),
              Text(
                '${item.parcel.block}/${item.parcel.parcel} • ${item.note}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.slate),
              ),
            ]),
          ),
          const Icon(Icons.chevron_right_rounded),
        ]),
      );
}

class _ParcelForm extends StatelessWidget {
  const _ParcelForm({required this.block, required this.parcel});
  final TextEditingController block;
  final TextEditingController parcel;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('parcel'),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Parsel bilgileri',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          const _Selector(
              label: 'İl',
              value: 'İstanbul',
              icon: Icons.location_city_rounded),
          const SizedBox(height: 10),
          const _Selector(
              label: 'İlçe', value: 'Kadıköy', icon: Icons.apartment_rounded),
          const SizedBox(height: 10),
          const _Selector(
              label: 'Mahalle', value: 'Fenerbahçe', icon: Icons.map_rounded),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: TextField(
                controller: block,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Ada',
                  helperText: 'Örn. 1247',
                  prefixIcon: Icon(Icons.grid_view_rounded),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: parcel,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Parsel',
                  helperText: 'Örn. 18',
                  prefixIcon: Icon(Icons.crop_square_rounded),
                ),
              ),
            ),
          ]),
        ]),
      );
}

class _CoordinateForm extends StatelessWidget {
  const _CoordinateForm({required this.lat, required this.lng});
  final TextEditingController lat;
  final TextEditingController lng;

  @override
  Widget build(BuildContext context) => GlassCard(
        key: const ValueKey('coordinate'),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Koordinat girişi',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: TextField(
                controller: lat,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Enlem',
                  prefixIcon: Icon(Icons.north_rounded),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: lng,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Boylam',
                  prefixIcon: Icon(Icons.east_rounded),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 10),
          const InsightCard(
            title: 'Önizleme sınırı',
            message:
                'Koordinat akışı doğrulama yapar ve en yakın örnek parsele götürür.',
            icon: Icons.rule_rounded,
            color: AppColors.info,
          ),
        ]),
      );
}

class _ValidationBanner extends StatelessWidget {
  const _ValidationBanner({required this.message, required this.isError});
  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Icon(isError ? Icons.error_rounded : Icons.check_circle_rounded,
              color: isError ? AppColors.danger : AppColors.emerald),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ),
        ]),
      );
}

class _Selector extends StatelessWidget {
  const _Selector(
      {required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => TextFormField(
        initialValue: value,
        readOnly: true,
        decoration: InputDecoration(
          labelText: label,
          helperText: 'Önizleme sabit seçimi',
          prefixIcon: Icon(icon),
        ),
      );
}
