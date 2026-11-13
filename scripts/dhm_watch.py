#!/usr/bin/env python3
"""Compare DHM page ids with the ids recorded in data/weather.json.

Read only: GET requests to DHM, no commit, no push, no write API.
Exit 0 when every recorded id is still current.
Exit 1 when any live id is newer, or when an id cannot be read.
On GitHub Actions the same text is appended to the job summary.
"""
import json, os, sys, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
WX = ROOT / "data" / "weather.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; Gati DHM watch; +https://nirajbhusal.github.io/gati-alerts/)", "Accept": "application/json"}
URLS = {
    "recent": "https://dhm.gov.np/mfd/api/recent-page",
    "special": "https://dhm.gov.np/mfd/api/page/tag?tag_id=5",
    "warning": "https://dhm.gov.np/mfd/api/page/tag?tag_id=8",
    "nowcast": "https://dhm.gov.np/mfd/api/page/tag?tag_id=14",
    "country_forecast": "https://dhm.gov.np/mfd/api/country-forecast",
}


def emit(text):
    print(text)
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(text + "\n")


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def max_id(pages):
    ids = []
    for p in pages or []:
        try:
            ids.append(int(p["id"]))
        except (KeyError, TypeError, ValueError):
            continue
    return max(ids) if ids else None


def recorded(doc):
    ids = doc.get("dhm_ids") or {}
    bulletin = (doc.get("bulletin5") or {}).get("mfd_id")
    country = ((doc.get("forecast24") or {}).get("country") or {}).get("id")
    fallback = {"warning": bulletin, "country_forecast": country}
    out = {}
    missing = []
    for key in URLS:
        raw = ids.get(key) or fallback.get(key)
        try:
            out[key] = int(raw)
        except (TypeError, ValueError):
            missing.append(key)
    if missing:
        raise RuntimeError("missing recorded id: " + ", ".join(missing))
    return out


def live_ids():
    out = {}
    for key, url in URLS.items():
        data = get(url)
        if key == "country_forecast":
            out[key] = int(data["id"])
        else:
            out[key] = max_id(data)
            if out[key] is None:
                raise RuntimeError(f"no id on {key}")
    return out


def newer(recorded_ids, live):
    """Names whose live id is strictly newer than the recorded id."""
    return [(k, recorded_ids[k], live[k]) for k in recorded_ids if int(live[k]) > int(recorded_ids[k])]


def self_test():
    base = {"recent": 1, "special": 2, "warning": 3, "nowcast": 4, "country_forecast": 5}
    assert newer(base, base) == []
    assert newer(base, {**base, "warning": 9}) == [("warning", 3, 9)]
    assert newer(base, {**base, "country_forecast": 4}) == []
    doc = {"dhm_ids": {"recent": "10", "special": "11", "nowcast": "12"}, "bulletin5": {"mfd_id": "13"}, "forecast24": {"country": {"id": "14"}}}
    assert recorded(doc) == {"recent": 10, "special": 11, "warning": 13, "nowcast": 12, "country_forecast": 14}
    print("dhm_watch self-test ok")


def main():
    if "--self-test" in sys.argv:
        self_test()
        return
    doc = json.loads(WX.read_text(encoding="utf-8"))
    try:
        have = recorded(doc)
        live = live_ids()
    except Exception as e:
        emit("DHM watch could not finish a read-only comparison.")
        emit(str(e)[:300])
        emit("The job fails so the owner is told the check did not complete. Nothing was committed.")
        raise SystemExit(1)
    rows = ", ".join(f"{k} {live[k]}" for k in URLS)
    found = newer(have, live)
    if not found:
        emit(f"DHM ids match this repo: {rows}.")
        return
    emit("DHM has a newer page than the ids recorded in this repo.")
    for k, old, new in found:
        emit(f"{k}: repo {old}, DHM {new}.")
    emit("This job fails on purpose so GitHub's failed-workflow email can reach the owner. It does not commit or push.")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
