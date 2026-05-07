import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserProfile {
  const UserProfile(
      {required this.id, required this.displayName, this.avatarUrl});
  final String id;
  final String displayName;
  final String? avatarUrl;
}

abstract interface class UserProfileRepository {
  Future<UserProfile?> currentProfile();
  Future<void> saveProfile(UserProfile profile);
}

abstract interface class FavoritesRepository {
  Future<List<String>> favorites();
  Future<void> addFavorite(String parcelId);
  Future<void> removeFavorite(String parcelId);
}

abstract interface class SavedSearchRepository {
  Future<List<String>> recentSearches();
  Future<void> saveSearch(String query);
}

abstract interface class FollowedParcelRepository {
  Future<List<String>> followedParcels();
  Future<void> followParcel(String parcelId);
  Future<void> unfollowParcel(String parcelId);
}

abstract interface class NotificationRepository {
  Future<void> registerDeviceToken(String token);
  Future<void> markAsRead(String notificationId);
}

final mockUserDataRepositoryProvider =
    Provider<MockUserDataRepository>((_) => MockUserDataRepository());

final userProfileRepositoryProvider = Provider<UserProfileRepository>(
  (ref) => _userDataRepository<UserProfileRepository>(ref),
);
final favoritesRepositoryProvider = Provider<FavoritesRepository>(
  (ref) => _userDataRepository<FavoritesRepository>(ref),
);
final savedSearchRepositoryProvider = Provider<SavedSearchRepository>(
  (ref) => _userDataRepository<SavedSearchRepository>(ref),
);
final followedParcelRepositoryProvider = Provider<FollowedParcelRepository>(
  (ref) => _userDataRepository<FollowedParcelRepository>(ref),
);
final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => _userDataRepository<NotificationRepository>(ref),
);

T _userDataRepository<T>(Ref ref) {
  final Object repository = Firebase.apps.isNotEmpty
      ? FirebaseUserDataRepository()
      : ref.watch(mockUserDataRepositoryProvider);
  return repository as T;
}

class UserDataException implements Exception {
  const UserDataException(this.message);
  final String message;

  @override
  String toString() => message;
}

class FirebaseUserDataRepository
    implements
        UserProfileRepository,
        FavoritesRepository,
        SavedSearchRepository,
        FollowedParcelRepository,
        NotificationRepository {
  FirebaseUserDataRepository({
    FirebaseFirestore? firestore,
    firebase_auth.FirebaseAuth? firebaseAuth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _firebaseAuth = firebaseAuth ?? firebase_auth.FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final firebase_auth.FirebaseAuth _firebaseAuth;

  DocumentReference<Map<String, dynamic>> get _userDoc =>
      _firestore.collection('users').doc(_uid);
  CollectionReference<Map<String, dynamic>> get _favorites =>
      _userDoc.collection('favorites');
  CollectionReference<Map<String, dynamic>> get _savedSearches =>
      _userDoc.collection('savedSearches');
  CollectionReference<Map<String, dynamic>> get _followedParcels =>
      _userDoc.collection('followedParcels');
  CollectionReference<Map<String, dynamic>> get _notifications =>
      _userDoc.collection('notifications');

  String get _uid {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw const UserDataException('Oturum açmış kullanıcı bulunamadı.');
    }
    return uid;
  }

  @override
  Future<UserProfile?> currentProfile() async {
    try {
      final snapshot = await _userDoc.get();
      final data = snapshot.data();
      if (data == null) {
        final user = _firebaseAuth.currentUser;
        if (user == null) return null;
        return UserProfile(
          id: user.uid,
          displayName: user.displayName?.trim().isNotEmpty == true
              ? user.displayName!.trim()
              : user.phoneNumber ?? user.email ?? 'E-İmar Kullanıcısı',
          avatarUrl: user.photoURL,
        );
      }
      return UserProfile(
        id: snapshot.id,
        displayName: (data['displayName'] as String?)?.trim().isNotEmpty == true
            ? (data['displayName'] as String).trim()
            : 'E-İmar Kullanıcısı',
        avatarUrl: data['avatarUrl'] as String?,
      );
    } on UserDataException {
      rethrow;
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Profil yüklenemedi.'),
      );
    } catch (_) {
      throw const UserDataException('Profil yüklenemedi.');
    }
  }

  @override
  Future<void> saveProfile(UserProfile profile) async {
    try {
      if (profile.id != _uid) {
        throw const UserDataException(
          'Profil yalnızca oturum kullanıcısı için kaydedilebilir.',
        );
      }
      await _userDoc.set({
        'displayName': profile.displayName,
        'avatarUrl': profile.avatarUrl,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } on UserDataException {
      rethrow;
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Profil kaydedilemedi.'),
      );
    } catch (_) {
      throw const UserDataException('Profil kaydedilemedi.');
    }
  }

  @override
  Future<List<String>> favorites() async => _idsFrom(
        _favorites.orderBy('createdAt', descending: true),
        'Favoriler yüklenemedi.',
      );

  @override
  Future<void> addFavorite(String parcelId) async => _setParcelDoc(
        _favorites.doc(_safeDocId(parcelId)),
        parcelId,
        'Favori eklenemedi.',
      );

  @override
  Future<void> removeFavorite(String parcelId) async => _deleteDoc(
        _favorites.doc(_safeDocId(parcelId)),
        'Favori kaldırılamadı.',
      );

  @override
  Future<List<String>> recentSearches() async {
    try {
      final snapshot = await _savedSearches
          .orderBy('createdAt', descending: true)
          .limit(20)
          .get();
      return snapshot.docs
          .map((doc) => doc.data()['query'] as String?)
          .whereType<String>()
          .toList(growable: false);
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Kayıtlı aramalar yüklenemedi.'),
      );
    } catch (_) {
      throw const UserDataException('Kayıtlı aramalar yüklenemedi.');
    }
  }

  @override
  Future<void> saveSearch(String query) async {
    final normalizedQuery = query.trim();
    if (normalizedQuery.isEmpty) return;
    try {
      await _savedSearches.add({
        'query': normalizedQuery,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Arama kaydedilemedi.'),
      );
    } catch (_) {
      throw const UserDataException('Arama kaydedilemedi.');
    }
  }

  @override
  Future<List<String>> followedParcels() async => _idsFrom(
        _followedParcels.orderBy('createdAt', descending: true),
        'Takip edilen parseller yüklenemedi.',
      );

  @override
  Future<void> followParcel(String parcelId) async => _setParcelDoc(
        _followedParcels.doc(_safeDocId(parcelId)),
        parcelId,
        'Parsel takip edilemedi.',
      );

  @override
  Future<void> unfollowParcel(String parcelId) async => _deleteDoc(
        _followedParcels.doc(_safeDocId(parcelId)),
        'Parsel takipten çıkarılamadı.',
      );

  @override
  Future<void> registerDeviceToken(String token) async {
    final normalizedToken = token.trim();
    if (normalizedToken.isEmpty) return;
    try {
      await _userDoc.set({
        'deviceTokens': FieldValue.arrayUnion([normalizedToken]),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Bildirim cihaz kaydı yapılamadı.'),
      );
    } catch (_) {
      throw const UserDataException('Bildirim cihaz kaydı yapılamadı.');
    }
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    try {
      await _notifications.doc(_safeDocId(notificationId)).update({
        'read': true,
        'readAt': FieldValue.serverTimestamp(),
      });
    } on FirebaseException catch (error) {
      throw UserDataException(
        _firestoreMessage(error, 'Bildirim güncellenemedi.'),
      );
    } catch (_) {
      throw const UserDataException('Bildirim güncellenemedi.');
    }
  }

  Future<List<String>> _idsFrom(
    Query<Map<String, dynamic>> query,
    String fallbackMessage,
  ) async {
    try {
      final snapshot = await query.get();
      return snapshot.docs
          .map((doc) => (doc.data()['parcelId'] as String?) ?? doc.id)
          .toList(growable: false);
    } on FirebaseException catch (error) {
      throw UserDataException(_firestoreMessage(error, fallbackMessage));
    } catch (_) {
      throw UserDataException(fallbackMessage);
    }
  }

  Future<void> _setParcelDoc(
    DocumentReference<Map<String, dynamic>> doc,
    String parcelId,
    String fallbackMessage,
  ) async {
    final normalizedParcelId = parcelId.trim();
    if (normalizedParcelId.isEmpty) return;
    try {
      await doc.set({
        'parcelId': normalizedParcelId,
        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } on FirebaseException catch (error) {
      throw UserDataException(_firestoreMessage(error, fallbackMessage));
    } catch (_) {
      throw UserDataException(fallbackMessage);
    }
  }

  Future<void> _deleteDoc(
    DocumentReference<Map<String, dynamic>> doc,
    String fallbackMessage,
  ) async {
    try {
      await doc.delete();
    } on FirebaseException catch (error) {
      throw UserDataException(_firestoreMessage(error, fallbackMessage));
    } catch (_) {
      throw UserDataException(fallbackMessage);
    }
  }
}

class MockUserDataRepository
    implements
        UserProfileRepository,
        FavoritesRepository,
        SavedSearchRepository,
        FollowedParcelRepository,
        NotificationRepository {
  final _favorites = <String>[];
  final _searches = <String>[];
  final _followed = <String>[];

  @override
  Future<void> addFavorite(String parcelId) async {
    if (!_favorites.contains(parcelId)) {
      _favorites.add(parcelId);
    }
  }

  @override
  Future<List<String>> favorites() async => List.unmodifiable(_favorites);

  @override
  Future<void> removeFavorite(String parcelId) async =>
      _favorites.remove(parcelId);

  @override
  Future<List<String>> recentSearches() async => List.unmodifiable(_searches);

  @override
  Future<void> saveSearch(String query) async {
    if (query.trim().isNotEmpty) {
      _searches.add(query.trim());
    }
  }

  @override
  Future<List<String>> followedParcels() async => List.unmodifiable(_followed);

  @override
  Future<void> followParcel(String parcelId) async {
    if (!_followed.contains(parcelId)) {
      _followed.add(parcelId);
    }
  }

  @override
  Future<void> unfollowParcel(String parcelId) async =>
      _followed.remove(parcelId);

  @override
  Future<UserProfile?> currentProfile() async =>
      const UserProfile(id: 'mock-user', displayName: 'E-İmar Kullanıcısı');

  @override
  Future<void> saveProfile(UserProfile profile) async {}

  @override
  Future<void> markAsRead(String notificationId) async {}

  @override
  Future<void> registerDeviceToken(String token) async {}
}

String _safeDocId(String value) => value.trim().replaceAll('/', '_');

String _firestoreMessage(FirebaseException error, String fallback) {
  switch (error.code) {
    case 'permission-denied':
      return 'Bu işlem için kullanıcı yetkisi bulunamadı.';
    case 'unavailable':
      return 'Firebase şu anda kullanılamıyor. Lütfen tekrar deneyin.';
    case 'not-found':
      return 'İstenen kayıt bulunamadı.';
    default:
      return fallback;
  }
}
