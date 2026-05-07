import 'package:flutter_riverpod/flutter_riverpod.dart';

final appConfigProvider =
    Provider<AppConfig>((_) => AppConfig.fromEnvironment());

class AppConfig {
  const AppConfig(
      {required this.environment,
      required this.mapboxAccessToken,
      required this.openAiKey,
      required this.grokKey,
      required this.firebaseProjectId});

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      environment:
          String.fromEnvironment('APP_ENV', defaultValue: 'development'),
      mapboxAccessToken: String.fromEnvironment('MAPBOX_ACCESS_TOKEN'),
      openAiKey: String.fromEnvironment('OPENAI_API_KEY'),
      grokKey: String.fromEnvironment('GROK_API_KEY'),
      firebaseProjectId: String.fromEnvironment('FIREBASE_PROJECT_ID',
          defaultValue: 'e-imar-placeholder'),
    );
  }

  final String environment;
  final String mapboxAccessToken;
  final String openAiKey;
  final String grokKey;
  final String firebaseProjectId;

  bool get hasMapbox => mapboxAccessToken.trim().isNotEmpty;
  bool get hasOpenAi => openAiKey.trim().isNotEmpty;
  bool get hasGrok => grokKey.trim().isNotEmpty;
  bool get firebaseEnabled => firebaseProjectId != 'e-imar-placeholder';
  bool get isDevelopment => environment == 'development';
}
