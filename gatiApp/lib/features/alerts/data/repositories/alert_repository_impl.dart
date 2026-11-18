import '../../domain/entities/alert.dart';
import '../../domain/repositories/alert_repository.dart';
import '../datasources/alert_remote_datasource.dart';

class AlertRepositoryImpl implements AlertRepository {
  const AlertRepositoryImpl(this._remote);

  final AlertRemoteDatasource _remote;

  @override
  Future<List<Alert>> getAlerts() async =>
      (await _remote.getAlerts()).where((a) => a.id.isNotEmpty).toList()
        ..sort((a, b) => b.sent.compareTo(a.sent));
}
