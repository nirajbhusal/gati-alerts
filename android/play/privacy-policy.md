# Privacy draft for Gati Alerts on Android

Draft only. Not published. Play needs a public URL before submission because the app declares location. Do not put a personal phone number or email in the published copy.

Gati Alerts (`io.github.nirajbhusal.gati.alerts`) is an independent project by Niraj Bhusal. It is not an official app of the Government of Nepal.

The Android app opens the public website https://nirajbhusal.github.io/gati-alerts/ in Chrome. It does not add an account, analytics SDK, or advertising SDK.

## What stays on the device

- Language, numeral style, theme, district, and notification choices are stored by the website in the browser on this device.
- The app stores one flag: that the opening notice has been shown.
- Location, if you tap a control that asks for it, is used on the device. The app does not collect location in the background.

## What leaves the device

Only when you use the site, and only over HTTPS:

- Pages and data are loaded from GitHub Pages.
- Maps may request tiles from OpenStreetMap.
- Ask Gati may send your question and language to https://gati-ask.nirajbhusal.workers.dev/ask and may request a forecast or air figure from Open-Meteo.
- A citizen report opens GitHub so you can submit it with your own GitHub account. The site does not send your phone number.
- Opening a source link leaves Gati and opens that agency's page in the browser.

## Notifications

You can turn on notifications while Gati is open. Gati does not send push messages while the app is closed. That feature is not built.

## Children

The app is not directed at children under 13.

## Contact

Write through the GitHub repository nirajbhusal/gati-alerts. This draft intentionally has no personal phone number or email.
