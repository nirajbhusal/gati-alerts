#!/usr/bin/env python3
"""Build data/geo/treks.geojson: major trekking routes in and near the districts named in
DHM's Cyclone 'Arnab' flood advisory (data/arnab-advisory.json).

Trail geometry: OpenStreetMap contributors (ODbL 1.0), hiking route relations fetched from
https://api.openstreetmap.org/api/0.6/relation/<id>/full.json on the build date. The Everest
Base Camp line has no OSM route relation, so it is the OSM footpath network routed between
named villages with the FOSSGIS OSRM foot profile (routing.openstreetmap.de, also OSM data).
Lines are simplified for display; they are not for navigation.
Usage: python scripts/make_treks.py /dir/with/<id>.json [ebc.json]
"""
import json, sys, pathlib
from shapely.geometry import shape, mapping, MultiLineString, LineString
from shapely.ops import linemerge, unary_union

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1])
# id, slug, Nepali name, English name
TREKS = [
    ("ebc", "ebc", "सगरमाथा आधार शिविर (लुक्ला–नाम्चे–गोरखशेप)", "Everest Base Camp (Lukla, Namche, Gorak Shep)"),
    (6829677, "mera", "मेरा पिक पदमार्ग", "Mera Peak trek"),
    (7837105, "numbur", "नुम्बुर चिज सर्किट", "Numbur Cheese Circuit"),
    (19876391, "rolwaling", "रोल्वालिङ (ताशी लाप्चा)", "Rolwaling (Tashi Labsa)"),
    (19876422, "tamakoshi", "तामाकोशी उपत्यका", "Tamakoshi Valley"),
    (1269089, "langtang", "लाङटाङ पदमार्ग", "Langtang Trek"),
    (4867746, "gosaikunda", "गोसाइँकुण्ड पदमार्ग", "Gosaikunda Trek"),
    (4867728, "helambu", "हेलम्बु पदमार्ग", "Helambu Trek"),
    (1328173, "manaslu", "मनास्लु सर्किट", "Manaslu Circuit"),
    (1187310, "annapurna", "अन्नपूर्ण सर्किट", "Annapurna Circuit"),
    (19267496, "mardi", "मार्दी हिमाल पदमार्ग", "Mardi Himal trek"),
    (11096629, "dhaulagiri", "धौलागिरि पदमार्ग", "Dhaulagiri Trek"),
    (9387979, "makalu", "मकालु आधार शिविर (अरुण उपत्यका)", "Makalu Base Camp (Arun valley)"),
    (12664915, "kanchenjunga-s", "कञ्चनजङ्घा दक्षिण (सुकेटार)", "Kanchenjunga South (Suketar)"),
    (12664914, "kanchenjunga-n", "कञ्चनजङ्घा उत्तर (ताप्लेजुङ)", "Kanchenjunga North (Taplejung)"),
]


def rnd(g, nd=4):
    def r(c):
        return [r(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], nd), round(c[1], nd)]
    m = mapping(g)
    return {"type": m["type"], "coordinates": r(m["coordinates"])}


def rel_lines(path, rid):
    els = json.load(open(path))["elements"]
    nodes = {e["id"]: (e["lon"], e["lat"]) for e in els if e["type"] == "node"}
    ways = {e["id"]: e for e in els if e["type"] == "way"}
    rel = next(e for e in els if e["type"] == "relation" and e["id"] == rid)
    ls = [LineString([nodes[n] for n in ways[m["ref"]]["nodes"] if n in nodes]) for m in rel["members"]
          if m["type"] == "way" and m["ref"] in ways and len(ways[m["ref"]]["nodes"]) > 1]
    return linemerge(MultiLineString(ls)), rel["tags"]


D = json.loads((ROOT / "data/districts.geojson").read_text(encoding="utf-8"))
dg = [(f["properties"]["slug"], shape(f["geometry"])) for f in D["features"]]
feats = []
for rid, slug, ne, en in TREKS:
    if rid == "ebc":
        g = shape(json.load(open(sys.argv[2] if len(sys.argv) > 2 else SRC / "ebc.json"))); osm = None
    else:
        g, tags = rel_lines(SRC / f"{rid}.json", rid); osm = f"https://www.openstreetmap.org/relation/{rid}"
    g = g.simplify(0.0006)
    lens = [(s, g.intersection(p).length) for s, p in dg]
    dists = [s for s, l in sorted(lens, key=lambda x: -x[1]) if l > 0.002]
    feats.append({"type": "Feature", "id": slug, "properties": {"slug": slug, "ne": ne, "en": en, "districts": dists, "osm": osm},
                  "geometry": rnd(g)})
    print(slug, dists, round(g.length, 2))
out = {"type": "FeatureCollection",
       "source": {"name": "OpenStreetMap hiking route relations and footpaths", "publisher": "OpenStreetMap contributors",
                  "url": "https://www.openstreetmap.org/copyright", "licence": "ODbL 1.0",
                  "processing": "Simplified for display, not for navigation. Everest Base Camp line routed on OSM footpaths (FOSSGIS OSRM foot)."},
       "features": feats}
(ROOT / "data/geo/treks.geojson").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
