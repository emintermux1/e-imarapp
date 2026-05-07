import 'package:flutter_riverpod/flutter_riverpod.dart';

final appConfigProvider =
    Provider<AppConfig>((_) => AppConfig.fromEnvironment());

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.mapboxAccessToken,
    required this.openAiKey,
    required this.grokKey,
    required this.firebaseProjectId,
    required this.gatewayBaseUrl,
    required this.gatewayTurkeyOnly,
    required this.publicMunicipalGisEnabled,
    required this.publicCityMapEnabled,
    required this.ePlanProviderEnabled,
    required this.restrictedTkgmProviderEnabled,
  });

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      environment: String.fromEnvironment(
        'APP_ENV',
        defaultValue: 'development',
      ),
      mapboxAccessToken: String.fromEnvironment('MAPBOX_ACCESS_TOKEN'),
      openAiKey: String.fromEnvironment('OPENAI_API_KEY'),
      grokKey: String.fromEnvironment('GROK_API_KEY'),
      firebaseProjectId: String.fromEnvironment(
        'FIREBASE_PROJECT_ID',
        defaultValue: 'e-imar-placeholder',
      ),
      gatewayBaseUrl: String.fromEnvironment('E_IMAR_GATEWAY_BASE_URL'),
      gatewayTurkeyOnly: bool.fromEnvironment(
        'E_IMAR_GATEWAY_TURKEY_ONLY',
        defaultValue: true,
      ),
      publicMunicipalGisEnabled: bool.fromEnvironment(
        'E_IMAR_PUBLIC_MUNICIPAL_GIS_ENABLED',
        defaultValue: true,
      ),
      publicCityMapEnabled: bool.fromEnvironment(
        'E_IMAR_PUBLIC_CITY_MAP_ENABLED',
        defaultValue: true,
      ),
      ePlanProviderEnabled: bool.fromEnvironment(
        'E_IMAR_EPLAN_PROVIDER_ENABLED',
        defaultValue: true,
      ),
      restrictedTkgmProviderEnabled: bool.fromEnvironment(
        'E_IMAR_RESTRICTED_TKGM_PROVIDER_ENABLED',
      ),
    );
  }

  final String environment;
  final String mapboxAccessToken;
  final String openAiKey;
  final String grokKey;
  final String firebaseProjectId;
  final String gatewayBaseUrl;
  final bool gatewayTurkeyOnly;
  final bool publicMunicipalGisEnabled;
  final bool publicCityMapEnabled;
  final bool ePlanProviderEnabled;
  final bool restrictedTkgmProviderEnabled;

  bool get hasMapbox => mapboxAccessToken.trim().isNotEmpty;
  bool get hasOpenAi => openAiKey.trim().isNotEmpty;
  bool get hasGrok => grokKey.trim().isNotEmpty;
  bool get hasGateway => gatewayBaseUrl.trim().isNotEmpty;
  bool get firebaseEnabled => firebaseProjectId != 'e-imar-placeholder';
  bool get isDevelopment => environment == 'development';
}
