import '../../domain/entities/weather_report.dart';
import '../../domain/repositories/weather_repository.dart';
import '../datasources/weather_remote_datasource.dart';

class WeatherRepositoryImpl implements WeatherRepository {
  const WeatherRepositoryImpl(this._remote);

  final WeatherRemoteDatasource _remote;

  @override
  Future<WeatherReport> getWeather() => _remote.getWeather();
}
