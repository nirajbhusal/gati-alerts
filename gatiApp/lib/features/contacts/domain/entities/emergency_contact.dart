import '../../../../core/l10n/localized_text.dart';

class EmergencyContact {
  const EmergencyContact({
    required this.number,
    required this.dial,
    required this.name,
    required this.agency,
    required this.category,
  });

  /// As printed, e.g. `100` or `9851277777`.
  final String number;

  /// What the dialer gets, e.g. `+9779851277777`.
  final String dial;
  final LocalizedText name;
  final LocalizedText agency;

  /// `police`, `fire`, `ambulance`, `dao`, ...
  final String category;
}

class ContactDirectory {
  const ContactDirectory({required this.national, required this.byDistrict});

  final List<EmergencyContact> national;

  /// Keyed by district slug (e.g. `rasuwa`).
  final Map<String, List<EmergencyContact>> byDistrict;
}
