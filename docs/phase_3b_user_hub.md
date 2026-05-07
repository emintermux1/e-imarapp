# Phase 3B — User Hub

## Summary

Premium 4-tab user hub reimplementing the favorites screen with notifications integration, favorite/follow hooks from parcel detail, and saved-search persistence from parcel search.

## Files Modified

### `apps/e_imar_mobile/lib/src/features/favorites/presentation/favorites_screen.dart`
Rewritten from a single-scroll workspace into a `DefaultTabController`-driven 4-tab hub:
- **Favori parseller** — mock favorite parcel cards with metric badges and action rows
- **Kayıtlı aramalar** — saved search tiles with frequency badges
- **Takip edilen parseller** — watched parcels with change indicators
- **Bildirim merkezi** — notification cards via `mockNotificationsProvider` with mark-all-read affordance

### `apps/e_imar_mobile/lib/src/features/notifications/**` (new)
- `domain/notification_item.dart` — `NotificationItem` model with 5 types: `zoningChange`, `priceChange`, `newListing`, `riskChange`, `aiSuggestion`; includes `relativeTime` getter
- `data/mock_notifications_source.dart` — `MockNotificationsSource` with 6 seeded notifications; exposed via `mockNotificationsProvider`
- `presentation/notification_card.dart` — type-aware card widget with icon/color mapping and unread dot
- `presentation/notifications_screen.dart` — standalone full-screen notification list with "tümünü okundu say" button

### `apps/e_imar_mobile/lib/src/features/map/presentation/widgets/parcel_detail_sheet.dart`
Added favorite/follow toggle hooks:
- "Favoriye Ekle" calls `favoritesRepositoryProvider` to add/remove with snackbar feedback
- "Takibe Al" calls `followedParcelRepositoryProvider` to follow/unfollow with snackbar feedback
- Both actions use `ProviderScope.containerOf(context)` to resolve Riverpod refs from a non-ConsumerWidget context
- Fail-soft: errors display a generic snackbar without crashing


### `apps/e_imar_mobile/lib/src/features/search/presentation/parcel_search_screen.dart`
- Converted from `StatefulWidget` to `ConsumerStatefulWidget` for Riverpod access
- On successful validation, saves the query string to `savedSearchRepositoryProvider` with silent `.catchError((_) {})` (fail-soft)
- Parcel mode saves `"İstanbul / Kadıköy / Fenerbahçe <ada>/<parsel>"`
- Coordinate mode saves `"Koordinat: <lat>, <lng>"`

### `apps/e_imar_mobile/lib/src/app/router/app_router.dart`
- Added `NotificationsRoute` (`/notifications`) with slide transition
- Added import for `NotificationsScreen`

## Architecture Notes

- All repositories (`FavoritesRepository`, `SavedSearchRepository`, `FollowedParcelRepository`) use the fail-soft provider pattern from Phase 2A — real Firebase when available, mock in-memory otherwise
- Notifications use a standalone `mockNotificationsProvider` independent of Firebase's `NotificationRepository` (which handles device tokens / push)
- No new dependencies, generated files, or theme changes
- All mock data is self-contained within each feature; no cross-feature coupling beyond repository interfaces

## Scope Boundary

- ✅ May modify: `features/favorites/**`, `features/search/**` (saved-search only), `features/map/.../parcel_detail_sheet.dart` (minimal), `features/notifications/**`, router (minimal), `docs/`
- ❌ Did NOT modify: auth repository internals, GIS/analysis, valuation, PDF service, emsal feature, design tokens/theme/widgets, README, CHANGELOG
