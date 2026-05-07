sealed class AppResult<T> {
  const AppResult();

  R when<R>(
      {required R Function(T value) success,
      required R Function(AppFailure failure) failure}) {
    return switch (this) {
      AppSuccess<T>(:final value) => success(value),
      AppFailureResult<T>(:final error) => failure(error),
    };
  }
}

final class AppSuccess<T> extends AppResult<T> {
  const AppSuccess(this.value);
  final T value;
}

final class AppFailureResult<T> extends AppResult<T> {
  const AppFailureResult(this.error);
  final AppFailure error;
}

final class AppFailure {
  const AppFailure({required this.message, this.code, this.cause});

  final String message;
  final String? code;
  final Object? cause;
}
