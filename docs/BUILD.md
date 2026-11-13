# Building, testing and publishing

Gati is a static site. Some of its files are written by hand and some are generated from the CAP alert files.

## What is generated

| Generated | From | By |
|---|---|---|
| `atom.xml`, `feed.xml`, `cap/`, `data/alerts.json` | `data/alerts/*.xml` | `scripts/build.py` |
| `alerts/<id>/` pages and share images, `stories/img/`, `stories/qr/`, `lite/`, `patro/gati.ics` | `data/alerts.json`, `data/calendar.json` | `scripts/render.py` |
| The `G.country` block in `assets/js/common.js` | `data/country.json` | `scripts/country.py` |
| `privacy/index.html` | `web/src/pages/privacy.astro` | `cd web && npm run build` |

## Build and test on your computer

```bash
pip install lxml pillow segno
python scripts/build.py && python scripts/render.py && python scripts/social_meta.py
python -m unittest discover scripts/tests          # broadcast script
(cd worker && npm test)                            # Worker
(cd tests && npm ci && npx playwright install chromium)
(cd tests && npm run lint && npm run types)        # undefined names and similar mistakes; Worker type check
node tests/smoke.cjs                               # every page, Nepali and English, in a real browser
(cd web && npm ci && npm run build)                # rebuild the pages that are written as templates
python -m http.server 8000                         # open http://localhost:8000/
```

## Pages written as templates (Astro)

Pages are moving, one at a time, from hand-written HTML to templates in `web/`. A template page shares one layout
(`web/src/layouts/Base.astro`) for its head tags, fonts and scripts, so those are written once. The output is plain
static HTML with nothing from Astro running in the browser.

- Moved so far: `privacy/`.
- To edit a moved page, change `web/src/pages/<name>.astro`, then run `cd web && npm run build`. That rebuilds the
  page and copies it to `<name>/index.html`, which is the file GitHub Pages serves. Commit both.
- Never edit a moved page's `index.html` by hand: CI rebuilds it and fails if the two differ.
- To move another page: create `web/src/pages/<name>.astro`, wrap the page's `<main>` content in `<Base ...>`, build,
  and compare the page in a browser before committing.

## What runs on GitHub

`.github/workflows/site.yml` runs on every pull request and every push to `main`. It builds the site from source,
runs the unit tests, the lint and the Worker type check, confirms template pages are up to date, then opens every page in a browser in both languages and fails if any page throws a script
error, returns "not found" or has no heading. `.github/workflows/cap.yml` validates the CAP files.

## Publishing

**Today:** GitHub Pages serves the `main` branch as it is, so the generated files are committed to the repository.
If someone adds an alert and forgets `render.py`, the checks fail.

**Publishing from the workflow** (recommended; off until you switch it on):

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → Variables → add `PAGES_VIA_ACTIONS` with the value `true`.

After that, each push to `main` is built, tested and deployed by `site.yml`, and a failed test stops the deploy.
To go back, set the Pages source to "Deploy from a branch" (`main`, root) and delete the variable.

Once publishing from the workflow has worked for a while, the generated files can be removed from the repository
and added to `.gitignore`, which takes roughly 25 MB out of it. That is a separate, later step: do not do it while
Pages still serves the branch, or the alert pages would disappear from the live site.
