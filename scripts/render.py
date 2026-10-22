#!/usr/bin/env python3
"""Build-time renderer (run after scripts/build.py). Reads data/alerts.json and writes:
  alerts/<identifier>/index.html   static permalink with OG meta and share buttons
  alerts/<identifier>/share.png    1200x630 share image
Everything shown comes from the CAP message: headline, agency, source link, source time.
Nothing is invented. Usage: python scripts/render.py
"""
import json, pathlib, datetime as dt, html, urllib.parse, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://nirajbhusal.github.io/gati-alerts/"
FONT = ROOT / "scripts/fonts"
NPT = dt.timezone(dt.timedelta(hours=5, minutes=45))
DEV = str.maketrans("0123456789", "०१२३४५६७८९")
MON_NE = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"]
MON_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
SEV = {"Extreme": ("अत्यन्त गम्भीर", "Extreme", "⬢", "#7A0019"), "Severe": ("गम्भीर", "Severe", "▲", "#C81E1E"),
       "Moderate": ("मध्यम", "Moderate", "◆", "#E8770E"), "Minor": ("सामान्य", "Minor", "●", "#F5C518"),
       "Unknown": ("सूचना", "Info", "ℹ", "#2B6CB0")}
TRUST = {"Official": ("आधिकारिक", "Official", "🛡"), "Verified": ("प्रमाणित", "Verified", "✓"), "Reported": ("रिपोर्ट गरिएको", "Reported", "❝"),
         "Unverified": ("पुष्टि नभएको", "Unverified", "◌"), "Corrected": ("सच्याइएको", "Corrected", "✎"), "Retracted": ("फिर्ता लिइएको", "Retracted", "✕")}
MT = {"Alert": ("मूल सूचना", "Original"), "Update": ("अद्यावधिक", "Update"), "Cancel": ("रद्द", "Cancel")}
e = html.escape


def npt(iso, lang):
    d = dt.datetime.fromisoformat(iso).astimezone(NPT)
    if lang == "ne":
        return f"{MON_NE[d.month-1]} {d.day}, {d.year} · {d.hour}:{d.minute:02d}".translate(DEV) + " NPT"
    h = d.hour % 12 or 12
    return f"{d.day} {MON_EN[d.month-1]} {d.year} · {h}:{d.minute:02d} {'PM' if d.hour >= 12 else 'AM'} NPT"


def b(ne, en):
    return f'<span class="ne-only">{ne}</span><span class="en-only">{en}</span>'


def agency(i):
    return i["senderName"].split(" — ")[0].split(" · ")[0]


def src_time(a, i):
    return i["params"].get("gati:sourceTime") or a["sent"]


def is_active(a, now):
    return dt.datetime.fromisoformat(a["expires"]) > now and not a.get("supersededBy") and a["msgType"] != "Cancel"


# ---------- images ----------
def font(w, size):
    return ImageFont.truetype(str(FONT / f"Mukta-{w}.ttf"), size, layout_engine=ImageFont.Layout.RAQM)


def wrap(draw, text, f, width, max_lines):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= width:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while draw.textlength(lines[-1] + " …", font=f) > width and " " in lines[-1]:
            lines[-1] = lines[-1].rsplit(" ", 1)[0]
        lines[-1] += " …"
    return lines


def pill(draw, xy, text, f, fill, color="#fff", pad=14):
    x, y = xy
    w = draw.textlength(text, font=f)
    h = f.size + 14
    draw.rounded_rectangle([x, y, x + w + 2 * pad, y + h], radius=h // 2, fill=fill)
    draw.text((x + pad, y + 3), text, font=f, fill=color)
    return x + w + 2 * pad + 12


def share_png(a, out, now):
    W, H = 1200, 630
    ne, en = a["info"]["ne"], a["info"]["en"]
    s = SEV.get(a["severity"], SEV["Unknown"])
    im = Image.new("RGB", (W, H), "#0E2A47")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 22, H], fill=s[3])
    d.text((60, 36), "गति · Gati", font=font("Bold", 40), fill="#FFFFFF")
    d.text((60, 86), "सही सूचना, समयमै। · The right alert, right on time.", font=font("Regular", 24), fill="#7FD1D8")
    x = 60
    sevc = "#14202B" if a["severity"] == "Minor" else "#fff"
    x = pill(d, (x, 140), f"{s[0]} · {s[1]}", font("Bold", 26), s[3], sevc)
    t = TRUST.get(a["trust"])
    if t: x = pill(d, (x, 140), f"{t[0]} · {t[1]}", font("SemiBold", 26), "#0F7C86")
    if a.get("state") in TRUST:
        x = pill(d, (x, 140), f"{TRUST[a['state']][0]} · {TRUST[a['state']][1]}", font("SemiBold", 26), "#6b3fa0")
    if not is_active(a, now):
        pill(d, (x, 140), "म्याद सकियो · Expired" if dt.datetime.fromisoformat(a["expires"]) <= now else "पछि अद्यावधिक · Superseded",
             font("SemiBold", 26), "#4A5A6A")
    y = 205
    for ln in wrap(d, ne["headline"], font("Bold", 50), W - 120, 3):
        d.text((60, y), ln, font=font("Bold", 50), fill="#FFFFFF"); y += 66
    y += 6
    for ln in wrap(d, en["headline"], font("Regular", 30), W - 120, 2):
        d.text((60, y), ln, font=font("Regular", 30), fill="#D5DEE7"); y += 40
    d.line([60, H - 112, W - 60, H - 112], fill="#2C4A6B", width=2)
    d.text((60, H - 100), f"स्रोत: {agency(ne)} · {npt(src_time(a, ne), 'ne')}", font=font("SemiBold", 26), fill="#FFFFFF")
    d.text((60, H - 60), "गतिले आधिकारिक चेतावनी जारी गर्दैन; मूल स्रोत हेर्नुहोस्। Relayed by Gati, not an official warning.",
           font=font("Regular", 22), fill="#7FD1D8")
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, optimize=True)


# ---------- permalink pages ----------
def share_buttons(url, text):
    u, tx = urllib.parse.quote(url, safe=""), urllib.parse.quote(text, safe="")
    links = [("Viber", f"viber://forward?text={tx}%20{u}"), ("Facebook", f"https://www.facebook.com/sharer/sharer.php?u={u}"),
             ("X", f"https://x.com/intent/post?text={tx}&url={u}"), ("WhatsApp", f"https://wa.me/?text={tx}%20{u}"),
             ("Telegram", f"https://t.me/share/url?url={u}&text={tx}")]
    a = "".join(f'<a class="sbtn" href="{e(h)}" target="_blank" rel="noopener">{n}</a>' for n, h in links)
    return (f'<div class="share" aria-label="Share">{a}<button class="sbtn" type="button" data-copy="{e(url)}">'
            f'{b("लिङ्क कपी गर्नुहोस्", "Copy link")}</button></div>')


def permalink(a, by, now):
    ident = a["identifier"]
    url = f"{SITE}alerts/{ident}/"
    ne, en = a["info"]["ne"], a["info"]["en"]
    s = SEV.get(a["severity"], SEV["Unknown"])
    active = is_active(a, now)
    expired = dt.datetime.fromisoformat(a["expires"]) <= now

    def L(k, i):
        return i.get(k) or ""

    chips = f'<span class="sev sev-{a["severity"] if a["severity"] in SEV else "Unknown"}"><span aria-hidden="true">{s[2]}</span>{b(s[0], s[1])}</span>'
    if a["trust"] in TRUST:
        t = TRUST[a["trust"]]; chips += f'<span class="trust t-{a["trust"]}"><span aria-hidden="true">{t[2]}</span>{b(t[0], t[1])}</span>'
    if a.get("state") in TRUST:
        t = TRUST[a["state"]]; chips += f'<span class="trust t-{a["state"]}"><span aria-hidden="true">{t[2]}</span>{b(t[0], t[1])}</span>'
    chips += f'<span class="tag{" exp" if not active else ""}">{b("चालु", "Active") if active else (b("म्याद सकियो", "Expired") if expired else b("पछि अद्यावधिक भयो", "Superseded"))}</span>'
    chain = ""
    if a.get("chain"):
        steps = []
        for k, c in enumerate(a["chain"]):
            lab = b(f"{str(k+1).translate(DEV)}. {MT[c['msgType']][0]}", f"{k+1}. {MT[c['msgType']][1]}") + \
                  f' <span class="meta">{b(npt(c["sent"], "ne"), npt(c["sent"], "en"))}</span>'
            steps.append(f'<strong aria-current="true">{lab}</strong>' if c["id"] == ident else f'<a href="../{e(c["id"])}/">{lab}</a>')
        chain = f'<div class="vchain">🔗 {b("संस्करण", "Versions")}: {" → ".join(steps)}</div>'
        if a.get("supersededBy"):
            chain += f'<p class="meta"><a href="../{e(a["supersededBy"])}/">{b("यो सूचना पछि अद्यावधिक भएको छ। पछिल्लो संस्करण हेर्नुहोस्।", "This notice was later updated. See the latest version.")}</a></p>'
    corr = ""
    if ne["params"].get("gati:correction"):
        corr = f'<div class="correction">✎ {b(e(ne["params"]["gati:correction"]), e(en["params"]["gati:correction"]))}</div>'
    instr = ""
    if ne.get("instruction"):
        lab = b("के गर्ने", "What to do") if active else b("त्यति बेलाको निर्देशन", "Instruction at the time")
        instr = f'<div class="instr"><strong>{lab}:</strong> {b(e(ne["instruction"]), e(en.get("instruction") or ""))}</div>'
    areas_ne = " · ".join(x["ne"] for x in a["areas"]) or " · ".join(x["desc"] for x in ne["areas"])
    areas_en = " · ".join(x["en"] for x in a["areas"]) or " · ".join(x["desc"] for x in en["areas"])
    src2 = ne["params"].get("gati:sourceUrl2")
    summ = ne["params"].get("gati:summary160") or ne["headline"]
    desc = f'{summ} · स्रोत: {agency(ne)} · {npt(src_time(a, ne), "ne")}'
    page = f'''<!doctype html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(ne["headline"])} · गति Gati</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Gati">
<meta property="og:title" content="{e(ne["headline"])}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{url}share.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{e(en["headline"])}">
<meta property="og:locale" content="ne_NP"><meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(ne["headline"])}"><meta name="twitter:image" content="{url}share.png">
<meta name="theme-color" content="#0E2A47">
<link rel="icon" href="../../assets/img/gati-concept-A-ga-signal-icon.svg" type="image/svg+xml">
<link rel="alternate" type="application/cap+xml" href="../../cap/{e(ident)}.xml">
<link rel="stylesheet" href="../../assets/fonts/fonts.css"><link rel="stylesheet" href="../../assets/css/gati.css">
</head><body data-page="alert" data-root="../../"><main id="main" class="wrap" style="max-width:780px">
<p class="meta"><a href="../../">{b("← सबै सूचना", "← All alerts")}</a></p>
<article class="card alert s-{a["severity"]}{"" if active else " expired"}" id="{e(ident)}">
<div class="chips">{chips}<span class="tag">{b(e(ne["event"]), e(en["event"]))}</span></div>
<h1 style="font-size:1.45rem">{b(e(ne["headline"]), e(en["headline"]))}</h1>
<p class="meta">📍 {b(e(areas_ne), e(areas_en))}</p>
<p class="meta">🕒 {b("स्रोतको समय", "Source time")}: {b(npt(src_time(a, ne), "ne"), npt(src_time(a, en), "en"))} · {b("म्याद", "Expires")}: {b(npt(a["expires"], "ne"), npt(a["expires"], "en"))}</p>
{corr}{chain}{instr}
<p>{b(e(ne["description"]), e(en["description"]))}</p>
<p class="meta src">{b("स्रोत", "Source")}: <strong>{b(e(agency(ne)), e(agency(en)))}</strong> · <a href="{e(ne["web"])}" rel="noopener" target="_blank">{b("मूल सूचना", "Original notice")} ↗</a>{f' · <a href="{e(src2)}" rel="noopener" target="_blank">{b("दोस्रो स्रोत", "Second source")} ↗</a>' if src2 else ""}</p>
<p class="meta">{b("सम्पर्क", "Contact")}: {e(ne.get("contact") or "")} · <a href="../../cap/{e(ident)}.xml">CAP 1.2 XML</a></p>
</article>
<h2 style="font-size:1.1rem">{b("सेयर गर्नुहोस्", "Share")}</h2>
{share_buttons(url, summ)}
<p class="meta">{b("सेयर गर्दा मूल स्रोत पनि उल्लेख गर्नुहोस्। गतिले सूचना जारी गर्दैन, फैलाउने मात्र गर्छ।", "When sharing, mention the original source. Gati relays notices; it does not issue them.")}</p>
</main><script src="../../assets/js/common.js"></script><script src="../../assets/js/share.js"></script></body></html>
'''
    out = ROOT / "alerts" / ident
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(page, encoding="utf-8")


def main():
    now = dt.datetime.now(dt.timezone.utc)
    alerts = json.loads((ROOT / "data/alerts.json").read_text(encoding="utf-8"))["alerts"]
    by = {a["identifier"]: a for a in alerts}
    for a in alerts:
        permalink(a, by, now)
        share_png(a, ROOT / "alerts" / a["identifier"] / "share.png", now)
    idx = "".join(f'<li><a href="{e(a["identifier"])}/">{e(a["info"]["ne"]["headline"])}</a> <span class="meta">{npt(a["sent"], "ne")}</span></li>' for a in alerts)
    (ROOT / "alerts/index.html").write_text(f'''<!doctype html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>सबै सूचना · All alerts · गति Gati</title><link rel="stylesheet" href="../assets/fonts/fonts.css"><link rel="stylesheet" href="../assets/css/gati.css"></head>
<body data-page="alerts" data-root="../"><main id="main" class="wrap" style="max-width:780px"><h1>{b("सबै सूचनाको अभिलेख", "Archive of all alerts")}</h1>
<p class="lead">{b("म्याद सकिएका सूचना पनि मेटिँदैनन्, यहीँ रहन्छन्।", "Expired notices are never deleted; they stay here.")}</p><ul>{idx}</ul>
</main><script src="../assets/js/common.js"></script></body></html>''', encoding="utf-8")
    print(f"rendered {len(alerts)} permalinks and share images")


if __name__ == "__main__":
    main()
