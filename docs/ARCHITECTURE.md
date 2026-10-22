# Architecture

Gati (MVP) is a fully static site on GitHub Pages. There is no server, database or secret.

```
 official notice (DHM / NDRRMA / NEOC / Police)          citizen
          │  human editor copies wording + link             │  /report/ form (browser only)
          ▼                                                 ▼
 data/alerts/*.xml  (CAP 1.2, one file/message)     prefilled GitHub issue form URL
          │  git push / PR                                  │  reporter submits with own account
          ▼                                                 ▼
 GitHub Action  ci/cap.yml (→ .github/workflows/cap.yml)           Issue + labels reported, citizen-report
   1. XSD validation (schema/CAP-v1.2.xsd)                  │  moderator relabels (docs/VERIFICATION.md)
   2. Gati profile checks                                   ▼
   3. scripts/build.py → feed.xml + data/alerts.json  /reports/ reads GitHub REST API in the browser
   4. commit feed, deploy Pages artifact
          ▼
 index.html  (assets/js/home.js: list, filters, Leaflet map)
```

## Components

| Part | Files | Notes |
|---|---|---|
| Shell | `assets/js/common.js`, `assets/css/gati.css` | Header, nav, disclaimer, footer, language toggle (Nepali default, saved in `localStorage`), NPT time formatting, severity/trust chips |
| Home | `index.html`, `assets/js/home.js` | Reads `data/alerts.json` + `data/districts.json`. Expiry is recomputed in the browser, so an alert flips to "Expired" even between builds. Map is Leaflet 1.9.4 (unpkg, SRI-pinned) with OSM tiles; list works without the map |
| Report | `report/index.html`, `assets/js/report.js` | GPS via `navigator.geolocation`, pin via Leaflet, rounded to 4 decimals. Builds `issues/new?template=report.yml&labels=…&<field-id>=…`. Contact never enters the URL; optional `mailto:` to the maintainer |
| Reports | `reports/index.html`, `assets/js/reports.js` | `GET /repos/nirajbhusal/gati-alerts/issues?labels=reported` and `…=verified`, merged. Status precedence: retracted > corrected > verified > reported. Emails and phone numbers are scrubbed before display |
| Feed | `scripts/build.py` | lxml XMLSchema validation, Atom 1.0 (`feed.xml`), JSON mirror |
| CI/CD | `ci/cap.yml (→ .github/workflows/cap.yml)` | On push, PR (validate only), manual and daily. Pages `build_type` = workflow |

## Data model (JSON mirror)

`data/alerts.json → alerts[]`: `identifier, sender, sent, status, msgType, note, file, trust, state, hazard, severity,
expires, expired, districts[], info.{ne,en}.{event, urgency, severity, certainty, senderName, headline, description,
instruction, web, params, areas[{desc, polygons[[[lat,lon]…]], circles[], geocodes{}}]}`.

## Why no backend

Static hosting has no place to keep secrets. GitHub issue forms are free, moderated, auditable and need no new
accounts for the project. See README "Future backend option" for the planned replacement.

## Privacy

No cookies, analytics or ads. Third-party requests: Google Fonts, unpkg (Leaflet), OSM tiles, GitHub API (Reports page only).
