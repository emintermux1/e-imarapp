import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/repositories/offline_parcel_repository.dart';
import '../../map/domain/parcel.dart';

enum SearchMode { parcel, coordinate }

class ParcelSearchScreen extends ConsumerStatefulWidget {
  const ParcelSearchScreen({super.key});

  @override
  ConsumerState<ParcelSearchScreen> createState() => _ParcelSearchScreenState();
}

class _ParcelSearchScreenState extends ConsumerState<ParcelSearchScreen> {
  SearchMode mode = SearchMode.parcel;
  final queryController = TextEditingController();
  final block = TextEditingController();
  final parcel = TextEditingController();
  final lat = TextEditingController();
  final lng = TextEditingController();
  String? validation;
  bool validationIsError = false;
  List<_SearchResult> results = [];
  bool searching = false;

  @override
  void dispose() {
    queryController.dispose();
    block.dispose();
    parcel.dispose();
    lat.dispose();
    lng.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parsel Sorgula')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        AppSegmentedControl(
          values: SearchMode.values,
          selected: mode,
          labelBuilder: (m) => m == SearchMode.parcel ? 'Ada / Parsel' : 'Koordinat',
          onChanged: (value) => setState(() {
            mode = value;
            validation = null;
            validationIsError = false;
            results = [];
          }),
        ),
        const SizedBox(height: 18),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 160),
          child: mode == SearchMode.parcel
              ? _ParcelForm(block: block, parcel: parcel)
              : _CoordinateForm(lat: lat, lng: lng),
        ),
        if (validation != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(validation!, style: TextStyle(color: validationIsError ? AppColors.danger : AppColors.emerald)),
          ),
        const SizedBox(height: 18),
        TextField(
          controller: queryController,
          decoration: const InputDecoration(
            labelText: 'Mahalle, ilçe, ada veya parsel ile ara',
            prefixIcon: Icon(Icons.search_rounded),
          ),
          onSubmitted: (_) => _search(),
        ),
        const SizedBox(height: 12),
        GradientButton(label: 'Sorgula', icon: Icons.search_rounded, onPressed: searching ? null : _search),
        if (searching) const Padding(padding: EdgeInsets.only(top: 16), child: Center(child: CircularProgressIndicator())),
        if (results.isNotEmpty) ...[
          const SizedBox(height: 28),
          Text('Arama Sonuçları', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...results.map((r) => _ResultTile(result: r)),
        ],
      ]),
    );
  }

  Future<void> _search() async {
    setState(() {
      searching = true;
      validation = null;
      validationIsError = false;
    });

    try {
      if (mode == SearchMode.parcel && (block.text.trim().isNotEmpty || parcel.text.trim().isNotEmpty)) {
        final repo = ref.read(offlineParcelRepositoryProvider);
        final found = await repo.getParcel(block.text.trim(), parcel.text.trim());
        if (found != null) {
          setState(() {
            results = [_SearchResult.cached(found)];
          });
        } else {
          setState(() {
            results = [_SearchResult.mock(block.text.trim(), parcel.text.trim())];
          });
        }
      } else if (queryController.text.trim().isNotEmpty) {
        final repo = ref.read(offlineParcelRepositoryProvider);
        final query = queryController.text.trim();
        final matches = await repo.search(query);
        if (matches.isNotEmpty) {
          setState(() {
            results = matches.map((p) => _SearchResult.cached(p)).toList();
          });
        } else {
          setState(() {
            results = [_SearchResult.mockSearch(query)];
            validation = 'Çevrimdışı veritabanında sonuç bulunamadı.';
            validationIsError = false;
          });
        }
      } else if (mode == SearchMode.coordinate) {
        final la = double.tryParse(lat.text.replaceAll(',', '.'));
        final lo = double.tryParse(lng.text.replaceAll(',', '.'));
        if (la != null && lo != null && la >= 35.8 && la <= 42.2 && lo >= 25.5 && lo <= 45.0) {
          setState(() {
            results = [_SearchResult.mockCoordinate(la, lo)];
          });
        } else {
          setState(() {
            validation = 'Koordinatlar Türkiye sınırları içinde olmalıdır.';
            validationIsError = true;
          });
        }
      } else {
        setState(() {
          validation = 'Ada/parsel, arama terimi veya koordinat giriniz.';
          validationIsError = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          validation = 'Arama sırasında hata: $e';
          validationIsError = true;
        });
      }
    } finally {
      if (mounted) setState(() => searching = false);
    }
  }
}

enum _ResultKind { cached, mock }

class _SearchResult {
  const _SearchResult({
    this.parcel,
    required this.title,
    required this.subtitle,
    required this.kind,
    this.cachedAt,
  });

  final ParcelDetail? parcel;
  final String title;
  final String subtitle;
  final _ResultKind kind;
  final DateTime? cachedAt;

  factory _SearchResult.cached(ParcelDetail p) {
    return _SearchResult(
      parcel: p,
      title: '${p.neighborhood} ${p.block}/${p.parcel}',
      subtitle: '${p.city} / ${p.district} • ${p.zoningStatus}',
      kind: _ResultKind.cached,
      cachedAt: DateTime.now().subtract(const Duration(days: 14)),
    );
  }

  factory _SearchResult.mock(String block, String parcel) {
    return _SearchResult(
      title: 'Sonuç: $block/$parcel',
      subtitle: 'Bu parsel çevrimdışı veritabanında bulunamadı.',
      kind: _ResultKind.mock,
    );
  }

  factory _SearchResult.mockSearch(String query) {
    return _SearchResult(
      title: 'Arama: "$query"',
      subtitle: 'Çevrimdışı veritabanında eşleşen kayıt yok.',
      kind: _ResultKind.mock,
    );
  }

  factory _SearchResult.mockCoordinate(double lat, double lng) {
    return _SearchResult(
      title: 'Koordinat: ${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}',
      subtitle: 'Bu koordinat için çevrimdışı veri bulunamadı.',
      kind: _ResultKind.mock,
    );
  }

  bool get isStale => cachedAt != null && DateTime.now().difference(cachedAt!).inDays > 30;
}

class _ResultTile extends StatelessWidget {
  const _ResultTile({required this.result});

  final _SearchResult result;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          result.kind == _ResultKind.cached ? Icons.storage_rounded : Icons.cloud_off_rounded,
          color: result.kind == _ResultKind.cached ? AppColors.emerald : AppColors.warning,
        ),
        title: Text(result.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(result.subtitle),
            if (result.isStale)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.warning_amber_rounded, size: 14, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Text('Veri güncel olmayabilir', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.warning)),
                  ],
                ),
              ),
          ],
        ),
        trailing: _SourceBadge(kind: result.kind),
      ),
    );
  }
}

class _SourceBadge extends StatelessWidget {
  const _SourceBadge({required this.kind});

  final _ResultKind kind;

  @override
  Widget build(BuildContext context) {
    if (kind == _ResultKind.cached) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AppColors.emerald.withOpacity(0.12),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Text('Çevrimdışı veri', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.emerald)),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.warning.withOpacity(0.15),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text('Mock sonuç', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.warning)),
    );
  }
}

class _ParcelForm extends StatelessWidget {
  const _ParcelForm({required this.block, required this.parcel});

  final TextEditingController block;
  final TextEditingController parcel;

  @override
  Widget build(BuildContext context) {
    return Column(key: const ValueKey('parcel'), children: [
      const _Selector(label: 'İl', value: 'İstanbul'),
      const SizedBox(height: 10),
      const _Selector(label: 'İlçe', value: 'Kadıköy'),
      const SizedBox(height: 10),
      const _Selector(label: 'Mahalle', value: 'Fenerbahçe'),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: TextField(controller: block, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ada'))),
        const SizedBox(width: 10),
        Expanded(child: TextField(controller: parcel, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Parsel'))),
      ]),
    ]);
  }
}

class _CoordinateForm extends StatelessWidget {
  const _CoordinateForm({required this.lat, required this.lng});

  final TextEditingController lat;
  final TextEditingController lng;

  @override
  Widget build(BuildContext context) {
    return Column(key: const ValueKey('coordinate'), crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: TextField(controller: lat, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Enlem'))),
        const SizedBox(width: 10),
        Expanded(child: TextField(controller: lng, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Boylam'))),
      ]),
      const SizedBox(height: 8),
      const Text('Türkiye bounds: enlem 35.8–42.2, boylam 25.5–45.0'),
    ]);
  }
}

class _Selector extends StatelessWidget {
  const _Selector({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label),
      items: [DropdownMenuItem(value: value, child: Text(value))],
      onChanged: (_) {},
    );
  }
}
