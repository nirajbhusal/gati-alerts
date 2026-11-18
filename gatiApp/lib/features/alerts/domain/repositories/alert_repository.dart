import '../entities/alert.dart';

abstract interface class AlertRepository {
  /// All messages, newest first. Includes expired ones (the archive).
  Future<List<Alert>> getAlerts();
}
