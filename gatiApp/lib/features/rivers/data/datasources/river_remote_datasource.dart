import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/river_report_model.dart';

class RiverRemoteDatasource {
  const RiverRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/rivers.json
  Future<RiverReportModel> getRivers() async =>
      RiverReportModel.fromJson(await _api.getMap(ApiEndpoints.rivers));
}
