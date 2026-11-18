import '../l10n/app_language.dart';

/// Dates in Nepal Time (UTC+5:45) and numerals that follow the language:
/// Devanagari in Nepali, Western in English, as on the website.
abstract final class Fmt {
  static const _neDigits = '०१२३४५६७८९';
  static const _nptOffset = Duration(hours: 5, minutes: 45);

  static const _monthsEn = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  static const _monthsNe = [
    'जनवरी',
    'फेब्रुअरी',
    'मार्च',
    'अप्रिल',
    'मे',
    'जुन',
    'जुलाई',
    'अगस्ट',
    'सेप्टेम्बर',
    'अक्टोबर',
    'नोभेम्बर',
    'डिसेम्बर',
  ];

  static String digits(String text, AppLanguage lang) => lang == AppLanguage.en
      ? text
      : text.replaceAllMapped(
          RegExp(r'\d'),
          (m) => _neDigits[int.parse(m[0]!)],
        );

  static String number(num value, AppLanguage lang, {int decimals = 0}) =>
      digits(value.toStringAsFixed(decimals), lang);

  /// e.g. "18 Nov, 09:25" in Nepal Time.
  static String dateTime(DateTime value, AppLanguage lang) {
    final t = value.toUtc().add(_nptOffset);
    final month = (lang == AppLanguage.ne ? _monthsNe : _monthsEn)[t.month - 1];
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return digits('${t.day} $month, $hh:$mm', lang);
  }

  /// e.g. "3 h ago" / "३ घण्टा अघि".
  static String ago(DateTime value, AppLanguage lang, {DateTime? now}) {
    final d = (now ?? DateTime.now()).difference(value);
    final ne = lang == AppLanguage.ne;
    final (n, unit) = switch (d) {
      _ when d.inMinutes < 1 => (0, ''),
      _ when d.inHours < 1 => (d.inMinutes, ne ? 'मिनेट' : 'min'),
      _ when d.inDays < 1 => (d.inHours, ne ? 'घण्टा' : 'h'),
      _ => (d.inDays, ne ? 'दिन' : 'd'),
    };
    if (unit.isEmpty) return ne ? 'भर्खरै' : 'just now';
    return digits(ne ? '$n $unit अघि' : '$n $unit ago', lang);
  }
}
