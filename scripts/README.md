# Scripts

Everything here uses the Python standard library unless a row says otherwise. Run from the repository root.

## Every time alerts change

| Script | What it does |
|---|---|
| `build.py` | Validates every CAP file (`--check`), then writes `atom.xml`, `feed.xml`, `cap/` and `data/alerts.json`. Needs `lxml`. |
| `render.py` | Writes each alert's page, share image, story image and QR, plus the Lite page and the holiday `.ics`. Needs `pillow` and `segno`. **Run after `build.py`**; CI fails if an alert has no page. |
| `social_meta.py` | Refreshes the share tags in the static pages. Run after `render.py`. |
| `stamp.py` | Stamps the service worker so browsers pick up a new version. Run by the pre-commit hook in `hooks/` and by `render.py`. |
| `country.py` | Shares `data/country.json` with other scripts and writes it into `assets/js/common.js`. Run after editing that file; `--check` is used in CI. |

## Run by workflows

| Script | Workflow | What it does |
|---|---|---|
| `poll.py` | `poll.yml` | Snapshots each official source into `data/raw/` when its content changes. |
| `ingest_quakes.py` | `poll.yml` | Turns NSC and USGS earthquake events into CAP files. |
| `broadcast.py` | `broadcast.yml` | Posts new official alerts to Telegram, Viber, WhatsApp and SMS. See `docs/BROADCAST.md`. |
| `dhm_watch.py` | `dhm-watch.yml` | Fails the run when DHM has a newer page than the repo records. Read only. |

## Run by hand to refresh data

| Script | Writes | Source |
|---|---|---|
| `fetch_dhm_forecast.py` | `data/weather.json` (24-hour country and Kathmandu forecast) | DHM |
| `fetch_dhm_warning.py` | `data/weather.json` (latest 5-day warning) | DHM |
| `fetch_navigate.py` | `data/navigate.json` (road closures) | Department of Roads |
| `fetch_fuel.py` | `data/fuel.json` | Nepal Oil Corporation |
| `fetch_health.py` | `data/health.json` (hospital beds, blood banks) | Ministry of Health and Population |
| `check_sources.py` | `data/source-health.json` | Each source in `data/sources.json` |

## Run rarely, to rebuild map and route data

| Script | Writes |
|---|---|
| `make_geo.py` | Simplified district and local-unit boundaries from the official COD-AB data. Needs `shapely`. |
| `add_official_chuchhe.py` | Adds the Limpiyadhura–Lipulekh–Kalapani area to the display boundaries, following Nepal's official map of 2020. |
| `make_layers.py` | Province, river and other map layers for the Map page. |
| `route_network.py`, `route_hq.py` | Places and highway segments in `data/roads.json` and their geometry. |
| `make_treks.py`, `make_trekinfo.py` | Trekking routes and their stage, altitude and help data. |
| `make_offline_map.py` | Cuts the offline street map in `data/offline/` from a Protomaps build. Large download; rebuild rarely. |
| `seed_from_bulletin.py` | One-off: created the first CAP files from the Rasuwa bulletin. Kept for the record. |

## Tests

`python -m unittest discover scripts/tests` covers `broadcast.py`. The Worker has its own tests in `worker/`.

## Brand kit

`make_brand_kit.py` builds everything in `assets/brand/` (vector and PNG logos, icons, social media images, the brand guidelines PDF, the maintainer's visiting card and the two zip files), refreshes the site's own icons and rewrites the file list on the About page. It needs `pip install fonttools uharfbuzz segno`, Node and Playwright (`cd tests && npm ci`). The drawing is in `brand/make_svg.py`, the layouts in `brand/render.cjs`. Run it only when the brand changes.

## Daily card

`render.py` also writes `share/today.png` (1200×630) and `share/today-square.png` (1080×1080): the "Nepal today" infographic with the district map, DHM's five-day warning, rivers, roads and measured rain. It is redrawn on every build, so it is as fresh as the data files.
