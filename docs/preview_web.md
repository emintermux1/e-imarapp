# Flutter web preview

Build the preview from the mobile app workspace:

```bash
cd apps/e_imar_mobile
flutter pub get
flutter build web --release
```

Serve the generated static files locally:

```bash
cd apps/e_imar_mobile/build/web
python3 -m http.server 8080
```

Open `http://localhost:8080` and capture the product screenshots from the rendered E-İmar preview.
