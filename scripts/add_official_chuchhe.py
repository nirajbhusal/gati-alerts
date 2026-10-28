#!/usr/bin/env python3
"""Add the Limpiyadhura-Lipulekh-Kalapani area (Nepal's official map of 2020, adopted by the
second constitutional amendment) to the display boundaries.

The COD-AB v02 boundaries used by make_geo.py stop at the Kali river at Kalapani, so the far-west
'chuchhe' of Darchula district is missing. This script grafts that area from Open Knowledge Nepal
LocalBoundaries (https://localboundries.oknp.org, CC BY 4.0, Survey Department based local-level
boundaries that follow the 2020 official map) onto Darchula (NP0775), the Byas rural municipality
(NP0775401, which administers Kalapani, Lipulekh and Limpiyadhura) and therefore Sudurpashchim
province and the national outline. All other geometry, ids and properties stay as they are.
Usage: python scripts/add_official_chuchhe.py /path/to/oknp/district/nepal.geojson
Then run the province dissolve part of make_layers.py (or this script's --provinces step).
"""
import json, sys, pathlib
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = pathlib.Path(__file__).resolve().parent.parent
OK = json.load(open(sys.argv[1], encoding="utf-8"))
NOTE = ("Darchula far west (Limpiyadhura, Lipulekh, Kalapani) added per Nepal's official map of 2020 from "
        "Open Knowledge Nepal LocalBoundaries (localboundries.oknp.org, CC BY 4.0).")


def rnd(g, nd=4):
    def r(c):
        return [r(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], nd), round(c[1], nd)]
    m = mapping(g)
    return {"type": m["type"], "coordinates": r(m["coordinates"])}


okd = shape(next(f for f in OK["features"] if f["properties"]["DISTRICT"] == "DARCHULA")["geometry"])
dp = ROOT / "data/districts.geojson"
D = json.loads(dp.read_text(encoding="utf-8"))
nat = unary_union([shape(f["geometry"]).buffer(0.003) for f in D["features"]])
diff = okd.difference(nat)
graft = max(getattr(diff, "geoms", [diff]), key=lambda g: g.area).simplify(0.003, preserve_topology=True)
print("graft area km2 ~", round(graft.area * 111 * 111 * 0.866, 1), graft.bounds)


def add(geom):
    o = shape(geom)
    seam = graft.buffer(0.004, join_style=2).intersection(o.buffer(0.004, join_style=2))
    g = unary_union([o, graft, seam]).buffer(0)
    if g.geom_type == "Polygon" and g.interiors:
        from shapely.geometry import Polygon
        g = Polygon(g.exterior)
    if g.geom_type == "MultiPolygon":
        g = max(g.geoms, key=lambda x: x.area)
    return rnd(g)


for f in D["features"]:
    if f["id"] == "NP0775":
        f["geometry"] = add(f["geometry"])
D["source"]["note"] = NOTE
dp.write_text(json.dumps(D, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

lp = ROOT / "data/localunits.geojson"
L = json.loads(lp.read_text(encoding="utf-8"))
for f in L["features"]:
    if f["id"] == "NP0775401":
        f["geometry"] = add(f["geometry"])
L["source"]["note"] = NOTE
lp.write_text(json.dumps(L, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
