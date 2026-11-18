import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../router/app_routes.dart';
import 'shell_bottom_nav.dart';
import 'shell_center_button.dart';

/// Main frame: Alerts · Weather · (Emergency) · Roads · Rivers.
///
/// Branch order matches the router: the four bar tabs are branches 0 to 3,
/// the centre button opens branch [_emergencyBranch].
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _emergencyBranch = 4;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final index = navigationShell.currentIndex;
    final onEmergency = index == _emergencyBranch;
    final theme = Theme.of(context);

    final items = <NavItem>[
      (
        icon: Icons.notifications_none,
        activeIcon: Icons.notifications,
        label: s.alerts,
      ),
      (icon: Icons.cloud_outlined, activeIcon: Icons.cloud, label: s.weather),
      (
        icon: Icons.alt_route_outlined,
        activeIcon: Icons.alt_route,
        label: s.roads,
      ),
      (
        icon: Icons.water_drop_outlined,
        activeIcon: Icons.water_drop,
        label: s.rivers,
      ),
    ];

    void go(int branch) {
      HapticFeedback.selectionClick();
      navigationShell.goBranch(branch, initialLocation: branch == index);
    }

    return Scaffold(
      appBar: AppBar(
        title: index == 0
            ? Text(
                s.appName,
                style: theme.appBarTheme.titleTextStyle?.copyWith(
                  color: AppColors.gatiRed,
                  fontSize: 24,
                ),
              )
            : Text(onEmergency ? s.contacts : items[index].label),
        actions: [
          IconButton(
            tooltip: s.settings,
            icon: const Icon(Icons.tune),
            onPressed: () => context.push(AppRoutes.settings),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: navigationShell,
      bottomNavigationBar: ShellBottomNav(
        items: items,
        currentIndex: onEmergency ? -1 : index,
        onTap: go,
      ),
      floatingActionButton: ShellCenterButton(
        icon: Icons.call,
        tooltip: s.contacts,
        selected: onEmergency,
        onPressed: () => go(_emergencyBranch),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }
}
