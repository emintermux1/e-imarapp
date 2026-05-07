import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../../features/map/domain/parcel.dart';

final gatewayApiProvider = Provider<GatewayApi>((ref) {
  final config = ref.watch(appConfigProvider);
  return GatewayApi(config: config);
});

class GatewayApi {
  GatewayApi({required AppConfig config, Dio? dio})
      : _config = config,
        _dio = dio ??
            Dio(BaseOptions(
              baseUrl: config.gatewayBaseUrl,
              connectTimeout: const Duration(seconds: 8),
              receiveTimeout: const Duration(seconds: 14),
              validateStatus: (_) => true,
            ));

  final AppConfig _config;
  final Dio _dio;

  bool get isConfigured => _config.hasGateway;

  Future<GatewayHealth> health() async {
    if (!isConfigured) return const GatewayHealth.unconfigured();
    final response = await _dio.get<Map<String, Object?>>('/health');
    final envelope = _envelope(response);
    if (envelope.isError) throw GatewayException.fromEnvelope(envelope);
    final data = envelope.data;
    return GatewayHealth(
      status: '${data['status'] ?? 'unknown'}',
      turkeyOnly: data['turkeyOnly'] == true,
    );
  }

  Future<List<ProviderDescriptor>> providers({String? city}) async {
    if (!isConfigured) return const [];
    final response = await _dio.get<Map<String, Object?>>('/providers', queryParameters: {
      if (city != null && city.trim().isNotEmpty) 'city': city.trim().toLowerCase(),
    });
    final envelope = _envelope(response);
    if (envelope.isError) throw GatewayException.fromEnvelope(envelope);
    final rawProviders = envelope.data['providers'];
    if (rawProviders is! List) return const [];
    return rawProviders
        .whereType<Map>()
        .map((item) => ProviderDescriptor.fromJson(item.cast<String, Object?>()))
        .toList(growable: false);
  }

  Future<ParcelLookupResult> lookupByAdmin({
    required String city,
    required String district,
    required String neighborhood,
    required String block,
    required String parcel,
  }) async {
    if (!isConfigured) {
      return ParcelLookupResult.unavailable(
        title: 'Veri geçidi yapılandırılmamış',
        message: 'Ada/parsel sorgusu için E_IMAR_GATEWAY_BASE_URL tanımlanmalıdır.',
        providerId: 'gateway',
        code: 'not_configured',
      );
    }

    final response = await _dio.get<Map<String, Object?>>('/parcel/by-admin', queryParameters: {
      'city': city,
      'district': district,
      'neighborhood': neighborhood,
      'block': block,
      'parcel': parcel,
    });
    final envelope = _envelope(response);
    if (envelope.isError) {
      return ParcelLookupResult.unavailable(
        title: 'Parsel geometrisi kısıtlı kaynakta',
        message: envelope.error?.message ?? 'Bu sorgu sağlayıcı tarafından kullanılamıyor.',
        providerId: envelope.error?.providerId,
        code: envelope.error?.code,
        providers: await _safeProviders(city),
      );
    }

    return ParcelLookupResult.unavailable(
      title: 'Canlı parsel adaptörü yanıtı desteklenmiyor',
      message: 'Geçit beklenen parsel formatından farklı bir yanıt döndürdü.',
      code: 'unsupported_operation',
      providers: await _safeProviders(city),
    );
  }

  Future<ParcelLookupResult> lookupByPoint({
    required double latitude,
    required double longitude,
    String? city,
  }) async {
    if (!isConfigured) {
      return ParcelLookupResult.unavailable(
        title: 'Veri geçidi yapılandırılmamış',
        message: 'Konumdan parsel/plan keşfi için E_IMAR_GATEWAY_BASE_URL tanımlanmalıdır.',
        providerId: 'gateway',
        code: 'not_configured',
      );
    }

    final parcelEnvelope = _envelope(await _dio.get<Map<String, Object?>>(
      '/parcel/by-point',
      queryParameters: {'lat': latitude, 'lng': longitude},
    ));

    final planEnvelope = _envelope(await _dio.get<Map<String, Object?>>(
      '/plan/by-parcel',
      queryParameters: {
        'lat': latitude,
        'lng': longitude,
        if (city != null && city.trim().isNotEmpty) 'city': city.trim().toLowerCase(),
      },
    ));

    if (!planEnvelope.isError) {
      final providers = await _safeProviders(city);
      final parcel = _parcelFromPlanEnvelope(
        latitude: latitude,
        longitude: longitude,
        city: city ?? 'Konum',
        envelope: planEnvelope,
        providers: providers,
        parcelEnvelope: parcelEnvelope,
      );
      return ParcelLookupResult.found(parcel, providers: providers);
    }

    return ParcelLookupResult.unavailable(
      title: 'Konumdan parsel bulunamadı',
      message: planEnvelope.error?.message ??
          parcelEnvelope.error?.message ??
          'Bu koordinat için canlı kamu plan katmanı kullanılamıyor.',
      providerId: planEnvelope.error?.providerId ?? parcelEnvelope.error?.providerId,
      code: planEnvelope.error?.code ?? parcelEnvelope.error?.code,
      providers: await _safeProviders(city),
    );
  }

  Future<List<ProviderDescriptor>> _safeProviders(String? city) async {
    try {
      return await providers(city: city);
    } catch (_) {
      return const [];
    }
  }

  ParcelDetail _parcelFromPlanEnvelope({
    required double latitude,
    required double longitude,
    required String city,
    required GatewayEnvelope envelope,
    required List<ProviderDescriptor> providers,
    required GatewayEnvelope parcelEnvelope,
  }) {
    final rawPlans = envelope.data['plans'];
    final plans = rawPlans is List
        ? rawPlans.whereType<Map>().map((item) {
            final json = item.cast<String, Object?>();
            final attributes = (json['attributes'] is Map)
                ? (json['attributes'] as Map).cast<String, Object?>()
                : <String, Object?>{};
            final layerName = '${json['layerName'] ?? json['layer'] ?? ''}'.trim();
            return PlanFeature(
              title: layerName.isEmpty ? 'Plan katmanı' : layerName,
              summary: _summarizeAttributes(attributes),
              layerName: layerName.isEmpty ? null : layerName,
              attributes: attributes,
            );
          }).toList(growable: false)
        : const <PlanFeature>[];
    final primaryProvider = providers.cast<ProviderDescriptor?>().firstWhere(
          (provider) => provider?.kind == 'public_municipal_gis',
          orElse: () => providers.isNotEmpty ? providers.first : null,
        );
    final sourceName = primaryProvider?.displayName ??
        (envelope.attribution.isNotEmpty ? envelope.attribution.first.name : 'E-İmar veri geçidi');
    final cityLabel = city == 'Konum' || city.trim().isEmpty ? 'Türkiye' : city;
    final restrictedMessage = parcelEnvelope.isError ? parcelEnvelope.error?.message : null;

    return ParcelDetail(
      city: _titleCaseTr(cityLabel),
      district: 'Konum tabanlı keşif',
      neighborhood: 'Yakın çevre',
      block: '—',
      parcel: '—',
      titleType: 'Plan katmanı',
      zoningStatus: plans.isEmpty ? 'Plan katmanı bulunamadı' : 'Kamu plan katmanı bulundu',
      taks: 0,
      kaks: 0,
      emsal: 0,
      floorLimit: 0,
      coverageRatio: 'Bilinmiyor',
      roadFrontage: 0,
      latitude: latitude,
      longitude: longitude,
      sourceName: sourceName,
      sourceKind: ParcelSourceKind.municipalPublic,
      providerId: primaryProvider?.id,
      providerStatus: primaryProvider?.status ?? 'metadata_only',
      providerCapabilities: primaryProvider?.capabilities ?? const [],
      attributionUrl: primaryProvider?.attribution.url ??
          (envelope.attribution.isNotEmpty ? envelope.attribution.first.url : null),
      official: true,
      restricted: restrictedMessage != null,
      fetchedAt: DateTime.now(),
      planFeatures: plans,
      unavailableReason: restrictedMessage,
      geometry: _smallViewportPolygon(latitude, longitude),
    );
  }

  GatewayEnvelope _envelope(Response<Map<String, Object?>> response) {
    final body = response.data ?? const <String, Object?>{};
    final errorJson = body['error'];
    return GatewayEnvelope(
      httpStatus: response.statusCode ?? 0,
      status: '${body['status'] ?? (response.statusCode == 200 ? 'ok' : 'error')}',
      data: (body['data'] is Map) ? (body['data'] as Map).cast<String, Object?>() : const {},
      error: errorJson is Map ? GatewayError.fromJson(errorJson.cast<String, Object?>()) : null,
      attribution: body['attribution'] is List
          ? (body['attribution'] as List)
              .whereType<Map>()
              .map((item) => SourceAttribution.fromJson(item.cast<String, Object?>()))
              .toList(growable: false)
          : const [],
    );
  }
}

class ParcelLookupResult {
  const ParcelLookupResult._({this.parcel, this.unavailable, this.providers = const []});

  factory ParcelLookupResult.found(ParcelDetail parcel, {List<ProviderDescriptor> providers = const []}) =>
      ParcelLookupResult._(parcel: parcel, providers: providers);

  factory ParcelLookupResult.unavailable({
    required String title,
    required String message,
    String? providerId,
    String? code,
    List<ProviderDescriptor> providers = const [],
  }) =>
      ParcelLookupResult._(
        unavailable: ProviderUnavailableState(
          title: title,
          message: message,
          providerId: providerId,
          code: code,
        ),
        providers: providers,
      );

  final ParcelDetail? parcel;
  final ProviderUnavailableState? unavailable;
  final List<ProviderDescriptor> providers;
  bool get hasParcel => parcel != null;
}

class ProviderUnavailableState {
  const ProviderUnavailableState({required this.title, required this.message, this.providerId, this.code});
  final String title;
  final String message;
  final String? providerId;
  final String? code;
}

class GatewayHealth {
  const GatewayHealth({required this.status, required this.turkeyOnly});
  const GatewayHealth.unconfigured()
      : status = 'not_configured',
        turkeyOnly = true;
  final String status;
  final bool turkeyOnly;
}

class GatewayEnvelope {
  const GatewayEnvelope({
    required this.httpStatus,
    required this.status,
    required this.data,
    required this.error,
    required this.attribution,
  });

  final int httpStatus;
  final String status;
  final Map<String, Object?> data;
  final GatewayError? error;
  final List<SourceAttribution> attribution;
  bool get isError => status == 'error' || httpStatus >= 400;
}

class GatewayError {
  const GatewayError({required this.code, required this.message, this.providerId});

  factory GatewayError.fromJson(Map<String, Object?> json) => GatewayError(
        code: '${json['code'] ?? 'provider_error'}',
        message: '${json['message'] ?? 'Sağlayıcı yanıtı alınamadı.'}',
        providerId: json['providerId'] as String?,
      );

  final String code;
  final String message;
  final String? providerId;
}

class GatewayException implements Exception {
  const GatewayException(this.message, {this.code, this.providerId});

  factory GatewayException.fromEnvelope(GatewayEnvelope envelope) => GatewayException(
        envelope.error?.message ?? 'Veri geçidi yanıtı alınamadı.',
        code: envelope.error?.code,
        providerId: envelope.error?.providerId,
      );

  final String message;
  final String? code;
  final String? providerId;

  @override
  String toString() => message;
}

class ProviderDescriptor {
  const ProviderDescriptor({
    required this.id,
    required this.kind,
    required this.displayName,
    required this.status,
    required this.enabled,
    required this.regions,
    required this.capabilities,
    required this.attribution,
  });

  factory ProviderDescriptor.fromJson(Map<String, Object?> json) => ProviderDescriptor(
        id: '${json['id'] ?? ''}',
        kind: '${json['kind'] ?? ''}',
        displayName: '${json['displayName'] ?? json['id'] ?? 'Sağlayıcı'}',
        status: '${json['status'] ?? 'not_configured'}',
        enabled: json['enabled'] == true,
        regions: json['regions'] is List ? (json['regions'] as List).map((e) => '$e').toList(growable: false) : const [],
        capabilities: json['capabilities'] is List ? (json['capabilities'] as List).map((e) => '$e').toList(growable: false) : const [],
        attribution: json['attribution'] is Map
            ? SourceAttribution.fromJson((json['attribution'] as Map).cast<String, Object?>())
            : const SourceAttribution(name: 'Bilinmeyen kaynak', url: ''),
      );

  final String id;
  final String kind;
  final String displayName;
  final String status;
  final bool enabled;
  final List<String> regions;
  final List<String> capabilities;
  final SourceAttribution attribution;
}

class SourceAttribution {
  const SourceAttribution({required this.name, required this.url, this.license, this.termsUrl});

  factory SourceAttribution.fromJson(Map<String, Object?> json) => SourceAttribution(
        name: '${json['name'] ?? 'Kaynak'}',
        url: '${json['url'] ?? ''}',
        license: json['license'] as String?,
        termsUrl: json['termsUrl'] as String?,
      );

  final String name;
  final String url;
  final String? license;
  final String? termsUrl;
}

String _summarizeAttributes(Map<String, Object?> attributes) {
  if (attributes.isEmpty) return 'Sağlayıcı özniteliği dönmedi.';
  final entries = attributes.entries
      .where((entry) => entry.value != null && '${entry.value}'.trim().isNotEmpty)
      .take(4)
      .map((entry) => '${entry.key}: ${entry.value}')
      .join(' • ');
  return entries.isEmpty ? 'Sağlayıcı özniteliği dönmedi.' : entries;
}

List<GeoPoint> _smallViewportPolygon(double latitude, double longitude) {
  const delta = .00055;
  return [
    GeoPoint(latitude - delta, longitude - delta),
    GeoPoint(latitude + delta, longitude - delta),
    GeoPoint(latitude + delta, longitude + delta),
    GeoPoint(latitude - delta, longitude + delta),
  ];
}

String _titleCaseTr(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return trimmed;
  return trimmed
      .split(RegExp(r'\s+'))
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}')
      .join(' ');
}
