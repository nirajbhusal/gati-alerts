import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/section_card.dart';
import '../../domain/entities/weather_report.dart';

extension WarningLevelStyle on WarningLevel {
  Color get color => switch (this) {
    WarningLevel.green => AppColors.ok,
    WarningLevel.yellow => AppColors.minor,
    WarningLevel.orange => AppColors.moderate,
    WarningLevel.red => AppColors.severe,
    WarningLevel.unknown => AppColors.info,
  };
}

/// DHM's 5-day warning: one coloured tile per day, then the advisory.
class FiveDayCard extends ConsumerWidget {
  const FiveDayCard({super.key, required this.bulletin});

  final FiveDayBulletin bulletin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    return SectionCard(
      title: s.fiveDayWarning,
      trailing: bulletin.issued == null
          ? null
          : Text(
              Fmt.dateTime(bulletin.issued!, lang),
              style: theme.textTheme.bodySmall,
            ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            spacing: Gap.xs + 2,
            children: [
              for (final day in bulletin.days)
                Expanded(
                  child: Tooltip(
                    message: day.text.of(lang),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: Gap.sm),
                      decoration: BoxDecoration(
                        color: day.level.color.withValues(alpha: 0.16),
                        border: Border(
                          bottom: BorderSide(color: day.level.color, width: 4),
                        ),
                        borderRadius: BorderRadius.circular(Radii.sm),
                      ),
                      child: Text(
                        day.bsDate,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.labelMedium,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          if (!bulletin.advisory.isEmpty) ...[
            const SizedBox(height: Gap.md),
            Text(
              bulletin.advisory.of(lang),
              style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
            ),
          ],
        ],
      ),
    );
  }
}
