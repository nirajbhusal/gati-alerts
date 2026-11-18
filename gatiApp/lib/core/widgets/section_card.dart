import 'package:flutter/material.dart';

import '../theme/app_dimens.dart';

/// Card with an optional title row. Used for every grouped block.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    this.title,
    this.trailing,
    required this.child,
    this.onTap,
    this.accent,
  });

  final String? title;
  final Widget? trailing;
  final Widget child;
  final VoidCallback? onTap;

  /// Coloured strip on the left edge (severity, status).
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final content = Padding(
      padding: const EdgeInsets.all(Gap.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Row(
              children: [
                Expanded(
                  child: Text(title!, style: theme.textTheme.titleMedium),
                ),
                ?trailing,
              ],
            ),
            const SizedBox(height: Gap.sm),
          ],
          child,
        ],
      ),
    );
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: accent == null
            ? content
            : DecoratedBox(
                decoration: BoxDecoration(
                  border: Border(left: BorderSide(color: accent!, width: 4)),
                ),
                child: content,
              ),
      ),
    );
  }
}
