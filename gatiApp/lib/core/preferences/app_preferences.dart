import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/app_language.dart';

/// Overridden in `main()` with the loaded instance.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (_) => throw UnimplementedError('sharedPreferencesProvider not overridden'),
);

/// The user's choices. They stay on the device.
@immutable
class AppPreferences {
  const AppPreferences({
    this.language = AppLanguage.ne,
    this.themeMode = ThemeMode.system,
    this.districtId,
  });

  final AppLanguage language;
  final ThemeMode themeMode;

  /// NP-DISTRICT code (e.g. `NP0330`), or null for all of Nepal.
  final String? districtId;
}

final preferencesProvider =
    NotifierProvider<PreferencesNotifier, AppPreferences>(
      PreferencesNotifier.new,
    );

class PreferencesNotifier extends Notifier<AppPreferences> {
  static const _kLanguage = 'language';
  static const _kTheme = 'theme';
  static const _kDistrict = 'district';

  SharedPreferences get _store => ref.read(sharedPreferencesProvider);

  @override
  AppPreferences build() {
    final store = ref.watch(sharedPreferencesProvider);
    return AppPreferences(
      language: AppLanguage.fromCode(store.getString(_kLanguage)),
      themeMode:
          ThemeMode.values.asNameMap()[store.getString(_kTheme)] ??
          ThemeMode.system,
      districtId: store.getString(_kDistrict),
    );
  }

  void setLanguage(AppLanguage language) {
    _store.setString(_kLanguage, language.code);
    state = _copy(language: language);
  }

  void setThemeMode(ThemeMode mode) {
    _store.setString(_kTheme, mode.name);
    state = _copy(themeMode: mode);
  }

  /// Pass null for all of Nepal.
  void setDistrict(String? districtId) {
    districtId == null
        ? _store.remove(_kDistrict)
        : _store.setString(_kDistrict, districtId);
    state = _copy(districtId: districtId);
  }

  static const _keep = Object();

  AppPreferences _copy({
    AppLanguage? language,
    ThemeMode? themeMode,
    Object? districtId = _keep,
  }) => AppPreferences(
    language: language ?? state.language,
    themeMode: themeMode ?? state.themeMode,
    districtId: identical(districtId, _keep)
        ? state.districtId
        : districtId as String?,
  );
}

/// Shortcut used by most widgets.
final languageProvider = Provider<AppLanguage>(
  (ref) => ref.watch(preferencesProvider.select((p) => p.language)),
);
