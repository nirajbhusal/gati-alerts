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

/// DHM's 5-day warning: one bar per day in the map colour, then the advisory.
class FiveDayCard extends ConsumerWidget {
  const FiveDayCard({super.key, required this.bulletin});

  final FiveDayBulletin bulletin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final text = Theme.of(context).textTheme;
    return SectionCard(
      title: s.fiveDayWarning,
      trailing: bulletin.issued == null
          ? null
          : Text(Fmt.dateTime(bulletin.issued!, lang), style: text.labelMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            spacing: Gap.sm,
            children: [
              for (final day in bulletin.days)
                Expanded(
                  child: Tooltip(
                    message: day.text.of(lang),
                    triggerMode: TooltipTriggerMode.tap,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 6,
                          decoration: BoxDecoration(
                            color: day.level.color,
                            borderRadius: BorderRadius.circular(Radii.pill),
                          ),
                        ),
                        const SizedBox(height: Gap.sm),
                        Text(day.bsDate, style: text.labelMedium),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          if (!bulletin.advisory.isEmpty) ...[
            const SizedBox(height: Gap.lg),
            Text(bulletin.advisory.of(lang), style: text.bodyMedium),
          ],
        ],
      ),
    );
  }
}
