# गति · Gati — प्रमाणित सूचना, अफवाहभन्दा छिटो। / Verified. Faster than rumour.

**Live:** https://nirajbhusal.github.io/gati-alerts/ · **CAP feed:** [`feed.xml`](https://nirajbhusal.github.io/gati-alerts/feed.xml) · **JSON:** [`data/alerts.json`](https://nirajbhusal.github.io/gati-alerts/data/alerts.json)

Gati is a Nepali-first public alert **relay and verification** site. It republishes official notices from Nepal's
mandated agencies (DHM, NDRRMA, NEOC, Nepal Police) as standard **CAP 1.2** messages with the original source,
time and a trust label, and lets citizens send hazard reports that are shown as *unconfirmed* until moderated.

> **Gati never issues official warnings.** Under the Disaster Risk Reduction and Management Act 2074 that is the
> job of the mandated agencies. In every CAP message the `<sender>` is the original agency; Gati is named only as
> the relay in `<note>` and `<senderName>` ("relayed by Gati"). Gati is an independent citizen project, not a
> government system.

It is a parallel project to the verified [Rasuwa–Bhotekoshi bulletin](https://nirajbhusal.github.io/rasuwa-flood-bulletin/)
([repo](https://github.com/nirajbhusal/rasuwa-flood-bulletin)), whose data seeded the current alerts. The bulletin is not modified by this repo.

## What's here

| Path | What |
|---|---|
| `index.html` | Home: alert list (sort by severity / area / time, filter by district, active vs expired), Leaflet + OSM map of alert areas, trust labels |
| `report/` | Citizen report form → prefilled GitHub issue (see below) |
| `reports/` | Public list of issues labelled `reported` / `verified` (GitHub REST API, unauthenticated) |
| `about/`, `sources/`, `contact/` | Legal position, trust labels, sources, maintainer and emergency helplines |
| `data/alerts/*.xml` | **Source of truth:** CAP 1.2 messages (one file per message) |
| `feed.xml`, `data/alerts.json` | Generated Atom index and JSON mirror |
| `schema/CAP-v1.2.xsd` | OASIS CAP 1.2 schema (unchanged copy) |
| `scripts/build.py` | Validate (XSD + Gati profile) and regenerate feed/JSON |
| `scripts/seed_from_bulletin.py`, `data/seed/` | One-off seeder used to create the first CAP files from bulletin data |
| `ci/cap.yml (→ .github/workflows/cap.yml)` | CI: validate → build → commit feed → deploy GitHub Pages (also daily) |
| `.github/ISSUE_TEMPLATE/report.yml` | Citizen report issue form |
| `docs/` | [ARCHITECTURE](docs/ARCHITECTURE.md), [CAP](docs/CAP.md), [VERIFICATION](docs/VERIFICATION.md) |

> **Install the CI workflow:** the account token used to create this repo lacks GitHub's `workflow` scope, so the
> Action is shipped as [`ci/cap.yml`](ci/cap.yml). To enable it, move it to `.github/workflows/cap.yml` (GitHub web UI,
> or `gh auth refresh -s workflow` then push), and switch *Settings → Pages → Source* to **GitHub Actions**. Until then
> Pages deploys from the `main` branch and `feed.xml`/`data/alerts.json` are rebuilt locally with `scripts/build.py`.

## Run locally

```bash
pip install lxml
python scripts/build.py --check   # validate only
python scripts/build.py           # validate + write feed.xml and data/alerts.json
python -m http.server 8000        # open http://localhost:8000/
```

## Adding an alert

1. Copy an existing file in `data/alerts/`, give it a new `<identifier>` (`np.gati.<agency>-<topic>-<date>`) and file name.
2. Keep `<sender>` = the original agency's domain, copy its wording into `ne` and `en` `<info>` blocks, set `<web>` and
   `gati:sourceUrl` to the original notice, set `gati:trustLevel`, `<expires>` and `<area>` (polygon and/or geocode).
3. To correct or retract, publish a **new** message with `msgType` `Update` or `Cancel` and `<references>`; never edit history silently. See [docs/CAP.md](docs/CAP.md).
4. Open a PR. CI fails if the file is not valid CAP 1.2 or breaks the Gati profile.

## Citizen reports (no backend)

GitHub Pages is static, so reports use a sanctioned, free route that needs no new accounts or secrets on our side:
the `/report/` page builds a **prefilled GitHub issue-form URL** (`issues/new?template=report.yml&…`). The reporter
reviews it and submits it with their own GitHub account. The issue template adds the labels `reported` and
`citizen-report`. Moderators relabel to `verified`, `corrected`, `retracted` or `unverified` per
[docs/VERIFICATION.md](docs/VERIFICATION.md). Contact details are **never** put into the issue; the form offers an
optional private e-mail to the maintainer instead. Photos are attached by the reporter on the GitHub page.

Labels: `official`, `verified`, `reported`, `unverified`, `corrected`, `retracted`, `citizen-report`.

### Future backend option

Requiring a GitHub account excludes many people. A later version should add a small backend, for example a
serverless function (Cloudflare Workers / Netlify Functions / a government-hosted API) that accepts anonymous
reports with rate limiting and CAPTCHA, stores contact details encrypted and separately from the public record,
strips photo EXIF, and creates the public issue/record through a bot token. SMS/IVR intake (short code) and a
moderator dashboard would follow. Until then, no secrets are stored in this repo.

## Limits (MVP)

- All seeded items are past and therefore **expired**; the site shows them as an archive.
- District polygons are simplified outlines for display, not legal boundaries. Station location for Aarughat is approximate.
- Dates are shown in Gregorian + NPT; Bikram Sambat appears where the source text gives it.
- Reporting needs a GitHub account; the Reports page uses the unauthenticated GitHub API (60 requests/hour per IP).

## Brand

Logo concept A "Ga-Signal", Himal Navy `#0E2A47`, River Teal `#0F7C86`, Glacier `#7FD1D8` (Signal Amber only in the logo arcs),
CAP severity scale Extreme `#7A0019`, Severe `#C81E1E`, Moderate `#E8770E`, Minor `#F5C518`, Info `#2B6CB0`. Fonts: Mukta, Inter.

Maintainer: Niraj Bhusal · [WhatsApp](https://wa.me/9779701010000) · neerajbhusal@gmail.com. Emergencies: 100, 101, 102, 1149.

Name note: the repo is `gati-alerts` because `nirajbhusal/gati` already hosts a separate project (Nepali Patro PWA).
