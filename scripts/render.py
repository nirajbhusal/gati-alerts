#!/usr/bin/env python3
"""Build-time renderer (run after scripts/build.py). Reads data/alerts.json and writes:
  alerts/<identifier>/index.html   static permalink with OG meta and share buttons
  alerts/<identifier>/share.png    1200x630 share image
  lite/index.html                  text-only page, no JS, no fonts, under 30 KB
  stories/img/<identifier>.png     1080x1920 story card with QR to the permalink
  stories/qr/<identifier>.svg      QR code to the permalink, used by /stories/
  patro/gati.ics                   iCalendar of the cited holidays in data/calendar.json
Everything shown comes from the CAP message: headline, agency, source link, source time.
Nothing is invented. Usage: python scripts/render.py
"""
import json, pathlib, datetime as dt, html, urllib.parse, textwrap
from PIL import Image, ImageDraw, ImageFont
import io, segno

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


def story_png(a, out, now):
    """1080x1920 (9:16) story card: severity colour, trust label, source and time, QR to the permalink."""
    W, H = 1080, 1920
    ne, en = a["info"]["ne"], a["info"]["en"]
    s = SEV.get(a["severity"], SEV["Unknown"])
    url = f"{SITE}alerts/{a['identifier']}/"
    im = Image.new("RGB", (W, H), "#0E2A47")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 300], fill=s[3])
    fg = "#14202B" if a["severity"] == "Minor" else "#FFFFFF"
    d.text((70, 60), "गति · Gati", font=font("Bold", 64), fill=fg)
    d.text((70, 150), f"{s[0]} · {s[1]}", font=font("Bold", 60), fill=fg)
    y = 350
    t = TRUST.get(a["trust"])
    x = 70
    if t: x = pill(d, (x, y), f"{t[0]} · {t[1]}", font("SemiBold", 40), "#0F7C86", pad=22)
    if a.get("state") in TRUST:
        pill(d, (x, y), f"{TRUST[a['state']][0]} · {TRUST[a['state']][1]}", font("SemiBold", 40), "#6b3fa0", pad=22)
    if not is_active(a, now):
        pill(d, (70, y + 80), "म्याद सकियो वा अद्यावधिक · Expired or superseded", font("SemiBold", 36), "#4A5A6A", pad=22)
    y = 520
    for ln in wrap(d, ne["headline"], font("Bold", 78), W - 140, 6):
        d.text((70, y), ln, font=font("Bold", 78), fill="#FFFFFF"); y += 104
    y += 24
    for ln in wrap(d, en["headline"], font("Regular", 46), W - 140, 4):
        d.text((70, y), ln, font=font("Regular", 46), fill="#D5DEE7"); y += 62
    y += 30
    areas = " · ".join(x["ne"] for x in a["areas"]) or " · ".join(x["desc"] for x in ne["areas"])
    for ln in wrap(d, "स्थान: " + areas, font("Regular", 40), W - 140, 2):
        d.text((70, y), ln, font=font("Regular", 40), fill="#7FD1D8"); y += 56
    # footer: source, time, QR
    qr = segno.make(url, error="m")
    buf = io.BytesIO(); qr.save(buf, kind="png", scale=10, border=2, dark="#0E2A47", light="#FFFFFF")
    q = Image.open(buf).convert("RGB").resize((340, 340), Image.NEAREST)
    im.paste(q, (W - 70 - 340, H - 560))
    fy = H - 560
    d.text((70, fy), "स्रोत / Source", font=font("Regular", 34), fill="#7FD1D8")
    for ln in wrap(d, agency(ne), font("Bold", 44), 560, 2):
        fy += 56; d.text((70, fy), ln, font=font("Bold", 44), fill="#FFFFFF")
    fy += 80; d.text((70, fy), "स्रोतको समय / Source time", font=font("Regular", 34), fill="#7FD1D8")
    fy += 50; d.text((70, fy), npt(src_time(a, ne), "ne"), font=font("SemiBold", 38), fill="#FFFFFF")
    fy += 50; d.text((70, fy), npt(src_time(a, en), "en"), font=font("Regular", 34), fill="#D5DEE7")
    d.text((W - 70 - 340, H - 210), "पूरा सूचना / Full notice", font=font("Regular", 30), fill="#7FD1D8")
    d.line([70, H - 150, W - 70, H - 150], fill="#2C4A6B", width=3)
    d.text((70, H - 130), "गतिले आधिकारिक चेतावनी जारी गर्दैन; मूल स्रोत हेर्नुहोस्।", font=font("Regular", 34), fill="#FFFFFF")
    d.text((70, H - 80), "Relayed by Gati, not an official warning. Emergency: 100 · 1234", font=font("Regular", 30), fill="#7FD1D8")
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, optimize=True)
    qdir = ROOT / "stories/qr"; qdir.mkdir(parents=True, exist_ok=True)
    qr.save(str(qdir / (a["identifier"] + ".svg")), scale=4, border=2, dark="#0E2A47", light="#FFFFFF", xmldecl=False)


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
</main><script src="../../assets/js/bs.js"></script><script src="../../assets/js/common.js"></script><script src="../../assets/js/share.js"></script></body></html>
'''
    out = ROOT / "alerts" / ident
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(page, encoding="utf-8")


DISC_NE = ("<strong>गति आफैँ कुनै आधिकारिक चेतावनी जारी गर्दैन।</strong> यसले जिम्मेवार सरकारी निकायकै सूचना, स्रोतसहित, फैलाउने र जाँच्ने काम मात्र गर्छ "
           "(विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन ऐन, २०७४)। आपत्कालमा १००, १०१, १०२ वा १२३४ मा फोन गर्नुहोस्।")
DISC_EN = ("<strong>Gati does not issue official warnings.</strong> It only relays and verifies notices from the mandated government agencies, always with the source "
           "(Disaster Risk Reduction and Management Act 2074). In an emergency call 100, 101, 102 or 1234.")
RW = {"open": ("खुला", "Open"), "oneway": ("एकतर्फी", "One-way"), "night": ("राति बन्द", "Closed at night"), "closed": ("बन्द", "Blocked"), "none": ("स्थिति पुष्टि भएन", "Not confirmed")}


def lite(alerts, now):
    roads = json.loads((ROOT / "data/roads.json").read_text(encoding="utf-8"))
    rivers = json.loads((ROOT / "data/rivers.json").read_text(encoding="utf-8"))
    act = [a for a in alerts if is_active(a, now)]
    def item(a, lang):
        i = a["info"][lang]
        s = SEV.get(a["severity"], SEV["Unknown"]); t = TRUST.get(a["trust"], ("", "", ""))
        lab = f"{s[0] if lang == 'ne' else s[1]} · {t[0] if lang == 'ne' else t[1]}"
        return (f'<li><b>[{e(lab)}]</b> {e(i["headline"])}<br><small>{"स्रोत" if lang == "ne" else "Source"}: '
                f'<a href="{e(i["web"])}">{e(agency(i))}</a>, {npt(src_time(a, i), lang)} · '
                f'<a href="../alerts/{e(a["identifier"])}/">{"पूरा" if lang == "ne" else "More"}</a></small></li>')
    def sec(lang):
        ne = lang == "ne"
        out = [f'<h2>{"चालु सूचना" if ne else "Active alerts"} ({str(len(act)).translate(DEV) if ne else len(act)})</h2>']
        out.append("<ul>" + "".join(item(a, lang) for a in act) + "</ul>" if act else
                   f'<p>{"अहिले गतिमा कुनै चालु सूचना छैन। यसको अर्थ खतरा छैन भन्ने होइन।" if ne else "No active item in Gati now. That does not mean there is no risk."}</p>')
        out.append(f'<h2>{"मुख्य सडक" if ne else "Main roads"}</h2><p><small>{e(roads["as_of_ne"] if ne else roads["as_of_en"])}</small></p><ul>')
        out += [f'<li>{e(r["name_ne"] if ne else r["name_en"])}: <b>{RW.get(r["status"], (r["status"], r["status"]))[0 if ne else 1]}</b></li>' for r in roads["routes"]]
        out.append("</ul>")
        out.append(f'<h2>{"नदी" if ne else "Rivers"}</h2><p><small>{e(rivers["as_of_ne"] if ne else rivers["as_of_en"])} · <a href="{e(rivers["url"])}">DHM</a></small></p><ul>')
        for g in rivers["gauges"]:
            lv = f'{g["level"]:.1f}'; wn = f'{g["warning"]:.1f}'
            out.append(f'<li>{e(g["ne"] if ne else g["en"])}: {lv.translate(DEV) if ne else lv} {"मि." if ne else "m"} '
                       f'({"चेतावनी" if ne else "warning"} {wn.translate(DEV) if ne else wn})</li>')
        out.append("</ul>")
        return "".join(out)
    page = f'''<!doctype html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>गति Lite: पाठ मात्र</title><link rel="icon" href="data:,"><meta name="description" content="Gati text-only page for slow connections.">
<style>body{{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:10px;color:#14202B}}a{{color:#0F7C86}}h1{{font-size:1.3em;color:#0E2A47}}h2{{font-size:1.1em;color:#0E2A47;margin:1.2em 0 .3em}}ul{{padding-left:1.1em}}li{{margin:.3em 0}}.d{{background:#e8f3f4;padding:8px;font-size:.9em}}hr{{border:0;border-top:1px solid #ccd}}</style>
</head><body>
<h1>गति Lite · सही सूचना, समयमै।</h1>
<p class="d">{DISC_NE}</p>
<p><small>बनाइएको: {npt(now.isoformat(), "ne")} · <a href="#en">English</a> · <a href="../">पूरा साइट</a></small></p>
{sec("ne")}
<hr><h1 id="en">Gati Lite · The right alert, right on time.</h1>
<p class="d">{DISC_EN}</p>
<p><small>Built: {npt(now.isoformat(), "en")} · <a href="../">Full site</a> · <a href="../atom.xml">Atom feed</a></small></p>
{sec("en")}
<hr><p><small>प्रहरी १०० · दमकल १०१ · एम्बुलेन्स १०२ · विपद् १२३४ · <a href="../alerts/">सबै सूचना / Archive</a> · <a href="../sources/">स्रोत / Sources</a></small></p>
</body></html>'''
    (ROOT / "lite").mkdir(exist_ok=True)
    (ROOT / "lite/index.html").write_text(page, encoding="utf-8")
    size = len(page.encode("utf-8"))
    assert size < 30_000, f"lite page is {size} bytes, over 30 KB"
    print(f"lite/index.html {size} bytes")


def ics(now):
    cal = json.loads((ROOT / "data/calendar.json").read_text(encoding="utf-8"))
    def esc_ics(x):
        return x.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")
    def fold(line):
        out, cur = [], b""
        for ch in line:
            c = ch.encode("utf-8")
            if len(cur) + len(c) > 73: out.append(cur.decode("utf-8")); cur = b""
            cur += c
        out.append(cur.decode("utf-8"))
        return "\r\n ".join(out)
    stamp = now.strftime("%Y%m%dT%H%M%SZ")
    L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gati//Patro//NE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
         "X-WR-CALNAME:गति पात्रो · Gati Patro", "X-WR-TIMEZONE:Asia/Kathmandu",
         "X-WR-CALDESC:" + esc_ics(cal.get("note_en", ""))]
    for x in cal["entries"]:
        d0 = dt.date.fromisoformat(x["date_ad"])
        L += ["BEGIN:VEVENT", f"UID:{x['date_ad']}-{x['type']}-{x["title_en"].lower().replace(" ", "-").replace("(", "").replace(")", "")}@gati",
              f"DTSTAMP:{stamp}", f"DTSTART;VALUE=DATE:{d0:%Y%m%d}", f"DTEND;VALUE=DATE:{d0 + dt.timedelta(1):%Y%m%d}",
              "SUMMARY:" + esc_ics(f"{x['title_ne']} · {x['title_en']}"),
              "DESCRIPTION:" + esc_ics(f"वि.सं. {x['date_bs']} · {x['type']} · {x.get('trust', '')} · Source: {x['source']} {x['sourceUrl']}"),
              "URL:" + x["sourceUrl"], "TRANSP:TRANSPARENT", "END:VEVENT"]
    L.append("END:VCALENDAR")
    (ROOT / "patro").mkdir(exist_ok=True)
    (ROOT / "patro/gati.ics").write_bytes(("\r\n".join(fold(l) for l in L) + "\r\n").encode("utf-8"))
    print(f"patro/gati.ics {len(cal['entries'])} events")


def main():
    now = dt.datetime.now(dt.timezone.utc)
    alerts = json.loads((ROOT / "data/alerts.json").read_text(encoding="utf-8"))["alerts"]
    by = {a["identifier"]: a for a in alerts}
    for a in alerts:
        permalink(a, by, now)
        share_png(a, ROOT / "alerts" / a["identifier"] / "share.png", now)
        story_png(a, ROOT / "stories/img" / (a["identifier"] + ".png"), now)
    idx = "".join(f'<li><a href="{e(a["identifier"])}/">{e(a["info"]["ne"]["headline"])}</a> <span class="meta">{npt(a["sent"], "ne")}</span></li>' for a in alerts)
    body = (ROOT / "scripts/alerts_list.html").read_text(encoding="utf-8")
    (ROOT / "alerts/index.html").write_text(f'''<!doctype html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>सबै सूचना · All alerts · गति Gati</title><meta name="description" content="Gati: every relayed alert with filters, charts and the full archive. Expired notices are never deleted.">
<meta property="og:title" content="सबै सूचना · All alerts · गति Gati"><meta property="og:url" content="{SITE}alerts/"><meta name="theme-color" content="#0E2A47">
<link rel="icon" href="../assets/img/gati-concept-A-ga-signal-icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/fonts/fonts.css"><link rel="stylesheet" href="../assets/css/gati.css"></head>
<body data-page="alerts" data-root="../"><main id="main" class="wrap dash"><h1>{b("सबै सूचना", "All alerts")}</h1>
<p class="lead">{b("चालु र पुराना सबै सूचना, फिल्टरसहित। म्याद सकिएका सूचना पनि मेटिँदैनन्।", "Every active and past alert, with filters. Expired notices are never deleted.")}</p>
{body}
<section aria-labelledby="harch"><h2 id="harch">{b("पूरा अभिलेख", "Full archive")}</h2><div class="card"><ul class="archive">{idx}</ul></div></section>
</main><script src="../assets/js/bs.js"></script><script src="../assets/js/common.js"></script><script src="../assets/js/home.js"></script></body></html>''', encoding="utf-8")
    print(f"rendered {len(alerts)} permalinks and share images")
    lite(alerts, now)
    ics(now)


if __name__ == "__main__":
    main()
