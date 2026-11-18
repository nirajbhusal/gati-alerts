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
