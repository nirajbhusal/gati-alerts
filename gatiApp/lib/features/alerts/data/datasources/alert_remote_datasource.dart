import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/json.dart';
import '../models/alert_model.dart';

class AlertRemoteDatasource {
  const AlertRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/alerts.json → `{generated, count, alerts: [...]}`.
  Future<List<AlertModel>> getAlerts() async {
    final body = await _api.getMap(ApiEndpoints.alerts);
    return Json.list(body['alerts']).map(AlertModel.fromJson).toList();
  }
}
