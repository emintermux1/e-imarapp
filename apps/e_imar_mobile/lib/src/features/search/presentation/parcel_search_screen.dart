import 'package:flutter/material.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';

enum SearchMode { parcel, coordinate }

class ParcelSearchScreen extends StatefulWidget {
  const ParcelSearchScreen({super.key});

  @override
  State<ParcelSearchScreen> createState() => _ParcelSearchScreenState();
}

class _ParcelSearchScreenState extends State<ParcelSearchScreen> {
  SearchMode mode = SearchMode.parcel;
  final block = TextEditingController();
  final parcel = TextEditingController();
  final lat = TextEditingController();
  final lng = TextEditingController();
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
      body: DecoratedBox(
        decoration: BoxDecoration(gradient: Theme.of(context).brightness == Brightness.dark ? null : AppGradients.sandSurface),
        child: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
          PremiumHeader(title: isParcel ? 'Bölgesel Akıllı Arama' : 'GPS ile Parsel Bul', subtitle: isParcel ? 'İl, ilçe, mahalle ve ada/parsel ile mock sorgu deneyimi.' : 'Türkiye sınırları içinde koordinat doğrulaması ve parsel önizlemesi.', icon: isParcel ? Icons.travel_explore_rounded : Icons.gps_fixed_rounded, badge: isParcel ? 'Ada / Parsel' : 'Koordinat'),
          const SizedBox(height: 16),
          AppSegmentedControl(values: SearchMode.values, selected: mode, labelBuilder: (m) => m == SearchMode.parcel ? 'Ada / Parsel' : 'Koordinat', onChanged: (value) => setState(() { mode = value; validation = null; validationIsError = false; })),
          const SizedBox(height: 16),
          AnimatedSwitcher(duration: const Duration(milliseconds: 160), child: isParcel ? _ParcelForm(block: block, parcel: parcel) : _CoordinateForm(lat: lat, lng: lng)),
          if (validation != null) Padding(padding: const EdgeInsets.only(top: 12), child: _ValidationBanner(message: validation!, isError: validationIsError)),
          const SizedBox(height: 16),
          GradientButton(label: isParcel ? 'Parseli Sorgula' : 'Koordinatı Doğrula', icon: Icons.search_rounded, onPressed: _validate),
          const SizedBox(height: 28),
          Row(children: [Text('Son aramalar', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)), const Spacer(), const StatusBadge(label: 'Mock', tone: BadgeTone.neutral)]),
          const SizedBox(height: 10),
          for (final item in const [('İstanbul / Kadıköy / Fenerbahçe', '1247/18 • yatırım skoru 86'), ('Ankara / Çankaya / Alacaatlı', '8912/4 • konut gelişim alanı'), ('İzmir / Urla / Kuşçular', 'Koordinat • sahil etkisi')]) Padding(padding: const EdgeInsets.only(bottom: 10), child: GlassCard(onTap: () {}, padding: const EdgeInsets.all(13), child: Row(children: [Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.emerald.withOpacity(.12), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.history_rounded, color: AppColors.emerald)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(item.$1, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)), const SizedBox(height: 3), Text(item.$2, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate))])), const Icon(Icons.chevron_right_rounded)]))),
        ]),
      ),
    );
  }

  void _validate() {
    setState(() {
      if (mode == SearchMode.parcel && (block.text.trim().isEmpty || parcel.text.trim().isEmpty)) {
        validation = 'Ada ve parsel numarası zorunludur.';
        validationIsError = true;
      } else if (mode == SearchMode.coordinate) {
        final la = double.tryParse(lat.text.replaceAll(',', '.'));
        final lo = double.tryParse(lng.text.replaceAll(',', '.'));
        final invalid = la == null || lo == null || la < 35.8 || la > 42.2 || lo < 25.5 || lo > 45.0;
        validation = invalid ? 'Koordinatlar Türkiye sınırları içinde olmalıdır.' : 'Koordinat doğrulandı. Mock parsel sonucu hazır.';
        validationIsError = invalid;
      } else {
        validation = 'Mock parsel sonucu hazır.';
        validationIsError = false;
      }
    });
  }
}

class _ParcelForm extends StatelessWidget {
  const _ParcelForm({required this.block, required this.parcel});
  final TextEditingController block;
  final TextEditingController parcel;
  @override
  Widget build(BuildContext context) => GlassCard(key: const ValueKey('parcel'), padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Bölge bilgileri', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        const _Selector(label: 'İl', value: 'İstanbul', icon: Icons.location_city_rounded),
        const SizedBox(height: 10),
        const _Selector(label: 'İlçe', value: 'Kadıköy', icon: Icons.apartment_rounded),
        const SizedBox(height: 10),
        const _Selector(label: 'Mahalle', value: 'Fenerbahçe', icon: Icons.map_rounded),
        const SizedBox(height: 10),
        Row(children: [Expanded(child: TextField(controller: block, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ada', helperText: 'Örn. 1247', prefixIcon: Icon(Icons.grid_view_rounded)))), const SizedBox(width: 10), Expanded(child: TextField(controller: parcel, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Parsel', helperText: 'Örn. 18', prefixIcon: Icon(Icons.crop_square_rounded))))]),
      ]));
}

class _CoordinateForm extends StatelessWidget {
  const _CoordinateForm({required this.lat, required this.lng});
  final TextEditingController lat;
  final TextEditingController lng;
  @override
  Widget build(BuildContext context) => GlassCard(key: const ValueKey('coordinate'), padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Koordinat girişi', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        Row(children: [Expanded(child: TextField(controller: lat, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Enlem', prefixIcon: Icon(Icons.north_rounded)))), const SizedBox(width: 10), Expanded(child: TextField(controller: lng, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Boylam', prefixIcon: Icon(Icons.east_rounded))))]),
        const SizedBox(height: 10),
        const InsightCard(title: 'Doğrulama aralığı', message: 'Türkiye bounds: enlem 35.8–42.2, boylam 25.5–45.0', icon: Icons.rule_rounded, color: AppColors.info),
      ]));
}

class _ValidationBanner extends StatelessWidget {
  const _ValidationBanner({required this.message, required this.isError});
  final String message;
  final bool isError;
  @override
  Widget build(BuildContext context) => GlassCard(padding: const EdgeInsets.all(12), child: Row(children: [Icon(isError ? Icons.error_rounded : Icons.check_circle_rounded, color: isError ? AppColors.danger : AppColors.emerald), const SizedBox(width: 10), Expanded(child: Text(message, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)))]));
}

class _Selector extends StatelessWidget {
  const _Selector({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(value: value, decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)), items: [DropdownMenuItem(value: value, child: Text(value))], onChanged: (_) {});
}
