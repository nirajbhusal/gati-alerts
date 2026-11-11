#!/usr/bin/env python3
"""Read DHM's 24-hour country forecast and the Kathmandu city forecast into data/weather.json.

Official APIs (no login):
  https://dhm.gov.np/mfd/api/country-forecast
  https://dhm.gov.np/mfd/api/weather   (station Kathmandu)

Writes text, issue time and source link under forecast24. Does not create a CAP alert.
A routine forecast is not a warning. If DHM cannot be read, the previous forecast24 is kept.
"""
import json, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "weather.json"
COUNTRY = "https://dhm.gov.np/mfd/api/country-forecast"
CITY = "https://dhm.gov.np/mfd/api/weather"
COUNTRY_PAGE = "https://dhm.gov.np/mfd/#/weather/country"
CITY_PAGE = "https://dhm.gov.np/mfd/#/weather/city"
NPT = datetime.timezone(datetime.timedelta(hours=5, minutes=45))
UA = {"User-Agent": "Mozilla/5.0 (compatible; Gati relay; +https://nirajbhusal.github.io/gati-alerts/)", "Accept": "application/json"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def npt(iso):
    """DHM sends UTC timestamps. Store Nepal time."""
    s = iso.replace("Z", "+00:00")
    t = datetime.datetime.fromisoformat(s)
    if t.tzinfo is None:
        t = t.replace(tzinfo=datetime.timezone.utc)
    return t.astimezone(NPT).isoformat(timespec="seconds")


def tidy(s):
    return " ".join((s or "").split())


def main():
    doc = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    try:
        country = get(COUNTRY)
        cities = get(CITY)
        stations = cities.get("stations") or []
        ktm = next((s for s in stations if (s.get("name") or "").strip().lower() == "kathmandu"), None)
        if not ktm:
            raise RuntimeError("Kathmandu station missing")
        days = ktm.get("manual_forecast") or []
        if len(days) < 2:
            raise RuntimeError("Kathmandu forecast incomplete")
        day, night = days[0], days[1]
        issued = country.get("issue_date") or cities.get("datetime")
        doc["forecast24"] = {
            "country": {
                "id": str(country.get("id") or ""),
                "issued": npt(issued),
                "url": COUNTRY_PAGE,
                "api": COUNTRY,
                "analysis_ne": tidy(country.get("analysis_np")),
                "analysis_en": tidy(country.get("analysis_en")),
                "day_ne": tidy(country.get("np_text_1")),
                "day_en": tidy(country.get("en_text_1")),
                "night_ne": tidy(country.get("np_text_2")),
                "night_en": tidy(country.get("en_text_2")),
            },
            "kathmandu": {
                "id": str(cities.get("id") or ""),
                "issued": npt(cities.get("datetime") or issued),
                "url": CITY_PAGE,
                "api": CITY,
                "name_ne": (ktm.get("nepali_name") or "काठमाडौँ").strip(),
                "name_en": "Kathmandu",
                "day_ne": tidy((day.get("weather") or {}).get("nepali_name")),
                "day_en": tidy((day.get("weather") or {}).get("name")),
                "night_ne": tidy((night.get("weather") or {}).get("nepali_name")),
                "night_en": tidy((night.get("weather") or {}).get("name")),
                "day_from_c": day.get("from_temperature"),
                "day_to_c": day.get("to_temperature"),
                "night_from_c": night.get("from_temperature"),
                "night_to_c": night.get("to_temperature"),
                "day_rain_pct": day.get("rain_probability"),
            },
        }
    except Exception as e:
        print("forecast: UNREACHABLE, kept last copy:", str(e)[:200])
        if "forecast24" not in doc:
            raise SystemExit(1)
        return
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    f = doc["forecast24"]
    print("forecast: country", f["country"]["id"], f["country"]["issued"], "kathmandu", f["kathmandu"]["id"])


if __name__ == "__main__":
    main()
