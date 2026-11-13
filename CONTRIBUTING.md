# Contributing to Gati

[नेपालीमा](CONTRIBUTING.ne.md)

धन्यवाद! Thank you for helping. Nepali or English is welcome in issues and pull requests.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## The one rule that cannot bend

**Gati never issues warnings of its own.** Every alert must come from a mandated agency, keep that agency as the
CAP `<sender>`, and carry the original link and source time. Nothing is invented, estimated or summed across
agencies. A pull request that breaks this will not be merged. See [docs/CAP.md](docs/CAP.md) and
[docs/VERIFICATION.md](docs/VERIFICATION.md).

## Ways to help

| You want to | Do this |
|---|---|
| Report a hazard | Use the [report page](https://nirajbhusal.github.io/gati-alerts/report/). In an emergency call 100, 101, 102 or 1234. |
| Fix a wrong or outdated item | Open an issue with the link to the official source. Corrections are published as CAP `Update` or `Cancel`, never as silent edits. |
| Suggest a new official source | Open an issue with the agency, URL and what it publishes. |
| Improve a translation | Open a pull request. Keep Nepali first and plain. |
| Fix a bug or add a feature | Open an issue first for anything larger than a small fix, then a pull request. |
| Report a security problem | Follow [SECURITY.md](SECURITY.md); do not open a public issue. |

## Set up

Gati is a static site: HTML, CSS and plain JavaScript, with Python scripts that build the feeds. There is no build
framework and no package install for the site itself.

```bash
pip install lxml
python scripts/build.py --check   # validate CAP files
python scripts/build.py           # rebuild atom.xml, feed.xml, cap/ and data/alerts.json
python scripts/render.py          # permalinks, share images, lite page
python -m http.server 8000        # open http://localhost:8000/
```

The optional Ask Gati Worker has its own tests: `cd worker && npm test`.

## Pull requests

- Branch from `main` and keep one topic per pull request.
- Run `python scripts/build.py --check` before pushing. CI runs the same check and fails on invalid CAP 1.2.
- Adding an alert: follow "Adding an alert" in the [README](README.md).
- Every visible text needs both Nepali and English.
- Keep it light: the site must work on a slow phone, offline, and without JavaScript where a page already does.
- Do not add analytics, cookies, trackers or third-party scripts. See [PRIVACY.md](PRIVACY.md).
- Never commit secrets, API keys or personal data.
- Keep `data/raw/` as it is; it is an archive and is never deleted.

## Licence of contributions

Code you contribute is licensed under the [MIT licence](LICENSE). Text, documentation and data you contribute are
licensed under [CC BY 4.0](LICENSE-CONTENT.md). Only contribute work you have the right to share.

## Reusing Gati in another country

Forks are welcome; that is the point of an open licence. Please use your own name and logo, list your own
country's mandated agencies in `data/sources.json`, publish your own privacy policy, and keep the rule above:
relay official sources, never originate warnings. See [docs/DPG.md](docs/DPG.md).
