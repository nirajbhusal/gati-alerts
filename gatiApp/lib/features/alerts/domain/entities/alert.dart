import '../../../../core/l10n/localized_text.dart';
import 'alert_enums.dart';

/// One relayed CAP message.
class Alert {
  const Alert({
    required this.id,
    required this.sent,
    required this.expires,
    required this.msgType,
    required this.trust,
    required this.hazard,
    required this.severity,
    required this.districtCodes,
    required this.headline,
    required this.event,
    required this.description,
    required this.instruction,
    required this.senderName,
    required this.areas,
    this.sourceUrl,
    this.correctedState,
    this.supersededBy,
  });

  final String id;
  final DateTime sent;
  final DateTime expires;

  /// `Alert`, `Update` or `Cancel`.
  final String msgType;
  final TrustLevel trust;
  final Hazard hazard;
  final Severity severity;

  /// NP-DISTRICT codes. Empty means the whole country.
  final List<String> districtCodes;

  final LocalizedText headline;
  final LocalizedText event;
  final LocalizedText description;
  final LocalizedText instruction;
  final LocalizedText senderName;
  final List<LocalizedText> areas;

  /// The original notice from the issuing agency.
  final String? sourceUrl;

  /// e.g. `Corrected` or `Retracted` when the item was later fixed.
  final String? correctedState;

  /// Id of the newer message that replaces this one.
  final String? supersededBy;

  bool get isNationwide => districtCodes.isEmpty;

  /// Same rule as the website: not expired, not replaced, not a cancel.
  /// Worked out on the device, so it is right even between data updates.
  bool isActive([DateTime? now]) =>
      supersededBy == null &&
      msgType != 'Cancel' &&
      expires.isAfter(now ?? DateTime.now());

  bool concerns(String districtCode) =>
      isNationwide || districtCodes.contains(districtCode);
}
