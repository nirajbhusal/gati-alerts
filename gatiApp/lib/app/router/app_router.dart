import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/alerts/presentation/pages/alert_detail_page.dart';
import '../../features/alerts/presentation/pages/alerts_page.dart';
import '../../features/contacts/presentation/pages/contacts_page.dart';
import '../../features/rivers/presentation/pages/rivers_page.dart';
import '../../features/roads/presentation/pages/roads_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/weather/presentation/pages/weather_page.dart';
import '../shell/app_shell.dart';
import 'app_routes.dart';

final routerProvider = Provider<GoRouter>((ref) {
  /// One branch per bottom tab; each keeps its own scroll and stack.
  StatefulShellBranch tab(String path, Widget page) => StatefulShellBranch(
    routes: [GoRoute(path: path, builder: (_, _) => page)],
  );

  return GoRouter(
    initialLocation: AppRoutes.alerts,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(navigationShell: shell),
        branches: [
          tab(AppRoutes.alerts, const AlertsPage()),
          tab(AppRoutes.weather, const WeatherPage()),
          tab(AppRoutes.roads, const RoadsPage()),
          tab(AppRoutes.rivers, const RiversPage()),
          tab(AppRoutes.contacts, const ContactsPage()),
        ],
      ),
      GoRoute(
        path: AppRoutes.alertDetail,
        builder: (_, state) => AlertDetailPage(
          id: Uri.decodeComponent(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (_, _) => const SettingsPage(),
      ),
    ],
  );
});
