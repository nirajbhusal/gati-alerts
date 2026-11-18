import 'package:flutter/material.dart';

import '../theme/app_dimens.dart';

/// One option in a [ChoiceRow].
typedef Choice<T> = ({T value, String label});

/// Horizontally scrolling single-choice filter. The selected option is a
/// solid dark pill; the rest are outlined.
class ChoiceRow<T> extends StatelessWidget {
  const ChoiceRow({
    super.key,
    required this.choices,
    required this.selected,
    required this.onSelected,
  });

  final List<Choice<T>> choices;
  final T selected;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: Row(
        spacing: Gap.sm,
        children: [
          for (final c in choices)
            _Option(
              label: c.label,
              selected: c.value == selected,
              onTap: () => onSelected(c.value),
              scheme: scheme,
              style: theme.textTheme.labelLarge!,
            ),
        ],
      ),
    );
  }
}

class _Option extends StatelessWidget {
  const _Option({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.scheme,
    required this.style,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final ColorScheme scheme;
  final TextStyle style;

  @override
  Widget build(BuildContext context) => Material(
    color: selected ? scheme.onSurface : scheme.surface,
    shape: StadiumBorder(
      side: BorderSide(color: selected ? scheme.onSurface : scheme.outline),
    ),
    child: InkWell(
      customBorder: const StadiumBorder(),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        child: Text(
          label,
          style: style.copyWith(
            color: selected ? scheme.surface : scheme.onSurface,
          ),
        ),
      ),
    ),
  );
}
