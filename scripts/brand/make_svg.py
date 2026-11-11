#!/usr/bin/env python3
"""Draw the Gati logo as standalone vector files (no font needed to open them).

Writes assets/brand/logos/*.svg. The letters are taken from Mukta Bold and
turned into outlines, so the files look the same everywhere.
Needs: pip install fonttools uharfbuzz
"""
import math, pathlib
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/brand/logos"
MUKTA = ROOT / "scripts/fonts/Mukta-Bold.ttf"
INTER = pathlib.Path("/usr/share/fonts/opentype/inter/Inter-SemiBold.otf")

RED, NAVY, WHITE, SLATE = "#E2362B", "#0B1424", "#FFFFFF", "#4A5A6A"


def outline(font_path, text, x, y, size, spacing=0.0, anchor="left"):
    """Text as one SVG path. (x, y) is the left end of the baseline."""
    blob = hb.Blob.from_file_path(str(font_path))
    face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf)
    tt = TTFont(str(font_path)); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    s = size / face.upem
    pen = SVGPathPen(gs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    bp = BoundsPen(gs)
    cx = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        t = (s, 0, 0, -s, x + (cx + pos.x_offset) * s, y - pos.y_offset * s)
        g = gs[order[info.codepoint]]
        g.draw(TransformPen(pen, t)); g.draw(TransformPen(bp, t))
        cx += pos.x_advance + spacing * face.upem
    d, b = pen.getCommands(), bp.bounds
    return d, b  # b = (xmin, ymin, xmax, ymax)


def fit(font_path, text, box, spacing=0.0):
    """Outline `text` scaled and moved to fill box = (x, y, w, h) by its ink."""
    _, b = outline(font_path, text, 0, 0, 1000, spacing)
    w, h = b[2] - b[0], b[3] - b[1]
    k = min(box[2] / w, box[3] / h)
    size = 1000 * k
    d, _ = outline(font_path, text, box[0] - b[0] * k, box[1] - b[1] * k, size, spacing)
    return d, (box[0], box[1], w * k, h * k)


def arc(cx, cy, r, half_deg):
    a = math.radians(half_deg)
    x, dy = cx + r * math.cos(a), r * math.sin(a)
    return "M%.1f %.1f A%d %d 0 0 1 %.1f %.1f" % (x, cy - dy, r, r, x, cy + dy)


def mark_inner(fg=WHITE):
    """The letter and the three signal arcs, on a 512 box."""
    ga, _ = fit(MUKTA, "ग", (97, 159, 201, 227))
    arcs = "".join(
        '<path d="%s" fill="none" stroke="%s" stroke-width="24" stroke-linecap="round" opacity="%s"/>'
        % (arc(300, 255, r, h), fg, o)
        for r, h, o in ((66, 40, "1"), (124, 43, ".65"), (183, 44, ".35")))
    return '<path d="%s" fill="%s"/>%s' % (ga, fg, arcs)


def svg(w, h, body, title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img">'
            '<title>%s</title>%s</svg>\n' % (w, h, w, h, title, body))


def tile(fill=RED, fg=WHITE, radius=112):
    return '<rect width="512" height="512" rx="%d" fill="%s"/>%s' % (radius, fill, mark_inner(fg))


def horizontal(ink, rule, sub):
    word, wb = fit(MUKTA, "गति", (640, 96, 400, 232))
    lat, _ = fit(INTER, "GATI", (646, 396, 400, 44), spacing=0.42)
    return ('<g>%s</g><rect x="574" y="56" width="3" height="400" fill="%s"/>'
            '<path d="%s" fill="%s"/><path d="%s" fill="%s"/>'
            % (tile(), rule, word, ink, lat, sub)), int(wb[0] + wb[2] + 40)


def stacked(ink, sub):
    word, wb = fit(MUKTA, "गति", (0, 566, 512, 150))
    dx = (512 - wb[2]) / 2
    lat, lb = fit(INTER, "GATI", (0, 760, 512, 30), spacing=0.42)
    lx = (512 - lb[2]) / 2
    return ('%s<path transform="translate(%.1f 0)" d="%s" fill="%s"/>'
            '<path transform="translate(%.1f 0)" d="%s" fill="%s"/>' % (tile(), dx, word, ink, lx, lat, sub))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "gati-mark.svg": svg(512, 512, tile(), "गति Gati"),
        "gati-mark-square.svg": svg(512, 512, tile(radius=0), "गति Gati"),
        "gati-mark-navy.svg": svg(512, 512, tile(fill=NAVY), "गति Gati"),
        "gati-glyph-white.svg": svg(512, 512, mark_inner(WHITE), "गति Gati"),
        "gati-glyph-navy.svg": svg(512, 512, mark_inner(NAVY), "गति Gati"),
        "gati-glyph-red.svg": svg(512, 512, mark_inner(RED), "गति Gati"),
    }
    for name, ink, rule, sub in (("gati-logo-horizontal.svg", NAVY, "#D5DEE7", SLATE),
                                 ("gati-logo-horizontal-white.svg", WHITE, "#33415A", "#C9D3DF")):
        body, w = horizontal(ink, rule, sub)
        files[name] = svg(w, 512, body, "गति Gati")
    files["gati-logo-stacked.svg"] = svg(512, 800, stacked(NAVY, SLATE), "गति Gati")
    files["gati-logo-stacked-white.svg"] = svg(512, 800, stacked(WHITE, "#C9D3DF"), "गति Gati")
    word, wb = fit(MUKTA, "गति", (0, 0, 400, 232))
    files["gati-wordmark.svg"] = svg(int(wb[2]) + 1, 232, '<path d="%s" fill="%s"/>' % (word, NAVY), "गति")
    files["gati-wordmark-white.svg"] = svg(int(wb[2]) + 1, 232, '<path d="%s" fill="%s"/>' % (word, WHITE), "गति")
    for name, text in files.items():
        (OUT / name).write_text(text, encoding="utf-8")
    print("wrote %d logo files to %s" % (len(files), OUT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
