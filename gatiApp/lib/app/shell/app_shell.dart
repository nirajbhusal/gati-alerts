import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../router/app_routes.dart';

/// App bar + bottom navigation around the five main tabs.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final tabs = [
      (Icons.notifications_none, Icons.notifications, s.alerts),
      (Icons.cloud_outlined, Icons.cloud, s.weather),
      (Icons.alt_route_outlined, Icons.alt_route, s.roads),
      (Icons.water_drop_outlined, Icons.water_drop, s.rivers),
      (Icons.call_outlined, Icons.call, s.contacts),
    ];
    final index = navigationShell.currentIndex;
    final theme = Theme.of(context);

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
            : Text(tabs[index].$3),
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
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: theme.dividerTheme.color!)),
        ),
        child: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (i) =>
              navigationShell.goBranch(i, initialLocation: i == index),
          destinations: [
            for (final (icon, selectedIcon, label) in tabs)
              NavigationDestination(
                icon: Icon(icon),
                selectedIcon: Icon(selectedIcon),
                label: label,
              ),
          ],
        ),
      ),
    );
  }
}
