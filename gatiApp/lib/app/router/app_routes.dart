/// Route paths in one place.
abstract final class AppRoutes {
  static const alerts = '/alerts';
  static const weather = '/weather';
  static const roads = '/roads';
  static const rivers = '/rivers';
  static const contacts = '/contacts';
  static const settings = '/settings';

  static const alertDetail = '$alerts/:id';
  static String alert(String id) => '$alerts/${Uri.encodeComponent(id)}';
}
