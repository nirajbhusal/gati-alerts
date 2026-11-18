import 'package:url_launcher/url_launcher.dart';

/// Opens links outside the app (browser, phone dialer).
abstract final class Launcher {
  static Future<bool> openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  static Future<bool> call(String number) =>
      launchUrl(Uri(scheme: 'tel', path: number.replaceAll(' ', '')));
}
