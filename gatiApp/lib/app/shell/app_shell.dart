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
      (Icons.campaign_outlined, Icons.campaign, s.alerts),
      (Icons.cloud_outlined, Icons.cloud, s.weather),
      (Icons.add_road_outlined, Icons.add_road, s.roads),
      (Icons.water_outlined, Icons.water, s.rivers),
      (Icons.phone_outlined, Icons.phone, s.contacts),
    ];
    final index = navigationShell.currentIndex;

    return Scaffold(
      appBar: AppBar(
        title: index == 0
            ? Text(s.appName, style: const TextStyle(color: AppColors.gatiRed))
            : Text(tabs[index].$3),
        actions: [
          IconButton(
            tooltip: s.settings,
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
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
    );
  }
}
