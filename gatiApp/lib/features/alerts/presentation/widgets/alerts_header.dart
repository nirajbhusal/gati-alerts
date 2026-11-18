import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/choice_row.dart';
import '../../../../core/widgets/status_label.dart';
import '../../../districts/presentation/widgets/district_picker.dart';
import '../../domain/entities/alert_enums.dart';
import '../providers/alert_providers.dart';
import 'alert_style.dart';

/// District, active count and filters above the alert list.
class AlertsHeader extends ConsumerWidget {
  const AlertsHeader({super.key});

  static const _hazards = [
    Hazard.flood,
    Hazard.landslide,
    Hazard.road,
    Hazard.weather,
    Hazard.earthquake,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final summary = ref.watch(alertSummaryProvider);
    final filter = ref.watch(alertFilterProvider);
    final notifier = ref.read(alertFilterProvider.notifier);
    final text = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const MyDistrictButton(),
        const SizedBox(height: Gap.sm),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              summary == null ? '–' : Fmt.number(summary.active, lang),
              style: text.displaySmall,
            ),
            const SizedBox(width: Gap.sm),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: Gap.xs),
                child: Text(
                  s.activeAlerts,
                  style: text.titleMedium?.copyWith(
                    color: text.bodySmall?.color,
                  ),
                ),
              ),
            ),
            if ((summary?.severe ?? 0) > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: Gap.sm),
                child: StatusLabel(
                  label:
                      '${Fmt.number(summary!.severe, lang)} ${s.severeAlerts}',
                  color: Severity.severe.color,
                ),
              ),
          ],
        ),
        const SizedBox(height: Gap.lg),
        ChoiceRow<bool>(
          choices: [
            (value: true, label: s.active),
            (value: false, label: s.all),
          ],
          selected: filter.activeOnly,
          onSelected: notifier.setActiveOnly,
        ),
        const SizedBox(height: Gap.sm),
        ChoiceRow<Hazard?>(
          choices: [
            (value: null, label: s.allHazards),
            for (final h in _hazards) (value: h, label: h.label.of(lang)),
          ],
          selected: filter.hazard,
          onSelected: notifier.setHazard,
        ),
      ],
    );
  }
}
