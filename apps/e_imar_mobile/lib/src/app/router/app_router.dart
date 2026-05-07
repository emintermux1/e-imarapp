import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/ai_valuation/presentation/ai_valuation_screen.dart';
import '../../features/analysis/presentation/analysis_screen.dart';
import '../../features/auth/presentation/auth_screen.dart';
import '../../features/emsal/presentation/emsal_calculator_screen.dart';
import '../../features/favorites/presentation/favorites_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/map/domain/parcel.dart';
import '../../features/map/presentation/home_map_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/reports/presentation/parcel_report_preview_screen.dart';
import '../../features/search/presentation/parcel_search_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../../features/study/presentation/study_request_screen.dart';
import '../../core/performance/motion.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AuthRoute.path,
    routes: [
      GoRoute(
          path: SplashRoute.path,
          name: SplashRoute.name,
          pageBuilder: _fadePage(const SplashScreen())),
      GoRoute(
          path: OnboardingRoute.path,
          name: OnboardingRoute.name,
          pageBuilder: _slidePage(const OnboardingScreen())),
      GoRoute(
          path: AuthRoute.path,
          name: AuthRoute.name,
          pageBuilder: _slidePage(const AuthScreen())),
      GoRoute(
          path: HomeRoute.path,
          name: HomeRoute.name,
          pageBuilder: _fadePage(const HomeMapScreen())),
      GoRoute(
          path: SearchRoute.path,
          name: SearchRoute.name,
          pageBuilder: _slidePage(const ParcelSearchScreen())),
      GoRoute(
          path: ParcelDetailRoute.path,
          name: ParcelDetailRoute.name,
          pageBuilder: (context, state) => _slidePage(HomeMapScreen(
                openParcelOnStart: true,
                selectedParcel: state.extra is ParcelDetail
                    ? state.extra! as ParcelDetail
                    : ParcelDetail.sample,
              ))(context, state)),
      GoRoute(
          path: EmsalRoute.path,
          name: EmsalRoute.name,
          pageBuilder: _slidePage(const EmsalCalculatorScreen())),
      GoRoute(
          path: AiValuationRoute.path,
          name: AiValuationRoute.name,
          pageBuilder: _slidePage(const AiValuationScreen())),
      GoRoute(
          path: AnalysisRoute.path,
          name: AnalysisRoute.name,
          pageBuilder: _slidePage(const AnalysisScreen())),
      GoRoute(
          path: ParcelReportRoute.path,
          name: ParcelReportRoute.name,
          pageBuilder: (context, state) => _slidePage(ParcelReportPreviewScreen(
              parcel: state.extra is ParcelDetail
                  ? state.extra! as ParcelDetail
                  : ParcelDetail.sample))(context, state)),
      GoRoute(
          path: FavoritesRoute.path,
          name: FavoritesRoute.name,
          pageBuilder: _slidePage(const FavoritesScreen())),
      GoRoute(
          path: StudyRequestRoute.path,
          name: StudyRequestRoute.name,
          pageBuilder: _slidePage(const StudyRequestScreen())),
      GoRoute(
          path: NotificationsRoute.path,
          name: NotificationsRoute.name,
          pageBuilder: _slidePage(const NotificationsScreen())),
      GoRoute(
          path: SettingsRoute.path,
          name: SettingsRoute.name,
          pageBuilder: _slidePage(const SettingsScreen())),
    ],
  );
});

Page<dynamic> Function(BuildContext, GoRouterState) _fadePage(Widget child) {
  return (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: child,
        transitionDuration: MotionDurations.route,
        reverseTransitionDuration: MotionDurations.routeReverse,
        transitionsBuilder: (_, animation, __, child) => FadeTransition(
            opacity: CurvedAnimation(
                parent: animation, curve: MotionCurves.standard),
            child: child),
      );
}

Page<dynamic> Function(BuildContext, GoRouterState) _slidePage(Widget child) {
  return (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: child,
        transitionDuration: MotionDurations.route,
        reverseTransitionDuration: MotionDurations.routeReverse,
        transitionsBuilder: (_, animation, __, child) {
          final curved = CurvedAnimation(
              parent: animation, curve: MotionCurves.emphasized);
          return SlideTransition(
              position: Tween(begin: const Offset(0.04, 0.02), end: Offset.zero)
                  .animate(curved),
              child: FadeTransition(opacity: curved, child: child));
        },
      );
}

abstract final class SplashRoute {
  static const path = '/';
  static const name = 'splash';
}

abstract final class OnboardingRoute {
  static const path = '/onboarding';
  static const name = 'onboarding';
}

abstract final class AuthRoute {
  static const path = '/auth';
  static const name = 'auth';
}

abstract final class HomeRoute {
  static const path = '/home';
  static const name = 'home';
}

abstract final class SearchRoute {
  static const path = '/search';
  static const name = 'search';
}

abstract final class ParcelDetailRoute {
  static const path = '/parcel-detail';
  static const name = 'parcel-detail';
}

abstract final class EmsalRoute {
  static const path = '/emsal';
  static const name = 'emsal';
}

abstract final class AiValuationRoute {
  static const path = '/ai-valuation';
  static const name = 'ai-valuation';
}

abstract final class AnalysisRoute {
  static const path = '/analysis';
  static const name = 'analysis';
}

abstract final class ParcelReportRoute {
  static const path = '/parcel-report';
  static const name = 'parcel-report';
}

abstract final class FavoritesRoute {
  static const path = '/favorites';
  static const name = 'favorites';
}

abstract final class NotificationsRoute {
  static const path = '/notifications';
  static const name = 'notifications';
}

abstract final class SettingsRoute {
  static const path = '/settings';
  static const name = 'settings';
}

abstract final class StudyRequestRoute {
  static const path = '/study-request';
  static const name = 'study-request';
}
