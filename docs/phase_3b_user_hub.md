# Phase 3B User Hub

Phase 3B builds the user-facing Favoriler hub and notification center on top of
Phase 2A repository abstractions. All four hub sections remain fail-soft:
Firebase-backed when `Firebase.apps.isNotEmpty`, in-memory mock otherwise.

## Architecture

```
FavoritesScreen (ConsumerStatefulWidget)
  _TabStrip: Favoriler | Aramalar | Takip | Bildirimler
    _FavoriteParcelsTab    → FavoritesRepository
    _SavedSearchesTab      → SavedSearchRepository
    _FollowedParcelsTab    → FollowedParcelRepository
    _NotificationsTab      → mockNotificationsProvider + NotificationRepository
```

Standalone `NotificationsScreen` is also registered at `/notifications` for
deep-linking from push notifications (future).

## Repository wiring

| Tab | Repository Provider | Read | Write |
|---|---|---|---|
| Favori parseller | `favoritesRepositoryProvider` | `favorites()` | `addFavorite` / `removeFavorite` |
| Kayıtlı aramalar | `savedSearchRepositoryProvider` | `recentSearches()` | `saveSearch` (fire-on-search) |
| Takip edilen | `followedParcelRepositoryProvider` | `followedParcels()` | `followParcel` / `unfollowParcel` |
| Bildirimler | `notificationRepositoryProvider` | mock provider | `markAsRead` |

Each tab uses `FutureBuilder` with loading/error/empty states rendered via
`AppStateView` from the core widgets layer. Error states show a retry button.

## Favorite / follow affordances

**Parcel detail sheet** (`parcel_detail_sheet.dart`):
- `_FavoriteActionTile` — calls `FavoritesRepository.addFavorite(parcelId)`
  and shows a snackbar on success or failure.
- `_FollowActionTile` — calls `FollowedParcelRepository.followParcel(parcelId)`
  and shows a snackbar on success or failure.

**Search screen** (`parcel_search_screen.dart`):
- On valid query submit, calls `SavedSearchRepository.saveSearch(query)`.
- Recent searches section reads from `SavedSearchRepository.recentSearches()`
  via `FutureBuilder` with the badge reflecting live/error state.

## Notifications

**Domain**: `NotificationItem` with `id`, `type`, `title`, `message`,
`parcelId`, `parcelLabel`, `read`, `timestamp`.

**Mock data** (`mock_notifications.dart`): 6 hardcoded notifications covering:
- İmar plan değişikliği (zoningChange)
- Fiyat değişimi (priceChange)
- Yeni ilan (newListing)
- Risk değişimi (riskChange)
- AI yatırım önerileri (aiSuggestion)

**Card widget** (`NotificationCard`): Color-coded per type with relative
timestamps, unread dot indicator, and parcel link when available.

## Files modified / added

### New
- `lib/src/features/notifications/domain/notification_item.dart`
- `lib/src/features/notifications/presentation/mock_notifications.dart`
- `lib/src/features/notifications/presentation/notification_card.dart`
- `lib/src/features/notifications/presentation/notifications_screen.dart`

### Modified
- `lib/src/features/favorites/presentation/favorites_screen.dart` —
  rewritten as 4-tab hub screen with repository-backed lists.
- `lib/src/features/search/presentation/parcel_search_screen.dart` —
  converted to `ConsumerStatefulWidget`, wired `SavedSearchRepository`
  for fire-on-search and live recent-searches list.
- `lib/src/features/map/presentation/widgets/parcel_detail_sheet.dart` —
  converted to `ConsumerWidget`, added `_FavoriteActionTile` and
  `_FollowActionTile` with snackbar feedback.
- `lib/src/app/router/app_router.dart` — added `NotificationsRoute`
  (`/notifications`).

## Future realtime steps

1. **Stream-based lists**: Replace `FutureBuilder` snapshots with
   `StreamBuilder` or Riverpod `StreamProvider` for live sync when Firebase
   is active, so favorites/searches/follow lists update in realtime.
2. **FCM push integration**: Call `NotificationRepository.registerDeviceToken`
   on first launch / token refresh; route FCM data payloads to
   `/notifications` screen and add to `mockNotificationsProvider`.
3. **Notification action routing**: Tap on a parcel-linked notification should
   navigate to the parcel detail sheet (`/parcel-detail`).
4. **Followed parcel polling**: Periodically diff risk/zoning data for followed
   parcels and push new `NotificationItem` entries on change.
5. **Firestore composite indexes**: If querying `notifications` by
   `createdAt` + `read == false` is needed, add a composite index.
