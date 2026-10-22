# data/raw: source snapshots (archive)

Written by `scripts/poll.py` via `.github/workflows/poll.yml` (staged at `ci/poll.yml`). One folder per source id from
`data/sources.json`; one file per *changed* fetch, named by UTC ISO time
(`2026-10-22T14-00-05Z.json`, colons replaced by hyphens for portability).

Each file: `source, url, fetchedAt, httpStatus, contentType, sha256, truncated, body`.
`sha256` is over normalised content (scripts, styles, comments, tags and whitespace stripped;
JSON key-sorted, USGS `metadata.generated` dropped), so an unchanged page creates no new file.

Retention: this folder is an archive. Never delete snapshots. If it grows too large, move
older years to an `archive` branch or a release asset, and leave a pointer here.
