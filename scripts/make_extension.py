#!/usr/bin/env python3
"""Zip the Chrome extension in extension/ for download and for the Chrome Web Store.

  python3 scripts/make_extension.py

Writes assets/downloads/gati-chrome-extension.zip. The zip is byte-for-byte repeatable
(fixed timestamps, sorted names) so a rebuild with no change does not dirty the repository.
"""
import json, pathlib, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "extension", ROOT / "assets/downloads/gati-chrome-extension.zip"
KEEP = {".json", ".js", ".html", ".css", ".png"}

def main():
    ver = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))["version"]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(SRC.rglob("*")):
            if p.is_file() and p.suffix in KEEP:
                info = zipfile.ZipInfo(str(p.relative_to(SRC)).replace("\\", "/"), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o644 << 16
                z.writestr(info, p.read_bytes())
    print(f"extension {ver}: {OUT.relative_to(ROOT)} {OUT.stat().st_size // 1024} KB")

if __name__ == "__main__":
    main()
