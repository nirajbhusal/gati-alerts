import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Round button docked in the bottom bar's notch. In Gati it opens the
/// emergency numbers, the most urgent thing in the app.
class ShellCenterButton extends StatelessWidget {
  const ShellCenterButton({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.selected,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;

  /// True while its destination is open; the ring then turns brand red.
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final ring = Theme.of(context).scaffoldBackgroundColor;
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppColors.gatiRed.withValues(alpha: 0.28),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: FloatingActionButton(
        heroTag: 'gati-shell-center',
        tooltip: tooltip,
        onPressed: onPressed,
        elevation: 0,
        highlightElevation: 0,
        backgroundColor: selected ? AppColors.crimson : AppColors.gatiRed,
        foregroundColor: Colors.white,
        shape: CircleBorder(side: BorderSide(color: ring, width: 4)),
        child: Icon(icon, size: 26),
      ),
    );
  }
}
