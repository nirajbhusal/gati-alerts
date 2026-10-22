#!/usr/bin/env python3
"""Earthquake ingest: real events only, from two official sources.

1. NSC (National Earthquake Monitoring and Research Center, seismonepal.gov.np): the event
   table on https://seismonepal.gov.np/ne . Rows with ML >= 4.0 are relayed.
2. USGS FDSN event API (GeoJSON): M4.5+ inside the Nepal bounding box
   lat 26.3..30.5, lon 80.0..88.3, last 90 days.
Each event becomes one CAP 1.2 file in data/alerts/. An existing file is never overwritten or
deleted (archive). Epicentres are matched to a district with data/districts.geojson.
Policy: earthquake reports are informational (severity Unknown, urgency Past) and expire 24 h
after the event. Figures from NSC and USGS are never merged or summed; a quake reported by
both appears twice, each with its own agency, magnitude type and link.
Usage: python scripts/ingest_quakes.py [--dry]
"""
import json, re, sys, pathlib, datetime as dt, urllib.request, html
from xml.sax.saxutils import escape as x
from shapely.geometry import shape, Point

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data/alerts"
DRY = "--dry" in sys.argv
UA = {"User-Agent": "Mozilla/5.0 (compatible; GatiIngest/1.0; +https://nirajbhusal.github.io/gati-alerts/sources/)"}
BBOX = dict(minlatitude=26.3, maxlatitude=30.5, minlongitude=80.0, maxlongitude=88.3)
NPT = dt.timezone(dt.timedelta(hours=5, minutes=45))
DEV = str.maketrans("0123456789", "०१२३४५६७८९")
GEO = json.loads((ROOT / "data/districts.geojson").read_text(encoding="utf-8"))
SHAPES = [(shape(f["geometry"]), f["properties"]) for f in GEO["features"]]
BYNAME = {f["properties"]["en"].lower(): f["properties"] for f in GEO["features"]}
NOTE = ("Relayed by Gati (गति), an independent citizen verification project. Gati does not issue "
        "official warnings (Disaster Risk Reduction and Management Act 2074). Original: {agency}. Source: {url}")
AG = {
 "NSC": ("seismonepal.gov.np", "राष्ट्रिय भूकम्प मापन तथा अनुसन्धान केन्द्र (NSC)", "National Earthquake Monitoring and Research Center (NSC)",
         "NSC · https://seismonepal.gov.np/"),
 "USGS": ("earthquake.usgs.gov", "अमेरिकी भूगर्भ सर्वेक्षण (USGS)", "U.S. Geological Survey (USGS)", "USGS National Earthquake Information Center · https://earthquake.usgs.gov/"),
}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def district_at(lat, lon):
    p = Point(lon, lat)
    for g, props in SHAPES:
        if g.contains(p):
            return props
    return None


def iso(t):
    return t.astimezone(NPT).isoformat(timespec="seconds")


def cap(stem, ag, t, lat, lon, mag_txt, place_ne, place_en, d, web):
    a = AG[ag]
    sent, exp = iso(t), iso(t + dt.timedelta(hours=24))
    head = {"ne": f"भूकम्प: {mag_txt.translate(DEV)}, {place_ne} ({ag})", "en": f"Earthquake: {mag_txt}, {place_en} ({ag})"}
    tl = t.astimezone(NPT)
    when_ne = f"{tl:%Y-%m-%d %H:%M}".translate(DEV) + " NPT"
    when_en = f"{tl:%Y-%m-%d %H:%M} NPT"
    desc = {"ne": f"{a[1]} अनुसार {when_ne} मा {place_ne} क्षेत्रमा {mag_txt.translate(DEV)} को भूकम्प गयो। केन्द्रबिन्दु: {lat:.2f}°N, {lon:.2f}°E।".replace(".", ".").translate(DEV),
            "en": f"According to {a[2]}, an earthquake of {mag_txt} occurred at {when_en}, {place_en}. Epicentre: {lat:.2f}°N, {lon:.2f}°E."}
    instr = {"ne": "धक्का फेरि आए घुँडा टेक्नुहोस्, टाउको छोप्नुहोस्, समात्नुहोस्। चर्केका घर र भिरालो ठाउँबाट टाढा रहनुहोस्।",
             "en": "If shaking returns: drop, cover and hold on. Stay away from cracked buildings and steep slopes."}

    def info(lang):
        area = []
        if d:
            area.append(f"""    <area>
      <areaDesc>{x(d['ne'] if lang == 'ne' else d['en'])} {'जिल्ला' if lang == 'ne' else 'district'}</areaDesc>
      <circle>{lat:.4f},{lon:.4f} 0</circle>
      <geocode><valueName>NP-DISTRICT</valueName><value>{d['code']}</value></geocode>
    </area>""")
        else:
            area.append(f"""    <area>
      <areaDesc>{x(place_ne if lang == 'ne' else place_en)}</areaDesc>
      <circle>{lat:.4f},{lon:.4f} 0</circle>
    </area>""")
        h = head[lang]
        s160 = h if len(h) <= 160 else h[:159] + "…"
        params = {"gati:trustLevel": "Official", "gati:sourceUrl": web, "gati:sourceTime": sent, "gati:hazard": "earthquake",
                  "gati:summary160": s160, "gati:magnitude": mag_txt}
        ps = "\n".join(f"    <parameter><valueName>{k}</valueName><value>{x(v)}</value></parameter>" for k, v in params.items())
        return f"""  <info>
    <language>{'ne-NP' if lang == 'ne' else 'en'}</language>
    <category>Geo</category>
    <event>{'भूकम्प' if lang == 'ne' else 'Earthquake'}</event>
    <responseType>None</responseType>
    <urgency>Past</urgency>
    <severity>Unknown</severity>
    <certainty>Observed</certainty>
    <effective>{sent}</effective>
    <onset>{sent}</onset>
    <expires>{exp}</expires>
    <senderName>{x((a[1] + ' · गति मार्फत प्रसारित') if lang == 'ne' else (a[2] + ' · relayed by Gati'))}</senderName>
    <headline>{x(h)}</headline>
    <description>{x(desc[lang])}</description>
    <instruction>{x(instr[lang])}</instruction>
    <web>{x(web)}</web>
    <contact>{x(a[3])}</contact>
{ps}
{chr(10).join(area)}
  </info>"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>np.gati.{stem}</identifier>
  <sender>{a[0]}</sender>
  <sent>{sent}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <source>{x(a[2])}</source>
  <scope>Public</scope>
  <note>{x(NOTE.format(agency=a[2], url=web))}</note>
{info('ne')}
{info('en')}
</alert>
"""


def write(stem, body):
    f = OUT / f"{stem}.xml"
    if f.exists():
        return "kept"
    if not DRY:
        f.write_text(body, encoding="utf-8")
    return "new"


def nsc():
    url = "https://seismonepal.gov.np/ne"
    s = get(url)
    t = s[s.find("<table"):s.find("</table>")]
    n = 0
    for row in re.findall(r"(?s)<tr.*?</tr>", t)[1:]:
        txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", row))).strip()
        m = re.search(r"ई\.सं\.: (\d{4}-\d{2}-\d{2}) .*?UTC: (\d{2}:\d{2}:\d{2}) ([\d.]+)° ([\d.]+)° ([\d.]+) ML (.+?) Did you feel", txt)
        if not m:
            continue
        ad, utc, lat, lon, ml, epi = m.groups()
        lat, lon, ml = float(lat), float(lon), float(ml)
        if ml < 4.0:
            continue
        form = re.search(r"earthquakes/form/(\d+)", row)
        tt = dt.datetime.fromisoformat(f"{ad}T{utc}+00:00")
        # NSC lists the UTC date of the local day; if UTC time + 5:45 crosses midnight, the AD date shown is the local date
        loc = re.search(r"स्थानीय: (\d{2}:\d{2}:\d{2})", txt).group(1)
        if loc < utc:  # local time already on the next day: AD shown is the local date, so UTC is the previous day
            tt -= dt.timedelta(days=1)
        d = district_at(lat, lon) or BYNAME.get(epi.strip().lower())
        place_en = epi.strip()
        place_ne = (BYNAME[place_en.lower()]["ne"] if place_en.lower() in BYNAME else place_en)
        stem = f"nsc-quake-{form.group(1) if form else tt.strftime('%Y%m%d%H%M')}-{tt.astimezone(NPT):%Y-%m-%d}"
        r = write(stem, cap(stem, "NSC", tt, lat, lon, f"{ml:.1f} ML", place_ne, place_en, d, url))
        print(r, stem); n += 1
    return n


def usgs():
    start = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=90)).strftime("%Y-%m-%d")
    q = "&".join(f"{k}={v}" for k, v in BBOX.items())
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5&{q}&orderby=time&starttime={start}"
    d = json.loads(get(url))
    n = 0
    for f in d["features"]:
        p = f["properties"]
        lon, lat = f["geometry"]["coordinates"][:2]
        tt = dt.datetime.fromtimestamp(p["time"] / 1000, dt.timezone.utc).replace(microsecond=0)
        dd = district_at(lat, lon)
        place = p["place"]
        place_ne = (f"{dd['ne']} जिल्ला, " if dd else "") + place
        stem = f"usgs-quake-{f['id']}-{tt.astimezone(NPT):%Y-%m-%d}"
        r = write(stem, cap(stem, "USGS", tt, lat, lon, f"M{p['mag']:.1f} ({p['magType']})", place_ne, place, dd, p["url"]))
        print(r, stem); n += 1
    return n


if __name__ == "__main__":
    for fn in (nsc, usgs):
        try:
            print(fn.__name__, fn(), "events")
        except Exception as e:  # unreachable source: record and carry on
            print(fn.__name__, "failed:", type(e).__name__, e)
