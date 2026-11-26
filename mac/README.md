# Gati for macOS

A small Mac app for [Gati](https://gatialerts.com/): Nepal's official disaster and weather alerts, relayed with source and time.

- **Menu bar:** a "ग" item with the number of active official alerts. Its menu lists them, most severe first, with links to Am I affected?, Route check, the Map and Emergency numbers. Checked every 15 minutes. Nepali or English.
- **Window:** the Gati site itself. Links to other sites open in your own browser, where the address is visible.

Only alerts labelled Official or Verified are listed. Gati relays agencies' notices; it does not issue warnings. This is an independent project by Niraj Bhusal, not a government app.

## Get the app

The app is built by the **macOS app** workflow in this repository. Open the latest run under *Actions*, download the `gati-mac` artifact, and open `Gati.dmg`.

The app is signed ad hoc, without an Apple Developer ID, and is not notarised. The first time, macOS will refuse a double-click: right-click the app, choose **Open**, then **Open** again. On macOS 15 and later, use *System Settings → Privacy & Security → Open Anyway*.

## Build it yourself

On a Mac with Xcode:

```
bash mac/build.sh
```

This writes `mac/build/Gati.app`, `Gati.dmg` and `Gati-mac.zip`. The binary runs on Apple silicon and Intel, macOS 12 or later.

## Privacy

The app reads one public file from `gatialerts.com` (`data/alerts.json`) every 15 minutes, and shows the Gati site in its window. It has no account, sends nothing about you, and keeps only two settings on the Mac: the menu language and whether the first-run notice was shown. The site's own privacy note applies to what the site does inside the window.

## What it does not do

- No notifications yet.
- "Use my location" on the site may not work inside the app; choose your district instead.
- It does not work offline: the window needs a connection, and the menu keeps its last list.

Package id: `io.github.nirajbhusal.gati.mac` (provisional). Version 1.0.0.
