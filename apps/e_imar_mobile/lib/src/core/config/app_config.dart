import 'package:flutter_riverpod/flutter_riverpod.dart';

final appConfigProvider =
    Provider<AppConfig>((ref) => AppConfig.fromEnvironment());

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.gatewayBaseUrl,
    required this.enableDemoFallback,
    required this.appName,
  });

  factory AppConfig.fromEnvironment() {
    const gateway = String.fromEnvironment('E_IMAR_GATEWAY_BASE_URL');
    const env = String.fromEnvironment('E_IMAR_ENV', defaultValue: 'dev');
    const demoFallback = bool.fromEnvironment(
      'E_IMAR_ENABLE_DEMO_FALLBACK',
      defaultValue: false,
    );

    return const AppConfig(
      environment: env,
      gatewayBaseUrl: gateway,
      enableDemoFallback: demoFallback,
      appName: 'E-İmar Mobil',
    );
  }

  final String environment;
  final String gatewayBaseUrl;
  final bool enableDemoFallback;
  final String appName;

  bool get hasGateway => gatewayBaseUrl.trim().isNotEmpty;
}
