import 'app_language.dart';

/// A Nepali/English pair, as Gati's data stores every human-readable text.
class LocalizedText {
  const LocalizedText({this.ne = '', this.en = ''});

  final String ne;
  final String en;

  static const empty = LocalizedText();

  bool get isEmpty => ne.isEmpty && en.isEmpty;

  /// The text in [language], falling back to the other one when missing.
  String of(AppLanguage language) => switch (language) {
    AppLanguage.ne => ne.isNotEmpty ? ne : en,
    AppLanguage.en => en.isNotEmpty ? en : ne,
  };
}
