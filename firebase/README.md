# Firebase setup

Phase 1 ships safe placeholders only. The app must run without a real Firebase project.

## Steps for a real environment

1. Create separate Firebase projects for development, staging, and production.
2. Enable Authentication providers: Google, Apple, Phone.
3. Enable Firestore, Storage, Cloud Messaging, Crashlytics, and Remote Config.
4. Install FlutterFire CLI and generate platform configs inside `apps/e_imar_mobile`:

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=<project-id>
```

5. Replace the checked-in placeholder `lib/firebase_options.dart` with generated options, or keep environment-specific generated files outside source control and inject at build time.
6. Deploy rules:

```bash
firebase deploy --only firestore:rules,storage
```

## Environment variables

See `../.env.example`. Do not commit real Firebase, Mapbox, OpenAI, Grok, or real-estate partner credentials.

## Collections prepared by Phase 1

- `users/{uid}`: profile metadata
- `users/{uid}/favorites/{parcelId}`
- `users/{uid}/savedSearches/{searchId}`
- `users/{uid}/followedParcels/{parcelId}`
- `users/{uid}/notifications/{notificationId}`
- `publicConfig/{docId}`: read-only public remote config mirrors
