enum NotificationType {
  zoningChange,
  priceChange,
  newListing,
  riskChange,
  aiSuggestion,
}

class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.parcelId,
    this.parcelLabel,
    this.read = false,
    required this.timestamp,
  });

  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final String? parcelId;
  final String? parcelLabel;
  final bool read;
  final DateTime timestamp;

  NotificationItem copyWith({bool? read}) => NotificationItem(
        id: id,
        type: type,
        title: title,
        message: message,
        parcelId: parcelId,
        parcelLabel: parcelLabel,
        read: read ?? this.read,
        timestamp: timestamp,
      );
}
