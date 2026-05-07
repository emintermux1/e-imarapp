# E-İmar Web Preview

This branch enables a Flutter web preview for the mobile app shell.

## Build

```bash
cd apps/e_imar_mobile
flutter pub get
flutter build web --release
```

## Serve locally

```bash
python3 -m http.server 8081 --bind 0.0.0.0 --directory apps/e_imar_mobile/build/web
```

Open `http://localhost:8081`.

The web preview uses existing mock/fail-soft data paths for Mapbox, Firebase, GIS, reports, and AI flows so the product UI can be reviewed without production credentials.
