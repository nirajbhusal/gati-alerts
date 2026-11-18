import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/weather_report_model.dart';

class WeatherRemoteDatasource {
  const WeatherRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/weather.json
  Future<WeatherReportModel> getWeather() async =>
      WeatherReportModel.fromJson(await _api.getMap(ApiEndpoints.weather));
}
