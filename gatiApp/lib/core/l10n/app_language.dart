import 'package:flutter/widgets.dart';

enum AppLanguage {
  ne('ne', 'नेपाली'),
  en('en', 'English');

  const AppLanguage(this.code, this.label);

  final String code;
  final String label;

  Locale get locale => Locale(code);

  static AppLanguage fromCode(String? code) =>
      values.firstWhere((l) => l.code == code, orElse: () => AppLanguage.ne);
}
