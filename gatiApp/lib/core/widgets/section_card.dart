import 'package:flutter/material.dart';

import '../theme/app_dimens.dart';

/// A bordered card with an optional label above it.
///
/// [SectionCard] pads one child. [SectionCard.list] stacks rows edge to edge
/// with hairline dividers, like a settings group.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    this.title,
    this.trailing,
    required Widget this.child,
    this.onTap,
  }) : children = null;

  const SectionCard.list({
    super.key,
    this.title,
    this.trailing,
    required List<Widget> this.children,
  }) : child = null,
       onTap = null;

  final String? title;
  final Widget? trailing;
  final Widget? child;
  final List<Widget>? children;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final rows = children;
    final body = rows == null
        ? InkWell(
            onTap: onTap,
            child: Padding(padding: const EdgeInsets.all(Gap.lg), child: child),
          )
        : Column(
            children: [
              for (final (i, row) in rows.indexed) ...[
                if (i > 0) const Divider(indent: Gap.lg),
                row,
              ],
            ],
          );

    final card = Card(clipBehavior: Clip.antiAlias, child: body);
    if (title == null) return card;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(Gap.xs, 0, Gap.xs, Gap.sm),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title!,
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ),
              ?trailing,
            ],
          ),
        ),
        card,
      ],
    );
  }
}
