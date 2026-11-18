import 'package:flutter/material.dart';

import '../../../../core/l10n/localized_text.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/alert_enums.dart';

/// How each enum looks. Kept out of the domain layer on purpose.

extension SeverityStyle on Severity {
  Color get color => switch (this) {
    Severity.extreme => AppColors.extreme,
    Severity.severe => AppColors.severe,
    Severity.moderate => AppColors.moderate,
    Severity.minor => AppColors.minor,
    Severity.unknown => AppColors.info,
  };

  LocalizedText get label => switch (this) {
    Severity.extreme => const LocalizedText(ne: 'अति गम्भीर', en: 'Extreme'),
    Severity.severe => const LocalizedText(ne: 'गम्भीर', en: 'Severe'),
    Severity.moderate => const LocalizedText(ne: 'मध्यम', en: 'Moderate'),
    Severity.minor => const LocalizedText(ne: 'सामान्य', en: 'Minor'),
    Severity.unknown => const LocalizedText(ne: 'जानकारी', en: 'Info'),
  };
}

extension TrustStyle on TrustLevel {
  LocalizedText get label => switch (this) {
    TrustLevel.official => const LocalizedText(ne: 'आधिकारिक', en: 'Official'),
    TrustLevel.verified => const LocalizedText(
      ne: 'पुष्टि भएको',
      en: 'Verified',
    ),
    TrustLevel.reported => const LocalizedText(
      ne: 'रिपोर्ट गरिएको',
      en: 'Reported',
    ),
    TrustLevel.unverified => const LocalizedText(
      ne: 'पुष्टि नभएको',
      en: 'Unverified',
    ),
    TrustLevel.model => const LocalizedText(ne: 'मोडेल', en: 'Model'),
  };
}

extension HazardStyle on Hazard {
  IconData get icon => switch (this) {
    Hazard.flood => Icons.water_drop_outlined,
    Hazard.landslide => Icons.landslide_outlined,
    Hazard.road => Icons.alt_route,
    Hazard.weather => Icons.thunderstorm_outlined,
    Hazard.earthquake => Icons.ssid_chart,
    Hazard.airQuality => Icons.air,
    Hazard.epidemic => Icons.coronavirus_outlined,
    Hazard.other => Icons.info_outline,
  };

  LocalizedText get label => switch (this) {
    Hazard.flood => const LocalizedText(ne: 'बाढी', en: 'Flood'),
    Hazard.landslide => const LocalizedText(ne: 'पहिरो', en: 'Landslide'),
    Hazard.road => const LocalizedText(ne: 'सडक', en: 'Road'),
    Hazard.weather => const LocalizedText(ne: 'मौसम', en: 'Weather'),
    Hazard.earthquake => const LocalizedText(ne: 'भूकम्प', en: 'Earthquake'),
    Hazard.airQuality => const LocalizedText(ne: 'हावा', en: 'Air'),
    Hazard.epidemic => const LocalizedText(ne: 'महामारी', en: 'Epidemic'),
    Hazard.other => const LocalizedText(ne: 'अन्य', en: 'Other'),
  };
}
