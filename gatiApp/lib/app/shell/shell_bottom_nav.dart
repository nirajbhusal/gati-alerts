import 'package:flutter/material.dart';

import '../../core/theme/app_dimens.dart';

/// One tab in [ShellBottomNav].
typedef NavItem = ({IconData icon, IconData activeIcon, String label});

/// Notched bottom bar with a gap in the middle for [ShellCenterButton].
/// Same layout as the Taskify app's bar.
class ShellBottomNav extends StatelessWidget {
  const ShellBottomNav({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
  });

  /// Width of the empty slot under the centre button.
  static const centerGap = 80.0;
  static const barHeight = 60.0;

  /// How far the bar may sit into the home-indicator area, so it does not
  /// look lifted on phones without a home button.
  static const homeIndicatorOverlap = 14.0;

  final List<NavItem> items;

  /// Selected tab, or -1 when the centre destination is open.
  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final media = MediaQuery.of(context);
    final center = items.length ~/ 2;
    final bottomInset = (media.viewPadding.bottom - homeIndicatorOverlap).clamp(
      0.0,
      double.infinity,
    );

    return MediaQuery(
      data: media.copyWith(
        padding: media.padding.copyWith(bottom: bottomInset),
      ),
      child: BottomAppBar(
        height: barHeight,
        color: scheme.surface,
        elevation: 12,
        shadowColor: Colors.black26,
        surfaceTintColor: Colors.transparent,
        shape: const CircularNotchedRectangle(),
        notchMargin: 7,
        padding: EdgeInsets.zero,
        child: Row(
          children: [
            for (final (i, item) in items.indexed) ...[
              if (i == center) const SizedBox(width: centerGap),
              Expanded(
                child: _NavTab(
                  item: item,
                  selected: i == currentIndex,
                  onTap: () => onTap(i),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  const _NavTab({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final NavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final color = selected ? scheme.primary : scheme.onSurfaceVariant;
    final radius = BorderRadius.circular(Radii.md);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
      child: Material(
        color: selected
            ? scheme.primary.withValues(alpha: 0.08)
            : Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                selected ? item.activeIcon : item.icon,
                color: color,
                size: 23,
              ),
              const SizedBox(height: 2),
              Text(
                item.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
