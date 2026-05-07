import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:isar_flutter_libs/isar_flutter_libs.dart';
// ignore: depend_on_referenced_packages
import 'package:path_provider/path_provider.dart' as pp;

import '../../../features/map/domain/parcel.dart';
import '../models/isar_parcel.dart';

Isar? _isarInstance;

Future<Isar> initializeIsar() async {
  if (_isarInstance != null && _isarInstance!.isOpen) return _isarInstance!;
  await Isar.initializeIsarCore(download: true);
  final dir = await pp.getApplicationDocumentsDirectory();
  _isarInstance = await Isar.open([IsarParcelSchema], directory: dir.path, inspector: kDebugMode);
  return _isarInstance!;
}

final isarInstanceProvider = Provider<Future<Isar>>((ref) => initializeIsar());

final offlineParcelRepositoryProvider = Provider<OfflineParcelRepository>((ref) {
  return OfflineParcelRepository(ref.watch(isarInstanceProvider));
});

class OfflineParcelRepository {
  const OfflineParcelRepository(this._isarFuture);

  final Future<Isar> _isarFuture;

  Future<Isar> get db => _isarFuture;

  Future<IsarParcel?> _byBlockParcel(String block, String parcel) async {
    final isar = await db;
    return isar.isarParcels
        .where()
        .blockPlusParcelEqualTo('$block|$parcel')
        .findFirst();
  }

  Future<void> saveParcel(ParcelDetail parcel) async {
    final isar = await db;
    final existing = await _byBlockParcel(parcel.block, parcel.parcel);
    final now = DateTime.now();

    await isar.writeTxn(() async {
      if (existing != null) {
        existing.city = parcel.city;
        existing.district = parcel.district;
        existing.neighborhood = parcel.neighborhood;
        existing.titleType = parcel.titleType;
        existing.zoningStatus = parcel.zoningStatus;
        existing.taks = parcel.taks;
        existing.kaks = parcel.kaks;
        existing.emsal = parcel.emsal;
        existing.floorLimit = parcel.floorLimit;
        existing.coverageRatio = parcel.coverageRatio;
        existing.roadFrontage = parcel.roadFrontage;
        existing.cachedAt = now;
        existing.blockPlusParcel = '${parcel.block}|${parcel.parcel}';
        await isar.isarParcels.put(existing);
      } else {
        final entity = IsarParcel.fromParcelDetail(parcel)
          ..cachedAt = now
          ..lastAccessed = now;
        await isar.isarParcels.put(entity);
      }
    });
  }

  Future<ParcelDetail?> getParcel(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return null;
    final isar = await db;
    await isar.writeTxn(() async {
      entity.lastAccessed = DateTime.now();
      await isar.isarParcels.put(entity);
    });
    return entity.toParcelDetail();
  }

  Future<List<ParcelDetail>> getByDistrict(String district) async {
    final isar = await db;
    final entities = await isar.isarParcels
        .where()
        .districtEqualTo(district)
        .findAll();
    return entities.map((e) => e.toParcelDetail()).toList();
  }

  Future<List<ParcelDetail>> getFavorites() async {
    final isar = await db;
    final entities = await isar.isarParcels
        .where()
        .isFavoriteEqualTo(true)
        .findAll();
    return entities.map((e) => e.toParcelDetail()).toList();
  }

  Future<List<ParcelDetail>> getFollowed() async {
    final isar = await db;
    final entities = await isar.isarParcels
        .where()
        .isFollowedEqualTo(true)
        .findAll();
    return entities.map((e) => e.toParcelDetail()).toList();
  }

  Future<List<ParcelDetail>> getRecent(int limit) async {
    final isar = await db;
    final entities = await isar.isarParcels
        .where()
        .lastAccessedIsNotNull()
        .sortByLastAccessedDesc()
        .limit(limit)
        .findAll();
    return entities.map((e) => e.toParcelDetail()).toList();
  }

  Future<void> toggleFavorite(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return;
    final isar = await db;
    await isar.writeTxn(() async {
      entity.isFavorite = !entity.isFavorite;
      await isar.isarParcels.put(entity);
    });
  }

  Future<void> toggleFollow(String block, String parcel) async {
    final entity = await _byBlockParcel(block, parcel);
    if (entity == null) return;
    final isar = await db;
    await isar.writeTxn(() async {
      entity.isFollowed = !entity.isFollowed;
      await isar.isarParcels.put(entity);
    });
  }

  Future<List<ParcelDetail>> search(String query) async {
    final isar = await db;
    final lowerQuery = query.toLowerCase();
    final results = <IsarParcel>[];
    final seen = <int>{};

    void addAll(List<IsarParcel> list) {
      for (final e in list) {
        if (seen.add(e.id)) results.add(e);
      }
    }

    addAll(await isar.isarParcels.where().neighborhoodContains(lowerQuery, caseSensitive: false).findAll());
    addAll(await isar.isarParcels.where().districtContains(lowerQuery, caseSensitive: false).findAll());
    addAll(await isar.isarParcels.where().blockContains(lowerQuery, caseSensitive: false).findAll());
    addAll(await isar.isarParcels.where().parcelContains(lowerQuery, caseSensitive: false).findAll());

    return results.map((e) => e.toParcelDetail()).toList();
  }

  Future<bool> get isEmpty async {
    final isar = await db;
    return isar.isarParcels.count() == 0;
  }

  Future<int> get count async {
    final isar = await db;
    return isar.isarParcels.count();
  }

  Future<void> pruneStaleParcels() async {
    final isar = await db;
    final cutoff = DateTime.now().subtract(const Duration(days: 90));
    await isar.writeTxn(() async {
      await isar.isarParcels.where().cachedAtBefore(cutoff).deleteAll();
    });
  }

  Future<void> deleteAll() async {
    final isar = await db;
    await isar.writeTxn(() => isar.isarParcels.clear());
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
    final isar = await repo.db;
    final entity = IsarParcel(
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
    );
    await isar.writeTxn(() => isar.isarParcels.put(entity));
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
