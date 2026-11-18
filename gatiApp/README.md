# Gati App

Flutter app for [Gati](https://gatialerts.com/): official disaster and weather alerts for Nepal, relayed with source and time.
Reads the website's public JSON (`data/*.json`). No backend, no account.

## Run

```bash
flutter pub get
flutter run
flutter test
```

## Structure (feature-first clean architecture)

```
lib/
  main.dart                 loads SharedPreferences, starts ProviderScope
  app/
    app.dart                MaterialApp.router (theme, language)
    router/                 go_router setup and route paths
    shell/                  app bar + bottom navigation
  core/                     shared by every feature, depends on no feature
    config/                 base URL, timeouts
    network/                Dio, ApiClient, endpoints
    error/                  Failure (Network / Server / Parse)
    l10n/                   AppLanguage, LocalizedText (ne/en), AppStrings
    preferences/            language, theme, my district (on device)
    theme/                  AppColors (Gati brand), AppTheme light/dark, spacing
    utils/                  Json readers, NPT date and Nepali digit formatting, url/phone launcher
    widgets/                AsyncListView, error/empty views, SectionCard, StatusPill, SourceNote
  features/
    alerts/  weather/  roads/  rivers/  contacts/  districts/  settings/
      domain/               entities + repository interface (pure Dart)
      data/                 models (fromJson) + remote datasource + repository impl
      presentation/         Riverpod providers, pages, widgets
```

Flow: page → provider → repository (interface) → repository impl → datasource → ApiClient → Dio.

## Add a feature

1. `domain/entities` and `domain/repositories/<x>_repository.dart`
2. `data/models` (extends the entity, `fromJson` using `Json`), `data/datasources`, `data/repositories`
3. `presentation/providers` (repository provider + `FutureProvider`), a page that returns `AsyncListView`
4. Add the endpoint to `core/network/api_endpoints.dart` and the route to `app/router`.
