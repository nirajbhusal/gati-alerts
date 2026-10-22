# CAP 1.2 profile used by Gati

Gati stores every item as an [OASIS CAP 1.2](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html) message
(ITU-T X.1303) in `data/alerts/`. Files must validate against `schema/CAP-v1.2.xsd` **and** the Gati profile below
(`scripts/build.py` enforces both; CI blocks merges that fail).

## Rules

| Element | Gati rule |
|---|---|
| `identifier` | `np.gati.<agency>-<topic>-<YYYY-MM-DD>` — unique, never reused |
| `sender` | Domain of the **original agency** (`hydrology.gov.np`, `ndrrma.gov.np`, `neoc.moha.gov.np`, `nepalpolice.gov.np`). Never Gati |
| `sent` | The agency's own issue/observation time, with `+05:45` offset |
| `status` / `scope` | `Actual` / `Public` (use `Exercise` or `Test` for drills) |
| `msgType` | `Alert`; corrections use `Update`, retractions `Cancel`, both with `<references>` |
| `source` | Agency name in English |
| `note` | Must say the item is **relayed by Gati**, that Gati does not issue official warnings (DRRM Act 2074), and give the source URL |
| `info` | **Two blocks**: `<language>ne</language>` first, then `en`. Same facts in both |
| `senderName` | Agency name + "— गति मार्फत प्रसारित" / "— relayed by Gati" |
| `severity` etc. | Agency's own wording mapped to CAP: see table below |
| `expires` | Required. Past items stay in the archive and show as *Expired* |
| `web` | Link to the original notice |
| `area` | At least one. District areas carry a `<polygon>` (simplified outline, lat,lon, closed) **and** `<geocode>` `NP-DISTRICT` = district slug. Point sources may use `<circle>` (`lat,lon radius_km`). National notices use geocode `ISO3166-1` = `NP` |

### Parameters (`<parameter>`, safe for other CAP consumers to ignore)

| valueName | Values |
|---|---|
| `gati:trustLevel` | `Official` · `Verified` · `Reported` · `Unverified` (required) |
| `gati:status` | `Corrected` · `Retracted` (optional overlay) |
| `gati:correction` | Text of the correction (with `gati:status=Corrected`) |
| `gati:sourceUrl` | Original notice URL (required) |
| `gati:sourceTime` | Agency time |
| `gati:hazard` | `flood`, `landslide`, `road`, `weather`, … |
| `gati:bulletinFile` | For seeded items: the bulletin data file the values came from |

### Severity mapping

| Situation (examples) | CAP severity | UI |
|---|---|---|
| Gauge far above danger level, station lost | `Extreme` | अत्यन्त गम्भीर `#7A0019` |
| River above danger level / special flood alert | `Severe` | गम्भीर `#C81E1E` |
| Highway fully blocked | `Moderate` | मध्यम `#E8770E` |
| One-way / restricted traffic | `Minor` | सामान्य `#F5C518` |
| Weather notice with no warning, all-clear, service notice | `Unknown` | सूचना `#2B6CB0` |

## Feeds

- `feed.xml` — Atom 1.0; one `<entry>` per CAP message, `link rel="alternate" type="application/cap+xml"` to the XML and `rel="via"` to the original notice.
- `data/alerts.json` — JSON mirror used by the UI.

## Validate

```bash
pip install lxml
python scripts/build.py --check
# or with xmllint:
xmllint --noout --schema schema/CAP-v1.2.xsd data/alerts/*.xml
```

## Seed data (Oct 2026)

The 15 seeded messages come only from verified items in the Rasuwa–Bhotekoshi bulletin repo:
`data/budhi-gandaki.json` (DHM Aarughat 8.43 m, 11 Oct 2026 08:40 NPT; NDRRMA press note 66),
`data/ndrrma_flood_alerts.json` (Narayani special flood alert, 27 Sep), `data/dhm-weather-alert.json` (DHM 12337),
`data/neoc_roads_2083-06-19-0700.json` and `data/police_roads_2083-06-17-0645.json` (road status). All are expired.
