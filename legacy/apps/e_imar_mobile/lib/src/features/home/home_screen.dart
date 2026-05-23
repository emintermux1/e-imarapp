import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/router.dart';
import '../../core/services/gateway_api.dart';
import '../../core/services/gateway_providers.dart';
import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import '../map/domain/parcel.dart';

class HomeSearchScreen extends ConsumerStatefulWidget {
  const HomeSearchScreen({
    super.key,
    required this.onOpenMap,
    required this.onOpenCoverage,
    required this.onOpenWatchlist,
  });

  final VoidCallback onOpenMap;
  final VoidCallback onOpenCoverage;
  final VoidCallback onOpenWatchlist;

  @override
  ConsumerState<HomeSearchScreen> createState() => _HomeSearchScreenState();
}

class _HomeSearchScreenState extends ConsumerState<HomeSearchScreen> {
  final _city = TextEditingController();
  final _district = TextEditingController();
  final _neighborhood = TextEditingController();
  final _block = TextEditingController();
  final _parcel = TextEditingController();
  final _lat = TextEditingController();
  final _lng = TextEditingController();

  bool _loading = false;
  ParcelLookupResult? _result;

  @override
  void dispose() {
    _city.dispose();
    _district.dispose();
    _neighborhood.dispose();
    _block.dispose();
    _parcel.dispose();
    _lat.dispose();
    _lng.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final api = ref.read(gatewayApiProvider);
    setState(() {
      _loading = true;
      _result = null;
    });

    try {
      final hasAdminSearch = _city.text.trim().isNotEmpty &&
          _district.text.trim().isNotEmpty &&
          _neighborhood.text.trim().isNotEmpty &&
          _block.text.trim().isNotEmpty &&
          _parcel.text.trim().isNotEmpty;

      final hasPointSearch =
          _lat.text.trim().isNotEmpty && _lng.text.trim().isNotEmpty;
      ParcelLookupResult result;
      if (hasAdminSearch) {
        result = await api.lookupByAdmin(
          city: _city.text,
          district: _district.text,
          neighborhood: _neighborhood.text,
          block: _block.text,
          parcel: _parcel.text,
        );
      } else if (hasPointSearch) {
        final lat = double.tryParse(_lat.text.trim().replaceAll(',', '.'));
        final lng = double.tryParse(_lng.text.trim().replaceAll(',', '.'));
        if (lat == null || lng == null) {
          result = ParcelLookupResult.unavailable(
            title: 'Koordinat formatı geçersiz',
            message:
                'Enlem ve boylamı WGS84 ondalık sayı olarak girin. Örnek: 41.0151 / 28.9795',
          );
          setState(() => _result = result);
          return;
        }
        result = await api.lookupByPoint(
            latitude: lat, longitude: lng, city: _city.text.trim());
      } else {
        result = ParcelLookupResult.unavailable(
          title: 'Eksik arama girdisi',
          message:
              'Ada/parsel için idari alanları ya da konum için lat/lng girin.',
        );
      }

      setState(() => _result = result);
      if (result.parcel != null && mounted) {
        Navigator.of(context)
            .pushNamed(AppRoutes.parcelDetail, arguments: result.parcel);
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _result = ParcelLookupResult.unavailable(
            title: 'Sorgu tamamlanamadı',
            message: 'Ağ ya da sağlayıcı yanıtı okunamadı: $error',
            code: 'client_error',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final providers = ref.watch(gatewayProvidersProvider);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          _HeroHeader(
              onOpenMap: widget.onOpenMap,
              onOpenCoverage: widget.onOpenCoverage),
          const SizedBox(height: 18),
          const _RecentSearches(),
          const SizedBox(height: 18),
          const SectionHeader(
            title: 'Ada / parsel veya konum ile ara',
            subtitle:
                'Resmi olmayan demo içerik yerine yalnızca kaynak hazırsa sonuç gösterilir.',
          ),
          const SizedBox(height: 12),
          PremiumCard(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _TextField(label: 'İl', controller: _city)),
                    const SizedBox(width: 12),
                    Expanded(
                        child:
                            _TextField(label: 'İlçe', controller: _district)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                        child: _TextField(
                            label: 'Mahalle', controller: _neighborhood)),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _TextField(label: 'Ada', controller: _block)),
                    const SizedBox(width: 12),
                    Expanded(
                        child:
                            _TextField(label: 'Parsel', controller: _parcel)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                        child: _TextField(
                            label: 'Enlem',
                            controller: _lat,
                            keyboardType: TextInputType.number)),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _TextField(
                            label: 'Boylam',
                            controller: _lng,
                            keyboardType: TextInputType.number)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: _loading ? null : _search,
                    icon: _loading
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.travel_explore_rounded),
                    label: Text(_loading ? 'Sorgulanıyor' : 'Sorgula'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (providers.hasValue)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final provider in providers.value!.take(4))
                  StatusPill(
                    label: provider.displayName,
                    color: provider.enabled ? scheme.primary : scheme.outline,
                    icon: provider.enabled
                        ? Icons.check_circle_rounded
                        : Icons.hourglass_bottom_rounded,
                  ),
              ],
            ),
          const SizedBox(height: 16),
          if (_result != null) _LookupResultPanel(result: _result!),
          const SizedBox(height: 16),
          _QuickActions(
            onOpenMap: widget.onOpenMap,
            onOpenCoverage: widget.onOpenCoverage,
            onOpenWatchlist: widget.onOpenWatchlist,
          ),
        ],
      ),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  const _RecentSearches();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final items = [
      ('Gömü-160/19', 'Bartın · Amasra · 3.098,75 m²'),
      ('Hamzalı-122/530', 'Ankara · Şereflikoçhisar · Ham Toprak'),
    ];
    return PremiumCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Text('Son Aramalar',
                  style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              Text('Temizle',
                  style: TextStyle(
                      color: scheme.onSurfaceVariant,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          for (final item in items)
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.history_rounded, color: scheme.primary),
              title: Text(item.$1,
                  style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text(item.$2),
              trailing: const Icon(Icons.close_rounded, size: 18),
            ),
        ],
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.onOpenMap, required this.onOpenCoverage});

  final VoidCallback onOpenMap;
  final VoidCallback onOpenCoverage;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(36),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B3324), Color(0xFF1E803E)],
        ),
        boxShadow: [
          BoxShadow(
            color: scheme.primary.withValues(alpha: 0.30),
            blurRadius: 42,
            offset: const Offset(0, 24),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'BÖLGESEL AKILLI ARAMA',
              style: TextStyle(
                color: Color(0xFF73D39B),
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.1,
              ),
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Parsel ve imar\nsorgulama',
            style: TextStyle(
              color: Colors.white,
              fontSize: 38,
              height: .95,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.4,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Haritadan nokta seç, ada/parsel gir veya koordinatla kaynak durumunu gör. Resmi veri yoksa arayüz bunu saklamaz.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.76),
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onOpenMap,
                  icon: const Icon(Icons.map_rounded),
                  label: const Text('Haritadan sorgula'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0B3324),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton.filledTonal(
                onPressed: onOpenCoverage,
                icon: const Icon(Icons.analytics_rounded),
                color: Colors.white,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: 0.14),
                  fixedSize: const Size(54, 54),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TextField extends StatelessWidget {
  const _TextField(
      {required this.label, required this.controller, this.keyboardType});

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label),
    );
  }
}

class _LookupResultPanel extends StatelessWidget {
  const _LookupResultPanel({required this.result});

  final ParcelLookupResult result;

  @override
  Widget build(BuildContext context) {
    if (result.parcel != null) {
      final parcel = result.parcel!;
      return PremiumCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(parcel.trustLabel,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(parcel.parcelLabel,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            Text(parcel.zoningStatus,
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      );
    }

    final unavailable = result.unavailable!;
    return EmptyStateCard(
      title: unavailable.title,
      body: unavailable.message,
      icon: Icons.rule_rounded,
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onOpenMap,
    required this.onOpenCoverage,
    required this.onOpenWatchlist,
  });

  final VoidCallback onOpenMap;
  final VoidCallback onOpenCoverage;
  final VoidCallback onOpenWatchlist;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'Hızlı eylemler',
          subtitle:
              'Kaynak kapsama, harita workspace ve askı takibi için hızlı girişler.',
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: PremiumCard(
                onTap: onOpenMap,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.location_searching_rounded,
                        color: scheme.primary),
                    const SizedBox(height: 12),
                    Text('Konumdan tara',
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: PremiumCard(
                onTap: onOpenWatchlist,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.notifications_rounded, color: scheme.primary),
                    const SizedBox(height: 12),
                    Text('Parsel Alarm',
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: onOpenCoverage,
            icon: const Icon(Icons.shield_rounded),
            label:
                const Text('Kaynak kapsamını ve sağlayıcı durumunu kontrol et'),
          ),
        ),
      ],
    );
  }
}
