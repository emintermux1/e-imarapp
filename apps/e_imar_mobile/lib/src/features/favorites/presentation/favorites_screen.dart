import 'package:flutter/material.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Çalışma Alanım'),
          actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.tune_rounded), tooltip: 'Filtrele')],
        ),
        body: const _WorkspaceBody(data: _WorkspaceMockData.rich),
      );
}

class _WorkspaceBody extends StatelessWidget {
  const _WorkspaceBody({required this.data});

  final _WorkspaceMockData data;

  bool get _isEmpty => data.favoriteParcels.isEmpty && data.savedSearches.isEmpty && data.watchedParcels.isEmpty && data.alerts.isEmpty && data.activities.isEmpty;

  @override
  Widget build(BuildContext context) {
    if (_isEmpty) {
      return AppStateView(
        title: 'Çalışma alanın hazır',
        message: 'Favoriye aldığın parseller, kayıtlı aramalar ve uyarılar burada tek panelde toplanacak.',
        icon: Icons.workspaces_outline_rounded,
        action: GradientButton(label: 'Parsel aramaya başla', icon: Icons.search_rounded, onPressed: () {}),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.xl),
      children: [
        _WorkspaceHero(data: data),
        const SizedBox(height: AppSpacing.md),
        _QuickActions(actions: data.quickActions),
        const SizedBox(height: AppSpacing.lg),
        _FavoriteParcelsSection(parcels: data.favoriteParcels),
        const SizedBox(height: AppSpacing.lg),
        _SavedSearchesSection(searches: data.savedSearches),
        const SizedBox(height: AppSpacing.lg),
        _WatchedParcelsSection(parcels: data.watchedParcels),
        const SizedBox(height: AppSpacing.lg),
        _AlertsSection(alerts: data.alerts),
        const SizedBox(height: AppSpacing.lg),
        _ActivitySection(activities: data.activities),
      ],
    );
  }
}

class _WorkspaceHero extends StatelessWidget {
  const _WorkspaceHero({required this.data});

  final _WorkspaceMockData data;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(AppRadius.xl), boxShadow: AppShadows.glow(AppColors.emerald)),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Kullanıcı çalışma alanı', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white.withOpacity(.78), fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text('Portföyünü, aramalarını ve uyarılarını tek yerden yönet.', style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w900, height: 1.05)),
              ])),
              Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.white.withOpacity(.16), borderRadius: BorderRadius.circular(AppRadius.md)), child: const Icon(Icons.dashboard_customize_rounded, color: Colors.white)),
            ]),
            const SizedBox(height: AppSpacing.lg),
            Wrap(spacing: 10, runSpacing: 10, children: [
              _HeroMetric(label: 'Favori', value: '${data.favoriteParcels.length}', icon: Icons.favorite_rounded),
              _HeroMetric(label: 'Kayıtlı arama', value: '${data.savedSearches.length}', icon: Icons.manage_search_rounded),
              _HeroMetric(label: 'Takip', value: '${data.watchedParcels.length}', icon: Icons.visibility_rounded),
              _HeroMetric(label: 'Uyarı', value: '${data.alerts.length}', icon: Icons.notifications_active_rounded),
            ]),
          ]),
        ),
      );
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        width: 142,
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(color: Colors.white.withOpacity(.14), borderRadius: BorderRadius.circular(AppRadius.md), border: Border.all(color: Colors.white.withOpacity(.18))),
        child: Row(children: [
          Icon(icon, color: Colors.white, size: 19),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w900)),
            Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white.withOpacity(.78))),
          ]),
        ]),
      );
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.actions});

  final List<_QuickActionData> actions;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Hızlı işlemler',
        subtitle: 'Sık kullanılan kullanıcı aksiyonları',
        icon: Icons.bolt_rounded,
        child: actions.isEmpty
            ? const _InlineEmptyState(message: 'Hızlı işlem tanımı bulunamadı.', icon: Icons.bolt_outlined)
            : Wrap(spacing: 8, runSpacing: 8, children: [for (final action in actions) IconActionChip(label: action.label, icon: action.icon, onTap: () {})]),
      );
}

class _FavoriteParcelsSection extends StatelessWidget {
  const _FavoriteParcelsSection({required this.parcels});

  final List<_ParcelWorkspaceItem> parcels;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Favori parseller',
        subtitle: 'Karşılaştırma ve rapor için kaydedilenler',
        icon: Icons.favorite_rounded,
        trailing: parcels.isEmpty ? null : Text('${parcels.length} parsel', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.emerald, fontWeight: FontWeight.w800)),
        child: parcels.isEmpty
            ? const _InlineEmptyState(message: 'Henüz favori parsel yok. Haritadan veya arama sonucundan favoriye ekleyebilirsin.', icon: Icons.favorite_border_rounded)
            : Column(children: [for (final parcel in parcels) _ParcelCard(parcel: parcel)]),
      );
}

class _SavedSearchesSection extends StatelessWidget {
  const _SavedSearchesSection({required this.searches});

  final List<_SavedSearchItem> searches;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Kayıtlı aramalar',
        subtitle: 'Yeni sonuç geldiğinde bildirim için hazır',
        icon: Icons.manage_search_rounded,
        child: searches.isEmpty
            ? const _InlineEmptyState(message: 'Kayıtlı arama yok. İl, ilçe, mahalle ve imar filtresiyle arama kaydedebilirsin.', icon: Icons.saved_search_rounded)
            : Column(children: [for (final search in searches) _SavedSearchTile(search: search)]),
      );
}

class _WatchedParcelsSection extends StatelessWidget {
  const _WatchedParcelsSection({required this.parcels});

  final List<_WatchedParcelItem> parcels;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Takip edilen parseller',
        subtitle: 'Plan notu, değer ve durum değişiklikleri',
        icon: Icons.visibility_rounded,
        child: parcels.isEmpty
            ? const _InlineEmptyState(message: 'Takip listesi boş. Değer veya imar değişimi izlemek istediğin parseli takibe al.', icon: Icons.visibility_off_rounded)
            : Column(children: [for (final parcel in parcels) _WatchedParcelTile(parcel: parcel)]),
      );
}

class _AlertsSection extends StatelessWidget {
  const _AlertsSection({required this.alerts});

  final List<_AlertCenterItem> alerts;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Bildirim ve uyarı merkezi',
        subtitle: 'Yerel mock uyarılar; canlı senkronizasyon sonraki fazda',
        icon: Icons.notifications_active_rounded,
        child: alerts.isEmpty
            ? const _InlineEmptyState(message: 'Aktif uyarı yok. Takip ettiğin parsellerde değişiklik olursa burada görünür.', icon: Icons.notifications_none_rounded)
            : Column(children: [for (final alert in alerts) _AlertTile(alert: alert)]),
      );
}

class _ActivitySection extends StatelessWidget {
  const _ActivitySection({required this.activities});

  final List<_ActivityItem> activities;

  @override
  Widget build(BuildContext context) => _SectionShell(
        title: 'Son aktiviteler',
        subtitle: 'Son görüntüleme, rapor ve not hareketleri',
        icon: Icons.history_rounded,
        child: activities.isEmpty
            ? const _InlineEmptyState(message: 'Henüz aktivite yok. Parsel görüntüledikçe zaman akışı dolacak.', icon: Icons.history_toggle_off_rounded)
            : Column(children: [for (final activity in activities) _ActivityTile(activity: activity)]),
      );
}

class _SectionShell extends StatelessWidget {
  const _SectionShell({required this.title, required this.subtitle, required this.icon, required this.child, this.trailing});

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            _SoftIcon(icon: icon),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
            ])),
            if (trailing != null) trailing!,
          ]),
          const SizedBox(height: AppSpacing.md),
          child,
        ]),
      );
}

class _ParcelCard extends StatelessWidget {
  const _ParcelCard({required this.parcel});

  final _ParcelWorkspaceItem parcel;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${parcel.neighborhood} • ${parcel.block}/${parcel.parcel}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 3),
                  Text('${parcel.city} / ${parcel.district} • ${parcel.area}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
                ])),
                _StatusBadge(label: parcel.status, color: AppColors.emerald),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Text(parcel.note, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: AppSpacing.sm),
              Wrap(spacing: 7, runSpacing: 7, children: [
                _StatusBadge(label: parcel.zoning, color: AppColors.sky),
                _StatusBadge(label: parcel.riskBadge, color: parcel.riskColor),
                _StatusBadge(label: parcel.valueBadge, color: AppColors.lime, darkText: true),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                Icon(Icons.update_rounded, size: 16, color: AppColors.slate),
                const SizedBox(width: 5),
                Text(parcel.updatedAt, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
                const Spacer(),
                TextButton(onPressed: () {}, child: const Text('Detay')),
              ]),
            ]),
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
        trailing: _StatusBadge(label: search.frequency, color: AppColors.emerald),
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

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.alert});

  final _AlertCenterItem alert;

  @override
  Widget build(BuildContext context) => _DividerTile(
        icon: alert.icon,
        title: alert.title,
        subtitle: alert.message,
        trailing: _StatusBadge(label: alert.level, color: alert.color),
      );
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.activity});

  final _ActivityItem activity;

  @override
  Widget build(BuildContext context) => _DividerTile(icon: activity.icon, title: activity.title, subtitle: '${activity.description} • ${activity.time}', trailing: const Icon(Icons.chevron_right_rounded));
}

class _DividerTile extends StatelessWidget {
  const _DividerTile({required this.icon, required this.title, required this.subtitle, this.trailing});

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Row(children: [
          _SoftIcon(icon: icon, compact: true),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
          ])),
          if (trailing != null) ...[const SizedBox(width: 8), trailing!],
        ]),
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
        decoration: BoxDecoration(color: AppColors.slate.withOpacity(.08), borderRadius: BorderRadius.circular(AppRadius.md)),
        child: Row(children: [
          Icon(icon, color: AppColors.slate),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate))),
        ]),
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
        decoration: BoxDecoration(color: AppColors.emerald.withOpacity(.14), borderRadius: BorderRadius.circular(compact ? AppRadius.sm : AppRadius.md)),
        child: Icon(icon, color: AppColors.emerald, size: compact ? 20 : 23),
      );
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.color, this.darkText = false});

  final String label;
  final Color color;
  final bool darkText;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
        decoration: BoxDecoration(color: color.withOpacity(darkText ? .85 : .16), borderRadius: BorderRadius.circular(AppRadius.pill), border: Border.all(color: color.withOpacity(.28))),
        child: Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: darkText ? AppColors.deepGreen : color, fontWeight: FontWeight.w900)),
      );
}

class _WorkspaceMockData {
  const _WorkspaceMockData({required this.favoriteParcels, required this.savedSearches, required this.watchedParcels, required this.alerts, required this.activities, required this.quickActions});

  final List<_ParcelWorkspaceItem> favoriteParcels;
  final List<_SavedSearchItem> savedSearches;
  final List<_WatchedParcelItem> watchedParcels;
  final List<_AlertCenterItem> alerts;
  final List<_ActivityItem> activities;
  final List<_QuickActionData> quickActions;

  static const rich = _WorkspaceMockData(
    favoriteParcels: [
      _ParcelWorkspaceItem(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fikirtepe', block: '3408', parcel: '12', area: '1.248 m²', zoning: 'Ticaret + Konut', status: 'Favori', riskBadge: 'Orta risk', riskColor: AppColors.warning, valueBadge: '+%18 değer', updatedAt: 'Bugün 10:24', note: 'Kentsel dönüşüm aksına yakın, emsal karşılaştırması için izleniyor.'),
      _ParcelWorkspaceItem(city: 'Ankara', district: 'Çankaya', neighborhood: 'Alacaatlı', block: '62841', parcel: '7', area: '842 m²', zoning: 'Konut E:1.20', status: 'Rapor hazır', riskBadge: 'Düşük risk', riskColor: AppColors.emerald, valueBadge: '+%9 değer', updatedAt: 'Dün 18:05', note: 'Site ölçekli geliştirme için TAKS/KAKS notları kaydedildi.'),
      _ParcelWorkspaceItem(city: 'İzmir', district: 'Urla', neighborhood: 'İçmeler', block: '151', parcel: '3', area: '2.310 m²', zoning: 'Turizm alanı', status: 'İnceleniyor', riskBadge: 'Kıyı kontrol', riskColor: AppColors.sky, valueBadge: '+%23 değer', updatedAt: '2 gün önce', note: 'Kıyı kenar çizgisi ve plan notu güncellemesi için işaretlendi.'),
    ],
    savedSearches: [
      _SavedSearchItem(title: 'Kadıköy ticaret + konut fırsatları', filters: 'İstanbul / Kadıköy • Emsal 2.00+', resultCount: 24, frequency: 'Günlük'),
      _SavedSearchItem(title: 'Ankara batı koridoru düşük risk', filters: 'Çankaya, Etimesgut • Konut', resultCount: 41, frequency: 'Haftalık'),
      _SavedSearchItem(title: 'İzmir sahil plan notu değişenler', filters: 'Urla, Seferihisar • Turizm', resultCount: 13, frequency: 'Anlık'),
    ],
    watchedParcels: [
      _WatchedParcelItem(title: 'Beşiktaş Etiler 1452/9', change: 'Plan notu askı süreci başladı', updatedAt: '1 sa', icon: Icons.description_rounded, color: AppColors.warning),
      _WatchedParcelItem(title: 'Bursa Nilüfer 7821/4', change: 'Değer skoru son 30 günde %6 arttı', updatedAt: '4 sa', icon: Icons.trending_up_rounded, color: AppColors.emerald),
      _WatchedParcelItem(title: 'Antalya Muratpaşa 981/22', change: 'Yapı yaklaşma mesafesi notu güncellendi', updatedAt: 'Dün', icon: Icons.rule_rounded, color: AppColors.sky),
    ],
    alerts: [
      _AlertCenterItem(title: 'İmar durumu değişikliği', message: 'Fikirtepe 3408/12 için belediye plan notu güncellemesi algılandı.', level: 'Önemli', icon: Icons.gpp_maybe_rounded, color: AppColors.warning),
      _AlertCenterItem(title: 'Rapor paylaşımı hazır', message: 'Alacaatlı 62841/7 PDF özeti çevrimdışı görüntüleme için hazırlandı.', level: 'Bilgi', icon: Icons.picture_as_pdf_rounded, color: AppColors.sky),
      _AlertCenterItem(title: 'Takip limiti uyarısı', message: 'Ücretsiz planda 2 parsel takip hakkı kaldı.', level: 'Plan', icon: Icons.workspace_premium_rounded, color: AppColors.emerald),
    ],
    activities: [
      _ActivityItem(title: 'Parsel notu eklendi', description: 'Kadıköy Fikirtepe 3408/12', time: '12 dk önce', icon: Icons.edit_note_rounded),
      _ActivityItem(title: 'Kayıtlı arama çalıştı', description: 'Kadıköy ticaret + konut fırsatları', time: '1 sa önce', icon: Icons.manage_search_rounded),
      _ActivityItem(title: 'Emsal özeti görüntülendi', description: 'Ankara Çankaya Alacaatlı', time: 'Dün', icon: Icons.calculate_rounded),
    ],
    quickActions: [
      _QuickActionData(label: 'Yeni arama', icon: Icons.search_rounded),
      _QuickActionData(label: 'PDF rapor', icon: Icons.picture_as_pdf_rounded),
      _QuickActionData(label: 'Not ekle', icon: Icons.note_add_rounded),
      _QuickActionData(label: 'Uyarı kur', icon: Icons.add_alert_rounded),
    ],
  );
}

class _ParcelWorkspaceItem {
  const _ParcelWorkspaceItem({required this.city, required this.district, required this.neighborhood, required this.block, required this.parcel, required this.area, required this.zoning, required this.status, required this.riskBadge, required this.riskColor, required this.valueBadge, required this.updatedAt, required this.note});

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
  const _SavedSearchItem({required this.title, required this.filters, required this.resultCount, required this.frequency});

  final String title;
  final String filters;
  final int resultCount;
  final String frequency;
}

class _WatchedParcelItem {
  const _WatchedParcelItem({required this.title, required this.change, required this.updatedAt, required this.icon, required this.color});

  final String title;
  final String change;
  final String updatedAt;
  final IconData icon;
  final Color color;
}

class _AlertCenterItem {
  const _AlertCenterItem({required this.title, required this.message, required this.level, required this.icon, required this.color});

  final String title;
  final String message;
  final String level;
  final IconData icon;
  final Color color;
}

class _ActivityItem {
  const _ActivityItem({required this.title, required this.description, required this.time, required this.icon});

  final String title;
  final String description;
  final String time;
  final IconData icon;
}

class _QuickActionData {
  const _QuickActionData({required this.label, required this.icon});

  final String label;
  final IconData icon;
}
