import 'package:flutter/material.dart';

import '../../../core/theme/tokens.dart';
import '../domain/notification_item.dart';

class NotificationCard extends StatelessWidget {
  const NotificationCard({required this.item, this.onTap, super.key});
  final NotificationItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _assets(item.type);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: item.read
            ? Colors.transparent
            : (isDark ? AppColors.emerald : AppColors.deepGreen)
                .withOpacity(isDark ? .06 : .04),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withOpacity(.14),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                            ),
                          ),
                          Text(
                            _relativeTime(item.timestamp),
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        item.message,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.35),
                      ),
                      if (item.parcelLabel != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.location_on_rounded, size: 14, color: AppColors.emerald),
                            const SizedBox(width: 4),
                            Text(item.parcelLabel!, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.emerald, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                if (!item.read)
                  Padding(
                    padding: const EdgeInsets.only(left: 8, top: 6),
                    child: Container(width: 9, height: 9, decoration: const BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle)),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  (IconData, Color) _assets(NotificationType type) => switch (type) {
        NotificationType.zoningChange => (Icons.account_balance_rounded, AppColors.info),
        NotificationType.priceChange => (Icons.trending_up_rounded, AppColors.emerald),
        NotificationType.newListing => (Icons.add_business_rounded, AppColors.lime),
        NotificationType.riskChange => (Icons.shield_rounded, AppColors.warning),
        NotificationType.aiSuggestion => (Icons.auto_awesome_rounded, AppColors.sky),
      };

  String _relativeTime(DateTime timestamp) {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes}d';
    if (diff.inHours < 24) return '${diff.inHours}s';
    if (diff.inDays < 7) return '${diff.inDays}g';
    return '${timestamp.day}/${timestamp.month}';
  }
}
