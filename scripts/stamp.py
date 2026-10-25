#!/usr/bin/env python3
"""Write a build stamp into sw.js so every deploy gets a fresh cache name (GitHub Pages has no build step here).
Run by scripts/hooks/pre-commit and at the end of render.py. Stamp is Nepal time, YYYYMMDDTHHMM."""
import re, pathlib, datetime
SW = pathlib.Path(__file__).resolve().parent.parent / "sw.js"
def stamp():
    t = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=45))).strftime("%Y%m%dT%H%M")
    s = SW.read_text(encoding="utf-8")
    n = re.sub(r'const BUILD = "[^"]*";', f'const BUILD = "{t}";', s, count=1)
    if n != s: SW.write_text(n, encoding="utf-8")
    return t
if __name__ == "__main__":
    print(stamp())
