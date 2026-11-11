# Adapting Gati for another country

Gati is licensed so that anyone can run it for their own country or region. This page says what to change, what is
already in one place, and what is still spread through the code.

## Keep the core rule

Relay official sources with their source and time. Never originate, estimate or combine warnings. Use your own name
and logo so nobody confuses your relay with this one, and publish your own privacy policy and legal position.

## `data/country.json`

One file holds the facts that make a deployment a country's: country code and name, project name and CAP identifier
prefix, site address, repository, languages, time zone, map bounds, the district geocode scheme, helplines, and the
governing law.

Read from it today:

| Reader | Fields used |
|---|---|
| `scripts/broadcast.py` | `site`, `helplines` |

Everything else below is still hard-coded and has to be changed by hand. Moving these to read `country.json` is the
next step, one page at a time, so that a fork becomes a config change.

## Still hard-coded

| What | Where |
|---|---|
| Site address and repository | `README.md`, page `<meta>` tags, `assets/js/report.js`, `assets/js/reports.js`, `worker/wrangler.toml`, `.github/ISSUE_TEMPLATE/` |
| Emergency numbers 100, 101, 102, 1234 | Page HTML (`report/`, `contact/`, `contacts/`, `offline/`), `assets/js/common.js`, `data/contacts.json` |
| Agencies and their domains | `data/sources.json`, the agency table at the top of `assets/js/common.js`, `worker/src/lib.js` |
| Districts and boundaries | `data/districts.json`, `data/districts.geojson`, `data/localunits.geojson`, `data/geo/` |
| Map bounds and centre | `assets/js/mapx.js`, `assets/js/report.js`, `assets/js/homemap.js` |
| Time zone (UTC+5:45) and Bikram Sambat calendar | `assets/js/common.js`, `assets/js/bs.js`, `assets/js/patro.js`, `worker/src/index.js` |
| The two languages (Nepali, English) | Every page uses `ne-only` / `en-only` spans; scripts use `T(ne, en)` |
| CAP profile (`np.gati.*` identifiers, `NP-DISTRICT` geocode) | `scripts/build.py`, `docs/CAP.md`, `data/alerts/` |
| Country-specific pages | `patro/`, `trek/`, `fuel/`, `health/`, `route/` |

## Suggested order for a fork

1. Fork, rename, replace the logo in `assets/img/brand/`.
2. Edit `data/country.json`.
3. Replace `data/sources.json` with your mandated alerting agencies and clear `data/alerts/`.
4. Replace the district files and the geocode scheme in `scripts/build.py`.
5. Translate: the first language goes in the `ne-only` spans and the first argument of `T()`.
6. Replace helplines and contacts.
7. Remove the country-specific pages you do not need.
8. Write your own `PRIVACY.md` and legal position, then run `python scripts/build.py --check`.
