#!/usr/bin/env python3
"""Fetch the latest official airport weather reports (METAR) for Nepal's airports.

Source: NOAA Aviation Weather Center, which republishes the reports each airport's
meteorological office issues for pilots. Only airports that actually reported in the
last three hours are written; the others are left out, never guessed.

  python3 scripts/fetch_metar.py [OUT]     default OUT: data/airport-weather.json

Never fatal: if the service cannot be reached the previous file is kept and marked.
"""
import json, re, sys, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "airport-weather.json"
IDS = [a["icao"] for a in json.loads((ROOT / "data/airports.json").read_text(encoding="utf-8"))["airports"]]
URL = "https://aviationweather.gov/api/data/metar?format=json&hours=3&ids=" + ",".join(IDS)
PAGE = "https://aviationweather.gov/data/metar/?ids={}"
NPT = datetime.timezone(datetime.timedelta(hours=5, minutes=45))
WX = re.compile(r"^(\+|-|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)+$|^(\+|-)?TS$")


def decode(raw):
    """Pull the few fields the page shows out of the raw report. Unknown parts are skipped."""
    tok = raw.replace("METAR", "").replace("SPECI", "").replace("COR", "").split()
    o = {"vis_m": None, "wind_dir": None, "wind_kt": None, "gust_kt": None, "wx": [], "clouds": [], "ceiling_ft": None, "temp_c": None, "qnh": None, "cavok": False}
    seen_wind = False
    for t in tok[2:]:
        if t in ("NOSIG", "BECMG", "TEMPO", "RMK"):
            break
        m = re.match(r"^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$", t)
        if m:
            o["wind_dir"] = None if m.group(1) == "VRB" else int(m.group(1)); o["wind_kt"] = int(m.group(2)); o["gust_kt"] = int(m.group(4)) if m.group(4) else None
            seen_wind = True; continue
        if t == "CAVOK":
            o["cavok"] = True; o["vis_m"] = 10000; continue
        if seen_wind and o["vis_m"] is None and re.match(r"^\d{4}$", t):
            o["vis_m"] = 10000 if t == "9999" else int(t); continue
        m = re.match(r"^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$", t)
        if m:
            base = int(m.group(2)) * 100
            o["clouds"].append({"cover": m.group(1), "base_ft": base, "type": m.group(3)})
            if m.group(1) in ("BKN", "OVC", "VV") and (o["ceiling_ft"] is None or base < o["ceiling_ft"]):
                o["ceiling_ft"] = base
            continue
        m = re.match(r"^(M?\d{2})/(M?\d{2})?$", t)
        if m:
            o["temp_c"] = int(m.group(1).replace("M", "-")); continue
        m = re.match(r"^Q(\d{4})$", t)
        if m:
            o["qnh"] = int(m.group(1)); continue
        if WX.match(t):
            o["wx"].append(t)
    return o


def main():
    now = datetime.datetime.now(NPT).isoformat(timespec="seconds")
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "Gati relay (+https://gatialerts.com/)", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=40) as r:
            rows = json.load(r)
    except Exception as ex:
        old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"stations": {}}
        old.update({"checked": now, "reachable": False, "error": str(ex)[:160]})
        OUT.write_text(json.dumps(old, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("metar: UNREACHABLE, kept the last reports"); return
    latest = {}
    for m in rows:
        k = m.get("icaoId")
        if k and m.get("rawOb") and (k not in latest or m["reportTime"] > latest[k]["reportTime"]):
            latest[k] = m
    st = {}
    for k, m in sorted(latest.items()):
        t = datetime.datetime.fromisoformat(m["reportTime"].replace("Z", "+00:00")).astimezone(NPT)
        st[k] = {"raw": m["rawOb"], "time": t.isoformat(timespec="minutes"), "url": PAGE.format(k), **decode(m["rawOb"])}
    out = {"checked": now, "reachable": True, "source_en": "Airport weather report (METAR), via NOAA Aviation Weather Center",
           "source_ne": "विमानस्थलको मौसम प्रतिवेदन (METAR), NOAA Aviation Weather Center मार्फत", "asked": IDS, "stations": st}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("metar:", ", ".join(f"{k} {v['time'][11:16]}" for k, v in st.items()) or "no airport reported in the last 3 hours")


if __name__ == "__main__":
    main()
