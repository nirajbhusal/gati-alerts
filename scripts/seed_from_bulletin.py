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
POLY = json.loads((ROOT / "data/seed/district-polygons.json").read_text())
DIST = {d["id"]: d for d in json.loads((ROOT / "data/districts.json").read_text())}
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
        pts = " ".join(f"{la},{lo}" for la, lo in POLY[d])
        out.append(f"""    <area>
      <areaDesc>{x(dd['ne'] if lang=='ne' else dd['en'])} {'जिल्ला' if lang=='ne' else 'district'}</areaDesc>
      <polygon>{pts}</polygon>
      <geocode><valueName>NP-DISTRICT</valueName><value>{d}</value></geocode>
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

def info_xml(it, lang):
    ag = AG[it["agency"]]
    p = {"gati:trustLevel": it["trust"], "gati:sourceUrl": it["source"], "gati:sourceTime": it["sent"],
         "gati:hazard": it["hazard"], "gati:bulletinFile": it["file"] if it["file"].startswith("http") else BUL + it["file"]}
    if it.get("source2"):
        p["gati:sourceUrl2"] = it["source2"]
    if it.get("correction_en"):
        p["gati:status"] = "Corrected"
        p["gati:correction"] = it["correction_" + lang]
    params = "\n".join(f"    <parameter><valueName>{k}</valueName><value>{x(v)}</value></parameter>" for k, v in p.items())
    instr = f"\n    <instruction>{x(it['instr_'+lang])}</instruction>" if it.get("instr_en") else ""
    relay = " — गति मार्फत प्रसारित" if lang == "ne" else " — relayed by Gati"
    return f"""  <info>
    <language>{'ne' if lang=='ne' else 'en'}</language>
    <category>{it['category']}</category>
    <event>{x(it['event_'+lang])}</event>
    <responseType>{it.get('response','Monitor')}</responseType>
    <urgency>{it['urgency']}</urgency>
    <severity>{it['severity']}</severity>
    <certainty>{it['certainty']}</certainty>
    <effective>{it['sent']}</effective>
    <expires>{it['expires']}</expires>
    <senderName>{x((ag[1] if lang=='ne' else ag[2]) + relay)}</senderName>
    <headline>{x(it['head_'+lang])}</headline>
    <description>{x(it['desc_'+lang])}</description>{instr}
    <web>{x(it['source'])}</web>
{params}
{area_xml(it['area'], lang)}
  </info>"""

def cap(it):
    ag = AG[it["agency"]]
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>np.gati.{it['id']}</identifier>
  <sender>{ag[0]}</sender>
  <sent>{it['sent']}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <source>{x(ag[2])}</source>
  <scope>Public</scope>
  <note>{x(NOTE.format(agency=ag[2], url=it['source']))}</note>
{info_xml(it, 'ne')}
{info_xml(it, 'en')}
</alert>
"""

ITEMS = json.loads((ROOT / "data/seed/seed-items.json").read_text())
for it in ITEMS:
    (ROOT / "data/alerts" / f"{it['id']}.xml").write_text(cap(it), encoding="utf-8")
print(f"wrote {len(ITEMS)} CAP files")
