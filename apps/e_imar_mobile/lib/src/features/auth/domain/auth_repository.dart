import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

class AuthUser {
  const AuthUser({
    required this.id,
    required this.displayName,
    this.photoUrl,
    this.phone,
  });

  static AuthUser? fromFirebaseUser(firebase_auth.User? user) {
    if (user == null) return null;
    return AuthUser(
      id: user.uid,
      displayName: user.displayName?.trim().isNotEmpty == true
          ? user.displayName!.trim()
          : user.phoneNumber ?? user.email ?? 'E-İmar Kullanıcısı',
      photoUrl: user.photoURL,
      phone: user.phoneNumber,
    );
  }

  final String id;
  final String displayName;
  final String? photoUrl;
  final String? phone;

  AuthUser copyWith({
    String? id,
    String? displayName,
    String? photoUrl,
    String? phone,
  }) =>
      AuthUser(
        id: id ?? this.id,
        displayName: displayName ?? this.displayName,
        photoUrl: photoUrl ?? this.photoUrl,
        phone: phone ?? this.phone,
      );
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}

abstract interface class AuthRepository {
  Stream<AuthUser?> authStateChanges();
  Future<AuthUser> signInWithGoogle();
  Future<AuthUser> signInWithApple();
  Future<String> sendPhoneOtp(String phoneNumber);
  Future<AuthUser> verifyPhoneOtp({
    required String verificationId,
    required String smsCode,
  });
  Future<void> signOut();
}
