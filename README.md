# गति · Gati — सही सूचना, सही समयमा । / The right alert, right on time.

**Live:** https://nirajbhusal.github.io/gati-alerts/ · **CAP feed:** [`atom.xml`](https://nirajbhusal.github.io/gati-alerts/atom.xml) · [API](https://nirajbhusal.github.io/gati-alerts/api/) · **JSON:** [`data/alerts.json`](https://nirajbhusal.github.io/gati-alerts/data/alerts.json)

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
| `scripts/seed_from_bulletin.py`, `data/seed/` | One-off seeder used to create the first CAP files from bulletin data. Old district outlines are kept in `data/archive/district-polygons.json`. |
| `.github/workflows/cap.yml` | Daily and on-push CAP validation only. It does not commit or deploy. |
| `.github/workflows/poll.yml` | Polls official sources every 2 hours and opens a pull request for review. Never commits to `main`. |
| `.github/workflows/broadcast.yml`, `scripts/broadcast.py` | Sends new official alerts to Telegram, Viber, WhatsApp and SMS once secrets are set. See [docs/BROADCAST.md](docs/BROADCAST.md). |
| `worker/` | Optional Cloudflare Worker: Ask Gati and the no-account report intake. See [worker/README.md](worker/README.md). |
| `data/country.json`, `scripts/country.py` | Country facts for this deployment, shared by scripts and pages. See [docs/FORKING.md](docs/FORKING.md). |
| `data/offline/`, `scripts/make_offline_map.py` | Offline street map of Nepal (about 36 MB) that people can save from the map page. |
| `privacy/`, `*.ne.md` | Privacy page on the site in Nepali and English; Nepali versions of the policy files. |
| `data/i18n/`, `assets/js/locale.js` | Regional interface languages over Nepali. See [docs/LANGUAGES.md](docs/LANGUAGES.md). |
| `.github/ISSUE_TEMPLATE/report.yml` | Citizen report issue form |
| `docs/` | [ARCHITECTURE](docs/ARCHITECTURE.md), [CAP](docs/CAP.md), [VERIFICATION](docs/VERIFICATION.md), [DPG](docs/DPG.md), [BROADCAST](docs/BROADCAST.md), [FORKING](docs/FORKING.md), [LANGUAGES](docs/LANGUAGES.md) |

> **CAP validation** runs from [`.github/workflows/cap.yml`](.github/workflows/cap.yml). It checks the CAP files and does not commit. Pages still publishes the `main` branch. [`poll.yml`](.github/workflows/poll.yml) proposes source changes as a pull request; a person reviews and merges. `feed.xml` and `data/alerts.json` are rebuilt locally with `scripts/build.py`.

## Run locally

```bash
pip install lxml
python scripts/build.py --check   # validate only
python scripts/build.py           # validate + write atom.xml, feed.xml, cap/ and data/alerts.json
python scripts/render.py          # permalinks, share/story images, lite page
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
[docs/VERIFICATION.md](docs/VERIFICATION.md). The form does not ask for a phone number or email, and contact
details are never put into the issue. Photos are attached by the reporter on the GitHub page.

Labels: `official`, `verified`, `reported`, `unverified`, `corrected`, `retracted`, `citizen-report`.

### Sending without a GitHub account

The Worker in `worker/` adds a `POST /report` route. When it is deployed and its URL is set in
`data/report-config.json`, the report page shows a "Send without an account" button next to the GitHub one. The Worker
rate-limits by IP, removes phone numbers, emails and links, rounds GPS, creates the public issue with a bot token, and
holds any photo privately for moderators after stripping its metadata. Until the URL is set, nothing changes on the
site. See [worker/README.md](worker/README.md).

### Still to come

SMS and voice-call (IVR) intake through a short code, and a moderator dashboard. Both need a telecom partner.
No secrets are stored in this repo; they live in GitHub Actions secrets and Worker secrets.

## Limits (MVP)

- Each CAP message has its own `<expires>` time. Active messages stay up until then. After that they stay in the archive and are not deleted.
- District polygons are simplified outlines for display, not legal boundaries. Station location for Aarughat is approximate.
- Dates are shown in Gregorian + NPT; Bikram Sambat appears where the source text gives it.
- Numerals follow the language: Devanagari when the page is in Nepali, Western digits when it is in English. There is no separate numeral control.
- Reporting needs a GitHub account until the report Worker is deployed; the Reports page uses the unauthenticated GitHub API (60 requests/hour per IP).

## Licence and reuse

Gati is open so that others can check it, improve it and adapt it for their own community.

- **Code:** [MIT](LICENSE).
- **Gati's own text, documentation and data:** [CC BY 4.0](LICENSE-CONTENT.md).
- **Relayed official notices** remain the issuing agencies' own; third-party material is listed in [THIRD_PARTY.md](THIRD_PARTY.md).

See also [CONTRIBUTING](CONTRIBUTING.md), [Code of Conduct](CODE_OF_CONDUCT.md), [Security](SECURITY.md),
[Privacy](PRIVACY.md), and how Gati maps to the Digital Public Goods Standard in [docs/DPG.md](docs/DPG.md).

## Brand

Mark: a white "ग" with three signal arcs on Gati Red `#E2362B`; wordmark in Navy `#0B1424`. Interface colours: Crimson
`#DC143C`, River Teal `#0F7C86`, Glacier `#7FD1D8`, Snow `#F7F9FB`, Ink `#14202B`. CAP severity scale (reserved for
severity only): Extreme `#8E1B14`, Severe `#D93025`, Moderate `#F28C1E`, Minor `#F2C94C`, Info `#8F9BB3`. Fonts: Mukta, Inter.
The full brand kit, with logo downloads and usage rules, is on the [About page](https://nirajbhusal.github.io/gati-alerts/about/#brand).

## Recognition

Gati is named in the opening of GitHub's [Octoverse 2026](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/)
report (28 October 2026). This is a mention, not an endorsement.

Maintainer: Niraj Bhusal ([X](https://x.com/nirajbhusal), [LinkedIn](https://www.linkedin.com/in/nirajbhusal)). Corrections and hazard reports go through GitHub (see Citizen reports above). Emergencies: 100, 101, 102, 1234.

Name note: the repo is `gati-alerts` because `nirajbhusal/gati` already hosts a separate project (Nepali Patro PWA).
