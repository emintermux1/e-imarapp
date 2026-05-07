import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../domain/notification_item.dart';

class NotificationCard extends StatelessWidget {
  const NotificationCard({required this.notification, this.onTap, super.key});

  final NotificationItem notification;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final typeMeta = _typeMeta(notification.type);
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: typeMeta.color.withOpacity(.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(typeMeta.icon, color: typeMeta.color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (!notification.read)
                      Container(
                        width: 9,
                        height: 9,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: const BoxDecoration(
                          color: AppColors.emerald,
                          shape: BoxShape.circle,
                        ),
                      ),
                    Expanded(
                      child: Text(
                        notification.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    Text(
                      notification.relativeTime,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.slate,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  notification.message,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.slate,
                    height: 1.35,
                  ),
                ),
                if (notification.parcelLabel != null) ...[
                  const SizedBox(height: 8),
                  StatusBadge(
                    label: notification.parcelLabel!,
                    tone: BadgeTone.neutral,
                    icon: Icons.map_rounded,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

_TypeMeta _typeMeta(NotificationType type) => switch (type) {
      NotificationType.zoningChange => const _TypeMeta(
            icon: Icons.description_rounded,
            color: AppColors.warning,
          ),
      NotificationType.priceChange => const _TypeMeta(
            icon: Icons.trending_up_rounded,
            color: AppColors.emerald,
          ),
      NotificationType.newListing => const _TypeMeta(
            icon: Icons.add_home_work_rounded,
            color: AppColors.info,
          ),
      NotificationType.riskChange => const _TypeMeta(
            icon: Icons.shield_rounded,
            color: AppColors.riskHigh,
          ),
      NotificationType.aiSuggestion => const _TypeMeta(
            icon: Icons.auto_awesome_rounded,
            color: AppColors.lime,
          ),
    };

class _TypeMeta {
  const _TypeMeta({required this.icon, required this.color});
  final IconData icon;
  final Color color;
}
