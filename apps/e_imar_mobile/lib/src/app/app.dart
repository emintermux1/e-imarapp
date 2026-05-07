import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
import 'router/app_router.dart';

final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);
final amoledProvider = StateProvider<bool>((_) => false);

class EImarApp extends ConsumerWidget {
  const EImarApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    final amoled = ref.watch(amoledProvider);

    return MaterialApp.router(
      title: 'E-İmar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: amoled ? AppTheme.amoled() : AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) => ScrollConfiguration(
          behavior: const _EImarScrollBehavior(),
          child: child ?? const SizedBox.shrink()),
    );
  }
}

class _EImarScrollBehavior extends ScrollBehavior {
  const _EImarScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());
}
