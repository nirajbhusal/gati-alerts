import '../../../../core/l10n/localized_text.dart';
import '../../../../core/utils/json.dart';
import '../../domain/entities/alert.dart';
import '../../domain/entities/alert_enums.dart';

/// Reads one item of `data/alerts.json → alerts[]`. Text fields live in
/// `info.ne` and `info.en`; the top level holds the computed summary.
class AlertModel extends Alert {
  const AlertModel({
    required super.id,
    required super.sent,
    required super.expires,
    required super.msgType,
    required super.trust,
    required super.hazard,
    required super.severity,
    required super.districtCodes,
    required super.headline,
    required super.event,
    required super.description,
    required super.instruction,
    required super.senderName,
    required super.areas,
    super.sourceUrl,
    super.correctedState,
    super.supersededBy,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    final info = Json.map(json['info']);
    final ne = Json.map(info['ne']);
    final en = Json.map(info['en']);
    LocalizedText field(String key) =>
        LocalizedText(ne: Json.str(ne[key]), en: Json.str(en[key]));

    final sent = Json.date(json['sent']) ?? DateTime.now();
    return AlertModel(
      id: Json.str(json['identifier']),
      sent: sent,
      expires: Json.date(json['expires']) ?? sent,
      msgType: Json.str(json['msgType']),
      trust: TrustLevel.parse(Json.str(json['trust'])),
      hazard: Hazard.parse(Json.str(json['hazard'])),
      severity: Severity.parse(Json.str(json['severity'])),
      districtCodes: Json.strList(json['districts']),
      headline: field('headline'),
      event: field('event'),
      description: field('description'),
      instruction: field('instruction'),
      senderName: field('senderName'),
      areas: Json.list(
        json['areas'],
      ).map(Json.text).where((t) => !t.isEmpty).toList(),
      sourceUrl: Json.strOrNull(en['web']) ?? Json.strOrNull(ne['web']),
      correctedState: Json.strOrNull(json['state']),
      supersededBy: Json.strOrNull(json['supersededBy']),
    );
  }
}
