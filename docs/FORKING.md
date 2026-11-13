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
| `scripts/country.py` | Loads the file for other scripts, and writes it into `assets/js/common.js` as `G.country` |
| `scripts/build.py`, `scripts/render.py`, `scripts/social_meta.py` | `site`, CAP identifier prefix, district geocode name |
| `scripts/broadcast.py` | `site`, `helplines` |
| `scripts/make_offline_map.py` | `map.maxBounds`, district geometry (to cut the offline map) |
| `assets/js/common.js` and page scripts | `repository`, `site`, time zone offset, map bounds and centre, helplines in the footer and on the report and contact pages |

After editing `data/country.json`, run `python scripts/country.py` (CI fails if you forget), then
`python scripts/make_offline_map.py` to rebuild the offline map for your country.

What is listed below is still hard-coded and has to be changed by hand.

## Still hard-coded

| What | Where |
|---|---|
| Site address and repository | `README.md`, the `<meta>` tags and links inside page HTML, `assets/js/embed.js`, `worker/wrangler.toml`, `.github/ISSUE_TEMPLATE/`, the policy files, User-Agent strings in fetch scripts |
| Emergency numbers in running text | Page HTML and messages in `assets/js/askpop.js`, `affected.js`, `highways.js`, `contacts.js`; `data/contacts.json` |
| Agencies and their domains | `data/sources.json`, the agency table at the top of `assets/js/common.js`, `worker/src/lib.js` |
| Districts and boundaries | `data/districts.json`, `data/districts.geojson`, `data/localunits.geojson`, `data/geo/` |
| Bikram Sambat calendar, and the time zone in two standalone files | `assets/js/bs.js`, `assets/js/patro.js`, `assets/js/embed.js`, `worker/src/index.js` |
| The two languages (Nepali, English) | Every page uses `ne-only` / `en-only` spans; scripts use `T(ne, en)` |
| CAP profile inside the alert files (`np.gati.*` identifiers, `NP-DISTRICT` geocode) | `data/alerts/`, `docs/CAP.md`, ingest scripts |
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
