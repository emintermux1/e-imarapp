import 'dart:async';
import 'dart:convert';
import 'dart:isolate';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'gis_cache_service.dart';
import 'gis_layers.dart';

final _dioProvider = Provider<Dio?>((ref) {
  try {
    return Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json, image/png',
          'User-Agent': 'EImarMobile/1.0 (GIS Connector)',
        },
      ),
    );
  } catch (e) {
    debugPrint('Dio başlatılamadı, mock depoya düşülüyor: $e');
    return null;
  }
});

final gisCacheServiceProvider = Provider<GisCacheService>(
  (ref) => GisCacheService(),
);

final gisLayerRepositoryProvider = Provider<GisLayerRepository>((ref) {
  final dio = ref.watch(_dioProvider);
  final cache = ref.watch(gisCacheServiceProvider);

  if (dio == null) {
    debugPrint('GIS: Dio kullanılamıyor — MockLayerRepository aktif');
    return MockGisLayerRepository();
  }

  return LiveGisLayerRepository(dio: dio, cache: cache);
});

final gisOfficialLayersProvider = Provider<List<GisLayerDescriptor>>(
  (ref) => officialRiskLayerPresets,
);

class _RateLimiter {
  final Map<String, DateTime> _lastRequest = {};
  static const _minInterval = Duration(milliseconds: 300);

  Future<void> waitIfNeeded(String host) async {
    final last = _lastRequest[host];
    if (last == null) {
      _lastRequest[host] = DateTime.now();
      return;
    }

    final elapsed = DateTime.now().difference(last);
    if (elapsed < _minInterval) {
      await Future<void>.delayed(_minInterval - elapsed);
    }

    _lastRequest[host] = DateTime.now();
  }
}

Future<GisFeatureCollection> _parseGeoJsonMainThread(String rawJson) async {
  try {
    final decoded = jsonDecode(rawJson) as Map<String, dynamic>;
    final type = decoded['type'] as String? ?? '';

    if (type == 'FeatureCollection') {
      return GisFeatureCollection.fromJson(decoded);
    }

    if (type == 'Feature') {
      final feature = GisFeature.fromJson(decoded);
      return GisFeatureCollection(features: [feature]);
    }

    if (decoded['features'] is List) {
      return GisFeatureCollection.fromJson(decoded);
    }

    return GisFeatureCollection.withError('Tanınmayan GeoJSON yapısı: $type');
  } catch (e) {
    debugPrint('GeoJSON ana iş parçacığı ayrıştırma hatası: $e');
    return GisFeatureCollection.withError('GeoJSON ayrıştırma hatası: $e');
  }
}

void _isolateEntry(SendPort mainSendPort) {
  final receivePort = ReceivePort();
  mainSendPort.send(receivePort.sendPort);

  receivePort.listen((message) {
    if (message is List && message.length == 2) {
      final rawJson = message[0] as String;
      final replyPort = message[1] as SendPort;

      try {
        final decoded = jsonDecode(rawJson) as Map<String, dynamic>;
        final type = decoded['type'] as String? ?? '';

        GisFeatureCollection result;
        if (type == 'FeatureCollection') {
          result = GisFeatureCollection.fromJson(decoded);
        } else if (type == 'Feature') {
          result = GisFeatureCollection(
            features: [GisFeature.fromJson(decoded)],
          );
        } else if (decoded['features'] is List) {
          result = GisFeatureCollection.fromJson(decoded);
        } else {
          result = GisFeatureCollection.withError(
            'Tanınmayan GeoJSON yapısı (isolate): $type',
          );
        }
        replyPort.send(result);
      } catch (e) {
        replyPort.send(
          GisFeatureCollection.withError('Isolate ayrıştırma hatası: $e'),
        );
      }
    }
  });
}

Future<GisFeatureCollection> parseGeoJsonInIsolate(String rawJson) async {
  try {
    final readyPort = ReceivePort();
    final isolate = await Isolate.spawn(_isolateEntry, readyPort.sendPort);

    final isolateSendPort = await readyPort.first as SendPort;
    final resultPort = ReceivePort();
    isolateSendPort.send([rawJson, resultPort.sendPort]);

    final result = await resultPort.first as GisFeatureCollection;
    readyPort.close();
    resultPort.close();
    isolate.kill();

    return result;
  } catch (e) {
    debugPrint(
      'Isolate GeoJSON ayrıştırma başarısız — ana iş parçacığına düşülüyor: $e',
    );
    return _parseGeoJsonMainThread(rawJson);
  }
}

class _GisHttpResponse {
  const _GisHttpResponse({
    this.body,
    this.statusCode = 200,
    this.contentType = '',
  });

  final String? body;
  final int statusCode;
  final String contentType;

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
  bool get isJson => contentType.contains('json');
}

class LiveGisLayerRepository implements GisLayerRepository {
  LiveGisLayerRepository({required Dio dio, GisCacheService? cache})
      : _dio = dio,
        _cache = cache,
        _rateLimiter = _RateLimiter();

  final Dio _dio;
  final GisCacheService? _cache;
  final _RateLimiter _rateLimiter;

  @override
  Future<List<GisLayerDescriptor>> availableLayers() async {
    await Future<void>.delayed(const Duration(milliseconds: 60));
    return officialRiskLayerPresets;
  }

  @override
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
    return buildGisRequestUrl(layer, query);
  }

  @override
  Future<GisFeatureCollection> fetchFeatures(
    GisLayerDescriptor layer,
    GisLayerQuery query,
  ) async {
    try {
      final cacheKey = buildCacheKey(layer, query);

      if (_cache != null) {
        final cached = await _cache.get(cacheKey);
        if (cached != null) return cached;
      }

      final url = buildGisRequestUrl(layer, query);
      final host = layer.endpoint.host;

      await _rateLimiter.waitIfNeeded(host);

      final response = await _fetchHttp(url);

      if (!response.isSuccess) {
        final collection = GisFeatureCollection.withError(
          'HTTP ${response.statusCode}: ${layer.name} katmanı yanıt vermedi',
        );
        debugPrint('GIS HTTP hatası: $url → ${response.statusCode}');
        return collection;
      }

      if (response.body == null || response.body!.isEmpty) {
        return const GisFeatureCollection(features: []);
      }

      final body = response.body!;
      final isJsonResponse = response.isJson ||
          body.trim().startsWith('{') ||
          body.trim().startsWith('[');

      if (!isJsonResponse) {
        return GisFeatureCollection(
          features: [],
          metadata: {
            'format': response.contentType,
            'info': 'Görüntü/ikili yanıt — ayrıştırma atlandı',
          },
        );
      }

      GisFeatureCollection collection;
      if (body.length > 50000) {
        collection = await parseGeoJsonInIsolate(body);
      } else {
        collection = await _parseGeoJsonMainThread(body);
      }

      if (_cache != null && !collection.hasError) {
        final ttl = layer.cacheTtl;
        await _cache.put(cacheKey, collection, ttl);
      }

      return collection;
    } on DioException catch (e) {
      debugPrint('GIS DioException: ${layer.name} → ${e.type} / ${e.message}');
      final message = switch (e.type) {
        DioExceptionType.connectionTimeout =>
          'Bağlantı zaman aşımı: ${layer.name}',
        DioExceptionType.receiveTimeout => 'Yanıt zaman aşımı: ${layer.name}',
        DioExceptionType.connectionError => 'Ağ bağlantısı yok: ${layer.name}',
        _ => 'Ağ hatası: ${layer.name} (${e.message})',
      };
      return GisFeatureCollection.withError(message);
    } catch (e) {
      debugPrint('GIS beklenmeyen hata: ${layer.name} → $e');
      return GisFeatureCollection.withError('GIS katman hatası: ${layer.name}');
    }
  }

  Future<_GisHttpResponse> _fetchHttp(String url) async {
    final response = await _dio.get<String>(
      url,
      options: Options(responseType: ResponseType.plain),
    );

    return _GisHttpResponse(
      body: response.data,
      statusCode: response.statusCode ?? 200,
      contentType: response.headers.value('content-type') ?? '',
    );
  }

  @override
  Future<String> fetchGeoJson(
    GisLayerDescriptor layer, {
    required double latitude,
    required double longitude,
  }) async {
    const padding = 0.03;
    final query = GisLayerQuery(
      bbox: GisBoundingBox(
        minLng: longitude - padding,
        minLat: latitude - padding,
        maxLng: longitude + padding,
        maxLat: latitude + padding,
      ),
      srs: 'EPSG:4326',
      format: layer.defaultFormat,
      maxFeatures: 200,
    );

    final collection = await fetchFeatures(layer, query);
    return jsonEncode(collection.toJson());
  }
}

class MockGisLayerRepository implements GisLayerRepository {
  @override
  Future<List<GisLayerDescriptor>> availableLayers() async {
    await Future<void>.delayed(const Duration(milliseconds: 40));
    return officialRiskLayerPresets;
  }

  @override
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query) {
    return buildGisRequestUrl(layer, query);
  }

  @override
  Future<GisFeatureCollection> fetchFeatures(
    GisLayerDescriptor layer,
    GisLayerQuery query,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return GisFeatureCollection.withError(
      'GIS sağlayıcısı kullanılamıyor: ${layer.name}',
    );
  }

  @override
  Future<String> fetchGeoJson(
    GisLayerDescriptor layer, {
    required double latitude,
    required double longitude,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 50));
    return jsonEncode(
      GisFeatureCollection.withError('Mock GIS layer: ${layer.name}').toJson(),
    );
  }
}
