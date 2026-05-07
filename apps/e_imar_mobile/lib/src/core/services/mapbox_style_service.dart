import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../features/map/domain/parcel.dart';

enum MapboxStylePreset { satellite, streets, light, dark }

class MapboxStyleService {
  MapboxStyleService._();

  static String styleUrl(MapboxStylePreset preset) => switch (preset) {
        MapboxStylePreset.satellite => 'mapbox://styles/mapbox/satellite-streets-v12',
        MapboxStylePreset.streets => 'mapbox://styles/mapbox/streets-v12',
        MapboxStylePreset.light => 'mapbox://styles/mapbox/light-v11',
        MapboxStylePreset.dark => 'mapbox://styles/mapbox/dark-v11',
      };

  static MapboxStylePreset current = MapboxStylePreset.satellite;
}

final mapboxStyleProvider = StateProvider<MapboxStylePreset>((_) => MapboxStyleService.current);

class MapboxCameraHelper {
  MapboxCameraHelper._();

  static mapbox.MapboxMap? _map;

  static void attach(mapbox.MapboxMap map) {
    _map = map;
  }

  static Future<void> animateTo(double lat, double lng, {double zoom = 15, double bearing = 0, double pitch = 0}) async {
    final map = _map;
    if (map == null) return;
    await map.flyTo(
      mapbox.CameraOptions(
        center: mapbox.Point(coordinates: mapbox.Position(lng, lat)),
        zoom: zoom,
        bearing: bearing,
        pitch: pitch,
      ),
      const mapbox.MapAnimationOptions(duration: 1800, startDelay: 0),
    );
  }

  static Future<void> flyToParcel(ParcelDetail parcel) async {
    await animateTo(41.0082, 28.9784);
  }
}

class ParcelHitTestHelper {
  ParcelHitTestHelper._();

  static ParcelDetail hitTest(double lat, double lng) {
    final col = ((lng + 180) / 360 * 7).floor();
    final row = ((lat + 90) / 180 * 11).floor();
    final seed = col * 13 + row * 7;
    final rng = _PseudoRandom(seed);

    final isKadikoy = lng > 29.0;
    final district = isKadikoy ? 'Kadıköy' : 'Beşiktaş';
    final neighborhoods = isKadikoy
        ? const ['Fenerbahçe', 'Caddebostan', 'Göztepe', 'Erenköy', 'Suadiye']
        : const ['Levent', 'Etiler', 'Bebek', 'Arnavutköy', 'Ortaköy'];
    final zoningStatuses = const ['Konut', 'Konut + Ticaret', 'Ticaret', 'Sanayi', 'Turizm'];
    final titleTypes = const ['Arsa', 'Arsa', 'Arsa', 'Bina', 'Konut'];

    final block = (1000 + rng.nextInt(500)).toString();
    final parcelNo = (1 + rng.nextInt(99)).toString();
    final taks = 0.15 + rng.nextDouble() * 0.45;
    final emsal = (0.5 + rng.nextDouble() * 3.0);
    final floorLimit = (2 + rng.nextInt(28));
    final roadFrontage = 8.0 + rng.nextDouble() * 42.0;

    return ParcelDetail(
      city: 'İstanbul',
      district: district,
      neighborhood: neighborhoods[rng.nextInt(neighborhoods.length)],
      block: block,
      parcel: parcelNo,
      titleType: titleTypes[rng.nextInt(titleTypes.length)],
      zoningStatus: zoningStatuses[rng.nextInt(zoningStatuses.length)],
      taks: double.parse(taks.toStringAsFixed(2)),
      kaks: emsal,
      emsal: emsal,
      floorLimit: floorLimit,
      coverageRatio: '%${(taks * 100).toStringAsFixed(0)}',
      roadFrontage: double.parse(roadFrontage.toStringAsFixed(1)),
    );
  }
}

class _PseudoRandom {
  _PseudoRandom(this._seed);
  int _seed;

  int nextInt(int max) {
    _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
    return _seed % max;
  }

  double nextDouble() {
    _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
    return _seed / 0x7fffffff;
  }
}
