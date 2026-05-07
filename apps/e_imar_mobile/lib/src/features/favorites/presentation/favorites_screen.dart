import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/firebase_repositories.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../notifications/domain/notification_item.dart';
import '../../notifications/presentation/mock_notifications.dart';
import '../../notifications/presentation/notification_card.dart';

enum _HubTab { favorites, searches, followed, notifications }

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  _HubTab _tab = _HubTab.favorites;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Favoriler'),
        centerTitle: false,
      ),
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Theme.of(context).brightness == Brightness.dark
              ? null
              : AppGradients.sandSurface,
        ),
        child: Column(
          children: [
            _TabStrip(selected: _tab, onChanged: (t) => setState(() => _tab = t)),
            const SizedBox(height: 6),
            Expanded(child: _body),
          ],
        ),
      ),
    );
  }

  Widget get _body => switch (_tab) {
        _HubTab.favorites => const _FavoriteParcelsTab(),
        _HubTab.searches => const _SavedSearchesTab(),
        _HubTab.followed => const _FollowedParcelsTab(),
        _HubTab.notifications => const _NotificationsTab(),
      };
}

class _TabStrip extends StatelessWidget {
  const _TabStrip({required this.selected, required this.onChanged});
  final _HubTab selected;
  final ValueChanged<_HubTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: _HubTab.values.map((t) {
          final (icon, label) = switch (t) {
            _HubTab.favorites => (Icons.favorite_rounded, 'Favoriler'),
            _HubTab.searches => (Icons.search_rounded, 'Aramalar'),
            _HubTab.followed => (Icons.visibility_rounded, 'Takip'),
            _HubTab.notifications => (Icons.notifications_rounded, 'Bildirimler'),
          };
          final active = t == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              avatar: Icon(icon, size: 18, color: active ? Colors.white : AppColors.emerald),
              label: Text(label),
              onPressed: () => onChanged(t),
              backgroundColor: active ? AppColors.emerald : null,
              labelStyle: TextStyle(
                fontWeight: FontWeight.w800,
                color: active ? Colors.white : null,
              ),
              side: active
                  ? BorderSide.none
                  : BorderSide(color: (Theme.of(context).brightness == Brightness.dark ? AppColors.outlineDark : AppColors.outlineLight).withOpacity(.8)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)),
            ),
          );
        }).toList(growable: false),
      ),
    );
  }
}

class _FavoriteParcelsTab extends ConsumerWidget {
  const _FavoriteParcelsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(favoritesRepositoryProvider);
    return _AsyncParcelList(
      loader: () => repo.favorites(),
      emptyTitle: 'Henüz favori parsel yok',
      emptyMessage: 'Haritadan veya aramadan bir parsele dokunup favorilere ekleyebilirsiniz.',
      emptyIcon: Icons.favorite_border_rounded,
      onRemove: (id) => repo.removeFavorite(id),
      repoProvider: favoritesRepositoryProvider,
    );
  }
}

class _SavedSearchesTab extends ConsumerWidget {
  const _SavedSearchesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(savedSearchRepositoryProvider);
    return _AsyncQueryList(
      loader: () => repo.recentSearches(),
      emptyTitle: 'Henüz kayıtlı arama yok',
      emptyMessage: 'Parsel sorgulama ekranında yaptığınız aramalar otomatik olarak buraya kaydedilir.',
      emptyIcon: Icons.search_off_rounded,
      repoProvider: savedSearchRepositoryProvider,
    );
  }
}

class _FollowedParcelsTab extends ConsumerWidget {
  const _FollowedParcelsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(followedParcelRepositoryProvider);
    return _AsyncParcelList(
      loader: () => repo.followedParcels(),
      emptyTitle: 'Henüz takip edilen parsel yok',
      emptyMessage: 'Bir parseli takip ederek imar değişikliği, fiyat hareketi ve risk güncellemelerinden haberdar olabilirsiniz.',
      emptyIcon: Icons.visibility_off_rounded,
      onRemove: (id) => repo.unfollowParcel(id),
      repoProvider: followedParcelRepositoryProvider,
    );
  }
}

class _NotificationsTab extends ConsumerWidget {
  const _NotificationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(mockNotificationsProvider);
    if (notifications.isEmpty) {
      return const AppStateView(
        title: 'Henüz bildirim yok',
        message: 'Takip ettiğiniz parsellerle ilgili bildirimler burada görünecek.',
        icon: Icons.notifications_off_rounded,
      );
    }
    final unreadCount = notifications.where((n) => !n.read).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              Text(
                'Bildirim Merkezi',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(width: 10),
              if (unreadCount > 0)
                StatusBadge(
                  label: '$unreadCount yeni',
                  tone: BadgeTone.success,
                ),
              const Spacer(),
              const StatusBadge(label: 'Mock', tone: BadgeTone.neutral),
            ],
          ),
        ),
        for (final item in notifications)
          NotificationCard(
            item: item,
            onTap: () {
              ref.read(notificationRepositoryProvider).markAsRead(item.id);
            },
          ),
      ],
    );
  }
}

class _AsyncParcelList extends ConsumerStatefulWidget {
  const _AsyncParcelList({
    required this.loader,
    required this.emptyTitle,
    required this.emptyMessage,
    required this.emptyIcon,
    required this.onRemove,
    required this.repoProvider,
  });

  final Future<List<String>> Function() loader;
  final String emptyTitle;
  final String emptyMessage;
  final IconData emptyIcon;
  final Future<void> Function(String id) onRemove;
  final ProviderListenable<dynamic> repoProvider;

  @override
  ConsumerState<_AsyncParcelList> createState() => _AsyncParcelListState();
}

class _AsyncParcelListState extends ConsumerState<_AsyncParcelList> {
  late Future<List<String>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.loader();
  }

  void _refresh() => setState(() => _future = widget.loader());

  @override
  Widget build(BuildContext context) {
    ref.listen(widget.repoProvider, (_, __) => _refresh());
    return FutureBuilder<List<String>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }
        if (snapshot.hasError) {
          return AppStateView(
            title: 'Yüklenemedi',
            message: 'Veriler şu anda alınamıyor. Lütfen tekrar deneyin.',
            icon: Icons.cloud_off_rounded,
            action: GradientButton(label: 'Tekrar dene', icon: Icons.refresh_rounded, onPressed: _refresh),
          );
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return AppStateView(
            title: widget.emptyTitle,
            message: widget.emptyMessage,
            icon: widget.emptyIcon,
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final id = items[index];
            final parsed = _parseParcelId(id);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                padding: const EdgeInsets.all(13),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.emerald.withOpacity(.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.map_rounded, color: AppColors.emerald),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            parsed.label,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            parsed.subtitle,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () async {
                        await widget.onRemove(id);
                        _refresh();
                      },
                      color: AppColors.slate,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  ({String label, String subtitle}) _parseParcelId(String raw) {
    final parts = raw.trim().replaceAll('/', '_').split('_');
    if (parts.length >= 2) {
      return (label: 'Ada $raw', subtitle: 'Mock parsel kaydı');
    }
    return (label: raw, subtitle: 'Kayıtlı parsel');
  }
}

class _AsyncQueryList extends ConsumerStatefulWidget {
  const _AsyncQueryList({
    required this.loader,
    required this.emptyTitle,
    required this.emptyMessage,
    required this.emptyIcon,
    required this.repoProvider,
  });

  final Future<List<String>> Function() loader;
  final String emptyTitle;
  final String emptyMessage;
  final IconData emptyIcon;
  final ProviderListenable<dynamic> repoProvider;

  @override
  ConsumerState<_AsyncQueryList> createState() => _AsyncQueryListState();
}

class _AsyncQueryListState extends ConsumerState<_AsyncQueryList> {
  late Future<List<String>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.loader();
  }

  void _refresh() => setState(() => _future = widget.loader());

  @override
  Widget build(BuildContext context) {
    ref.listen(widget.repoProvider, (_, __) => _refresh());
    return FutureBuilder<List<String>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }
        if (snapshot.hasError) {
          return AppStateView(
            title: 'Yüklenemedi',
            message: 'Veriler şu anda alınamıyor. Lütfen tekrar deneyin.',
            icon: Icons.cloud_off_rounded,
            action: GradientButton(label: 'Tekrar dene', icon: Icons.refresh_rounded, onPressed: _refresh),
          );
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return AppStateView(
            title: widget.emptyTitle,
            message: widget.emptyMessage,
            icon: widget.emptyIcon,
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final query = items[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                padding: const EdgeInsets.all(13),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.emerald.withOpacity(.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.history_rounded, color: AppColors.emerald),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            query,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Kayıtlı arama',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.slate),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
