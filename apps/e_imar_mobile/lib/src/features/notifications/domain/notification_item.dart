enum NotificationType { zoningChange, priceChange, newListing, riskChange, aiSuggestion }

class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.parcelId,
    this.parcelLabel,
    required this.createdAt,
    this.read = false,
  });

  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final String parcelId;
  final String? parcelLabel;
  final DateTime createdAt;
  final bool read;

  NotificationItem copyWith({bool? read}) => NotificationItem(
        id: id,
        type: type,
        title: title,
        message: message,
        parcelId: parcelId,
        parcelLabel: parcelLabel,
        createdAt: createdAt,
        read: read ?? this.read,
      );

  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return 'Az önce';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk önce';
    if (diff.inHours < 24) return '${diff.inHours} sa önce';
    if (diff.inDays < 7) return '${diff.inDays} gün önce';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}
