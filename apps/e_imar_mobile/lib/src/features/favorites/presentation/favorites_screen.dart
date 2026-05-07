import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../notifications/data/mock_notifications_source.dart';
import '../../notifications/presentation/notification_card.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) => const _UserHub();
}

class _UserHub extends StatelessWidget {
  const _UserHub();

  @override
  Widget build(BuildContext context) => DefaultTabController(
        length: 4,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Kullanıcı Merkezi'),
            bottom: const TabBar(
              isScrollable: false,
              labelStyle: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
              unselectedLabelStyle:
                  TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: [
                Tab(
                    text: 'Favori',
                    icon: Icon(Icons.favorite_rounded, size: 20)),
                Tab(
                  text: 'Aramalar',
                  icon: Icon(Icons.manage_search_rounded, size: 20),
                ),
                Tab(
                  text: 'Takip',
                  icon: Icon(Icons.visibility_rounded, size: 20),
                ),
                Tab(
                  text: 'Bildirim',
                  icon: Icon(Icons.notifications_active_rounded, size: 20),
                ),
              ],
            ),
          ),
          body: DecoratedBox(
            decoration: BoxDecoration(
              gradient: Theme.of(context).brightness == Brightness.dark
                  ? null
                  : AppGradients.sandSurface,
            ),
            child: const TabBarView(
              children: [
                _FavoriteParcelsTab(),
                _SavedSearchesTab(),
                _FollowedParcelsTab(),
                _NotificationsTab(),
              ],
            ),
          ),
        ),
      );
}

class _FavoriteParcelsTab extends StatelessWidget {
  const _FavoriteParcelsTab();

  @override
  Widget build(BuildContext context) {
    final data = _UserHubMockData.rich;
    final parcels = data.favoriteParcels;
    return _SectionShell(
      title: 'Favori parseller',
      subtitle: 'Karşılaştırma ve rapor için kaydedilenler',
      icon: Icons.favorite_rounded,
      trailing: parcels.isEmpty
          ? null
          : Text(
              '${parcels.length} parsel',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.emerald, fontWeight: FontWeight.w800),
            ),
      child: parcels.isEmpty
          ? const _InlineEmptyState(
              message:
                  'Henüz favori parsel yok. Haritadan veya arama sonucundan favoriye ekleyebilirsin.',
              icon: Icons.favorite_border_rounded,
            )
          : Column(
              children: [
                for (final parcel in parcels) _ParcelCard(parcel: parcel),
              ],
            ),
    );
  }
}

class _SavedSearchesTab extends StatelessWidget {
  const _SavedSearchesTab();

  @override
  Widget build(BuildContext context) {
    final data = _UserHubMockData.rich;
    final searches = data.savedSearches;
    return _SectionShell(
      title: 'Kayıtlı aramalar',
      subtitle: 'Yeni sonuç geldiğinde bildirim için hazır',
      icon: Icons.manage_search_rounded,
      child: searches.isEmpty
          ? const _InlineEmptyState(
              message:
                  'Kayıtlı arama yok. İl, ilçe, mahalle ve imar filtresiyle arama kaydedebilirsin.',
              icon: Icons.saved_search_rounded,
            )
          : Column(
              children: [
                for (final search in searches) _SavedSearchTile(search: search),
              ],
            ),
    );
  }
}

class _FollowedParcelsTab extends StatelessWidget {
  const _FollowedParcelsTab();

  @override
  Widget build(BuildContext context) {
    final data = _UserHubMockData.rich;
    final parcels = data.watchedParcels;
    return _SectionShell(
      title: 'Takip edilen parseller',
      subtitle: 'Plan notu, değer ve durum değişiklikleri',
      icon: Icons.visibility_rounded,
      child: parcels.isEmpty
          ? const _InlineEmptyState(
              message:
                  'Takip listesi boş. Değer veya imar değişimi izlemek istediğin parseli takibe al.',
              icon: Icons.visibility_off_rounded,
            )
          : Column(
              children: [
                for (final parcel in parcels)
                  _WatchedParcelTile(parcel: parcel),
              ],
            ),
    );
  }
}

class _NotificationsTab extends ConsumerWidget {
  const _NotificationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final source = ref.watch(mockNotificationsProvider);
    final notifications = source.notifications;
    final unreadCount = source.unreadCount;

    return _SectionShell(
      title: 'Bildirim merkezi',
      subtitle: 'Takip, imar, değer ve AI bildirimleri',
      icon: Icons.notifications_active_rounded,
      trailing: unreadCount > 0
          ? TextButton(
              onPressed: () => source.markAllRead(),
              child: Text(
                'Tümünü okundu say',
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(color: AppColors.emerald),
              ),
            )
          : null,
      child: notifications.isEmpty
          ? const _InlineEmptyState(
              message:
                  'Henüz bildirim yok. Takip ettiğin parsellerde değişiklik olursa burada görünür.',
              icon: Icons.notifications_none_rounded,
            )
          : Column(
              children: [
                for (final notification in notifications)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: NotificationCard(notification: notification),
                  ),
              ],
            ),
    );
  }
}

class _SectionShell extends StatelessWidget {
  const _SectionShell({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          GlassCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _SoftIcon(icon: icon),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          Text(
                            subtitle,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.slate),
                          ),
                        ],
                      ),
                    ),
                    if (trailing != null) trailing!,
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                child,
              ],
            ),
          ),
        ],
      );
}

class _ParcelCard extends StatelessWidget {
  const _ParcelCard({required this.parcel});

  final _ParcelItem parcel;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${parcel.neighborhood} • ${parcel.block}/${parcel.parcel}',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '${parcel.city} / ${parcel.district} • ${parcel.area}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.slate),
                          ),
                        ],
                      ),
                    ),
                    _StatusBadge(
                        label: parcel.status, color: AppColors.emerald),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(parcel.note,
                    style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    _StatusBadge(label: parcel.zoning, color: AppColors.sky),
                    _StatusBadge(
                        label: parcel.riskBadge, color: parcel.riskColor),
                    _StatusBadge(
                      label: parcel.valueBadge,
                      color: AppColors.lime,
                      darkText: true,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Icon(Icons.update_rounded,
                        size: 16, color: AppColors.slate),
                    const SizedBox(width: 5),
                    Text(
                      parcel.updatedAt,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.slate),
                    ),
                    const Spacer(),
                    TextButton(onPressed: () {}, child: const Text('Detay')),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
}

class _SavedSearchTile extends StatelessWidget {
  const _SavedSearchTile({required this.search});

  final _SavedSearchItem search;

  @override
  Widget build(BuildContext context) => _DividerTile(
        icon: Icons.saved_search_rounded,
        title: search.title,
        subtitle: '${search.filters} • ${search.resultCount} sonuç',
        trailing:
            _StatusBadge(label: search.frequency, color: AppColors.emerald),
      );
}

class _WatchedParcelTile extends StatelessWidget {
  const _WatchedParcelTile({required this.parcel});

  final _WatchedParcelItem parcel;

  @override
  Widget build(BuildContext context) => _DividerTile(
        icon: parcel.icon,
        title: parcel.title,
        subtitle: parcel.change,
        trailing: _StatusBadge(label: parcel.updatedAt, color: parcel.color),
      );
}

class _DividerTile extends StatelessWidget {
  const _DividerTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Row(
          children: [
            _SoftIcon(icon: icon, compact: true),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.slate),
                  ),
                ],
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
          ],
        ),
      );
}

class _InlineEmptyState extends StatelessWidget {
  const _InlineEmptyState({required this.message, required this.icon});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.slate.withValues(alpha: .08),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.slate),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.slate),
              ),
            ),
          ],
        ),
      );
}

class _SoftIcon extends StatelessWidget {
  const _SoftIcon({required this.icon, this.compact = false});

  final IconData icon;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
        width: compact ? 38 : 44,
        height: compact ? 38 : 44,
        decoration: BoxDecoration(
          color: AppColors.emerald.withValues(alpha: .14),
          borderRadius:
              BorderRadius.circular(compact ? AppRadius.sm : AppRadius.md),
        ),
        child: Icon(icon, color: AppColors.emerald, size: compact ? 20 : 23),
      );
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.label,
    required this.color,
    this.darkText = false,
  });

  final String label;
  final Color color;
  final bool darkText;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: darkText ? .85 : .16),
          borderRadius: BorderRadius.circular(AppRadius.pill),
          border: Border.all(color: color.withValues(alpha: .28)),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: darkText ? AppColors.deepGreen : color,
                fontWeight: FontWeight.w900,
              ),
        ),
      );
}

class _UserHubMockData {
  const _UserHubMockData({
    required this.favoriteParcels,
    required this.savedSearches,
    required this.watchedParcels,
  });

  final List<_ParcelItem> favoriteParcels;
  final List<_SavedSearchItem> savedSearches;
  final List<_WatchedParcelItem> watchedParcels;

  static const rich = _UserHubMockData(
    favoriteParcels: [
      _ParcelItem(
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Fikirtepe',
        block: '3408',
        parcel: '12',
        area: '1.248 m²',
        zoning: 'Ticaret + Konut',
        status: 'Favori',
        riskBadge: 'Orta risk',
        riskColor: AppColors.warning,
        valueBadge: '+%18 değer',
        updatedAt: 'Bugün 10:24',
        note:
            'Kentsel dönüşüm aksına yakın, emsal karşılaştırması için izleniyor.',
      ),
      _ParcelItem(
        city: 'Ankara',
        district: 'Çankaya',
        neighborhood: 'Alacaatlı',
        block: '62841',
        parcel: '7',
        area: '842 m²',
        zoning: 'Konut E:1.20',
        status: 'Rapor hazır',
        riskBadge: 'Düşük risk',
        riskColor: AppColors.emerald,
        valueBadge: '+%9 değer',
        updatedAt: 'Dün 18:05',
        note: 'Site ölçekli geliştirme için TAKS/KAKS notları kaydedildi.',
      ),
      _ParcelItem(
        city: 'İzmir',
        district: 'Urla',
        neighborhood: 'İçmeler',
        block: '151',
        parcel: '3',
        area: '2.310 m²',
        zoning: 'Turizm alanı',
        status: 'İnceleniyor',
        riskBadge: 'Kıyı kontrol',
        riskColor: AppColors.sky,
        valueBadge: '+%23 değer',
        updatedAt: '2 gün önce',
        note: 'Kıyı kenar çizgisi ve plan notu güncellemesi için işaretlendi.',
      ),
    ],
    savedSearches: [
      _SavedSearchItem(
        title: 'Kadıköy ticaret + konut fırsatları',
        filters: 'İstanbul / Kadıköy • Emsal 2.00+',
        resultCount: 24,
        frequency: 'Günlük',
      ),
      _SavedSearchItem(
        title: 'Ankara batı koridoru düşük risk',
        filters: 'Çankaya, Etimesgut • Konut',
        resultCount: 41,
        frequency: 'Haftalık',
      ),
      _SavedSearchItem(
        title: 'İzmir sahil plan notu değişenler',
        filters: 'Urla, Seferihisar • Turizm',
        resultCount: 13,
        frequency: 'Anlık',
      ),
    ],
    watchedParcels: [
      _WatchedParcelItem(
        title: 'Beşiktaş Etiler 1452/9',
        change: 'Plan notu askı süreci başladı',
        updatedAt: '1 sa',
        icon: Icons.description_rounded,
        color: AppColors.warning,
      ),
      _WatchedParcelItem(
        title: 'Bursa Nilüfer 7821/4',
        change: 'Değer skoru son 30 günde %6 arttı',
        updatedAt: '4 sa',
        icon: Icons.trending_up_rounded,
        color: AppColors.emerald,
      ),
      _WatchedParcelItem(
        title: 'Antalya Muratpaşa 981/22',
        change: 'Yapı yaklaşma mesafesi notu güncellendi',
        updatedAt: 'Dün',
        icon: Icons.rule_rounded,
        color: AppColors.sky,
      ),
    ],
  );
}

class _ParcelItem {
  const _ParcelItem({
    required this.city,
    required this.district,
    required this.neighborhood,
    required this.block,
    required this.parcel,
    required this.area,
    required this.zoning,
    required this.status,
    required this.riskBadge,
    required this.riskColor,
    required this.valueBadge,
    required this.updatedAt,
    required this.note,
  });

  final String city;
  final String district;
  final String neighborhood;
  final String block;
  final String parcel;
  final String area;
  final String zoning;
  final String status;
  final String riskBadge;
  final Color riskColor;
  final String valueBadge;
  final String updatedAt;
  final String note;
}

class _SavedSearchItem {
  const _SavedSearchItem({
    required this.title,
    required this.filters,
    required this.resultCount,
    required this.frequency,
  });

  final String title;
  final String filters;
  final int resultCount;
  final String frequency;
}

class _WatchedParcelItem {
  const _WatchedParcelItem({
    required this.title,
    required this.change,
    required this.updatedAt,
    required this.icon,
    required this.color,
  });

  final String title;
  final String change;
  final String updatedAt;
  final IconData icon;
  final Color color;
}
