import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/map/domain/parcel.dart';
import '../models/isar_parcel.dart';

final InMemoryParcelStore _parcelStore = InMemoryParcelStore();

Future<InMemoryParcelStore> initializeIsar() async => _parcelStore;

final isarInstanceProvider = Provider<Future<InMemoryParcelStore>>((ref) => initializeIsar());

final offlineParcelRepositoryProvider = Provider<OfflineParcelRepository>((ref) {
  return OfflineParcelRepository(ref.watch(isarInstanceProvider));
});

class InMemoryParcelStore {
  final List<IsarParcel> parcels = [];
}

class OfflineParcelRepository {
  const OfflineParcelRepository(this._storeFuture);

  final Future<InMemoryParcelStore> _storeFuture;

  Future<InMemoryParcelStore> get db => _storeFuture;

  Future<IsarParcel?> _byBlockParcel(String block, String parcel) async {
    final store = await db;
    for (final entity in store.parcels) {
      if (entity.block == block && entity.parcel == parcel) return entity;
    }
    return null;
  }

  Future<void> saveParcel(ParcelDetail parcel) async {
    final store = await db;
    final existing = await _byBlockParcel(parcel.block, parcel.parcel);
    final now = DateTime.now();

    if (existing != null) {
      existing.updateFromParcelDetail(parcel);
      existing.cachedAt = now;
      existing.lastAccessed = now;
    } else {
      store.parcels.add(
        IsarParcel.fromParcelDetail(parcel)
          ..cachedAt = now
          ..lastAccessed = now,
      );
    }
  }

  Future<ParcelDetail?> getParcel(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return null;
    entity.lastAccessed = DateTime.now();
    return entity.toParcelDetail();
  }

  Future<List<ParcelDetail>> getByDistrict(String district) async {
    final store = await db;
    return store.parcels.where((e) => e.district == district).map((e) => e.toParcelDetail()).toList(growable: false);
  }

  Future<List<ParcelDetail>> getFavorites() async {
    final store = await db;
    return store.parcels.where((e) => e.isFavorite).map((e) => e.toParcelDetail()).toList(growable: false);
  }

  Future<List<ParcelDetail>> getFollowed() async {
    final store = await db;
    return store.parcels.where((e) => e.isFollowed).map((e) => e.toParcelDetail()).toList(growable: false);
  }

  Future<List<ParcelDetail>> getRecent(int limit) async {
    final store = await db;
    final entities = store.parcels.where((e) => e.lastAccessed != null).toList(growable: false)
      ..sort((a, b) => b.lastAccessed!.compareTo(a.lastAccessed!));
    return entities.take(limit).map((e) => e.toParcelDetail()).toList(growable: false);
  }

  Future<void> toggleFavorite(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return;
    entity.isFavorite = !entity.isFavorite;
  }

  Future<void> toggleFollow(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return;
    entity.isFollowed = !entity.isFollowed;
  }

  Future<List<ParcelDetail>> search(String query) async {
    final store = await db;
    final lowerQuery = query.toLowerCase();
    return store.parcels
        .where((e) => e.neighborhood.toLowerCase().contains(lowerQuery) || e.district.toLowerCase().contains(lowerQuery) || e.block.toLowerCase().contains(lowerQuery) || e.parcel.toLowerCase().contains(lowerQuery))
        .map((e) => e.toParcelDetail())
        .toList(growable: false);
  }

  Future<bool> get isEmpty async {
    final store = await db;
    return store.parcels.isEmpty;
  }

  Future<int> get count async {
    final store = await db;
    return store.parcels.length;
  }

  Future<void> pruneStaleParcels() async {
    final store = await db;
    final cutoff = DateTime.now().subtract(const Duration(days: 90));
    store.parcels.removeWhere((e) => e.cachedAt != null && e.cachedAt!.isBefore(cutoff));
  }

  Future<void> deleteAll() async {
    final store = await db;
    store.parcels.clear();
  }
}

Future<void> seedInitialParcelData(OfflineParcelRepository repo) async {
  if (!await repo.isEmpty) return;

  final now = DateTime.now();
  final rng = Random(42);

  Future<void> seed({
    required String city,
    required String district,
    required String neighborhood,
    required String block,
    required String parcel,
    required String titleType,
    required String zoningStatus,
    required double taks,
    required double kaks,
    required double emsal,
    required int floorLimit,
    required String coverageRatio,
    required double roadFrontage,
    bool isFavorite = false,
    bool isFollowed = false,
  }) async {
    final store = await repo.db;
    store.parcels.add(
      IsarParcel(
        city: city,
        district: district,
        neighborhood: neighborhood,
        block: block,
        parcel: parcel,
        titleType: titleType,
        zoningStatus: zoningStatus,
        taks: taks,
        kaks: kaks,
        emsal: emsal,
        floorLimit: floorLimit,
        coverageRatio: coverageRatio,
        roadFrontage: roadFrontage,
        isFavorite: isFavorite,
        isFollowed: isFollowed,
        cachedAt: now.subtract(Duration(days: rng.nextInt(14))),
        lastAccessed: now.subtract(Duration(days: rng.nextInt(7))),
      ),
    );
  }

  await seed(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe', block: '1247', parcel: '18', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: 0.35, kaks: 1.75, emsal: 1.75, floorLimit: 8, coverageRatio: '%35', roadFrontage: 28.4, isFavorite: true, isFollowed: true);
  await seed(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caddebostan', block: '1425', parcel: '3', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.25, kaks: 1.25, emsal: 1.25, floorLimit: 5, coverageRatio: '%25', roadFrontage: 22.1, isFavorite: true);
  await seed(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Göztepe', block: '1331', parcel: '12', titleType: 'Arsa', zoningStatus: 'Ticaret', taks: 0.40, kaks: 2.00, emsal: 2.00, floorLimit: 10, coverageRatio: '%40', roadFrontage: 35.2);
  await seed(city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Göztepe', block: '1288', parcel: '7', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.30, kaks: 1.50, emsal: 1.50, floorLimit: 6, coverageRatio: '%30', roadFrontage: 18.5, isFollowed: true);
  await seed(city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Etiler', block: '2125', parcel: '22', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: 0.40, kaks: 2.50, emsal: 2.50, floorLimit: 12, coverageRatio: '%40', roadFrontage: 42.0, isFavorite: true, isFollowed: true);
  await seed(city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Levent', block: '2750', parcel: '8', titleType: 'Arsa', zoningStatus: 'Ticaret', taks: 0.50, kaks: 3.50, emsal: 3.50, floorLimit: 18, coverageRatio: '%50', roadFrontage: 55.3, isFavorite: true);
  await seed(city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Bebek', block: '3001', parcel: '5', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.20, kaks: 1.00, emsal: 1.00, floorLimit: 4, coverageRatio: '%20', roadFrontage: 15.8, isFollowed: true);
  await seed(city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Bebek', block: '3001', parcel: '11', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.15, kaks: 0.50, emsal: 0.50, floorLimit: 2, coverageRatio: '%15', roadFrontage: 12.0);
  await seed(city: 'Ankara', district: 'Çankaya', neighborhood: 'Çukurambar', block: '5890', parcel: '31', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: 0.35, kaks: 2.00, emsal: 2.00, floorLimit: 10, coverageRatio: '%35', roadFrontage: 30.0, isFavorite: true, isFollowed: true);
  await seed(city: 'Ankara', district: 'Çankaya', neighborhood: 'Çukurambar', block: '5905', parcel: '15', titleType: 'Arsa', zoningStatus: 'Ticaret', taks: 0.45, kaks: 3.00, emsal: 3.00, floorLimit: 15, coverageRatio: '%45', roadFrontage: 48.7);
  await seed(city: 'Ankara', district: 'Çankaya', neighborhood: 'GOP', block: '4102', parcel: '9', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.25, kaks: 1.20, emsal: 1.20, floorLimit: 5, coverageRatio: '%25', roadFrontage: 20.4);
  await seed(city: 'Ankara', district: 'Çankaya', neighborhood: 'Oran', block: '6201', parcel: '27', titleType: 'Arsa', zoningStatus: 'Konut', taks: 0.30, kaks: 1.80, emsal: 1.80, floorLimit: 7, coverageRatio: '%30', roadFrontage: 25.6, isFavorite: true);
  await seed(city: 'Ankara', district: 'Çankaya', neighborhood: 'Oran', block: '6240', parcel: '42', titleType: 'Arsa', zoningStatus: 'Konut + Ticaret', taks: 0.35, kaks: 2.20, emsal: 2.20, floorLimit: 11, coverageRatio: '%35', roadFrontage: 38.1, isFollowed: true);
}
