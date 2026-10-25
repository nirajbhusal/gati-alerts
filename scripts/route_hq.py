#!/usr/bin/env python3
"""District HQ coverage (route-1025, part 2): every district headquarters gets a place in data/roads.json and,
when OSM has a road, a corridor to the network. Same method as route_network.py: OSRM over OSM roads, routed
length under 3.5x straight distance, both ends snapped within 2 km of the HQ point, and at least 97% of the line
inside Nepal (catches routes that leave the country). HQ points: Nominatim (OSM) search, accepted only if the
point lies in that district's COD-AB polygon. HQs that fail get "noroad": true and are listed, never a road.
New corridors start as "none" (not confirmed).
"""
import json, math, pathlib, time, urllib.request, urllib.parse
from shapely.geometry import shape, Point, LineString
from shapely.ops import unary_union
ROOT = pathlib.Path(__file__).resolve().parent.parent
RD = json.loads((ROOT / "data/roads.json").read_text()); GJ = json.loads((ROOT / "data/geo/roads.geojson").read_text())
DG = json.loads((ROOT / "data/districts.geojson").read_text()); DPOLY = {f["properties"]["slug"]: shape(f["geometry"]).buffer(0.01) for f in DG["features"]}
NEPAL = unary_union(list(DPOLY.values())).buffer(0.02)
UA = {"User-Agent": "gati-alerts/1.0 route_hq (https://nirajbhusal.github.io/gati-alerts/)"}
# district, node id, ne, en, search, anchor (built in this order)
HQ = [
 ("panchthar", "phidim", "फिदिम (पाँचथर)", "Phidim (Panchthar)", "Phidim", "ilam"),
 ("taplejung", "phungling", "फुङलिङ (ताप्लेजुङ)", "Phungling (Taplejung)", "Phungling", "phidim"),
 ("jhapa", "bhadrapur", "भद्रपुर (झापा)", "Bhadrapur (Jhapa)", "Bhadrapur", "birtamod"),
 ("sunsari", "inaruwa", "इनरुवा (सुनसरी)", "Inaruwa (Sunsari)", "Inaruwa", "itahari"),
 ("terhathum", "myanglung", "म्याङलुङ (तेह्रथुम)", "Myanglung (Terhathum)", "Myanglung", "dhankuta"),
 ("sankhuwasabha", "khandbari", "खाँदबारी (संखुवासभा)", "Khandbari (Sankhuwasabha)", "Khandbari", "dhankuta"),
 ("bhojpur", "bhojpur", "भोजपुर", "Bhojpur", "Bhojpur", "dhankuta"),
 ("udayapur", "gaighat", "गाईघाट (उदयपुर)", "Gaighat (Udayapur)", "Gaighat", "lahan"),
 ("khotang", "diktel", "दिक्तेल (खोटाङ)", "Diktel (Khotang)", "Diktel", "gaighat"),
 ("okhaldhunga", "okhaldhunga", "ओखलढुङ्गा", "Okhaldhunga", "Okhaldhunga", "gaighat"),
 ("solukhumbu", "salleri", "सल्लेरी (सोलुखुम्बु)", "Salleri (Solukhumbu)", "Salleri", "okhaldhunga"),
 ("saptari", "rajbiraj", "राजविराज (सप्तरी)", "Rajbiraj (Saptari)", "Rajbiraj", "lahan"),
 ("siraha", "siraha", "सिरहा", "Siraha", "Siraha", "lahan"),
 ("mahottari", "jaleshwar", "जलेश्वर (महोत्तरी)", "Jaleshwar (Mahottari)", "Jaleshwar", "janakpur"),
 ("sarlahi", "malangwa", "मलङ्गवा (सर्लाही)", "Malangwa (Sarlahi)", "Malangwa", "bardibas"),
 ("rautahat", "gaur", "गौर (रौतहट)", "Gaur (Rautahat)", "Gaur", "pathlaiya"),
 ("bara", "kalaiya", "कलैया (बारा)", "Kalaiya (Bara)", "Kalaiya", "pathlaiya"),
 ("ramechhap", "manthali", "मन्थली (रामेछाप)", "Manthali (Ramechhap)", "Manthali", "sindhuli"),
 ("kavrepalanchok", "dhulikhel", "धुलिखेल (काभ्रे)", "Dhulikhel (Kavre)", "Dhulikhel", "ktm"),
 ("bhaktapur", "bhaktapur", "भक्तपुर", "Bhaktapur", "Bhaktapur", "ktm"),
 ("lalitpur", "lalitpur", "ललितपुर", "Lalitpur", "Lalitpur", "ktm"),
 ("dolakha", "charikot", "चरिकोट (दोलखा)", "Charikot (Dolakha)", "Charikot", "dhulikhel"),
 ("sindhupalchok", "chautara", "चौतारा (सिन्धुपाल्चोक)", "Chautara (Sindhupalchok)", "Chautara", "dhulikhel"),
 ("nuwakot", "bidur", "विदुर (नुवाकोट)", "Bidur (Nuwakot)", "Bidur", "ktm"),
 ("dhading", "dhadingbesi", "धादिङबेसी", "Dhading Besi", "Dhading Besi", "galaudi"),
 ("manang", "chame", "चामे (मनाङ)", "Chame (Manang)", "Chame", "besisahar"),
 ("parbat", "kusma", "कुश्मा (पर्वत)", "Kusma (Parbat)", "Kusma", "pokhara"),
 ("nawalparasi-east", "kawasoti", "कावासोती (नवलपुर)", "Kawasoti (Nawalpur)", "Kawasoti", "narayanghat"),
 ("nawalparasi-west", "parasi", "परासी (नवलपरासी पश्चिम)", "Parasi (Nawalparasi West)", "Parasi", "butwal"),
 ("kapilbastu", "taulihawa", "तौलिहवा (कपिलवस्तु)", "Taulihawa (Kapilvastu)", "Taulihawa", "butwal"),
 ("arghakhanchi", "sandhikharka", "सन्धिखर्क (अर्घाखाँची)", "Sandhikharka (Arghakhanchi)", "Sandhikharka", "palpa"),
 ("gulmi", "tamghas", "तम्घास (गुल्मी)", "Tamghas (Gulmi)", "Tamghas", "palpa"),
 ("pyuthan", "pyuthan", "प्युठान खलङ्गा", "Pyuthan Khalanga", "Pyuthan", "lamahi"),
 ("rolpa", "liwang", "लिबाङ (रोल्पा)", "Liwang (Rolpa)", "Liwang", "ghorahi"),
 ("rukum-east", "rukumkot", "रुकुमकोट (रुकुम पूर्व)", "Rukumkot (Rukum East)", "Rukumkot", "liwang"),
 ("bardiya", "gulariya", "गुलरिया (बर्दिया)", "Gulariya (Bardiya)", "Gulariya", "nepalgunj"),
 ("salyan", "salyan", "सल्यान खलङ्गा", "Salyan Khalanga", "Salyan", "tulsipur"),
 ("rukum-west", "musikot", "मुसिकोट (रुकुम पश्चिम)", "Musikot (Rukum West)", "Musikot", "salyan"),
 ("jajarkot", "jajarkot", "जाजरकोट खलङ्गा", "Jajarkot Khalanga", "Jajarkot", "surkhet"),
 ("dailekh", "dailekh", "दैलेख", "Dailekh", "Dailekh", "surkhet"),
 ("dolpa", "dunai", "दुनै (डोल्पा)", "Dunai (Dolpa)", "Dunai", "jajarkot"),
 ("mugu", "gamgadhi", "गमगढी (मुगु)", "Gamgadhi (Mugu)", "Gamgadhi", "jumla"),
 ("humla", "simikot", "सिमकोट (हुम्ला)", "Simikot (Humla)", "Simikot", "gamgadhi"),
 ("doti", "dipayal", "दिपायल (डोटी)", "Dipayal (Doti)", "Dipayal", "dadeldhura"),
 ("achham", "mangalsen", "मंगलसेन (अछाम)", "Mangalsen (Achham)", "Mangalsen", "dipayal"),
 ("bajura", "martadi", "मार्तडी (बाजुरा)", "Martadi (Bajura)", "Martadi", "mangalsen"),
 ("bajhang", "chainpur", "चैनपुर (बझाङ)", "Chainpur (Bajhang)", "Chainpur", "dipayal"),
 ("baitadi", "dasharathchand", "दशरथचन्द (बैतडी)", "Dasharathchand (Baitadi)", "Dasharathchand", "dadeldhura"),
 ("darchula", "darchula", "दार्चुला खलङ्गा", "Darchula Khalanga", "Darchula", "dasharathchand"),
]
# second tries: other OSM names for the HQ, other anchors, and a looser length limit for long mountain roads
OVR = {"gaighat": (["Triyuga", "Gaighat Bazar"], ["lahan", "itahari"], 3.5), "salleri": (["Salle", "Phaplu", "Solududhkunda"], ["okhaldhunga"], 5.0),
       "rukumkot": (["Rukumkot", "Sisne"], ["musikot", "liwang"], 4.5), "jajarkot": (["Khalanga, Jajarkot", "Bheri"], ["surkhet", "musikot", "dailekh"], 4.5),
       "dunai": (["Dunai", "Thuli Bheri"], ["jajarkot", "musikot"], 4.5), "gamgadhi": (["Gamgadhi"], ["jumla"], 4.5), "simikot": (["Simikot"], ["gamgadhi", "jumla"], 5.0),
       "chainpur": (["Chainpur, Bajhang", "Jaya Prithvi"], ["dipayal", "martadi"], 4.5), "darchula": (["Khalanga, Darchula", "Mahakali", "Darchula"], ["dasharathchand"], 4.5)}
hav = lambda a, b: 12742 * math.asin(math.sqrt(math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2))
def get(u):
    for _ in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
        except Exception: time.sleep(3)
def geocode(dist, q):
    poly = DPOLY[dist]
    for qq in (f"{q}, Nepal", q):
        r = get("https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"q": qq, "format": "json", "limit": 10, "countrycodes": "np"})) or []
        time.sleep(1.1)
        for x in r:
            if poly.contains(Point(float(x["lon"]), float(x["lat"]))): return [round(float(x["lat"]), 4), round(float(x["lon"]), 4)]
    return None
def osrm(a, b):
    d = get(f"https://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson")
    if not d or d.get("code") != "Ok": return None
    r = d["routes"][0]; snap = max(w["distance"] for w in d["waypoints"])
    return r["geometry"]["coordinates"], r["distance"] / 1000, snap / 1000
def simplify(cs, step=0.004):
    out = [cs[0]]
    for c in cs[1:-1]:
        if abs(c[0] - out[-1][0]) + abs(c[1] - out[-1][1]) >= step: out.append(c)
    return [[round(x, 4), round(y, 4)] for x, y in out + [cs[-1]]]
N = RD["nodes"]; have = {f["properties"]["id"] for f in GJ["features"]}; noroad = []
for dist, nid, ne, en, q, anchor in HQ:
    if nid in N and not N[nid].get("noroad") and any(r["id"] == f"hq-{nid}" for r in RD["routes"]): continue
    qs, anchors, lim = OVR.get(nid, ([q], [anchor], 3.5)); qs = [q] + [x for x in qs if x != q]; anchors = [anchor] + [x for x in anchors if x != anchor]
    ll = None
    for qq in qs:
        ll = geocode(dist, qq)
        if ll: break
    if not ll: noroad.append((nid, "HQ point not found in district")); continue
    N[nid] = {"ne": ne, "en": en, "ll": ll, "hq": dist}
    why = "no anchor with a road"
    for anc in anchors:
        if anc not in N or N[anc].get("noroad"): continue
        a = N[anc]["ll"]; res = osrm(a, ll); time.sleep(1)
        if not res: why = "no OSRM route"; continue
        cs, km, snap = res; inside = sum(NEPAL.contains(Point(x, y)) for x, y in cs) / len(cs)
        if snap > 2: why = f"nearest road {snap:.1f} km from HQ"; continue
        if km > lim * hav(a, ll) + 10: why = f"routed {km:.0f} km vs straight {hav(a, ll):.0f} km"; continue
        if inside < 0.97: why = f"route leaves Nepal ({inside:.0%} inside)"; continue
        why = None; anchor = anc; break
    if why:
        N[nid].update(noroad=True, noroad_why=why); noroad.append((nid, why)); continue
    rid = f"hq-{nid}"
    RD["routes"].append({"id": rid, "status": "none", "segs": [[anchor, nid]], "name_ne": f"{N[anchor]['ne']}–{ne} सडक", "name_en": f"{N[anchor]['en']}–{en} road",
        "note_ne": "पुष्टि नभएको: गतिले यो खण्डको अवस्था बताउने आधिकारिक स्रोत अझै जोडेको छैन। यात्राअघि नेपाल प्रहरी वा सडक विभाग NAVIGATE हेर्नुहोस्।",
        "note_en": "Not confirmed: Gati has not yet linked an official source that reports this segment. Check Nepal Police or DoR NAVIGATE before travelling.",
        "sources": ["pol", "dor"], "navigate": {"refs": [], "districts": []}})
    if rid not in have: GJ["features"].append({"type": "Feature", "properties": {"id": rid, "km": round(km)}, "geometry": {"type": "LineString", "coordinates": simplify(cs)}})
    print("ok", nid, round(km), "km")
(ROOT / "data/roads.json").write_text(json.dumps(RD, ensure_ascii=False, indent=1) + "\n")
(ROOT / "data/geo/roads.geojson").write_text(json.dumps(GJ, ensure_ascii=False, separators=(",", ":")) + "\n")
print("routes", len(RD["routes"]), "nodes", len(N), "noroad", noroad)
