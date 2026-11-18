import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/road_report_model.dart';

class RoadRemoteDatasource {
  const RoadRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/roads.json
  Future<RoadReportModel> getRoads() async =>
      RoadReportModel.fromJson(await _api.getMap(ApiEndpoints.roads));
}
