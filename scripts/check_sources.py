#!/usr/bin/env python3
"""Fetch each source URL in data/sources.json once and update data/source-health.json.
lastChecked is always written; lastSuccess only when the fetch returns HTTP 2xx/3xx.
A timeout or error never fails the run; the source simply shows as down or stale.
Usage: python scripts/check_sources.py [--timeout 25]"""
import json, sys, pathlib, datetime as dt, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
TIMEOUT = int(sys.argv[sys.argv.index("--timeout") + 1]) if "--timeout" in sys.argv else 25
src = json.loads((ROOT / "data/sources.json").read_text(encoding="utf-8"))
hp = ROOT / "data/source-health.json"
health = json.loads(hp.read_text(encoding="utf-8")) if hp.exists() else {}
H = health.setdefault("sources", {})
for s in src:
    h = H.setdefault(s["id"], {"lastSuccess": None, "lastChecked": None, "lastResult": None})
    if s.get("status") == "planned" or not s.get("url"):
        h["lastResult"] = "planned"; continue
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    try:
        req = urllib.request.Request(s["url"], headers={"User-Agent": "Mozilla/5.0 (Gati source health check; +https://nirajbhusal.github.io/gati-alerts/sources/)"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            code = r.status; r.read(2048)
        ok = 200 <= code < 400; res = f"HTTP {code}"
    except Exception as e:
        ok = False; res = type(e).__name__ + (": " + str(getattr(e, "reason", "") or getattr(e, "code", ""))).rstrip(": ")
    h["lastChecked"] = now; h["lastResult"] = res
    if ok: h["lastSuccess"] = now
    print(f"{'ok  ' if ok else 'FAIL'} {s['id']:<14} {res}")
health["checkedAt"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
health["note"] = "Checked from an automated server outside Nepal; some .gov.np sites block or time out for such servers even when they are up for people in Nepal."
hp.write_text(json.dumps(health, ensure_ascii=False, indent=1), encoding="utf-8")
