class AuthUser {
  const AuthUser({required this.id, required this.displayName, this.photoUrl, this.phone});
  final String id;
  final String displayName;
  final String? photoUrl;
  final String? phone;
}

abstract interface class AuthRepository {
  Stream<AuthUser?> authStateChanges();
  Future<AuthUser> signInWithGoogle();
  Future<AuthUser> signInWithApple();
  Future<String> sendPhoneOtp(String phoneNumber);
  Future<AuthUser> verifyPhoneOtp({required String verificationId, required String smsCode});
  Future<void> signOut();
}
