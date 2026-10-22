#!/usr/bin/env python3
"""Validate every CAP 1.2 file in data/alerts/ and regenerate:
  - feed.xml          Atom index of all CAP messages (newest first)
  - data/alerts.json  JSON mirror for the web UI
Usage: python scripts/build.py [--check]   (--check = validate only, write nothing)
Strict: exit code 1 if any file is not well-formed XML, fails the OASIS CAP 1.2 XSD
(schema/CAP-v1.2.xsd), fails the Gati profile, has an identifier that does not match its
file name, or duplicates another identifier. Nothing is written unless every file passes.
"""
import json, sys, pathlib, datetime as dt
from lxml import etree

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://nirajbhusal.github.io/gati-alerts/"
NS = {"c": "urn:oasis:names:tc:emergency:cap:1.2"}
TRUST = {"Official", "Verified", "Reported", "Unverified"}
SCHEMA = etree.XMLSchema(etree.parse(str(ROOT / "schema/CAP-v1.2.xsd")))

def t(el, path):
    r = el.find(path, NS)
    return r.text.strip() if r is not None and r.text else None

def profile_errors(doc):
    """Gati profile on top of the OASIS schema."""
    e = []
    infos = doc.findall("c:info", NS)
    langs = {t(i, "c:language") for i in infos}
    if not {"ne", "en"} <= langs: e.append(f"needs <info> in ne and en, found {sorted(langs)}")
    for i in infos:
        p = {t(x, "c:valueName"): t(x, "c:value") for x in i.findall("c:parameter", NS)}
        if p.get("gati:trustLevel") not in TRUST: e.append("gati:trustLevel missing/invalid")
        if not p.get("gati:sourceUrl"): e.append("gati:sourceUrl missing")
        if not t(i, "c:web"): e.append("<web> (original source link) missing")
        if not t(i, "c:expires"): e.append("<expires> missing")
        if not i.findall("c:area", NS): e.append("<area> missing")
        for poly in i.findall("c:area/c:polygon", NS):
            pts = poly.text.split()
            if len(pts) < 4 or pts[0] != pts[-1]: e.append("polygon must have >=4 points and be closed")
    if "Gati" not in (t(doc, "c:note") or ""): e.append("<note> must name Gati as relay")
    return e

def parse_poly(s):
    return [[float(a) for a in p.split(",")] for p in s.split()]

def main(check=False):
    now = dt.datetime.now(dt.timezone.utc)
    alerts, bad, seen = [], 0, set()
    others = [p.name for p in (ROOT / "data/alerts").iterdir() if p.suffix != ".xml"]
    if others:
        bad += 1; print("FAIL non-XML files in data/alerts:", others)
    for f in sorted((ROOT / "data/alerts").glob("*.xml")):
        try:
            doc = etree.parse(str(f), etree.XMLParser(recover=False, resolve_entities=False, no_network=True))
        except etree.XMLSyntaxError as ex:
            bad += 1; print(f"FAIL {f.name}: not well-formed XML: {ex}"); continue
        if not SCHEMA.validate(doc):
            bad += 1
            for err in SCHEMA.error_log:
                print(f"FAIL {f.name}:{err.line}: {err.message}")
            continue
        root = doc.getroot()
        errs = profile_errors(root)
        ident = t(root, "c:identifier") or ""
        if ident != "np.gati." + f.stem: errs.append(f"identifier {ident!r} must be 'np.gati.{f.stem}'")
        if ident in seen: errs.append(f"duplicate identifier {ident}")
        seen.add(ident)
        if errs:
            bad += 1; print(f"FAIL {f.name}: " + "; ".join(errs)); continue
        print(f"ok   {f.name}")
        a = {k: t(root, "c:" + k) for k in ("identifier", "sender", "sent", "status", "msgType", "scope", "note", "references")}
        a["file"] = "data/alerts/" + f.name
        a["info"] = {}
        for i in root.findall("c:info", NS):
            lang = t(i, "c:language")
            p = {t(x, "c:valueName"): t(x, "c:value") for x in i.findall("c:parameter", NS)}
            a["info"][lang] = {k: t(i, "c:" + k) for k in ("category", "event", "urgency", "severity", "certainty",
                               "effective", "expires", "senderName", "headline", "description", "instruction", "web")}
            a["info"][lang]["params"] = p
            a["info"][lang]["areas"] = [{
                "desc": t(ar, "c:areaDesc"),
                "polygons": [parse_poly(pg.text) for pg in ar.findall("c:polygon", NS)],
                "circles": [c.text for c in ar.findall("c:circle", NS)],
                "geocodes": {t(g, "c:valueName"): t(g, "c:value") for g in ar.findall("c:geocode", NS)},
            } for ar in i.findall("c:area", NS)]
        en = a["info"]["en"]
        a["trust"] = en["params"]["gati:trustLevel"]
        a["state"] = en["params"].get("gati:status")  # Corrected / Retracted / None
        a["hazard"] = en["params"].get("gati:hazard")
        a["severity"] = en["severity"]
        a["expires"] = en["expires"]
        a["districts"] = sorted({ar["geocodes"]["NP-DISTRICT"] for ar in en["areas"] if "NP-DISTRICT" in ar["geocodes"]})
        a["expired"] = dt.datetime.fromisoformat(en["expires"]) < now
        # Split: geometry lives once in data/districts.geojson, keyed by NP-DISTRICT code.
        a["areas"] = [{"code": ar["geocodes"].get("NP-DISTRICT"), "circles": ar["circles"],
                       "ne": ne_ar["desc"], "en": ar["desc"]}
                      for ar, ne_ar in zip(en["areas"], a["info"]["ne"]["areas"])]
        for lang in a["info"]:
            for ar in a["info"][lang]["areas"]:
                ar.pop("polygons", None)
        alerts.append(a)
    print(f"{len(alerts)} valid, {bad} failed")
    if bad: sys.exit(1)
    if check: return
    alerts.sort(key=lambda a: a["sent"], reverse=True)
    gen = now.isoformat(timespec="seconds")
    (ROOT / "data/alerts.json").write_text(json.dumps({"generated": gen, "count": len(alerts), "alerts": alerts},
                                                      ensure_ascii=False, indent=1), encoding="utf-8")
    A = "http://www.w3.org/2005/Atom"
    feed = etree.Element("{%s}feed" % A, nsmap={None: A})
    def sub(p, tag, text=None, **kw):
        e = etree.SubElement(p, "{%s}%s" % (A, tag), **kw)
        if text: e.text = text
        return e
    sub(feed, "id", SITE + "feed.xml")
    sub(feed, "title", "गति (Gati) — relayed CAP 1.2 alerts (not official warnings)")
    sub(feed, "subtitle", "सही सूचना, समयमै। / The right alert, right on time. Gati relays and verifies; it does not issue official warnings.")
    sub(feed, "updated", gen)
    sub(feed, "link", href=SITE + "feed.xml", rel="self")
    sub(feed, "link", href=SITE, rel="alternate")
    au = sub(feed, "author"); sub(au, "name", "Gati (Niraj Bhusal, maintainer)")
    for a in alerts:
        en = a["info"]["en"]
        e = sub(feed, "entry")
        sub(e, "id", a["identifier"])
        sub(e, "title", en["headline"])
        sub(e, "updated", a["sent"])
        sub(e, "published", a["sent"])
        sub(e, "summary", f"[{a['trust']}{' / ' + a['state'] if a['state'] else ''}] {en['severity']} · {en['senderName']} · expires {a['expires']}")
        sub(e, "link", href=SITE + a["file"], rel="alternate", type="application/cap+xml")
        sub(e, "link", href=en["web"], rel="via")
        ea = sub(e, "author"); sub(ea, "name", a["sender"])
    (ROOT / "feed.xml").write_bytes(etree.tostring(feed, xml_declaration=True, encoding="UTF-8", pretty_print=True))
    print("wrote feed.xml and data/alerts.json")

if __name__ == "__main__":
    main("--check" in sys.argv)
