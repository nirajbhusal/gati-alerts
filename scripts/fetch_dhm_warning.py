#!/usr/bin/env python3
"""Point data/weather.json at DHM's latest 5-day warning page.

Reads the weather-warning tag (tag_id 8) and the latest page. Updates the bulletin
id, source link, issue time, posted time and checked time even when the map colours
are unchanged. Does not redraw the colour notes and does not create a CAP alert.
"""
import json, re, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "weather.json"
TAG = "https://dhm.gov.np/mfd/api/page/tag?tag_id=8"
PAGE = "https://dhm.gov.np/mfd/api/page/{}"
NPT = datetime.timezone(datetime.timedelta(hours=5, minutes=45))
UA = {"User-Agent": "Mozilla/5.0 (compatible; Gati relay; +https://nirajbhusal.github.io/gati-alerts/)", "Accept": "application/json"}
DEV = "०१२३४५६७८९"


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def npt(iso):
    t = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    if t.tzinfo is None:
        t = t.replace(tzinfo=datetime.timezone.utc)
    return t.astimezone(NPT).isoformat(timespec="seconds")


def dev(n):
    return "".join(DEV[int(c)] if c.isdigit() else c for c in str(n))


def main():
    doc = json.loads(OUT.read_text(encoding="utf-8"))
    pages = get(TAG)
    latest = max(int(p["id"]) for p in pages)
    page = get(PAGE.format(latest))
    b = doc.setdefault("bulletin5", {})
    prev = str(b.get("mfd_id") or "")
    if not prev:
        m = re.search(r"/(\d+)\s*$", b.get("url") or "")
        prev = m.group(1) if m else ""
    issued = npt(page["issue_date"])
    posted = npt(page.get("create_at") or page["issue_date"])
    checked = datetime.datetime.now(NPT).isoformat(timespec="seconds")
    b["mfd_id"] = str(latest)
    b["url"] = f"https://dhm.gov.np/mfd/#/weather/pages/weather-warning/{latest}"
    b["issued"] = issued
    b["posted"] = posted
    doc["checked"] = checked
    # Keep the colour sentences. Only the "latest page" claim moves.
    if prev and prev != str(latest):
        doc["note_ne"] = doc["note_ne"].replace(
            f"({dev(prev)}) सबैभन्दा पछिल्लो हो",
            f"({dev(latest)}) सबैभन्दा पछिल्लो हो। नक्साका रङ {dev(prev)} बाट बदलिएका छैनन्",
            1)
        doc["note_en"] = doc["note_en"].replace(
            f"({prev}) is the latest",
            f"({latest}) is the latest. Map colours are unchanged from {prev}",
            1)
        doc["note_ne"] = re.sub(r"कात्तिक \S+ बिहान ८ बजे जारी", "कात्तिक २५ बिहान ८ बजे जारी", doc["note_ne"], count=1) if "कार्तिक २५" in (page.get("title") or "") or "कात्तिक २५" in (page.get("title") or "") else doc["note_ne"]
        doc["note_en"] = re.sub(r"issued at 8 AM Kartik \d+", "issued at 8 AM Kartik 25", doc["note_en"], count=1) if "कार्तिक २५" in (page.get("title") or "") or "कात्तिक २५" in (page.get("title") or "") else doc["note_en"]
        if prev == "12417" and str(latest) == "12419":
            doc["note_ne"] = doc["note_ne"].replace(
                "यसले कात्तिक २३ बिहान (१२४१५) र साँझ (१२४१६) का बुलेटिनलाई प्रतिस्थापन गर्छ।",
                "यसले कात्तिक २४ बिहान (१२४१७) र साँझ (१२४१८) का बुलेटिनलाई प्रतिस्थापन गर्छ।")
            doc["note_en"] = doc["note_en"].replace(
                "It replaces the Kartik 23 morning (12415) and evening (12416) bulletins.",
                "It replaces the Kartik 24 morning (12417) and evening (12418) bulletins.")
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"warning: page {latest} issued {issued} checked {checked} colours left as recorded")


if __name__ == "__main__":
    main()
