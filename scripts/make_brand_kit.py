#!/usr/bin/env python3
"""Build the whole brand kit in assets/brand/ from the vector logo.

  python3 scripts/make_brand_kit.py

Steps: draw the logo as SVG (scripts/brand/make_svg.py), render PNGs, social
images, the guidelines PDF and the visiting card (scripts/brand/render.cjs,
needs Node and Playwright), then pack the zip files.
Needs: pip install fonttools uharfbuzz segno
"""
import os, pathlib, shutil, subprocess, sys, tempfile, zipfile
import segno

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/brand"
SITE = "https://nirajbhusal.github.io/gati-alerts/"

README = """गति Gati brand kit
==================

logos/      the logo as vector (SVG) and as PNG (logos/png)
icons/      app icons and favicons
social/     profile pictures, covers, thumbnails and post backgrounds
print/      brand guidelines (PDF)

Rules in short: do not recolour, stretch or rotate the logo; do not combine it
with a government emblem; do not use the name or logo for a fork or another
service. Full guidelines: print/gati-brand-guidelines.pdf and
%sabout/#brand

The name and logo identify the Gati project and are not covered by the open
licences of its code (MIT) and content (CC BY 4.0).
""" % SITE


def pack(name, folders, skip=()):
    target = OUT / name
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr(zipfile.ZipInfo("README.txt", (2026, 11, 11, 0, 0, 0)), README)
        for folder in folders:
            for p in sorted((OUT / folder).rglob("*")):
                if p.is_file() and not any(s in p.name for s in skip):
                    info = zipfile.ZipInfo(str(p.relative_to(OUT)), (2026, 11, 11, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    z.writestr(info, p.read_bytes())  # fixed dates: same input, same zip
    print("%s  %.1f MB" % (name, target.stat().st_size / 1e6))


# the site's own icons, kept in step with the kit
SITE_COPIES = {
    "icons/app-icon-192.png": ["assets/img/icon-192.png", "assets/img/brand/mark-192.png"],
    "icons/app-icon-512.png": ["assets/img/icon-512.png", "assets/img/brand/mark-512.png"],
    "icons/app-icon-maskable-512.png": ["assets/img/icon-maskable-512.png"],
    "icons/app-icon-180.png": ["assets/img/brand/apple-touch-icon.png"],
    "icons/favicon-32.png": ["assets/img/brand/favicon-32.png"],
    "icons/favicon-64.png": ["assets/img/brand/favicon-64.png"],
    "social/covers/share-cover-1200x630.png": ["assets/img/brand/og-cover.png"],
}

GROUPS = [
    ("logos", "लोगो (SVG, भेक्टर)", "Logos (SVG, vector)"),
    ("logos/png", "लोगो (PNG)", "Logos (PNG)"),
    ("icons", "एप र वेब आइकन", "App and web icons"),
    ("social/profile", "प्रोफाइल तस्विर", "Profile pictures"),
    ("social/covers", "कभर र ब्यानर", "Covers and banners"),
    ("social/thumbnails", "थम्बनेल", "Thumbnails"),
    ("social/posts", "पोस्ट र स्टोरी", "Posts and stories"),
]


def size(p):
    n = p.stat().st_size
    return "%.1f MB" % (n / 1e6) if n > 9.5e5 else "%d KB" % max(1, round(n / 1e3))


def about_list():
    """Rewrite the file list on the About page between its two markers."""
    page = ROOT / "about/index.html"
    html = page.read_text(encoding="utf-8")
    a, b = "<!-- brandfiles:begin -->", "<!-- brandfiles:end -->"
    if a not in html:
        return
    rows = []
    for folder, ne, en in GROUPS:
        files = sorted(p for p in (OUT / folder).iterdir() if p.is_file())
        links = " · ".join('<a href="../assets/brand/%s/%s" download>%s</a>' % (folder, p.name, p.name) for p in files)
        rows.append('<p class="meta"><strong><span class="ne-only">%s</span><span class="en-only">%s</span> (%d):</strong> %s</p>'
                    % (ne, en, len(files), links))
    html = html[:html.index(a) + len(a)] + "\n" + "\n".join(rows) + "\n" + html[html.index(b):]
    for name in ("gati-brand-kit.zip", "gati-social-media-kit.zip", "print/gati-brand-guidelines.pdf",
                 "print/niraj-bhusal-visiting-card.pdf"):
        import re
        html = re.sub(r'(data-size="%s">)[^<]*' % re.escape(name), r"\g<1>" + size(OUT / name), html)
    page.write_text(html, encoding="utf-8")


def main():
    subprocess.run([sys.executable, str(ROOT / "scripts/brand/make_svg.py")], check=True)
    qr = pathlib.Path(tempfile.gettempdir()) / "gati-qr.svg"
    segno.make(SITE, error="m").save(str(qr), scale=4, border=0, dark="#0B1424", light=None, xmldecl=False, svgns=True, omitsize=True)
    subprocess.run(["node", str(ROOT / "scripts/brand/render.cjs")], check=True, cwd=str(ROOT / "tests"))
    qr.unlink()
    pack("gati-social-media-kit.zip", ["logos", "social"])
    pack("gati-brand-kit.zip", ["logos", "icons", "social", "print"], skip=("visiting-card",))
    for src, targets in SITE_COPIES.items():
        for t in targets:
            shutil.copyfile(OUT / src, ROOT / t)
    about_list()


if __name__ == "__main__":
    main()
