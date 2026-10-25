#!/usr/bin/env python3
"""Route network expansion (route-1025): adds places and named highway segments to data/roads.json and
their road geometry to data/geo/roads.geojson.

Geometry: OpenStreetMap road network via the public OSRM router (router.project-osrm.org), one request per
segment between named places; a segment is accepted only if the routed length is under 3.2x the straight
distance (catches wrong snapping). Status: new segments start as "none" (not confirmed) because no loaded
source reports them; scripts/fetch_navigate.py and the Police notice update status, never this script.
Existing route ids keep their status; some gain junction places inside their segs (same corridor).
"""
import json, math, pathlib, time, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
RD = json.loads((ROOT / "data/roads.json").read_text())
GJ = json.loads((ROOT / "data/geo/roads.geojson").read_text())
NODES = {
 "lamahi": ("लमही", "Lamahi", 27.873, 82.522), "ghorahi": ("घोराही (दाङ)", "Ghorahi (Dang)", 28.040, 82.487), "tulsipur": ("तुलसीपुर (दाङ)", "Tulsipur (Dang)", 28.131, 82.297),
 "kohalpur": ("कोहलपुर", "Kohalpur", 28.197, 81.689), "surkhet": ("सुर्खेत (वीरेन्द्रनगर)", "Surkhet (Birendranagar)", 28.601, 81.634),
 "manma": ("मान्म (कालिकोट)", "Manma (Kalikot)", 29.143, 81.600), "jumla": ("जुम्ला (खलङ्गा)", "Jumla (Khalanga)", 29.274, 82.183),
 "attariya": ("अत्तरिया", "Attariya", 28.805, 80.555), "mahendranagar": ("महेन्द्रनगर", "Mahendranagar", 28.963, 80.178), "dadeldhura": ("डडेलधुरा", "Dadeldhura", 29.299, 80.585),
 "beni": ("बेनी (म्याग्दी)", "Beni (Myagdi)", 28.347, 83.567), "jomsom": ("जोमसोम", "Jomsom", 28.781, 83.723), "kagbeni": ("कागबेनी", "Kagbeni", 28.837, 83.785),
 "muktinath": ("मुक्तिनाथ", "Muktinath", 28.816, 83.871), "abukhaireni": ("आँबुखैरेनी", "Abukhaireni", 27.898, 84.535), "dumre": ("डुम्रे", "Dumre", 27.968, 84.410),
 "damauli": ("दमौली", "Damauli", 27.975, 84.270), "gorkha": ("गोरखा", "Gorkha", 28.000, 84.628), "besisahar": ("बेसीशहर", "Besisahar", 28.230, 84.378),
 "bhairahawa": ("भैरहवा", "Bhairahawa", 27.505, 83.452), "lumbini": ("लुम्बिनी", "Lumbini", 27.484, 83.276), "waling": ("वालिङ", "Waling", 27.985, 83.773),
 "syangja": ("स्याङ्जा (पुतलीबजार)", "Syangja (Putalibazar)", 28.095, 83.876), "birtamod": ("बिर्तामोड", "Birtamod", 26.645, 87.990), "ilam": ("इलाम", "Ilam", 26.910, 87.928),
 "biratnagar": ("विराटनगर", "Biratnagar", 26.455, 87.271), "dharan": ("धरान", "Dharan", 26.812, 87.284), "dhankuta": ("धनकुटा", "Dhankuta", 26.984, 87.343),
 "dhalkebar": ("ढल्केबर", "Dhalkebar", 26.930, 85.968), "janakpur": ("जनकपुर", "Janakpur", 26.729, 85.925), "lahan": ("लहान", "Lahan", 26.722, 86.481),
 "birgunj": ("वीरगन्ज", "Birgunj", 27.012, 84.877),
}
SPLIT = {"butwal-nepalgunj": ["butwal", "lamahi", "kohalpur", "nepalgunj"], "nepalgunj-dhangadhi": ["nepalgunj", "kohalpur", "attariya", "dhangadhi"],
         "itahari-kakarbhitta": ["itahari", "birtamod", "kakarbhitta"], "bardibas-itahari": ["bardibas", "dhalkebar", "lahan", "itahari"],
         "mugling-pokhara": ["mugling", "abukhaireni", "dumre", "damauli", "pokhara"]}
NEW = [
 ("rapti", ["lamahi", "ghorahi", "tulsipur"], "राप्ती राजमार्ग: लमही–घोराही–तुलसीपुर", "Rapti Highway: Lamahi–Ghorahi–Tulsipur", ["Dang"]),
 ("ratna", ["kohalpur", "surkhet"], "रत्न राजमार्ग: कोहलपुर–सुर्खेत", "Ratna Highway: Kohalpur–Surkhet", ["Banke", "Surkhet"]),
 ("karnali", ["surkhet", "manma", "jumla"], "कर्णाली राजमार्ग: सुर्खेत–मान्म–जुम्ला", "Karnali Highway: Surkhet–Manma–Jumla", ["Surkhet", "Dailekh", "Kalikot", "Jumla"]),
 ("attariya-mahendranagar", ["attariya", "mahendranagar"], "पूर्व–पश्चिम (महेन्द्र) राजमार्ग: अत्तरिया–महेन्द्रनगर", "East–West (Mahendra) Highway: Attariya–Mahendranagar", ["Kailali", "Kanchanpur"]),
 ("attariya-dadeldhura", ["attariya", "dadeldhura"], "अत्तरिया–डडेलधुरा सडक", "Attariya–Dadeldhura road", ["Kailali", "Dadeldhura"]),
 ("baglung-beni", ["baglung", "beni"], "बागलुङ–बेनी (कालीगण्डकी करिडोर)", "Baglung–Beni (Kaligandaki corridor)", ["Baglung", "Myagdi"]),
 ("beni-jomsom", ["beni", "jomsom"], "बेनी–जोमसोम (बेनी–जोमसोम–कोरला, कालीगण्डकी करिडोर)", "Beni–Jomsom (Beni–Jomsom–Korala, Kaligandaki corridor)", ["Myagdi", "Mustang"]),
 ("jomsom-muktinath", ["jomsom", "kagbeni", "muktinath"], "जोमसोम–कागबेनी–मुक्तिनाथ", "Jomsom–Kagbeni–Muktinath", ["Mustang"]),
 ("dumre-besisahar", ["dumre", "besisahar"], "डुम्रे–बेसीशहर (मध्यमस्याङ्दी सडक)", "Dumre–Besisahar (Madhyamarsyangdi road)", ["Tanahun", "Lamjung"]),
 ("abukhaireni-gorkha", ["abukhaireni", "gorkha"], "आँबुखैरेनी–गोरखा सडक", "Abukhaireni–Gorkha road", ["Tanahun", "Gorkha"]),
 ("butwal-lumbini", ["butwal", "bhairahawa", "lumbini"], "बुटवल–भैरहवा (सिद्धार्थ राजमार्ग)–लुम्बिनी", "Butwal–Bhairahawa (Siddhartha Highway)–Lumbini", ["Rupandehi"]),
 ("palpa-pokhara", ["palpa", "waling", "syangja", "pokhara"], "पाल्पा–वालिङ–स्याङ्जा–पोखरा (सिद्धार्थ राजमार्ग)", "Palpa–Waling–Syangja–Pokhara (Siddhartha Highway)", ["Palpa", "Syangja", "Kaski"]),
 ("mechi", ["birtamod", "ilam"], "बिर्तामोड–इलाम (मेची राजमार्ग)", "Birtamod–Ilam (Mechi Highway)", ["Jhapa", "Ilam"]),
 ("koshi-south", ["itahari", "biratnagar"], "इटहरी–विराटनगर (कोशी राजमार्ग)", "Itahari–Biratnagar (Koshi Highway)", ["Sunsari", "Morang"]),
 ("koshi-north", ["itahari", "dharan", "dhankuta"], "इटहरी–धरान–धनकुटा (कोशी राजमार्ग)", "Itahari–Dharan–Dhankuta (Koshi Highway)", ["Sunsari", "Dhankuta"]),
 ("dhalkebar-janakpur", ["dhalkebar", "janakpur"], "ढल्केबर–जनकपुर सडक", "Dhalkebar–Janakpur road", ["Dhanusha"]),
 ("pathlaiya-birgunj", ["pathlaiya", "birgunj"], "पथलैया–वीरगन्ज (त्रिभुवन राजपथ)", "Pathlaiya–Birgunj (Tribhuvan Rajpath)", ["Bara", "Parsa"]),
]
NOTE_NE = "पुष्टि नभएको: गतिले यो खण्डको अवस्था बताउने आधिकारिक स्रोत अझै जोडेको छैन। यात्राअघि नेपाल प्रहरी वा सडक विभाग NAVIGATE हेर्नुहोस्।"
NOTE_EN = "Not confirmed: Gati has not yet linked an official source that reports this segment. Check Nepal Police or DoR NAVIGATE before travelling."
_m = json.loads((ROOT / "data/raw/osm-jomsom-muktinath.json").read_text())  # shortest path on OSM highway ways (Overpass, 2026-10-25)
OSM = {("jomsom", "kagbeni"): (_m["jk"], _m["d"][0]), ("kagbeni", "muktinath"): (_m["km"], _m["d"][1])}
hav = lambda a, b: 12742 * math.asin(math.sqrt(math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2))
def osrm(a, b):
    u = f"https://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson"
    for _ in range(3):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "gati-alerts route_network"}), timeout=30)); break
        except Exception: time.sleep(2)
    r = d["routes"][0]; return r["geometry"]["coordinates"], r["distance"] / 1000
def simplify(cs, step=0.004):
    out = [cs[0]]
    for c in cs[1:-1]:
        if abs(c[0] - out[-1][0]) + abs(c[1] - out[-1][1]) >= step: out.append(c)
    return [[round(x, 4), round(y, 4)] for x, y in out + [cs[-1]]]
for k, (ne, en, la, lo) in NODES.items(): RD["nodes"].setdefault(k, {"ne": ne, "en": en, "ll": [la, lo]})
for r in RD["routes"]:
    if r["id"] in SPLIT: p = SPLIT[r["id"]]; r["segs"] = [[p[i], p[i + 1]] for i in range(len(p) - 1)]
have = {f["properties"]["id"] for f in GJ["features"]}
bad = []
for rid, p, ne, en, ds in NEW:
    if any(r["id"] == rid for r in RD["routes"]): continue
    coords, km = [], 0
    for i in range(len(p) - 1):
        a, b = RD["nodes"][p[i]]["ll"], RD["nodes"][p[i + 1]]["ll"]
        if (p[i], p[i + 1]) in OSM:  # OSRM snaps Upper Mustang across the border; use the OSM way graph path instead
            cs, d = OSM[(p[i], p[i + 1])]
        else:
            cs, d = osrm(a, b); time.sleep(1)
        if d > 3.2 * hav(a, b) + 5: bad.append((rid, p[i], p[i + 1], round(d), round(hav(a, b)))); cs = None
        if cs is None: coords = None; break
        coords += cs if not coords else cs[1:]; km += d
    if not coords: continue
    RD["routes"].append({"id": rid, "status": "none", "segs": [[p[i], p[i + 1]] for i in range(len(p) - 1)], "name_ne": ne, "name_en": en,
                         "note_ne": NOTE_NE, "note_en": NOTE_EN, "sources": ["pol", "dor"], "navigate": {"refs": [], "districts": ds}})
    if rid not in have: GJ["features"].append({"type": "Feature", "properties": {"id": rid, "km": round(km)}, "geometry": {"type": "LineString", "coordinates": simplify(coords)}})
(ROOT / "data/roads.json").write_text(json.dumps(RD, ensure_ascii=False, indent=1) + "\n")
(ROOT / "data/geo/roads.geojson").write_text(json.dumps(GJ, ensure_ascii=False, separators=(",", ":")) + "\n")
print("routes", len(RD["routes"]), "nodes", len(RD["nodes"]), "rejected", bad)
