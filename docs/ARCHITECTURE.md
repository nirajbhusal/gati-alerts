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
| Home | `index.html`, `assets/js/home.js` | Visual dashboard: map, KPI strip, on-page charts (HTML/SVG, no images), feed list and updates. Reads `data/alerts.json`, `data/districts.json`, `data/seed/district-polygons.json`, `data/roads.json` (main-road status copied from the Rasuwa bulletin) and `data/updates.json`. Expiry is recomputed in the browser, so an alert flips to "Expired" even between builds. Map is self-hosted Leaflet 1.9.4 (`assets/vendor/leaflet`) with no tile server: muted district polygons, `data/geo/roads.geojson` (real road paths routed on OpenStreetMap data via OSRM, simplified), `data/geo/rivers.geojson` (Natural Earth, clipped), `data/rivers.json` gauges; list works without the map |
| Report | `report/index.html`, `assets/js/report.js` | GPS via `navigator.geolocation`, pin via Leaflet, rounded to 4 decimals. Builds `issues/new?template=report.yml&labels=…&<field-id>=…`. Contact never enters the URL; optional `mailto:` to the maintainer |
| Reports | `reports/index.html`, `assets/js/reports.js` | Lists only `GET /repos/nirajbhusal/gati-alerts/issues?labels=verified&state=all` (minus `retracted`). Unverified reports are never listed; a search-API count of open `reported` issues is shown instead. Emails and phone numbers are scrubbed before display |
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

No cookies, analytics or ads. Fonts (Mukta, Inter; `assets/fonts`) and Leaflet are self-hosted. Third-party requests: OSM tiles on the Report page map only (disclosed) and the GitHub API (report counts on the home page; verified reports on the Reports page).
