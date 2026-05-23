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
            Dio(
              BaseOptions(
                baseUrl: config.gatewayBaseUrl,
                connectTimeout: const Duration(seconds: 8),
                receiveTimeout: const Duration(seconds: 14),
                validateStatus: (_) => true,
              ),
            );

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
    final response = await _dio.get<Map<String, Object?>>('/sources/activation');
    final envelope = _envelope(response);
    if (envelope.isError) throw GatewayException.fromEnvelope(envelope);
    final rawProviders = envelope.data['sources'];
    if (rawProviders is! List) return const [];
    return rawProviders
        .whereType<Map>()
        .map(
          (item) => _providerFromActivation(item.cast<String, Object?>()),
        )
        .toList(growable: false);
  }

  ProviderDescriptor _providerFromActivation(Map<String, Object?> json) {
    final metadata = json['metadata'] is Map
        ? (json['metadata'] as Map).cast<String, Object?>()
        : const <String, Object?>{};
    return ProviderDescriptor.fromJson({
      'id': json['sourceId'],
      'kind': json['category'],
      'displayName': json['name'],
      'status': json['activationStatus'],
      'enabled': json['activationStatus'] == 'active',
      'regions': [
        if (metadata['province'] != null) metadata['province'],
        if (metadata['district'] != null) metadata['district'],
      ],
      'capabilities': json['capabilities'],
      'attribution': {'name': json['name'], 'url': json['homepageUrl']},
      'activationStatus': json['activationStatus'],
      'nextAction': json['nextAction'],
      'blockedReason': json['blockedReason'],
    });
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
        message:
            'Ada/parsel sorgusu için E_IMAR_GATEWAY_BASE_URL tanımlanmalıdır.',
        providerId: 'gateway',
        code: 'not_configured',
      );
    }

    final response = await _dio.get<Map<String, Object?>>(
      '/parcel/by-admin',
      queryParameters: {
        'city': city,
        'district': district,
        'neighborhood': neighborhood,
        'block': block,
        'parcel': parcel,
      },
    );
    final envelope = _envelope(response);
    if (envelope.isError) {
      return ParcelLookupResult.unavailable(
        title: 'Parsel geometrisi kısıtlı kaynakta',
        message: envelope.error?.message ??
            'Bu sorgu sağlayıcı tarafından kullanılamıyor.',
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
        message:
            'Konumdan parsel/plan keşfi için E_IMAR_GATEWAY_BASE_URL tanımlanmalıdır.',
        providerId: 'gateway',
        code: 'not_configured',
      );
    }

    final parcelEnvelope = _envelope(
      await _dio.get<Map<String, Object?>>(
        '/parcel/by-point',
        queryParameters: {'lat': latitude, 'lng': longitude},
      ),
    );

    final planEnvelope = _envelope(
      await _dio.get<Map<String, Object?>>(
        '/plan/by-parcel',
        queryParameters: {
          'lat': latitude,
          'lng': longitude,
          if (city != null && city.trim().isNotEmpty)
            'city': city.trim().toLowerCase(),
        },
      ),
    );

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
      providerId:
          planEnvelope.error?.providerId ?? parcelEnvelope.error?.providerId,
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
            final layerName =
                '${json['layerName'] ?? json['layer'] ?? ''}'.trim();
            return PlanFeature(
              title: layerName.isEmpty ? 'Plan katmanı' : layerName,
              summary: _summarizeAttributes(attributes),
              layerName: layerName.isEmpty ? null : layerName,
              attributes: attributes,
            );
          }).toList(growable: false)
        : const <PlanFeature>[];
    final primaryAttributes =
        plans.isNotEmpty ? plans.first.attributes : const <String, Object?>{};
    final area = readFirstDouble(primaryAttributes, const [
      'area',
      'parcelArea',
      'surfaceArea',
      'grossArea',
      'netArea',
    ]);
    final gabari = readFirstDouble(primaryAttributes, const [
      'gabari',
      'gabariMeters',
      'heightLimit',
      'maxHeight',
    ]);
    final floorLimit = readFirstInt(primaryAttributes, const [
          'kat',
          'katSayisi',
          'floorLimit',
          'maxFloors',
        ]) ??
        0;
    final taks =
        readFirstDouble(primaryAttributes, const ['taks', 'TAKS']) ?? 0;
    final kaks =
        readFirstDouble(primaryAttributes, const ['kaks', 'KAKS', 'emsal']) ??
            0;
    final primaryProvider = providers.cast<ProviderDescriptor?>().firstWhere(
          (provider) => provider?.kind == 'public_municipal_gis',
          orElse: () => providers.isNotEmpty ? providers.first : null,
        );
    final sourceName = primaryProvider?.displayName ??
        (envelope.attribution.isNotEmpty
            ? envelope.attribution.first.name
            : 'E-İmar veri geçidi');
    final cityLabel = city == 'Konum' || city.trim().isEmpty ? 'Türkiye' : city;
    final restrictedMessage =
        parcelEnvelope.isError ? parcelEnvelope.error?.message : null;

    return ParcelDetail(
      city: _titleCaseTr(cityLabel),
      district: 'Konum tabanlı keşif',
      neighborhood: 'Yakın çevre',
      block: '—',
      parcel: '—',
      titleType: 'Plan katmanı',
      zoningStatus: plans.isEmpty
          ? 'Plan katmanı bulunamadı'
          : 'Kamu plan katmanı bulundu',
      taks: taks,
      kaks: kaks,
      emsal:
          readFirstDouble(primaryAttributes, const ['emsal', 'emsalOrani']) ??
              kaks,
      floorLimit: floorLimit,
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
          (envelope.attribution.isNotEmpty
              ? envelope.attribution.first.url
              : null),
      official: false,
      restricted: restrictedMessage != null,
      fetchedAt: DateTime.now(),
      planFeatures: plans,
      unavailableReason: restrictedMessage,
      geometry: _smallViewportPolygon(latitude, longitude),
      siteAreaSquareMeters: area,
      gabariMeters: gabari,
    );
  }

  GatewayEnvelope _envelope(Response<Map<String, Object?>> response) {
    final body = response.data ?? const <String, Object?>{};
    final errorJson = body['error'];
    return GatewayEnvelope(
      httpStatus: response.statusCode ?? 0,
      status:
          '${body['status'] ?? (response.statusCode == 200 ? 'ok' : 'error')}',
      data: (body['data'] is Map)
          ? (body['data'] as Map).cast<String, Object?>()
          : const {},
      error: errorJson is Map
          ? GatewayError.fromJson(errorJson.cast<String, Object?>())
          : null,
      attribution: body['attribution'] is List
          ? (body['attribution'] as List)
              .whereType<Map>()
              .map(
                (item) =>
                    SourceAttribution.fromJson(item.cast<String, Object?>()),
              )
              .toList(growable: false)
          : const [],
    );
  }
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
  const GatewayError({
    required this.code,
    required this.message,
    this.providerId,
  });

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

  factory GatewayException.fromEnvelope(GatewayEnvelope envelope) =>
      GatewayException(
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

String _summarizeAttributes(Map<String, Object?> attributes) {
  if (attributes.isEmpty) return 'Sağlayıcı özniteliği dönmedi.';
  final entries = attributes.entries
      .where(
        (entry) => entry.value != null && '${entry.value}'.trim().isNotEmpty,
      )
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
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}
