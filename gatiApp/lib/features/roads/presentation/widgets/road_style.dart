import 'package:flutter/material.dart';

import '../../../../core/l10n/localized_text.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/road_report.dart';

extension RoadStatusStyle on RoadStatus {
  Color get color => switch (this) {
    RoadStatus.blocked => AppColors.blocked,
    RoadStatus.oneway => AppColors.oneWay,
    RoadStatus.open => AppColors.ok,
    RoadStatus.unconfirmed => AppColors.info,
  };

  IconData get icon => switch (this) {
    RoadStatus.blocked => Icons.block_rounded,
    RoadStatus.oneway => Icons.swap_calls_rounded,
    RoadStatus.open => Icons.check_circle_rounded,
    RoadStatus.unconfirmed => Icons.help_outline_rounded,
  };

  LocalizedText get label => switch (this) {
    RoadStatus.blocked => const LocalizedText(ne: 'अवरुद्ध', en: 'Blocked'),
    RoadStatus.oneway => const LocalizedText(ne: 'आंशिक खुला', en: 'One-way'),
    RoadStatus.open => const LocalizedText(ne: 'खुला', en: 'Open'),
    RoadStatus.unconfirmed => const LocalizedText(
      ne: 'पुष्टि नभएको',
      en: 'Not confirmed',
    ),
  };
}
