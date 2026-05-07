class UserProfile {
  const UserProfile({required this.id, required this.displayName, this.avatarUrl});
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

class MockUserDataRepository implements UserProfileRepository, FavoritesRepository, SavedSearchRepository, FollowedParcelRepository, NotificationRepository {
  final _favorites = <String>[];
  final _searches = <String>[];
  final _followed = <String>[];

  @override
  Future<void> addFavorite(String parcelId) async => _favorites.add(parcelId);
  @override
  Future<List<String>> favorites() async => List.unmodifiable(_favorites);
  @override
  Future<void> removeFavorite(String parcelId) async => _favorites.remove(parcelId);
  @override
  Future<List<String>> recentSearches() async => List.unmodifiable(_searches);
  @override
  Future<void> saveSearch(String query) async => _searches.add(query);
  @override
  Future<List<String>> followedParcels() async => List.unmodifiable(_followed);
  @override
  Future<void> followParcel(String parcelId) async => _followed.add(parcelId);
  @override
  Future<void> unfollowParcel(String parcelId) async => _followed.remove(parcelId);
  @override
  Future<UserProfile?> currentProfile() async => const UserProfile(id: 'mock-user', displayName: 'E-İmar Kullanıcısı');
  @override
  Future<void> saveProfile(UserProfile profile) async {}
  @override
  Future<void> markAsRead(String notificationId) async {}
  @override
  Future<void> registerDeviceToken(String token) async {}
}
