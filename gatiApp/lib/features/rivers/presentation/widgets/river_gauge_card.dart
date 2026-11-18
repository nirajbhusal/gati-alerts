import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../../core/widgets/status_pill.dart';
import '../../domain/entities/river_report.dart';

/// Gauge name, status, and a bar of the level against the danger mark.
class RiverGaugeCard extends ConsumerWidget {
  const RiverGaugeCard({super.key, required this.gauge});

  final RiverGauge gauge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final (color, label) = switch (gauge.status) {
      RiverStatus.normal => (AppColors.ok, s.normal),
      RiverStatus.aboveWarning => (AppColors.caution, s.aboveWarning),
      RiverStatus.aboveDanger => (AppColors.severe, s.aboveDanger),
    };
    String metres(double? v) =>
        v == null ? '–' : '${Fmt.number(v, lang, decimals: 2)} m';

    return SectionCard(
      accent: color,
      title: gauge.name.of(lang),
      trailing: StatusPill(label: label, color: color),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(Radii.pill),
            child: LinearProgressIndicator(
              value: gauge.fill,
              minHeight: 8,
              color: color,
              backgroundColor: theme.colorScheme.outlineVariant,
            ),
          ),
          const SizedBox(height: Gap.sm),
          Wrap(
            spacing: Gap.lg,
            children: [
              Text('${s.level}: ${metres(gauge.level)}'),
              Text(
                '${s.warningLevel}: ${metres(gauge.warning)}',
                style: const TextStyle(color: AppColors.caution),
              ),
              Text(
                '${s.dangerLevel}: ${metres(gauge.danger)}',
                style: const TextStyle(color: AppColors.severe),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
