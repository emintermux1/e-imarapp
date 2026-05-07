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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parsel Sorgula')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        AppSegmentedControl(values: SearchMode.values, selected: mode, labelBuilder: (m) => m == SearchMode.parcel ? 'Ada / Parsel' : 'Koordinat', onChanged: (value) => setState(() { mode = value; validation = null; })),
        const SizedBox(height: 18),
        AnimatedSwitcher(duration: const Duration(milliseconds: 160), child: mode == SearchMode.parcel ? _ParcelForm(block: block, parcel: parcel) : _CoordinateForm(lat: lat, lng: lng)),
        if (validation != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(validation!, style: const TextStyle(color: AppColors.danger))),
        const SizedBox(height: 18),
        GradientButton(label: 'Sorgula', icon: Icons.search_rounded, onPressed: _validate),
        const SizedBox(height: 28),
        Text('Son aramalar', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        for (final item in const ['İstanbul / Kadıköy / Fenerbahçe • 1247/18', 'Ankara / Çankaya / Alacaatlı • 8912/4', 'İzmir / Urla / Kuşçular • Koordinat']) Card(child: ListTile(leading: const Icon(Icons.history_rounded), title: Text(item), subtitle: const Text('Mock kayıt • canlı veri entegrasyonu Faz 2'), trailing: const Icon(Icons.chevron_right_rounded))),
      ]),
    );
  }

  void _validate() {
    setState(() {
      if (mode == SearchMode.parcel && (block.text.trim().isEmpty || parcel.text.trim().isEmpty)) validation = 'Ada ve parsel numarası zorunludur.';
      else if (mode == SearchMode.coordinate) {
        final la = double.tryParse(lat.text.replaceAll(',', '.'));
        final lo = double.tryParse(lng.text.replaceAll(',', '.'));
        validation = (la == null || lo == null || la < 35.8 || la > 42.2 || lo < 25.5 || lo > 45.0) ? 'Koordinatlar Türkiye sınırları içinde olmalıdır.' : 'Koordinat doğrulandı. Mock parsel sonucu hazır.';
      } else validation = 'Mock parsel sonucu hazır.';
    });
  }
}

class _ParcelForm extends StatelessWidget {
  const _ParcelForm({required this.block, required this.parcel});
  final TextEditingController block;
  final TextEditingController parcel;
  @override
  Widget build(BuildContext context) => Column(key: const ValueKey('parcel'), children: [
        const _Selector(label: 'İl', value: 'İstanbul'),
        const SizedBox(height: 10),
        const _Selector(label: 'İlçe', value: 'Kadıköy'),
        const SizedBox(height: 10),
        const _Selector(label: 'Mahalle', value: 'Fenerbahçe'),
        const SizedBox(height: 10),
        Row(children: [Expanded(child: TextField(controller: block, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ada'))), const SizedBox(width: 10), Expanded(child: TextField(controller: parcel, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Parsel')))]),
      ]);
}

class _CoordinateForm extends StatelessWidget {
  const _CoordinateForm({required this.lat, required this.lng});
  final TextEditingController lat;
  final TextEditingController lng;
  @override
  Widget build(BuildContext context) => Column(key: const ValueKey('coordinate'), crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Expanded(child: TextField(controller: lat, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Enlem'))), const SizedBox(width: 10), Expanded(child: TextField(controller: lng, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Boylam')))]),
        const SizedBox(height: 8),
        const Text('Türkiye bounds: enlem 35.8–42.2, boylam 25.5–45.0'),
      ]);
}

class _Selector extends StatelessWidget {
  const _Selector({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(value: value, decoration: InputDecoration(labelText: label), items: [DropdownMenuItem(value: value, child: Text(value))], onChanged: (_) {});
}
