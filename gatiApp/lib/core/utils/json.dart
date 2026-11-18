import '../l10n/localized_text.dart';

/// Null-safe readers for loosely typed JSON. Models use these so a missing
/// or oddly typed field never crashes parsing.
abstract final class Json {
  static Map<String, dynamic> map(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return const {};
  }

  static List<Map<String, dynamic>> list(dynamic v) =>
      v is List ? v.map(map).where((e) => e.isNotEmpty).toList() : const [];

  static String str(dynamic v) => v == null ? '' : v.toString();

  static String? strOrNull(dynamic v) {
    final s = str(v).trim();
    return s.isEmpty ? null : s;
  }

  static double? dbl(dynamic v) =>
      v is num ? v.toDouble() : double.tryParse(str(v));

  static DateTime? date(dynamic v) => DateTime.tryParse(str(v));

  static List<String> strList(dynamic v) =>
      v is List ? v.map(str).where((e) => e.isNotEmpty).toList() : const [];

  /// Reads `{ne, en}` pairs. With [key], reads `key_ne` / `key_en` instead.
  static LocalizedText text(Map<String, dynamic> json, [String? key]) =>
      key == null
      ? LocalizedText(ne: str(json['ne']), en: str(json['en']))
      : LocalizedText(ne: str(json['${key}_ne']), en: str(json['${key}_en']));
}
