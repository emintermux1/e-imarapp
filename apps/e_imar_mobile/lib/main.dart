import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'firebase_options.dart';
import 'src/app/app.dart';
import 'src/core/config/app_config.dart';

Future<void> main() async {
  await runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();
    final config = AppConfig.fromEnvironment();
    await _initializeFirebase(config);

    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      if (_crashlyticsAvailable(config)) {
        FirebaseCrashlytics.instance.recordFlutterFatalError(details);
      }
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      if (_crashlyticsAvailable(config)) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      }
      return true;
    };

    runApp(ProviderScope(overrides: [appConfigProvider.overrideWithValue(config)], child: const EImarApp()));
  }, (error, stack) {
    debugPrint('Yakalanmamış hata: $error');
  });
}

bool _crashlyticsAvailable(AppConfig config) => config.firebaseEnabled && !kDebugMode && Firebase.apps.isNotEmpty;

Future<void> _initializeFirebase(AppConfig config) async {
  if (!config.firebaseEnabled) return;
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    if (!kDebugMode) {
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    }
  } catch (error, stack) {
    debugPrint('Firebase devre dışı başlatıldı: $error\n$stack');
  }
}
