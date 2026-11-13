#!/usr/bin/env python3
"""Build Android launcher, splash, and notification artwork from the existing Gati marks.

No new artwork is drawn. Inputs are the brand PNGs already in this repo.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MARK = ROOT / "assets/img/brand/mark-512.png"
MASKABLE = ROOT / "assets/img/icon-maskable-512.png"
RES = ROOT / "android/app/src/main/res"
PLAY = ROOT / "android/play"

# Sampled from assets/img/icon-maskable-512.png (full-bleed brand red).
RED = (226, 54, 43, 255)

LEGACY = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
FOREGROUND = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
SPLASH = {
    "drawable-mdpi": 120,
    "drawable-hdpi": 180,
    "drawable-xhdpi": 240,
    "drawable-xxhdpi": 360,
    "drawable-xxxhdpi": 480,
}


def cover(src: Image.Image, size: int) -> Image.Image:
    im = src.convert("RGBA")
    scale = max(size / im.width, size / im.height)
    resized = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    return resized.crop((left, top, left + size, top + size))


def foreground(src: Image.Image, size: int) -> Image.Image:
    """Keep the maskable glyph inside the adaptive-icon safe zone, on brand red."""
    canvas = Image.new("RGBA", (size, size), RED)
    inner = int(round(size * 0.82))
    glyph = cover(src, inner)
    offset = (size - inner) // 2
    canvas.paste(glyph, (offset, offset), glyph)
    return canvas


def monochrome(src: Image.Image, size: int) -> Image.Image:
    """White glyph on transparent, from pixels that are not the red field."""
    im = cover(src, size)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = im.load()
    dest = out.load()
    br, bg, bb, _ = RED
    for y in range(size):
        for x in range(size):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            dist = abs(r - br) + abs(g - bg) + abs(b - bb)
            if dist < 70:
                continue
            alpha = 255 if dist > 180 else min(255, int(dist * 2))
            dest[x, y] = (255, 255, 255, alpha)
    return out


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG")


def main() -> None:
    mark = Image.open(MARK)
    mask = Image.open(MASKABLE)
    for folder, size in LEGACY.items():
        icon = cover(mark, size)
        # Legacy launchers need an opaque squircle. Flatten transparent corners onto brand red.
        flat = Image.new("RGBA", (size, size), RED)
        flat.paste(icon, (0, 0), icon)
        save(flat, RES / folder / "ic_launcher.png")
        save(flat, RES / folder / "ic_launcher_round.png")
    for folder, size in FOREGROUND.items():
        save(foreground(mask, size), RES / folder / "ic_launcher_foreground.png")
    for folder, size in SPLASH.items():
        save(cover(mark, size), RES / folder / "splash.png")
    save(monochrome(mask, 432), RES / "drawable-xxxhdpi" / "ic_launcher_monochrome.png")
    PLAY.mkdir(parents=True, exist_ok=True)
    save(cover(mask, 512), PLAY / "icon-512.png")
    print("icons written")


if __name__ == "__main__":
    main()
