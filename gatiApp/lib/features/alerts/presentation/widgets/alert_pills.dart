import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/status_pill.dart';
import '../../domain/entities/alert.dart';
import 'alert_style.dart';

/// Severity, trust, hazard and state labels. Shared by card and detail.
class AlertPills extends ConsumerWidget {
  const AlertPills({super.key, required this.alert});

  final Alert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final s = ref.watch(stringsProvider);
    return Wrap(
      spacing: Gap.xs + 2,
      runSpacing: Gap.xs + 2,
      children: [
        StatusPill(
          label: alert.severity.label.of(lang),
          color: alert.severity.color,
          filled: true,
        ),
        StatusPill(
          label: alert.trust.label.of(lang),
          color: alert.trust.color,
          icon: alert.trust.icon,
        ),
        StatusPill(
          label: alert.hazard.label.of(lang),
          color: AppColors.teal,
          icon: alert.hazard.icon,
        ),
        if (alert.correctedState != null)
          StatusPill(label: alert.correctedState!, color: AppColors.corrected),
        if (!alert.isActive())
          StatusPill(label: s.expired, color: AppColors.slate),
      ],
    );
  }
}
