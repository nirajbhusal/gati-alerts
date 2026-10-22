#!/usr/bin/env python3
"""Build extra map layers for /map/ (run by hand when refreshing; inputs are downloaded files).
  data/geo/provinces.geojson  7 provinces dissolved from data/districts.geojson (Survey Department COD-AB via OCHA HDX, CC BY-IGO)
  data/geo/health.json        hospitals and health posts from HOT OSM export "Health Facilities of Nepal" (HDX hotosm_npl_health_facilities, ODbL)
  data/geo/aviation.json      helipads and aerodromes from HOT OSM export "Airports of Nepal" (HDX hotosm_npl_airports, ODbL)
Usage: python scripts/make_layers.py /path/health_facilities.geojson /path/airports.geojson
"""
import json, sys, pathlib
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
ROOT = pathlib.Path(__file__).resolve().parent.parent
PROV = {"NP01": ("कोशी प्रदेश", "Koshi Province"), "NP02": ("मधेश प्रदेश", "Madhesh Province"), "NP03": ("बागमती प्रदेश", "Bagmati Province"),
        "NP04": ("गण्डकी प्रदेश", "Gandaki Province"), "NP05": ("लुम्बिनी प्रदेश", "Lumbini Province"), "NP06": ("कर्णाली प्रदेश", "Karnali Province"),
        "NP07": ("सुदूरपश्चिम प्रदेश", "Sudurpashchim Province")}
def rnd(o):
    if isinstance(o, float): return round(o, 3)
    if isinstance(o, (list, tuple)): return [rnd(x) for x in o]
    if isinstance(o, dict): return {k: rnd(v) for k, v in o.items()}
    return o
d = json.loads((ROOT / "data/districts.geojson").read_text())
groups = {}
for f in d["features"]: groups.setdefault(f["properties"]["province"], []).append(shape(f["geometry"]).buffer(0.0005))
feats = []
for p, gs in sorted(groups.items()):
    u = unary_union(gs).buffer(-0.0005).simplify(0.01)
    c = u.representative_point()
    feats.append({"type": "Feature", "id": p, "properties": {"code": p, "ne": PROV[p][0], "en": PROV[p][1], "label": [round(c.y, 3), round(c.x, 3)]}, "geometry": rnd(mapping(u))})
(ROOT / "data/geo/provinces.geojson").write_text(json.dumps({"type": "FeatureCollection", "source": "Dissolved from data/districts.geojson (COD-AB, Survey Department of Nepal via OCHA HDX, CC BY-IGO)", "features": feats}, ensure_ascii=False, separators=(",", ":")))
def pt(f):
    g = f["geometry"]
    if not g: return None
    if g["type"] == "Point": x, y = g["coordinates"]
    else: c = shape(g).centroid; x, y = c.x, c.y
    return [round(y, 4), round(x, 4)]
h = json.load(open(sys.argv[1]))
hosp, posts = [], []
for f in h["features"]:
    p = f["properties"]; n = p.get("name") or p.get("name_en") or ""
    ll = pt(f)
    if not ll: continue
    if p.get("amenity") == "hospital" or p.get("healthcare") == "hospital": hosp.append(ll + [n])
    elif "स्वास्थ्य चौकी" in n or "health post" in n.lower() or "healthpost" in n.lower(): posts.append(ll + [n])
(ROOT / "data/geo/health.json").write_text(json.dumps({"source": "OpenStreetMap contributors, via HOT export 'Health Facilities of Nepal' on HDX (hotosm_npl_health_facilities), ODbL",
  "sourceUrl": "https://data.humdata.org/dataset/hotosm_npl_health_facilities", "as_of": "2026-10-07",
  "note": "Volunteer-mapped; coverage is uneven, especially in remote areas. Not an official facility list.",
  "hospitals": hosp, "healthPosts": posts}, ensure_ascii=False, separators=(",", ":")))
a = json.load(open(sys.argv[2]))
heli, aero = [], []
for f in a["features"]:
    p = f["properties"]; ll = pt(f)
    if not ll: continue
    n = p.get("name") or p.get("name_en") or ""
    if p.get("aeroway") == "helipad": heli.append(ll + [n])
    elif p.get("aeroway") == "aerodrome": aero.append(ll + [n])
(ROOT / "data/geo/aviation.json").write_text(json.dumps({"source": "OpenStreetMap contributors, via HOT export 'Airports of Nepal' on HDX (hotosm_npl_airports), ODbL",
  "sourceUrl": "https://data.humdata.org/dataset/hotosm_npl_airports", "as_of": "2026-10-07",
  "note": "Helipads as mapped in OSM; not a list of approved emergency landing sites.", "helipads": heli, "aerodromes": aero}, ensure_ascii=False, separators=(",", ":")))
print(len(feats), "provinces;", len(hosp), "hospitals;", len(posts), "health posts;", len(heli), "helipads;", len(aero), "aerodromes")
