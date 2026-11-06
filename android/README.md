# Gati Alerts for Android

Provisional Android package for the live site at `https://nirajbhusal.github.io/gati-alerts/`.

This is a **Trusted Web Activity**. Chrome loads the real site, including its service worker, language, numeral, and theme settings. The app does not bundle a second copy of the pages and it does not add a JavaScript bridge.

Package id: `io.github.nirajbhusal.gati.alerts`  
Version: `1.0.0` (`versionCode` 1). The debug build is `1.0.0-preview` and its launcher name is **गति Gati PREVIEW**.  
minSdk 24, compileSdk 36, targetSdk 36 (Play's submission requirement as of 31 August 2026: Android 16, API 36).

The package id is provisional. Confirm it before any store listing. No production keystore is in this repo.

## What the app does

- Shows a one-time notice: Gati relays official notices, does not issue warnings, and is an independent project by Niraj Bhusal, not a government app.
- Then opens `https://nirajbhusal.github.io/gati-alerts/?source=android` in Chrome.
- Keeps https links on `/gati-alerts` inside that session. Other links stay in the browser, where the address is visible. `tel:` is handled by the dialer. The app does not place calls.
- Android back is the browser history, then the app closes.
- Location and notification permissions exist so the site's own buttons can work. The app does not ask for them at startup. There is no background location and no closed-app push. The site already says push while Gati is closed is not available.

## Address bar

Checked on 6 November 2026:

- `https://nirajbhusal.github.io/.well-known/assetlinks.json` returns 404.
- `https://nirajbhusal.github.io/gati-alerts/.well-known/assetlinks.json` returns 404.

Chrome only reads Digital Asset Links from the **origin root**. A file inside this project would be served under `/gati-alerts/` and would not count. This repo cannot publish that file. The user site (`nirajbhusal.github.io`) is a different repository.

Until that file is hosted, with the SHA-256 of the real signing cert, Chrome shows the address bar (Custom Tab). That is expected. Do not treat a preview build as verified.

After verification, trust is for the whole `nirajbhusal.github.io` origin, not only `/gati-alerts`. A link to another project on that host can stay full screen. See `android/play/compliance-checklist.md`.

The template to publish, after a signing key exists, is `android/play/assetlinks.template.json`.

## Build

Java 17 or 21. Android SDK platform 36 and build-tools 36.0.0. `ANDROID_HOME` must be set. Do not commit `local.properties`.

```bash
cd android
./gradlew assembleDebug assembleRelease bundleRelease
```

Outputs:

| File | Meaning |
|---|---|
| `app/build/outputs/apk/debug/gati-alerts-debug.apk` | Debug-signed PREVIEW. Installable for testing. Not a Play release. |
| `app/build/outputs/apk/release/gati-alerts-release-unsigned.apk` | Release (R8) APK with no signature. Not installable and not Play-ready. |
| `app/build/outputs/bundle/release/gati-alerts-release.aab` | Release AAB with no signature. Play will reject it until it is signed. |

Icons are generated from `assets/img/brand/mark-512.png` and `assets/img/icon-maskable-512.png`:

```bash
python3 android/tools/make_icons.py
```

## Production signing

Not configured. CI signs a release only when these repository secrets exist. It never prints them and it never uploads to Play.

- `GATI_ANDROID_KEYSTORE_BASE64`
- `GATI_ANDROID_KEYSTORE_PASSWORD`
- `GATI_ANDROID_KEY_ALIAS`
- `GATI_ANDROID_KEY_PASSWORD`

Create a keystore only after the package id is confirmed. If Play App Signing is used, `assetlinks.json` needs both the upload key and the app signing key fingerprints. Do not commit the keystore.

Local release signing, when a keystore already exists outside the repo:

```bash
export GATI_ANDROID_KEYSTORE_FILE=/path/outside/the/repo/upload.jks
export GATI_ANDROID_KEYSTORE_PASSWORD=...
export GATI_ANDROID_KEY_ALIAS=...
export GATI_ANDROID_KEY_PASSWORD=...
./gradlew assembleRelease bundleRelease
```
