#!/usr/bin/env python3
"""Fetch Nepal Oil Corporation retail prices (official) into data/fuel.json.
Source: NOC portal API behind https://noc.org.np/retailprice. If NOC is unreachable the last official values are kept
and only 'checked'/'reachable' are updated. Never uses media numbers."""
import json, urllib.request, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT / "data/fuel.json"
API = "https://noc.org.np/api/fuel-prices?per_page=50&page=%d"; PAGE = "https://noc.org.np/retailprice"
NPT = datetime.timezone(datetime.timedelta(hours=5, minutes=45)); now = datetime.datetime.now(NPT).isoformat(timespec="minutes")
KEEP = ("petrol", "diesel")
def get(n):
    r = urllib.request.Request(API % n, headers={"User-Agent": "Mozilla/5.0 (Gati relay; +https://nirajbhusal.github.io/gati-alerts/)", "Accept": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=30))
old = json.loads(OUT.read_text()) if OUT.exists() else None
try:
    rows, n = [], 1
    while True:
        d = get(n); rows += d.get("data") or []; pg = d.get("pagination") or {}
        if not pg.get("has_more_pages") or n >= 10: break
        n += 1
    rows = [x for x in rows if x["fuel_type"]["slug"] in KEEP]
    if not rows: raise RuntimeError("no petrol/diesel rows")
    latest = max(x["price_date"] for x in rows)
    cur = [x for x in rows if x["price_date"] == latest]
    groups = {}
    for x in cur:
        c = x["fuel_category"]; g = groups.setdefault(c["id"], {"name_ne": c["name_ne"], "name_en": {"पहिलो वर्ग": "First group", "दोस्रो वर्ग": "Second group", "तेस्रो वर्ग": "Third group"}.get(c["name_ne"], c["name"]), "noc_label": c["name"], "depots": [], "price": {}})
        loc = x["location"]
        if not any(dp["en"] == loc["name"] for dp in g["depots"]): g["depots"].append({"ne": loc["name_ne"], "en": loc["name"]})
        g["price"][x["fuel_type"]["slug"]] = float(x["price"])
    order = {"पहिलो वर्ग": 1, "दोस्रो वर्ग": 2, "तेस्रो वर्ग": 3}
    out = {"source_ne": "नेपाल आयल निगम लिमिटेड", "source_en": "Nepal Oil Corporation (NOC)", "url": PAGE, "trust": "Official", "unit_ne": "रु. प्रति लिटर", "unit_en": "NPR per litre",
           "effective": latest[:10], "fetched": now, "checked": now, "reachable": True,
           "groups": sorted(groups.values(), key=lambda g: order.get(g["name_ne"], 9))}
except Exception as e:
    if not old: raise
    out = dict(old, checked=now, reachable=False, error=str(e)[:200])
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print("fuel:", out["effective"], "reachable" if out["reachable"] else "UNREACHABLE, kept last official values")
