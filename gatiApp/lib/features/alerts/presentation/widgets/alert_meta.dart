import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/status_label.dart';
import '../../domain/entities/alert.dart';
import 'alert_style.dart';

/// "● Moderate · Flood · Official" line. Shared by the row and the detail.
class AlertMeta extends ConsumerWidget {
  const AlertMeta({super.key, required this.alert});

  final Alert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final style = Theme.of(context).textTheme.labelMedium;
    final parts = [
      alert.hazard.label.of(lang),
      alert.trust.label.of(lang),
      if (!alert.isActive()) s.expired,
    ];
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: Gap.sm,
      runSpacing: Gap.xs,
      children: [
        StatusLabel(
          label: alert.severity.label.of(lang),
          color: alert.severity.color,
        ),
        Text(parts.join('  ·  '), style: style),
        if (alert.correctedState != null)
          Text(
            alert.correctedState!,
            style: style?.copyWith(color: AppColors.corrected),
          ),
      ],
    );
  }
}
