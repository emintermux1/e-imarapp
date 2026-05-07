import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/repositories/offline_parcel_repository.dart';
import '../../map/domain/parcel.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(offlineParcelRepositoryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Kayıtlı parseller')),
      body: FutureBuilder<void>(
        future: repo.db.then((_) {}),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) return const _SavedSkeleton();
          if (snapshot.hasError) return AppStateView(title: 'Yüklenemedi', message: 'Yerel önbellek başlatılamadı: ${snapshot.error}', icon: Icons.error_outline_rounded);
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
  List<ParcelDetail> favorites = const [];
  List<ParcelDetail> followed = const [];
  List<ParcelDetail> recent = const [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => loading = true);
    final favs = await widget.repo.getFavorites();
    final flw = await widget.repo.getFollowed();
    final rec = await widget.repo.getRecent(12);
    if (!mounted) return;
    setState(() {
      favorites = favs;
      followed = flw;
      recent = rec;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const _SavedSkeleton();
    if (favorites.isEmpty && followed.isEmpty && recent.isEmpty) {
      return AppStateView(
        title: 'Henüz kayıtlı parsel yok',
        message: 'Harita veya sorgu sonuçlarından parsel açtığınızda son görüntülenenler burada offline-friendly şekilde tutulur.',
        icon: Icons.bookmark_border_rounded,
        action: FilledButton.icon(onPressed: () => context.push(SearchRoute.path), icon: const Icon(Icons.search_rounded), label: const Text('Parsel ara')),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(padding: const EdgeInsets.all(AppSpacing.md), children: [
        if (favorites.isNotEmpty) ...[
          const _SectionHeader(title: 'Favoriler', icon: Icons.favorite_rounded),
          const SizedBox(height: 8),
          ...favorites.map((p) => _ParcelTile(parcel: p, onTap: () => _open(p), onFavorite: () => _toggleFavorite(p), onFollow: () => _toggleFollow(p))),
          const SizedBox(height: 18),
        ],
        if (followed.isNotEmpty) ...[
          const _SectionHeader(title: 'Takip edilenler', icon: Icons.notifications_active_rounded),
          const SizedBox(height: 8),
          ...followed.map((p) => _ParcelTile(parcel: p, onTap: () => _open(p), onFavorite: () => _toggleFavorite(p), onFollow: () => _toggleFollow(p))),
          const SizedBox(height: 18),
        ],
        if (recent.isNotEmpty) ...[
          const _SectionHeader(title: 'Son görüntülenenler', icon: Icons.history_rounded),
          const SizedBox(height: 8),
          ...recent.map((p) => _ParcelTile(parcel: p, onTap: () => _open(p), onFavorite: () => _toggleFavorite(p), onFollow: () => _toggleFollow(p), compact: true)),
        ],
      ]),
    );
  }

  void _open(ParcelDetail parcel) => context.push(ParcelDetailRoute.path, extra: parcel);

  Future<void> _toggleFavorite(ParcelDetail parcel) async {
    await widget.repo.toggleFavorite(parcel.block, parcel.parcel);
    await _loadData();
  }

  Future<void> _toggleFollow(ParcelDetail parcel) async {
    await widget.repo.toggleFollow(parcel.block, parcel.parcel);
    await _loadData();
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, color: AppColors.civicRed, size: 22),
        const SizedBox(width: 10),
        Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
      ]);
}

class _ParcelTile extends StatelessWidget {
  const _ParcelTile({required this.parcel, required this.onTap, required this.onFavorite, required this.onFollow, this.compact = false});
  final ParcelDetail parcel;
  final VoidCallback onTap;
  final VoidCallback onFavorite;
  final VoidCallback onFollow;
  final bool compact;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: GlassCard(
          onTap: onTap,
          padding: EdgeInsets.all(compact ? 12 : 14),
          child: Row(children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.civicRed.withValues(alpha: .12), borderRadius: BorderRadius.circular(AppRadius.sm)), child: const Icon(Icons.map_rounded, color: AppColors.civicRed, size: 22)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${parcel.neighborhood} ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 2),
              Text('${parcel.displayAddress} • ${parcel.sourceName}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate), maxLines: 1, overflow: TextOverflow.ellipsis),
              if (!compact) ...[
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  StatusBadge(label: parcel.providerStatus, tone: BadgeTone.info),
                  StatusBadge(label: parcel.official ? 'resmi/kamu' : 'önbellek', tone: parcel.official ? BadgeTone.success : BadgeTone.warning),
                ]),
              ],
            ])),
            IconButton(icon: const Icon(Icons.favorite_rounded, color: AppColors.danger, size: 20), onPressed: onFavorite, tooltip: 'Favori durumunu değiştir'),
            IconButton(icon: const Icon(Icons.notifications_active_rounded, color: AppColors.warning, size: 20), onPressed: onFollow, tooltip: 'Takip durumunu değiştir'),
          ]),
        ),
      );
}

class _SavedSkeleton extends StatelessWidget {
  const _SavedSkeleton();

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: List.generate(5, (i) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.slate.withValues(alpha: .12), borderRadius: BorderRadius.circular(14))),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(height: 14, width: double.infinity, decoration: BoxDecoration(color: AppColors.slate.withValues(alpha: .12), borderRadius: BorderRadius.circular(8))),
                    const SizedBox(height: 8),
                    Container(height: 10, width: 160, decoration: BoxDecoration(color: AppColors.slate.withValues(alpha: .10), borderRadius: BorderRadius.circular(8))),
                  ])),
                ]),
              ),
            )),
      );
}
