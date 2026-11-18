import 'package:flutter/material.dart';

import '../theme/app_dimens.dart';

/// Small coloured dot. The colour carries the status, nothing else does.
class StatusDot extends StatelessWidget {
  const StatusDot(this.color, {super.key, this.size = 8});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
  );
}

/// Dot followed by a short label: severity, road or river status.
class StatusLabel extends StatelessWidget {
  const StatusLabel({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      StatusDot(color),
      const SizedBox(width: Gap.xs + 2),
      Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    ],
  );
}
