enum WatchlistIntent { aski, zoningChange, permitReminder, providerHealth }

class WatchlistItem {
  const WatchlistItem({
    required this.title,
    required this.subtitle,
    required this.intent,
    required this.provenance,
    required this.statusLabel,
    required this.nextAction,
  });

  final String title;
  final String subtitle;
  final WatchlistIntent intent;
  final String provenance;
  final String statusLabel;
  final String nextAction;
}
