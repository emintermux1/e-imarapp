import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_repository.dart';
import 'firebase_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((_) {
  if (Firebase.apps.isNotEmpty) return FirebaseAuthRepository();
  return const UnavailableAuthRepository();
});

class UnavailableAuthRepository implements AuthRepository {
  const UnavailableAuthRepository();

  static const _message =
      'Firebase kimlik doğrulama yapılandırması bulunamadı. Gerçek oturum için Firebase seçeneklerini ve telefon sağlayıcısını etkinleştirin.';

  @override
  Stream<AuthUser?> authStateChanges() => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInWithApple() async => throw const AuthException(_message);

  @override
  Future<AuthUser> signInWithGoogle() async => throw const AuthException(_message);

  @override
  Future<String> sendPhoneOtp(String phoneNumber) async => throw const AuthException(_message);

  @override
  Future<AuthUser> verifyPhoneOtp({required String verificationId, required String smsCode}) async =>
      throw const AuthException(_message);

  @override
  Future<void> signOut() async {}
}
