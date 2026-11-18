/// App-wide constants. Everything Gati reads is static JSON on the website.
abstract final class AppConfig {
  static const appName = 'Gati';
  static const baseUrl = 'https://gatialerts.com/';

  static const connectTimeout = Duration(seconds: 15);
  static const receiveTimeout = Duration(seconds: 30);
}
