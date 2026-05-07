import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/repositories/offline_parcel_repository.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(offlineParcelRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Çalışma Alanı')),
      body: FutureBuilder<void>(
        future: repo.db.then((_) {}),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return AppStateView(
              title: 'Yüklenemedi',
              message: 'Veritabanı başlatılamadı: ${snapshot.error}',
              icon: Icons.error_outline_rounded,
            );
          }
          return _FavoritesContent(repo: repo);
        },
      ),
    );
  }
}

class _FavoritesContent extends ConsumerStatefulWidget {
  const _FavoritesContent({required this.repo});

  final OfflineParcelRepository repo;

  @override
  ConsumerState<_FavoritesContent> createState() => _FavoritesContentState();
}

class _FavoritesContentState extends ConsumerState<_FavoritesContent> {
  List<ParcelData> _favorites = [];
  List<ParcelData> _followed = [];
  List<ParcelData> _recent = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final favs = await widget.repo.getFavorites();
      final flw = await widget.repo.getFollowed();
      final recent = await widget.repo.getRecent(10);
      if (mounted) {
        setState(() {
          _favorites = favs.map((p) => ParcelData.fromParcelDetail(p)).toList();
          _followed = flw.map((p) => ParcelData.fromParcelDetail(p)).toList();
          _recent = recent.map((p) => ParcelData.fromParcelDetail(p)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final hasData = _favorites.isNotEmpty || _followed.isNotEmpty || _recent.isNotEmpty;
    if (!hasData) {
      return AppStateView(
        title: 'Henüz kayıtlı parsel yok',
        message: 'Haritadan veya arama sonuçlarından parselleri favorilere ekleyerek burada takip edebilirsiniz.',
        icon: Icons.favorite_border_rounded,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          if (_favorites.isNotEmpty) ...[
            _SectionHeader(title: 'Favori Parseller', icon: Icons.favorite_rounded),
            const SizedBox(height: 8),
            ..._favorites.map((p) => _ParcelTile(
                  data: p,
                  onToggleFavorite: () => _toggleFavorite(p),
                  onToggleFollow: () => _toggleFollow(p),
                )),
            const SizedBox(height: 20),
          ],
          if (_followed.isNotEmpty) ...[
            _SectionHeader(title: 'Takip Edilen Parseller', icon: Icons.notifications_active_rounded),
            const SizedBox(height: 8),
            ..._followed.map((p) => _ParcelTile(
                  data: p,
                  onToggleFavorite: () => _toggleFavorite(p),
                  onToggleFollow: () => _toggleFollow(p),
                )),
            const SizedBox(height: 20),
          ],
          if (_recent.isNotEmpty) ...[
            _SectionHeader(title: 'Son Görüntülenenler', icon: Icons.history_rounded),
            const SizedBox(height: 8),
            ..._recent.map((p) => _ParcelTile(
                  data: p,
                  onToggleFavorite: () => _toggleFavorite(p),
                  onToggleFollow: () => _toggleFollow(p),
                  compact: true,
                )),
          ],
        ],
      ),
    );
  }

  Future<void> _toggleFavorite(ParcelData p) async {
    await widget.repo.toggleFavorite(p.block, p.parcel);
    await _loadData();
  }

  Future<void> _toggleFollow(ParcelData p) async {
    await widget.repo.toggleFollow(p.block, p.parcel);
    await _loadData();
  }
}

class ParcelData {
  const ParcelData({
    required this.city,
    required this.district,
    required this.neighborhood,
    required this.block,
    required this.parcel,
    required this.titleType,
    required this.zoningStatus,
    required this.taks,
    required this.kaks,
    required this.emsal,
    required this.floorLimit,
    required this.coverageRatio,
    required this.roadFrontage,
  });

  final String city, district, neighborhood, block, parcel, titleType, zoningStatus;
  final double taks, kaks, emsal, roadFrontage;
  final int floorLimit;
  final String coverageRatio;

  factory ParcelData.fromParcelDetail(dynamic d) {
    return ParcelData(
      city: d.city,
      district: d.district,
      neighborhood: d.neighborhood,
      block: d.block,
      parcel: d.parcel,
      titleType: d.titleType,
      zoningStatus: d.zoningStatus,
      taks: d.taks,
      kaks: d.kaks,
      emsal: d.emsal,
      floorLimit: d.floorLimit,
      coverageRatio: d.coverageRatio,
      roadFrontage: d.roadFrontage,
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.emerald, size: 22),
        const SizedBox(width: 10),
        Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _ParcelTile extends StatelessWidget {
  const _ParcelTile({
    required this.data,
    required this.onToggleFavorite,
    required this.onToggleFollow,
    this.compact = false,
  });

  final ParcelData data;
  final VoidCallback onToggleFavorite;
  final VoidCallback onToggleFollow;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: EdgeInsets.all(compact ? 10.0 : 14.0),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.emerald.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: const Icon(Icons.map_rounded, color: AppColors.emerald, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${data.neighborhood} ${data.block}/${data.parcel}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${data.city} / ${data.district} • ${data.zoningStatus}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (!compact)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          _Badge(label: 'TAKS ${data.taks.toStringAsFixed(2)}'),
                          const SizedBox(width: 6),
                          _Badge(label: 'KAKS ${data.kaks.toStringAsFixed(2)}'),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.favorite_rounded, color: AppColors.danger, size: 20),
                  onPressed: onToggleFavorite,
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Favorilerden çıkar',
                ),
                const SizedBox(height: 2),
                IconButton(
                  icon: const Icon(Icons.notifications_active_rounded, color: AppColors.warning, size: 20),
                  onPressed: onToggleFollow,
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Takibi bırak',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.emerald.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.deepGreen)),
    );
  }
}
