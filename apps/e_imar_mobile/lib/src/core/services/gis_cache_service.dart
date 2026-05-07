import 'dart:collection';

import 'gis_layers.dart';

class _CacheEntry {
  const _CacheEntry({required this.features, required this.expiresAt});
  final GisFeatureCollection features;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

String buildCacheKey(GisLayerDescriptor layer, GisLayerQuery query) {
  return Uri.encodeComponent(
      '${layer.id}|${query.toBboxString()}|${query.srs}');
}

class GisCacheService {
  final LinkedHashMap<String, _CacheEntry> _store =
      LinkedHashMap<String, _CacheEntry>();

  Future<GisFeatureCollection?> get(String cacheKey) async {
    final entry = _store[cacheKey];
    if (entry == null) return null;
    if (entry.isExpired) {
      _store.remove(cacheKey);
      return null;
    }
    return entry.features;
  }

  Future<void> put(
      String cacheKey, GisFeatureCollection features, Duration ttl) async {
    _store[cacheKey] = _CacheEntry(
      features: features,
      expiresAt: DateTime.now().add(ttl),
    );
  }

  Future<void> invalidate(String layerId) async {
    _store.removeWhere((key, _) => key.contains(layerId));
  }

  Future<void> pruneExpired() async {
    _store.removeWhere((_, entry) => entry.isExpired);
  }

  int get entryCount => _store.length;

  Future<void> clear() async => _store.clear();
}
