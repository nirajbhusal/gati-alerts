# Gati for Chrome

A toolbar button for [Gati](https://gatialerts.com/): official disaster and weather alerts for Nepal, relayed with source and time.

- **Popup:** active alerts for your district (or all Nepal), DHM's 5-day weather warning, and links to the Map, Roads, Flights and Emergency numbers. Nepali or English. Colours: automatic (follows the computer), light or dark, changed with the button at the top.
- **Badge:** the number of active alerts that name your district, coloured by the most severe one. Checked every 15 minutes.
- **Notifications:** off by default. When turned on, a new alert is shown once. Nothing is shown for alerts that were already active when you installed it.

Only alerts labelled Official or Verified are shown. Gati relays agencies' notices; it does not issue warnings.

## Install without the Chrome Web Store
1. Download `assets/downloads/gati-chrome-extension.zip` from the repository and unzip it (or use this `extension/` folder directly).
2. Open `chrome://extensions`, turn on **Developer mode** (top right).
3. Press **Load unpacked** and choose the unzipped folder.

Works in Chrome, Edge, Brave and other Chromium browsers.

## Privacy
The extension reads two public files from `gatialerts.com/` (`data/alerts.json`, `data/weather.json`) and nothing else. Your district, language and the list of alerts already shown stay in the browser (`chrome.storage.local`). There is no account, no analytics and no tracking.

Permissions: `alarms` (the 15-minute check), `storage` (your settings), `notifications` (only used if you turn them on), and access to the Gati site to read its data.

## Publish to the Chrome Web Store
Upload `assets/downloads/gati-chrome-extension.zip` in the [developer dashboard](https://chrome.google.com/webstore/devconsole). Rebuild the zip with `python3 scripts/make_extension.py` after any change, and raise `version` in `manifest.json` first.
