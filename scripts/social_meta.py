"""Ensure every static page has og:title, og:description, og:image (og-cover 1200x630) and a summary_large_image twitter card.
Run after render.py. Alert permalinks get their own generated share.png from render.py and are skipped here."""
import html, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://nirajbhusal.github.io/gati-alerts/"
OG = SITE + "assets/img/brand/og-cover.png"
DEF_DESC = "सही सूचना, सही समयमा । The right alert, right on time. Gati relays official disaster alerts for Nepal with source and time."

def meta(s, prop, attr="property"):
    m = re.search(rf'<meta {attr}="{re.escape(prop)}" content="([^"]*)"', s)
    return m.group(1) if m else None

def patch(p):
    s = p.read_text(encoding="utf-8")
    if "</head>" not in s: return False
    rel = p.relative_to(ROOT).as_posix()
    if rel.startswith("alerts/np."): return False
    url = SITE + (rel[:-len("index.html")] if rel.endswith("index.html") else rel)
    t = re.search(r"<title>(.*?)</title>", s, re.S); title = html.unescape(t.group(1).strip()) if t else "Gati"
    desc = meta(s, "description", "name") or meta(s, "og:description") or DEF_DESC
    add = []
    need = {("property", "og:title"): title, ("property", "og:description"): html.unescape(desc), ("property", "og:type"): "website", ("property", "og:url"): url,
            ("property", "og:site_name"): "Gati", ("property", "og:image"): OG, ("property", "og:image:width"): "1200", ("property", "og:image:height"): "630",
            ("property", "og:image:alt"): "गति Gati: सही सूचना, सही समयमा । The right alert, right on time.",
            ("name", "twitter:card"): "summary_large_image", ("name", "twitter:title"): title, ("name", "twitter:description"): html.unescape(desc), ("name", "twitter:image"): OG}
    for (a, k), v in need.items():
        cur = meta(s, k, a)
        if cur is None: add.append(f'<meta {a}="{k}" content="{html.escape(v, quote=True)}">')
        elif k == "twitter:card" and cur != "summary_large_image": s = s.replace(f'<meta name="twitter:card" content="{cur}">', '<meta name="twitter:card" content="summary_large_image">')
        elif k in ("og:image", "twitter:image") and "icon" in cur: s = s.replace(f'content="{cur}"', f'content="{OG}"')
    if add: s = s.replace("</head>", "\n".join(add) + "\n</head>", 1)
    p.write_text(s, encoding="utf-8"); return bool(add)

if __name__ == "__main__":
    files = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "scripts" not in p.parts and "vendor" not in p.parts]
    n = sum(patch(p) for p in files); print(f"social meta: patched {n} of {len(files)} pages")
