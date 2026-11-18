import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/status_label.dart';
import '../../domain/entities/river_report.dart';

/// Gauge name and status, a thin bar of level against danger, the numbers.
class RiverGaugeRow extends ConsumerWidget {
  const RiverGaugeRow({super.key, required this.gauge});

  final RiverGauge gauge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final text = Theme.of(context).textTheme;
    final (color, label) = switch (gauge.status) {
      RiverStatus.normal => (AppColors.ok, s.normal),
      RiverStatus.aboveWarning => (AppColors.caution, s.aboveWarning),
      RiverStatus.aboveDanger => (AppColors.severe, s.aboveDanger),
    };
    String m(double? v) => v == null ? '–' : Fmt.number(v, lang, decimals: 2);

    return Padding(
      padding: const EdgeInsets.all(Gap.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(gauge.name.of(lang), style: text.titleSmall),
              ),
              StatusLabel(label: label, color: color),
            ],
          ),
          const SizedBox(height: Gap.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(Radii.pill),
            child: LinearProgressIndicator(
              value: gauge.fill,
              minHeight: 4,
              color: color,
            ),
          ),
          const SizedBox(height: Gap.sm),
          Text(
            '${s.level} ${m(gauge.level)} m   ·   '
            '${s.warningLevel} ${m(gauge.warning)}   ·   '
            '${s.dangerLevel} ${m(gauge.danger)}',
            style: text.bodySmall,
          ),
        ],
      ),
    );
  }
}
