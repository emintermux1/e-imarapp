import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/firebase_repositories.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/notification_item.dart';
import 'mock_notifications.dart';
import 'notification_card.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(mockNotificationsProvider);
    final repo = ref.watch(notificationRepositoryProvider);
    final unreadCount = notifications.where((n) => !n.read).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () {
                for (final n in notifications.where((n) => !n.read)) {
                  repo.markAsRead(n.id);
                }
              },
              child: const Text('Tümünü okundu say'),
            ),
        ],
      ),
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Theme.of(context).brightness == Brightness.dark ? null : AppGradients.sandSurface,
        ),
        child: notifications.isEmpty
            ? const AppStateView(
                title: 'Henüz bildirim yok',
                message: 'Takip ettiğiniz parsellerle ilgili bildirimler burada görünecek.',
                icon: Icons.notifications_off_rounded,
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Text(
                          'Bildirim Merkezi',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(width: 10),
                        if (unreadCount > 0)
                          StatusBadge(label: '$unreadCount yeni', tone: BadgeTone.success),
                        const Spacer(),
                        const StatusBadge(label: 'Mock', tone: BadgeTone.neutral),
                      ],
                    ),
                  ),
                  for (final item in notifications)
                    NotificationCard(
                      item: item,
                      onTap: () => repo.markAsRead(item.id),
                    ),
                ],
              ),
      ),
    );
  }
}
