#!/usr/bin/env python3
"""One-off seeder: turns verified items from the Rasuwa–Bhotekoshi bulletin
(github.com/nirajbhusal/rasuwa-flood-bulletin, data/*.json) into CAP 1.2 files.

Every value below is copied from the bulletin's data files (file named in
`gati:bulletinFile`). Nothing is invented. The original agency is the CAP
<sender>/<senderName>; Gati is only named as the relay in <note>.
Run once; afterwards CAP files in data/alerts/ are the source of truth.
"""
import json, pathlib
from xml.sax.saxutils import escape as x

ROOT = pathlib.Path(__file__).resolve().parent.parent
GEO = json.loads((ROOT / "data/districts.geojson").read_text(encoding="utf-8"))
DIST = {d["id"]: d for d in json.loads((ROOT / "data/districts.json").read_text(encoding="utf-8"))}
def _rings(g):
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return [p[0] for p in polys if len(p[0]) >= 4]
# district slug -> list of outer rings as [lat, lon] (COD-AB, see scripts/make_geo.py)
POLY = {f["properties"]["slug"]: [[[la, lo] for lo, la in r] for r in _rings(f["geometry"])] for f in GEO["features"]}
BUL = "https://github.com/nirajbhusal/rasuwa-flood-bulletin/blob/main/"
NOTE = ("Relayed by Gati (गति), an independent citizen verification project. Gati does not issue "
        "official warnings (Disaster Risk Reduction and Management Act 2074). Original: {agency}. "
        "Source: {url}")

AG = {
 "DHM":  ("hydrology.gov.np", "जल तथा मौसम विज्ञान विभाग (DHM)", "Department of Hydrology and Meteorology (DHM)"),
 "NDRRMA": ("ndrrma.gov.np", "राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण (NDRRMA)", "National Disaster Risk Reduction and Management Authority (NDRRMA)"),
 "NEOC": ("neoc.moha.gov.np", "राष्ट्रिय आपतकालीन कार्यसञ्चालन केन्द्र (NEOC), गृह मन्त्रालय", "National Emergency Operation Centre (NEOC), Ministry of Home Affairs"),
 "BIPAD": ("bipadportal.gov.np", "विपद् पोर्टल (BIPAD), राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण", "BIPAD portal, National Disaster Risk Reduction and Management Authority"),
 "POLICE": ("nepalpolice.gov.np", "नेपाल प्रहरी प्रधान कार्यालय", "Nepal Police Headquarters"),
}

def area_xml(a, lang):
    out = []
    for d in a.get("districts", []):
        dd = DIST[d]
        polys = "\n".join("      <polygon>" + " ".join(f"{la},{lo}" for la, lo in ring) + "</polygon>" for ring in POLY[d])
        out.append(f"""    <area>
      <areaDesc>{x(dd['ne'] if lang=='ne' else dd['en'])} {'जिल्ला' if lang=='ne' else 'district'}</areaDesc>
{polys}
      <geocode><valueName>NP-DISTRICT</valueName><value>{dd['code']}</value></geocode>
    </area>""")
    for c in a.get("circles", []):
        out.append(f"""    <area>
      <areaDesc>{x(c['ne'] if lang=='ne' else c['en'])}</areaDesc>
      <circle>{c['circle']}</circle>
    </area>""")
    if a.get("national"):
        out.append(f"""    <area>
      <areaDesc>{'नेपाल (सबै जिल्ला)' if lang=='ne' else 'Nepal (all districts)'}</areaDesc>
      <geocode><valueName>ISO3166-1</valueName><value>NP</value></geocode>
    </area>""")
    return "\n".join(out)

CONTACT = {
 "DHM": "DHM, Babarmahal, Kathmandu · https://www.dhm.gov.np/",
 "NDRRMA": "NDRRMA · https://ndrrma.gov.np/",
 "NEOC": "NEOC, Ministry of Home Affairs · 1149 · neoc@moha.gov.np",
 "BIPAD": "BIPAD portal, NDRRMA · https://bipadportal.gov.np/",
 "POLICE": "Nepal Police · 100 · https://www.nepalpolice.gov.np/",
}
LANG = {"ne": "ne-NP", "en": "en"}

def summary160(it, lang):
    """gati:summary160: the source headline, cut to 160 characters (never new wording)."""
    s = it["head_" + lang].replace("—", ",")
    return s if len(s) <= 160 else s[:159].rstrip() + "…"

def info_xml(it, lang):
    ag = AG[it["agency"]]
    p = {"gati:trustLevel": it["trust"], "gati:sourceUrl": it["source"], "gati:sourceTime": it["sent"],
         "gati:hazard": it["hazard"], "gati:bulletinFile": it["file"] if it["file"].startswith("http") else BUL + it["file"]}
    if it.get("source2"):
        p["gati:sourceUrl2"] = it["source2"]
    if it.get("_status"):
        p["gati:status"] = it["_status"]
    if it.get("_note_" + lang):
        p["gati:correction"] = it["_note_" + lang]
    p["gati:summary160"] = summary160(it, lang)
    params = "\n".join(f"    <parameter><valueName>{k}</valueName><value>{x(v)}</value></parameter>" for k, v in p.items())
    instr = f"\n    <instruction>{x(it['instr_'+lang])}</instruction>" if it.get("instr_en") else ""
    relay = " — गति मार्फत प्रसारित" if lang == "ne" else " — relayed by Gati"
    return f"""  <info>
    <language>{LANG[lang]}</language>
    <category>{it['category']}</category>
    <event>{x(it['event_'+lang])}</event>
    <responseType>{it.get('response','Monitor')}</responseType>
    <urgency>{it['urgency']}</urgency>
    <severity>{it['severity']}</severity>
    <certainty>{it['certainty']}</certainty>
    <effective>{it['sent']}</effective>
    <onset>{it.get('onset', it['sent'])}</onset>
    <expires>{it['expires']}</expires>
    <senderName>{x((ag[1] if lang=='ne' else ag[2]) + relay)}</senderName>
    <headline>{x(it['head_'+lang])}</headline>
    <description>{x(it['desc_'+lang])}</description>{instr}
    <web>{x(it['source'])}</web>
    <contact>{x(CONTACT[it['agency']])}</contact>
{params}
{area_xml(it['area'], lang)}
  </info>"""

def cap(it):
    ag = AG[it["agency"]]
    refs = f"\n  <references>{x(it['_references'])}</references>" if it.get("_references") else ""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>np.gati.{it['id']}</identifier>
  <sender>{ag[0]}</sender>
  <sent>{it['sent']}</sent>
  <status>Actual</status>
  <msgType>{it.get('_msgType', 'Alert')}</msgType>
  <source>{x(ag[2])}</source>
  <scope>Public</scope>
  <note>{x(NOTE.format(agency=ag[2], url=it['source']) + it.get('_noteExtra', ''))}</note>{refs}
{info_xml(it, 'ne')}
{info_xml(it, 'en')}
</alert>
"""

def lifecycle(items):
    """CAP lifecycle. A corrected item becomes the original Alert plus an Update that
    references it; a retracted item becomes the original Alert plus a Cancel.
    references = "sender,identifier,sent" (CAP 1.2 3.2.1)."""
    out = []
    for it in items:
        kind = "Corrected" if it.get("correction_en") else "Retracted" if it.get("retraction_en") else None
        base = {k: v for k, v in it.items() if not k.startswith(("correction", "retraction"))}
        out.append(base)
        if not kind:
            continue
        key = "correction" if kind == "Corrected" else "retraction"
        ref = f"{AG[it['agency']][0]},np.gati.{it['id']},{it['sent']}"
        nx = dict(base)
        nx.update({"id": f"{it['id']}-{'update' if kind == 'Corrected' else 'cancel'}-1",
                   "_msgType": "Update" if kind == "Corrected" else "Cancel", "_status": kind, "_references": ref,
                   "sent": it.get(key + "_time", it["sent"]), "source": it.get(key + "_source", it["source"]),
                   "_note_ne": it[key + "_ne"], "_note_en": it[key + "_en"],
                   "desc_ne": it[key + "_ne"] + " पहिलेको सूचना: " + it["desc_ne"],
                   "desc_en": it[key + "_en"] + " Earlier notice: " + it["desc_en"],
                   "_noteExtra": f" {kind} by the Gati relay from: {it.get(key + '_source', it['source'])}",
                   "head_ne": ("सच्याइएको: " if kind == "Corrected" else "फिर्ता: ") + it["head_ne"],
                   "head_en": ("Corrected: " if kind == "Corrected" else "Withdrawn: ") + it["head_en"]})
        out.append(nx)
    return out

ITEMS = lifecycle(json.loads((ROOT / "data/seed/seed-items.json").read_text()))
for it in ITEMS:
    (ROOT / "data/alerts" / f"{it['id']}.xml").write_text(cap(it), encoding="utf-8")
print(f"wrote {len(ITEMS)} CAP files")
