import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../data/mock_notifications_source.dart';
import 'notification_card.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool markedAllRead = false;

  @override
  Widget build(BuildContext context) {
    final source = ref.watch(mockNotificationsProvider);
    final notifications = markedAllRead
        ? source.notifications.map((n) => n.copyWith(read: true)).toList()
        : source.notifications;
    final unreadCount = notifications.where((n) => !n.read).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirim Merkezi'),
        actions: [
          if (unreadCount > 0 && !markedAllRead)
            TextButton.icon(
              onPressed: () => setState(() => markedAllRead = true),
              icon: const Icon(Icons.done_all_rounded, size: 18),
              label: const Text('Tümünü okundu say'),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? const AppStateView(
              title: 'Bildirim yok',
              message:
                  'Takip ettiğin parsellerde değişiklik olduğunda burada görünür.',
              icon: Icons.notifications_none_rounded,
            )
          : ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.lg),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) =>
                  NotificationCard(notification: notifications[i]),
            ),
    );
  }
}
