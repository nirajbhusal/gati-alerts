#!/usr/bin/env python3
"""DoR NAVIGATE road closures -> data/navigate.json (run daily by ci/cap.yml; safe to run any time).

GET https://navigate.dor.gov.np/api/Map_data_api/getRoadClosureMapData (timeout, one retry).
- Raw response saved to data/raw/navigate-YYYY-MM-DD.json (NPT date). Health in data/source-health.json
  under "dor-navigate". On failure the last good data/navigate.json is kept and marked stale.
- Status per record: CLOSED with no date_roadblock_end -> blocked; OPEN, or any end date -> open;
  anything else -> partial. Older than 72 h, or past its estimated end with nothing newer -> none
  ("not confirmed", grey dashed).
- Matching: road_refno / link_code against routes[].navigate.refs in data/roads.json, narrowed by
  routes[].navigate.districts when given. Unmatched records are listed but change no route.
- Conflict with Nepal Police (routes[].status at roads.json as_of): the newer report wins; if they
  disagree within WINDOW_H of each other, the route shows none with both sources linked.
  The browser applies data/navigate.json "routes" on top of data/roads.json (assets/js/common.js).
"""
import json, sys, time, pathlib, datetime as dt, urllib.request, ssl

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "https://navigate.dor.gov.np/api/Map_data_api/getRoadClosureMapData"
DASH = "https://navigate.dor.gov.np/dashboard"
OUT = ROOT / "data" / "navigate.json"
HP = ROOT / "data" / "source-health.json"
NPT = dt.timezone(dt.timedelta(hours=5, minutes=45))
TIMEOUT, STALE_H, WINDOW_H = 30, 72, 6
UA = "Mozilla/5.0 (compatible; GatiPoller/1.0; +https://nirajbhusal.github.io/gati-alerts/sources/)"


def now():
    return dt.datetime.now(NPT).replace(microsecond=0)


def t(s):
    """NAVIGATE times are local Nepal time without an offset."""
    if not s:
        return None
    s = str(s).strip().replace("T", " ")
    for f in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s[:19], f).replace(tzinfo=NPT)
        except ValueError:
            pass
    return None


def iso(d):
    return d.isoformat() if d else None


def fetch():
    err = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl.create_default_context()) as r:
                body = r.read()
            return json.loads(body), body, None
        except Exception as e:  # noqa: BLE001
            err = f"{type(e).__name__}: {e}"[:300]
            if attempt == 0:
                time.sleep(5)
    return None, None, err


def status_of(rec, at):
    ct = (rec.get("closure_type") or "").strip().upper()
    end = t(rec.get("date_roadblock_end"))
    if ct == "CLOSED" and not end:
        st = "blocked"
    elif ct == "OPEN" or end:
        st = "open"
    else:
        st = "partial"
    rep = max([x for x in (t(rec.get("date_roadblock_start")), end, t(rec.get("date_created"))) if x], default=None)
    est = t(rec.get("date_roadblock_end_estimated"))
    why = ""
    if not rep or (at - rep).total_seconds() > STALE_H * 3600:
        st, why = "none", "older than 72 h"
    elif st != "open" and est and est < at:
        st, why = "none", "past its estimated end with nothing newer"
    return st, rep, est, end, why


def resolve(routes, items, police_at):
    """Per route: compare the newest matched NAVIGATE item with the Nepal Police status."""
    res = {}
    for r in routes:
        mine = [i for i in items if i["route"] == r["id"]]
        if not mine:
            continue
        n = max(mine, key=lambda i: i["reported_at"] or "")
        nat = dt.datetime.fromisoformat(n["reported_at"]) if n["reported_at"] else None
        pol = r.get("status", "none")
        navst = "oneway" if n["status"] == "partial" else n["status"]
        out = {"police": pol, "navigate": n["status"], "item": n["id"], "police_at": iso(police_at), "navigate_at": n["reported_at"]}
        if n["status"] == "none" or navst == pol:
            out.update(status=pol, winner="police" if navst != pol else "agree")
        elif nat and police_at and abs((nat - police_at).total_seconds()) <= WINDOW_H * 3600:
            out.update(status="none", winner="conflict")
        elif nat and police_at and nat > police_at:
            out.update(status=navst, winner="navigate")
        else:
            out.update(status=pol, winner="police")
        res[r["id"]] = out
    return res


def main():
    at = now()
    roads = json.loads((ROOT / "data" / "roads.json").read_text())
    health = json.loads(HP.read_text()) if HP.exists() else {"sources": {}}
    h = health.setdefault("sources", {}).setdefault("dor-navigate", {"lastSuccess": None})
    h["lastChecked"] = iso(at)
    data, body, err = fetch()
    prev = json.loads(OUT.read_text()) if OUT.exists() else None
    if data is None or not isinstance(data.get("data"), list):
        h["lastResult"] = err or "unexpected response shape"
        HP.write_text(json.dumps(health, ensure_ascii=False, indent=1) + "\n")
        if prev:
            prev.update(stale=True, checked_at=iso(at), error=h["lastResult"])
            OUT.write_text(json.dumps(prev, ensure_ascii=False, indent=1) + "\n")
        print("NAVIGATE failed:", h["lastResult"], "(kept last good data)" if prev else "")
        return 0
    raw = ROOT / "data" / "raw" / f"navigate-{at.date().isoformat()}.json"
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_bytes(body)
    h.update(lastSuccess=iso(at), lastResult="ok")
    items = []
    for rec in data["data"]:
        st, rep, est, end, why = status_of(rec, at)
        ref, link, dist = (rec.get("road_refno") or "").upper(), (rec.get("link_code") or "").upper(), (rec.get("district") or "").strip().lower()
        route = None
        for r in roads["routes"]:
            nv = r.get("navigate") or {}
            refs = [x.upper() for x in nv.get("refs", [])]
            if not refs or not (ref in refs or any(link.startswith(x) for x in refs)):
                continue
            ds = [d.lower() for d in nv.get("districts", [])]
            if ds and dist not in ds:
                continue
            route = r["id"]
            break
        items.append({"id": "navigate-" + str(rec.get("id")), "road_refno": ref, "link_code": link, "road_name": rec.get("road_name"),
                      "location": rec.get("location"), "district": rec.get("district"), "closure_type": rec.get("closure_type"),
                      "reason": rec.get("closure_reason"), "started": iso(t(rec.get("date_roadblock_start"))), "estimated_end": iso(est),
                      "ended": iso(end), "status": st, "status_note": why, "reported_at": iso(rep), "checked_at": iso(at), "route": route,
                      "source": "DoR NAVIGATE", "source_ne": "सडक विभाग NAVIGATE", "url": DASH, "trust": "Official"})
    items.sort(key=lambda i: i["reported_at"] or "", reverse=True)
    police_at = dt.datetime.fromisoformat(roads["as_of"]) if roads.get("as_of") else None
    out = {"source": "DoR NAVIGATE", "url": DASH, "api": URL, "checked_at": iso(at), "stale": False, "raw": str(raw.relative_to(ROOT)),
           "rules": {"stale_hours": STALE_H, "conflict_window_hours": WINDOW_H}, "items": items, "routes": resolve(roads["routes"], items, police_at)}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    HP.write_text(json.dumps(health, ensure_ascii=False, indent=1) + "\n")
    print(f"NAVIGATE ok: {len(items)} records, {sum(1 for i in items if i['route'])} matched, routes resolved: {len(out['routes'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
