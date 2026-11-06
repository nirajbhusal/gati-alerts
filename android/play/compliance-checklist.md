# Play compliance checklist

Status on 6 November 2026. Nothing here has been submitted to Google Play.

Package `io.github.nirajbhusal.gati.alerts`, versionName `1.0.0`, versionCode `1`, minSdk 24, compileSdk 36, targetSdk 36.

Play's target API rule, read from https://developer.android.com/google/play/requirements/target-sdk on 6 November 2026 (page updated 28 October 2026): new apps must target Android 16 (API 36) or higher. This build does.

## Done in this repo

- [x] Target API 36, minimum API 24.
- [x] 16 KB alignment check passed on the built APKs. The APKs contain no native libraries.
- [x] Cleartext traffic is off. Network security config trusts system CAs only.
- [x] No JavaScript bridge. Release build uses R8.
- [x] Backup of app files and preferences is excluded.
- [x] Exported components set `android:exported`. The launcher accepts only https URLs on `nirajbhusal.github.io` under `/gati-alerts`.
- [x] Permissions: `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `VIBRATE`. No background location, camera, contacts, storage, SMS, or `CALL_PHONE`. AndroidX also adds a signature permission `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` for its own internal receiver. The user is not prompted for it.
- [x] Location and notifications are not requested at startup. The opening notice says what they do.
- [x] Opening notice states that Gati relays, does not issue warnings, and is not a government app.
- [x] Debug launcher label is `गति Gati PREVIEW`. versionName is `1.0.0-preview`.
- [x] Release APK and AAB built here are unsigned. They are not installable as a Play release.
- [x] CI workflow builds the same artifacts and can sign only from repository secrets. It does not publish to Play.
- [x] No keystore, password, or token is committed.

## Blocked before an official release

- [ ] Confirm the package id `io.github.nirajbhusal.gati.alerts`. It is provisional. No earlier Android package was found in this repo.
- [ ] Create an upload keystore outside the repo and store it in `GATI_ANDROID_KEYSTORE_BASE64`, `GATI_ANDROID_KEYSTORE_PASSWORD`, `GATI_ANDROID_KEY_ALIAS`, and `GATI_ANDROID_KEY_PASSWORD`. Do not commit it. Ask before any existing production key is used. None was found in this repo.
- [ ] Enroll in Play App Signing. Put both the app signing certificate SHA-256 and the upload certificate SHA-256 into `assetlinks.json`. The debug certificate of a PREVIEW APK must not be listed there.
- [ ] Publish `assetlinks.json` at `https://nirajbhusal.github.io/.well-known/assetlinks.json`. Checked 6 November 2026: that URL and `https://nirajbhusal.github.io/gati-alerts/.well-known/assetlinks.json` both return 404. Chrome ignores a file under the project subpath. This repo cannot write the user-site root. Until the origin file is live, the address bar stays. That is honest, and it means the shipped preview is a browser tab with a launcher, not a fully trusted web activity.
- [ ] After that file is live, retest. Trust is origin-wide. A link from Gati to another project on `nirajbhusal.github.io` (for example the Rasuwa bulletin) can open full screen, with no address bar. Decide if that is acceptable or if those links should move to another host.
- [ ] Publish the privacy draft at a public URL and paste that URL into Play Console.
- [ ] Create the Play Console app, complete Data safety, the IARC questionnaire, and the news declaration if News is the category. Store copy must keep the independent-project wording in `store-listing.md`.
- [ ] Review `/contact/` on the website before promotion. It still shows a personal WhatsApp number and email. This Android change does not alter that page. The store listing in this folder does not repeat them.
- [ ] Capture store screenshots from the build you intend to ship, including the address bar if Digital Asset Links are still missing. Do not use screenshots of a Chrome flag that skips verification.
- [ ] Do not promise closed-app alerts. Push is not implemented.

## Signing names only

No production keystore, Play service account, or upload alias is present in the repo. CI secret names are listed above. They were not set for the builds in this change.
