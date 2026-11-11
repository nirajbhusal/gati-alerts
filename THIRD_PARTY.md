# Third-party material

Gati's own code is MIT ([LICENSE](LICENSE)) and its own content is CC BY 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
The items below belong to others and keep their own terms.

## Bundled in this repository

| Item | Where | Licence / terms |
|---|---|---|
| Leaflet | `assets/vendor/leaflet/` | BSD 2-Clause |
| protomaps-leaflet 5.1.0 | `assets/vendor/protomaps-leaflet/` | BSD 3-Clause (licence file included) |
| Offline street map | `data/offline/basemap.pmtiles` | Map data © OpenStreetMap contributors, ODbL; tiles built by Protomaps. Cut by `scripts/make_offline_map.py`. |
| Mukta typeface | `assets/fonts/` | SIL Open Font License 1.1 |
| Inter typeface | `assets/fonts/` | SIL Open Font License 1.1 |
| CAP 1.2 schema | `schema/CAP-v1.2.xsd` | OASIS open standard, unchanged copy, copyright OASIS Open |
| SDG icons | `assets/sdg/` | United Nations. Used for information only; use does not imply UN endorsement. They are not covered by Gati's licences. |

## Data and services used

| Source | Used for | Terms |
|---|---|---|
| DHM, NDRRMA, NEOC, BIPAD Portal, Nepal Police, Department of Roads, National Earthquake Monitoring and Research Center, and other agencies in `data/sources.json` | Official notices and figures | The agency's own. Relayed with source, link and time. |
| OpenStreetMap | Map tiles and base data | Open Database License (ODbL), © OpenStreetMap contributors |
| Open-Meteo | Model weather and air quality (labelled "Model", never as an official warning) | CC BY 4.0 |
| USGS Earthquake Hazards Program | Supplementary earthquake data | US public domain |
| GitHub | Hosting, citizen reports as issues | GitHub Terms of Service |
| Cloudflare Workers and the Anthropic API | Optional "Ask Gati" question box (`worker/`) | The providers' terms. See the note below. |
| Cloudflare Workers | Optional report intake without an account (`worker/`) | Cloudflare's terms |
| Telegram, Viber, WhatsApp (Meta), an SMS gateway | Optional alert broadcast (`scripts/broadcast.py`) | Each provider's terms |

## Optional proprietary component

"Ask Gati" calls a hosted AI model through a small Worker in `worker/`. It is optional: when
`data/ask-config.json` has an empty `worker` value the site answers from its local data only, and every other page
works without it. A fork can leave it off or point the Worker at any other model, including an open one. No core
function of Gati (relaying, feeds, maps, reports) depends on a closed service.

If you find something here that is missing or wrongly credited, please open an issue.
