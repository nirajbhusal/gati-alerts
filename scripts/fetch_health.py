#!/usr/bin/env python3
"""Fetch MoHP Free Health dashboard data (official, public, no login) into data/health.json.
Beds: https://freehealth.mohp.gov.np/api/organizations (free beds = 10% of beds reserved for the targeted-groups free treatment scheme;
used and available as reported by MoHP; the API gives no per-hospital update time, so Gati shows its fetch time).
Blood: /api/blood-bank/facilities and /api/blood-bank/facilities/<id> (stock by blood group and component, with MoHP sync and stock times).
If the site is unreachable the last official values are kept and only 'checked'/'reachable' change."""
import json, urllib.request, datetime, pathlib, time
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT / "data/health.json"
B = "https://freehealth.mohp.gov.np"; NPT = datetime.timezone(datetime.timedelta(hours=5, minutes=45))
now = lambda: datetime.datetime.now(NPT).isoformat(timespec="minutes")
GR = ["a_pos", "a_neg", "b_pos", "b_neg", "o_pos", "o_neg", "ab_pos", "ab_neg"]
def get(p):
    r = urllib.request.Request(B + p, headers={"User-Agent": "Gati relay (+https://nirajbhusal.github.io/gati-alerts/)", "Accept": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=40))
old = json.loads(OUT.read_text()) if OUT.exists() else {}
out = dict(old) if old else {"source_ne": "स्वास्थ्य तथा जनसङ्ख्या मन्त्रालय, नि:शुल्क स्वास्थ्य ड्यासबोर्ड", "source_en": "Ministry of Health and Population, Free Health dashboard", "url": B + "/", "trust": "Official"}
t = now(); out["checked"] = t
try:
    orgs = get("/api/organizations"); beds = []
    for o in orgs:
        fb = int(o.get("free_beds") or 0)
        if fb <= 0: continue
        beds.append({"id": o.get("hf_uid"), "name": (o.get("health_facility_name") or "").strip(), "district": (o.get("district_name") or "").title(), "province": (o.get("province_name") or "").title(),
                     "palika": (o.get("palika_name") or "").title(), "address": o.get("hospital_address") or "", "ownership": o.get("public_nonpublic") or "",
                     "contact": (o.get("contact_number") or "").strip(), "total": int(o.get("sanction_beds") or 0), "free": fb, "used": int(o.get("active_beds") or 0), "available": int(o.get("available_beds") or 0)})
    out["beds"] = {"fetched": t, "reachable": True, "url": B + "/", "items": beds}
except Exception as e:
    out.setdefault("beds", {"items": []}); out["beds"].update(reachable=False, error=str(e)[:200])
try:
    fac = get("/api/blood-bank/facilities"); banks = []
    for f in fac:
        try: d = get("/api/blood-bank/facilities/%s" % f["id"]); time.sleep(0.3)
        except Exception: d = {"stock": None}
        st = d.get("stock")
        g = {k: sum(int(s.get(k) or 0) for s in st) for k in GR} if st else None
        comp = [{"c": s["component"], "n": int(s.get("total") or 0)} for s in (st or []) if int(s.get("total") or 0) > 0]
        banks.append({"id": f["id"], "name": f["name"], "district_ne": f.get("district_name") or "", "province_ne": f.get("province_name") or "", "municipality_ne": f.get("municipality_name") or "",
                      "address": f.get("address") or "", "contact": (f.get("phone") or "").strip(), "total": int(f.get("total_stock") or 0), "groups": g, "components": comp,
                      "synced": f.get("fetched_at"), "stock_updated": f.get("stock_updated_at")})
    out["blood"] = {"fetched": t, "reachable": True, "url": B + "/blood-bank", "items": banks}
except Exception as e:
    out.setdefault("blood", {"items": []}); out["blood"].update(reachable=False, error=str(e)[:200])
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n")
print("health: beds %d (%s), blood banks %d (%s)" % (len(out["beds"]["items"]), out["beds"].get("reachable"), len(out["blood"]["items"]), out["blood"].get("reachable")))
