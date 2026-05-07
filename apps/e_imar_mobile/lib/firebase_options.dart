import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: String.fromEnvironment('FIREBASE_API_KEY',
        defaultValue: 'placeholder-api-key'),
    appId: String.fromEnvironment('FIREBASE_APP_ID',
        defaultValue: '1:000000000000:web:placeholder'),
    messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID',
        defaultValue: '000000000000'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID',
        defaultValue: 'e-imar-placeholder'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET',
        defaultValue: 'e-imar-placeholder.appspot.com'),
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: String.fromEnvironment('FIREBASE_API_KEY',
        defaultValue: 'placeholder-api-key'),
    appId: String.fromEnvironment('FIREBASE_APP_ID',
        defaultValue: '1:000000000000:android:placeholder'),
    messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID',
        defaultValue: '000000000000'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID',
        defaultValue: 'e-imar-placeholder'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET',
        defaultValue: 'e-imar-placeholder.appspot.com'),
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: String.fromEnvironment('FIREBASE_API_KEY',
        defaultValue: 'placeholder-api-key'),
    appId: String.fromEnvironment('FIREBASE_APP_ID',
        defaultValue: '1:000000000000:ios:placeholder'),
    messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID',
        defaultValue: '000000000000'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID',
        defaultValue: 'e-imar-placeholder'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET',
        defaultValue: 'e-imar-placeholder.appspot.com'),
    iosBundleId: 'com.eimar.mobile',
  );

  static const FirebaseOptions macos = ios;
}
