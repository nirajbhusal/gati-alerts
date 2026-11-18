import '../config/app_config.dart';

/// Paths relative to [AppConfig.baseUrl].
abstract final class ApiEndpoints {
  static const alerts = 'data/alerts.json';
  static const weather = 'data/weather.json';
  static const rivers = 'data/rivers.json';
  static const roads = 'data/roads.json';
  static const contacts = 'data/contacts.json';
  static const districts = 'data/districts.json';

  /// Public web page of one alert.
  static String alertPage(String id) => '${AppConfig.baseUrl}alerts/$id/';
}
