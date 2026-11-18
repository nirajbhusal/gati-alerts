import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../districts/presentation/widgets/district_picker.dart';
import '../../domain/entities/alert_enums.dart';
import '../providers/alert_providers.dart';
import 'alert_style.dart';

/// District, active/all switch and hazard chips above the list.
class AlertFilterBar extends ConsumerWidget {
  const AlertFilterBar({super.key});

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
    final filter = ref.watch(alertFilterProvider);
    final notifier = ref.read(alertFilterProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const MyDistrictButton(),
            const Spacer(),
            SegmentedButton<bool>(
              showSelectedIcon: false,
              segments: [
                ButtonSegment(value: true, label: Text(s.active)),
                ButtonSegment(value: false, label: Text(s.all)),
              ],
              selected: {filter.activeOnly},
              onSelectionChanged: (v) => notifier.setActiveOnly(v.first),
            ),
          ],
        ),
        const SizedBox(height: Gap.sm),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            spacing: Gap.sm,
            children: [
              ChoiceChip(
                label: Text(s.all),
                selected: filter.hazard == null,
                onSelected: (_) => notifier.setHazard(null),
              ),
              for (final h in _hazards)
                ChoiceChip(
                  avatar: Icon(h.icon, size: 18),
                  label: Text(h.label.of(lang)),
                  selected: filter.hazard == h,
                  onSelected: (on) => notifier.setHazard(on ? h : null),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
