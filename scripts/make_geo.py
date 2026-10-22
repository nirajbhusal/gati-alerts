#!/usr/bin/env python3
"""Build simplified admin boundaries from the official COD-AB for Nepal.

Source: Nepal - Subnational Administrative Boundaries (COD-AB), Survey Department of Nepal
and UN Resident Coordinator's Office, via OCHA HDX, version v02, valid_on 2024-03-14,
licence CC BY-IGO. https://data.humdata.org/dataset/cod-ab-npl
Input: npl_admin2.geojson and npl_admin3.geojson from npl_admin_boundaries.geojson.zip.
Output: data/districts.geojson (NP-DISTRICT = adm2_pcode) and data/localunits.geojson
(NP-LOCALUNIT = adm3_pcode); data/districts.json gains a "code" field.
Usage: python scripts/make_geo.py /path/to/unzipped/dir
"""
import json, re, sys, pathlib
from shapely.geometry import shape, mapping

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1])
CITE = {"name": "Nepal - Subnational Administrative Boundaries (COD-AB) v02, valid 2024-03-14",
        "publisher": "Survey Department of Nepal; UN Resident Coordinator's Office in Nepal; OCHA HDX",
        "url": "https://data.humdata.org/dataset/cod-ab-npl", "licence": "CC BY-IGO",
        "processing": "Simplified with shapely (Douglas-Peucker), coordinates rounded; for display only."}
ALIAS = {"chitawan": "chitwan", "dhanusa": "dhanusha"}
norm = lambda s: re.sub(r"[^a-z]", "", s.lower())


def rnd(geom, nd):
    def r(c):
        return [r(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], nd), round(c[1], nd)]
    m = mapping(geom)
    return {"type": m["type"], "coordinates": r(m["coordinates"])}


def simp(f, tol, nd):
    g = shape(f["geometry"]).simplify(tol, preserve_topology=True)
    return rnd(g, nd)


D = json.loads((ROOT / "data/districts.json").read_text(encoding="utf-8"))
byname = {norm(d["en"]): d for d in D}
a2 = json.load(open(SRC / "npl_admin2.geojson", encoding="utf-8"))
feats, code_of = [], {}
for f in a2["features"]:
    p = f["properties"]
    d = byname[ALIAS.get(norm(p["adm2_name"]), norm(p["adm2_name"]))]
    d["code"] = p["adm2_pcode"]
    code_of[p["adm2_pcode"]] = d
    feats.append({"type": "Feature", "id": p["adm2_pcode"],
                  "properties": {"code": p["adm2_pcode"], "slug": d["id"], "province": p["adm1_pcode"],
                                 "en": d["en"], "ne": d["ne"]},
                  "geometry": simp(f, 0.004, 4)})
feats.sort(key=lambda f: f["id"])
(ROOT / "data/districts.geojson").write_text(json.dumps({"type": "FeatureCollection", "source": CITE, "features": feats},
                                             ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
D.sort(key=lambda d: d["code"])
(ROOT / "data/districts.json").write_text(json.dumps(D, ensure_ascii=False, indent=0), encoding="utf-8")
a3 = json.load(open(SRC / "npl_admin3.geojson", encoding="utf-8"))
lf = [{"type": "Feature", "id": f["properties"]["adm3_pcode"],
       "properties": {"code": f["properties"]["adm3_pcode"], "district": f["properties"]["adm2_pcode"],
                      "en": f["properties"]["adm3_name"]},
       "geometry": simp(f, 0.003, 4)} for f in a3["features"]]
lf.sort(key=lambda f: f["id"])
(ROOT / "data/localunits.geojson").write_text(json.dumps({"type": "FeatureCollection", "source": CITE,
    "note": "Names are the COD-AB English names; Nepali local-unit names are not in the source and are not invented here.",
    "features": lf}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(feats), "districts,", len(lf), "local units")
