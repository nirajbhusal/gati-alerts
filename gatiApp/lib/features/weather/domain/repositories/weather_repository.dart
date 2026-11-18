import '../entities/weather_report.dart';

abstract interface class WeatherRepository {
  Future<WeatherReport> getWeather();
}
