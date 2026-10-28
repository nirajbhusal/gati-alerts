#!/usr/bin/env python3
"""Build data/geo/trekinfo.json for trek/?trek=...: stages, altitude profile and help nearby per route.

- Line: data/geo/treks.geojson (OpenStreetMap contributors, ODbL). Longest connected part is used.
- Stages: named places along the line by reverse geocoding sample points with Nominatim
  (OpenStreetMap contributors, ODbL). Overpass was unavailable at build time.
- Altitude: SRTM 30 m (NASA/USGS, public domain) sampled via OpenTopoData (api.opentopodata.org) at build time.
- Help nearby (about 5 km of the line): hospitals, health posts and helipads from data/geo/health.json and
  data/geo/aviation.json (OSM via HOT exports on HDX), police from Nominatim. OSM, may be outdated.
Usage: python scripts/make_trekinfo.py
"""
import json, math, time, pathlib, urllib.request, urllib.parse, datetime
from shapely.geometry import shape, LineString, Point
from shapely.ops import linemerge

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {"User-Agent": "gati-alerts/1.0 (+https://nirajbhusal.github.io/gati-alerts/)"}
def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: return json.load(r)
        except Exception as e: err = e; time.sleep(3)
    raise err
def km(a, b):
    la = math.radians((a[1] + b[1]) / 2); dx = (b[0] - a[0]) * 111.32 * math.cos(la); dy = (b[1] - a[1]) * 110.57; return math.hypot(dx, dy)
def main_line(g):
    g = linemerge(g) if g.geom_type == "MultiLineString" else g
    return max(g.geoms, key=lambda x: x.length) if g.geom_type == "MultiLineString" else g
def along(cs, n):
    d = [0.0]
    for a, b in zip(cs, cs[1:]): d.append(d[-1] + km(a, b))
    tot = d[-1]; out = []; j = 0
    for i in range(n):
        t = tot * i / (n - 1)
        while j < len(d) - 2 and d[j + 1] < t: j += 1
        a, b = cs[j], cs[j + 1]; f = 0 if d[j + 1] == d[j] else (t - d[j]) / (d[j + 1] - d[j])
        out.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, t))
    return out, tot
H = json.loads((ROOT / "data/geo/health.json").read_text()); A = json.loads((ROOT / "data/geo/aviation.json").read_text())
TK = json.loads((ROOT / "data/geo/treks.geojson").read_text(encoding="utf-8"))
out = {"built": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=45))).isoformat(timespec="minutes"),
       "sources": {"line": "OpenStreetMap contributors (ODbL)", "stages": "Nominatim reverse geocoding, OpenStreetMap contributors (ODbL)",
                   "dem": "SRTM 30 m (NASA/USGS) via OpenTopoData", "health": H["source"] + ", as of " + H["as_of"],
                   "helipads": A["source"] + ", as of " + A["as_of"], "police": "Nominatim, OpenStreetMap contributors (ODbL)"}, "treks": {}}
for f in TK["features"]:
    slug = f["id"]; ln = main_line(shape(f["geometry"])); cs = list(ln.coords)
    pts, tot = along(cs, 100)
    prof = []
    el = get("https://api.opentopodata.org/v1/srtm30m?locations=" + "|".join(f"{y:.5f},{x:.5f}" for x, y, _ in pts))["results"]; time.sleep(1.1)
    for (x, y, t), r in zip(pts, el): prof.append([round(t, 2), None if r["elevation"] is None else round(r["elevation"])])
    stages = []; seen = set()
    for x, y, t in along(cs, 12)[0]:
        try: r = get(f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat={y:.5f}&lon={x:.5f}&accept-language=en")
        except Exception: r = {}
        time.sleep(1.1); ad = r.get("address", {})
        nm = ad.get("village") or ad.get("hamlet") or ad.get("town") or ad.get("suburb") or ad.get("neighbourhood")
        if nm and nm not in seen:
            seen.add(nm); e = min(prof, key=lambda p: abs(p[0] - t))[1]; stages.append({"name": nm, "km": round(t, 1), "ll": [round(y, 4), round(x, 4)], "elev": e})
    help_ = []
    def near(lst, kind):
        for la, lo, nm in lst:
            p = Point(lo, la)
            if ln.distance(p) > 0.08: continue
            q = ln.interpolate(ln.project(p)); d = km((lo, la), (q.x, q.y))
            if d <= 5: help_.append({"kind": kind, "name": nm or "", "ll": [la, lo], "dist_km": round(d, 1)})
    near(H["hospitals"], "hospital"); near(H["healthPosts"], "health_post"); near(A["helipads"], "helipad")
    b = ln.bounds
    try: pol = get(f"https://nominatim.openstreetmap.org/search?format=jsonv2&amenity=police&limit=40&bounded=1&viewbox={b[0]-0.05},{b[3]+0.05},{b[2]+0.05},{b[1]-0.05}")
    except Exception: pol = []
    time.sleep(1.1); near([(float(p["lat"]), float(p["lon"]), p.get("name") or "") for p in pol], "police")
    help_.sort(key=lambda h: h["dist_km"])
    out["treks"][slug] = {"length_km": round(tot, 1), "profile": prof, "stages": stages, "help": help_[:30], "help_total": len(help_)}
    print(slug, round(tot, 1), len(stages), len(help_), flush=True)
(ROOT / "data/geo/trekinfo.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
