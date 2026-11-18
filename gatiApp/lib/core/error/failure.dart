import 'package:dio/dio.dart';

/// Every error that leaves the data layer is a [Failure]. The UI picks a
/// translated message by type (see `ErrorView`), so no text lives here.
sealed class Failure implements Exception {
  const Failure([this.detail]);

  final String? detail;

  /// Maps anything thrown while loading data to a [Failure].
  factory Failure.from(Object error) {
    if (error is Failure) return error;
    if (error is DioException) {
      return switch (error.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.sendTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.connectionError => NetworkFailure(error.message),
        _ => ServerFailure(error.response?.statusCode, error.message),
      };
    }
    return ParseFailure(error.toString());
  }

  @override
  String toString() => '$runtimeType(${detail ?? ''})';
}

/// No connection or the request timed out.
final class NetworkFailure extends Failure {
  const NetworkFailure([super.detail]);
}

/// The server answered with an error status or an empty body.
final class ServerFailure extends Failure {
  const ServerFailure(this.statusCode, [super.detail]);

  final int? statusCode;
}

/// The response arrived but was not in the expected shape.
final class ParseFailure extends Failure {
  const ParseFailure([super.detail]);
}
