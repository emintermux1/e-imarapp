import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((_) => MockAuthRepository());

class MockAuthRepository implements AuthRepository {
  final _controller = StreamController<AuthUser?>.broadcast();

  @override
  Stream<AuthUser?> authStateChanges() => _controller.stream;

  @override
  Future<AuthUser> signInWithApple() async => _mock('apple', 'Apple Kullanıcısı');

  @override
  Future<AuthUser> signInWithGoogle() async => _mock('google', 'Google Kullanıcısı');

  @override
  Future<String> sendPhoneOtp(String phoneNumber) async {
    await Future<void>.delayed(const Duration(milliseconds: 420));
    return 'mock-verification-$phoneNumber';
  }

  @override
  Future<AuthUser> verifyPhoneOtp({required String verificationId, required String smsCode}) async => _mock('phone', 'Telefon Kullanıcısı');

  @override
  Future<void> signOut() async => _controller.add(null);

  Future<AuthUser> _mock(String id, String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 360));
    final user = AuthUser(id: 'mock-$id', displayName: name);
    _controller.add(user);
    return user;
  }
}
