# Gati and the Digital Public Goods Standard

This page maps Gati to the nine indicators of the
[Digital Public Goods Standard](https://digitalpublicgoods.net/standard/) and points to the evidence for each.
It is a self-assessment prepared for a registry application; it is not a certification.

| # | Indicator | Gati | Evidence |
|---|---|---|---|
| 1 | Relevance to the Sustainable Development Goals | Gets official disaster warnings to more people, in Nepali first. Primary SDG 11 (target 11.5); also 13 (13.1, 13.3), 1 (1.5), 9 (9.c) and 16 (16.10). | [About page, SDG section](https://nirajbhusal.github.io/gati-alerts/about/) |
| 2 | Open licence | Code: MIT. Content and data: CC BY 4.0. | [LICENSE](../LICENSE), [LICENSE-CONTENT.md](../LICENSE-CONTENT.md) |
| 3 | Clear ownership | Copyright Niraj Bhusal and Gati contributors. Relayed notices remain the agencies' own. | [LICENSE](../LICENSE), [THIRD_PARTY.md](../THIRD_PARTY.md) |
| 4 | Platform independence | Static HTML, CSS and JavaScript; Python build scripts; Leaflet and OpenStreetMap. Runs on any static web host. The one closed dependency, the AI model behind Ask Gati, is optional and replaceable. | [ARCHITECTURE.md](ARCHITECTURE.md), [THIRD_PARTY.md](../THIRD_PARTY.md) |
| 5 | Documentation | README with local setup, architecture, CAP profile, verification process, contributing guide. | [README](../README.md), [docs/](.), [CONTRIBUTING.md](../CONTRIBUTING.md) |
| 6 | Mechanism for extracting data | All alerts are open, non-proprietary files: CAP 1.2 XML, Atom feeds and JSON, with no login. | [API page](https://nirajbhusal.github.io/gati-alerts/api/), [`atom.xml`](../atom.xml), [`data/alerts.json`](../data/alerts.json) |
| 7 | Privacy and applicable laws | No accounts, cookies or analytics. Published privacy policy. Operates as a relay under Nepal's Disaster Risk Reduction and Management Act 2074, never as a warning authority. | [PRIVACY.md](../PRIVACY.md), [About page, legal position](https://nirajbhusal.github.io/gati-alerts/about/) |
| 8 | Standards and best practices | OASIS CAP 1.2 (ITU-T X.1303) validated in CI against the official schema; Atom; GeoJSON; installable offline web app; bilingual; severity shown with word and icon, not colour alone. | [CAP.md](CAP.md), [`.github/workflows/cap.yml`](../.github/workflows/cap.yml) |
| 9 | Do no harm by design | See below. | [VERIFICATION.md](VERIFICATION.md), [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md), [SECURITY.md](../SECURITY.md) |

## Indicator 9 in detail

- **Data privacy and security.** Gati stores no personal data of readers. Citizen reports are public GitHub
  issues with no contact details; locations are rounded. Security reports go through a private channel.
- **Inappropriate and illegal content.** Citizen reports are shown as unconfirmed until a moderator checks them.
  False or misleading items are marked "Retracted" and kept visible, not deleted, so the record can be audited.
- **Protection from harassment.** A code of conduct applies to issues and pull requests; moderators can remove
  content and block accounts.
- **Misinformation risk.** Every item carries a trust label, the original source link and the source time. Model
  data is labelled "Model" and is never presented as an official warning. Figures from different agencies are
  never added together.
- **Not an emergency service.** Every contact surface points to the official helplines 100, 101, 102 and 1234.

## Known gaps

- Reporting needs a GitHub account, which excludes many people. An anonymous intake is planned
  (README, "Future backend option").
- Agencies, districts, languages and helplines for Nepal are spread through the data files rather than held in
  one country configuration, so a fork for another country needs manual changes.
- The policy files are in English only; a Nepali privacy page on the site is still to be written.
- "Gati" is a working name pending a trademark check.

## Adapting Gati for another country

1. Fork the repository and choose your own name and logo.
2. Replace `data/sources.json` with your mandated alerting agencies.
3. Replace the district boundaries and codes in `data/districts.geojson` and `data/districts.json`.
4. Translate the page text; every string has a first-language and an English version.
5. Replace the emergency numbers and contacts.
6. Publish your own privacy policy and legal position.
7. Keep the core rule: relay official sources with source and time; never originate warnings.
