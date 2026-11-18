import '../../../../core/l10n/localized_text.dart';

/// Order matters: worst first, used for sorting.
enum RoadStatus {
  blocked,
  oneway,
  open,

  /// Not on any official notice either way.
  unconfirmed;

  static RoadStatus parse(String v) => switch (v) {
    'blocked' || 'closed' => RoadStatus.blocked,
    'oneway' || 'partial' => RoadStatus.oneway,
    'open' => RoadStatus.open,
    _ => RoadStatus.unconfirmed,
  };
}

class RoadRoute {
  const RoadRoute({
    required this.id,
    required this.name,
    required this.status,
    required this.note,
  });

  final String id;
  final LocalizedText name;
  final RoadStatus status;
  final LocalizedText note;
}

class RoadReport {
  const RoadReport({
    required this.asOf,
    required this.rule,
    required this.sourceUrl,
    required this.routes,
  });

  final LocalizedText asOf;

  /// How Gati decides "open", shown under the list.
  final LocalizedText rule;
  final String? sourceUrl;
  final List<RoadRoute> routes;

  int count(RoadStatus status) =>
      routes.where((r) => r.status == status).length;
}
