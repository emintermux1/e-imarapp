# Phase 2A Firebase integration seams

Phase 2A adds production Firebase seams without changing UI flows. The app remains fail-soft: repository providers use Firebase only when `Firebase.apps.isNotEmpty`; otherwise they keep using in-memory mock repositories so local/dev runs without Firebase config do not crash.

## Setup

- Keep Firebase initialization in `lib/main.dart` gated by `AppConfig.firebaseEnabled`.
- Provide platform Firebase config (`firebase_options.dart` plus native `google-services.json` / `GoogleService-Info.plist`) outside source secrets.
- Enable Firebase Auth providers in the Firebase console: Google, Apple, and Phone.
- Configure Google OAuth clients and Apple Sign in capabilities/Services ID per platform.

## Auth behavior

`authRepositoryProvider` selects:

- `FirebaseAuthRepository` when a Firebase app is initialized.
- `MockAuthRepository` when Firebase is disabled or initialization failed.

`FirebaseAuthRepository` maps Firebase `User` to `AuthUser` with `id`, `displayName`, `photoUrl`, and `phone`. SDK exceptions are translated to `AuthException` messages. Google and phone OTP are implemented with Firebase Auth credentials. Apple uses `sign_in_with_apple` and Firebase `apple.com` OAuth credentials; nonce hashing is the remaining hardening step before production App Store release if Apple/Firebase project settings require explicit nonce validation.

## Firestore paths

Firestore-backed user-data repositories use the existing rules-compatible user scope:

- `users/{uid}` for profile and device token metadata.
- `users/{uid}/favorites/{parcelId}` for favorite parcels.
- `users/{uid}/savedSearches/{autoId}` for saved searches.
- `users/{uid}/followedParcels/{parcelId}` for followed parcels.
- `users/{uid}/notifications/{notificationId}` for notification read updates.

The providers in `lib/src/core/services/firebase_repositories.dart` mirror auth fallback behavior and return `MockUserDataRepository` when Firebase is not initialized.

## Remaining production steps

- Add native Firebase config files through secure app distribution/CI, not committed secrets.
- Validate Apple Sign in on physical iOS/macOS targets and add explicit nonce generation/hashing if required by the configured Apple provider.
- Add Firestore composite indexes only if future queries introduce additional filters beyond `createdAt` ordering.
- Add emulator or integration tests once Firebase emulator wiring exists in CI.
