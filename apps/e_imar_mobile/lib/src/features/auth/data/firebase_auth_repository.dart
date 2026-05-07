import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../domain/auth_repository.dart';

class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository({
    firebase_auth.FirebaseAuth? firebaseAuth,
    GoogleSignIn? googleSignIn,
  })  : _firebaseAuth = firebaseAuth ?? firebase_auth.FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  final firebase_auth.FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  @override
  Stream<AuthUser?> authStateChanges() =>
      _firebaseAuth.authStateChanges().map(AuthUser.fromFirebaseUser);

  @override
  Future<AuthUser> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw const AuthException('Google girişi iptal edildi.');
      }

      final googleAuth = await googleUser.authentication;
      final credential = firebase_auth.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result = await _firebaseAuth.signInWithCredential(credential);
      return _requireUser(result.user, 'Google girişi tamamlanamadı.');
    } on AuthException {
      rethrow;
    } on firebase_auth.FirebaseAuthException catch (error) {
      throw AuthException(_firebaseAuthMessage(error));
    } catch (_) {
      throw const AuthException(
          'Google girişi sırasında beklenmeyen bir hata oluştu.');
    }
  }

  @override
  Future<AuthUser> signInWithApple() async {
    try {
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: const [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      final idToken = appleCredential.identityToken;
      if (idToken == null || idToken.isEmpty) {
        throw const AuthException(
            'Apple kimlik doğrulama belirteci alınamadı.');
      }

      final rawNonce = _appleRawNonce();
      final credential = firebase_auth.OAuthProvider('apple.com').credential(
        idToken: idToken,
        rawNonce: rawNonce,
      );
      final result = await _firebaseAuth.signInWithCredential(credential);
      final user = _requireUser(result.user, 'Apple girişi tamamlanamadı.');
      final fullName = [appleCredential.givenName, appleCredential.familyName]
          .whereType<String>()
          .where((part) => part.trim().isNotEmpty)
          .join(' ');
      if (fullName.isNotEmpty &&
          (result.user?.displayName == null ||
              result.user!.displayName!.isEmpty)) {
        await result.user?.updateDisplayName(fullName);
        await result.user?.reload();
        return AuthUser.fromFirebaseUser(_firebaseAuth.currentUser) ??
            user.copyWith(displayName: fullName);
      }
      return user;
    } on SignInWithAppleAuthorizationException catch (error) {
      if (error.code == AuthorizationErrorCode.canceled) {
        throw const AuthException('Apple girişi iptal edildi.');
      }
      throw const AuthException('Apple girişi yetkilendirilemedi.');
    } on AuthException {
      rethrow;
    } on firebase_auth.FirebaseAuthException catch (error) {
      throw AuthException(_firebaseAuthMessage(error));
    } catch (_) {
      throw const AuthException(
          'Apple girişi sırasında beklenmeyen bir hata oluştu.');
    }
  }

  @override
  Future<String> sendPhoneOtp(String phoneNumber) async {
    final normalizedPhone = phoneNumber.trim();
    if (!normalizedPhone.startsWith('+') || normalizedPhone.length < 8) {
      throw const AuthException('Telefon numarasını ülke kodu ile girin.');
    }

    final completer = Completer<String>();
    try {
      await _firebaseAuth.verifyPhoneNumber(
        phoneNumber: normalizedPhone,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (credential) async {
          try {
            await _firebaseAuth.signInWithCredential(credential);
          } catch (_) {
            debugPrint('Otomatik telefon doğrulama tamamlanamadı.');
          }
        },
        verificationFailed: (error) {
          if (!completer.isCompleted) {
            completer.completeError(AuthException(_firebaseAuthMessage(error)));
          }
        },
        codeSent: (verificationId, _) {
          if (!completer.isCompleted) {
            completer.complete(verificationId);
          }
        },
        codeAutoRetrievalTimeout: (verificationId) {
          if (!completer.isCompleted) {
            completer.complete(verificationId);
          }
        },
      );
      return await completer.future;
    } on AuthException {
      rethrow;
    } on firebase_auth.FirebaseAuthException catch (error) {
      throw AuthException(_firebaseAuthMessage(error));
    } catch (_) {
      throw const AuthException('Telefon doğrulama kodu gönderilemedi.');
    }
  }

  @override
  Future<AuthUser> verifyPhoneOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    if (verificationId.trim().isEmpty || smsCode.trim().isEmpty) {
      throw const AuthException('Doğrulama kodunu girin.');
    }

    try {
      final credential = firebase_auth.PhoneAuthProvider.credential(
        verificationId: verificationId.trim(),
        smsCode: smsCode.trim(),
      );
      final result = await _firebaseAuth.signInWithCredential(credential);
      return _requireUser(result.user, 'Telefon girişi tamamlanamadı.');
    } on firebase_auth.FirebaseAuthException catch (error) {
      throw AuthException(_firebaseAuthMessage(error));
    } catch (_) {
      throw const AuthException(
          'Telefon doğrulaması sırasında beklenmeyen bir hata oluştu.');
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await Future.wait([_firebaseAuth.signOut(), _googleSignIn.signOut()]);
    } on firebase_auth.FirebaseAuthException catch (error) {
      throw AuthException(_firebaseAuthMessage(error));
    } catch (_) {
      throw const AuthException(
          'Çıkış yapılırken beklenmeyen bir hata oluştu.');
    }
  }

  AuthUser _requireUser(firebase_auth.User? user, String message) {
    final mapped = AuthUser.fromFirebaseUser(user);
    if (mapped == null) {
      throw AuthException(message);
    }
    return mapped;
  }
}

String? _appleRawNonce() {
  return null;
}

String _firebaseAuthMessage(firebase_auth.FirebaseAuthException error) {
  switch (error.code) {
    case 'account-exists-with-different-credential':
      return 'Bu e-posta farklı bir giriş yöntemiyle kayıtlı.';
    case 'credential-already-in-use':
      return 'Bu kimlik bilgisi başka bir hesapta kullanılıyor.';
    case 'invalid-credential':
    case 'invalid-verification-code':
      return 'Kimlik doğrulama bilgileri geçersiz.';
    case 'invalid-phone-number':
      return 'Telefon numarası geçersiz.';
    case 'network-request-failed':
      return 'Ağ bağlantısı kurulamadı. Lütfen tekrar deneyin.';
    case 'quota-exceeded':
    case 'too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
    case 'user-disabled':
      return 'Bu kullanıcı hesabı devre dışı bırakılmış.';
    case 'operation-not-allowed':
      return 'Bu giriş yöntemi Firebase projesinde etkin değil.';
    default:
      return 'Kimlik doğrulama işlemi tamamlanamadı.';
  }
}
