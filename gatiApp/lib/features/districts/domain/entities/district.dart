import '../../../../core/l10n/localized_text.dart';

class District {
  const District({
    required this.code,
    required this.slug,
    required this.name,
    required this.province,
  });

  /// NP-DISTRICT code, e.g. `NP0330`. Alerts refer to districts by this.
  final String code;

  /// Lower-case id, e.g. `dhading`. Contacts and rivers refer to this.
  final String slug;
  final LocalizedText name;
  final String province;

  bool matches(String query) {
    final q = query.trim().toLowerCase();
    return q.isEmpty ||
        name.en.toLowerCase().contains(q) ||
        name.ne.contains(q) ||
        slug.contains(q);
  }
}
