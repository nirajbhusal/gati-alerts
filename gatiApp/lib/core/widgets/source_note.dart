import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../theme/app_dimens.dart';
import '../utils/launcher.dart';

/// "Source: … " footnote under each screen. Tapping opens the source.
class SourceNote extends ConsumerWidget {
  const SourceNote({super.key, required this.text, this.url});

  final String text;
  final String? url;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final theme = Theme.of(context);
    final muted = theme.colorScheme.onSurfaceVariant;
    return InkWell(
      onTap: url == null ? null : () => Launcher.openUrl(url!),
      borderRadius: BorderRadius.circular(Radii.sm),
      child: Padding(
        padding: const EdgeInsets.all(Gap.xs),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${s.source}  ',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: text),
                  ],
                ),
                style: theme.textTheme.bodySmall,
              ),
            ),
            if (url != null) ...[
              const SizedBox(width: Gap.sm),
              Icon(Icons.north_east, size: 16, color: muted),
            ],
          ],
        ),
      ),
    );
  }
}
