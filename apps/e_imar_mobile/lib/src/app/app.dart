import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/router.dart';
import '../app/theme.dart';

class EImarApp extends ConsumerWidget {
  const EImarApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = buildAppTheme();
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'E-İmar Mobil',
      theme: theme.light,
      darkTheme: theme.dark,
      themeMode: ThemeMode.system,
      initialRoute: AppRoutes.root,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
