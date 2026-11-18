import 'package:flutter/material.dart';

import '../theme/app_dimens.dart';

/// Rounded square holding an icon. Leading element of list rows.
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.color});

  final IconData icon;

  /// Icon colour; defaults to the muted text colour.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(Radii.sm + 2),
      ),
      child: Icon(icon, size: 21, color: color ?? scheme.onSurfaceVariant),
    );
  }
}
