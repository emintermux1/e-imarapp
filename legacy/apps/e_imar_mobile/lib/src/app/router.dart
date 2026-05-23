import 'package:flutter/material.dart';

import '../features/map/domain/parcel.dart';
import '../features/parcel/parcel_detail_screen.dart';
import '../core/widgets/premium_shell.dart';

class AppRoutes {
  static const root = '/';
  static const parcelDetail = '/parcel-detail';
}

class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.root:
        return MaterialPageRoute<void>(
          settings: settings,
          builder: (_) => const PremiumShell(),
        );
      case AppRoutes.parcelDetail:
        final parcel = settings.arguments;
        return MaterialPageRoute<void>(
          settings: settings,
          builder: (_) => ParcelDetailScreen(
            parcel: parcel is ParcelDetail ? parcel : null,
          ),
        );
      default:
        return MaterialPageRoute<void>(
          settings: settings,
          builder: (_) => const PremiumShell(),
        );
    }
  }
}
