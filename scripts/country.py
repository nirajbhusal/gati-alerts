#!/usr/bin/env python3
"""Country facts for this deployment, read from data/country.json.

Other scripts import this instead of hard-coding the site address, the CAP identifier prefix or the geocode name.
It also writes the same facts into assets/js/common.js (between the country:begin / country:end markers) so that
every page has them at once, without an extra request and when offline.

  python scripts/country.py           # rewrite the block in common.js after editing data/country.json
  python scripts/country.py --check   # exit 1 if common.js is out of date (used in CI)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C = json.loads((ROOT / "data" / "country.json").read_text(encoding="utf-8"))
SITE = C["site"].rstrip("/") + "/"
REPO = C["repository"]
PREFIX = C["project"]["identifierPrefix"]            # "np.gati"
GEOCODE = C["adminLevels"]["district"]["geocode"]    # "NP-DISTRICT"
TZ_MINUTES = C["timezone"]["offsetMinutes"]
JS = ROOT / "assets" / "js" / "common.js"
BLOCK = re.compile(r"/\* country:begin.*?\*/.*?/\* country:end \*/", re.S)


def js_block():
    pub = {k: v for k, v in C.items() if not k.startswith("_")}
    return ("/* country:begin (written by scripts/country.py from data/country.json; edit that file, not this block) */\n"
            "  G.country = " + json.dumps(pub, ensure_ascii=False, separators=(",", ":")) + ";\n"
            "  /* country:end */")


def main(argv):
    src = JS.read_text(encoding="utf-8")
    if not BLOCK.search(src):
        print("country markers not found in assets/js/common.js"); return 2
    new = BLOCK.sub(lambda m: js_block(), src, count=1)
    if "--check" in argv:
        if new != src:
            print("assets/js/common.js is out of date. Run: python scripts/country.py"); return 1
        print("country block is up to date"); return 0
    if new != src:
        JS.write_text(new, encoding="utf-8"); print("updated assets/js/common.js")
    else:
        print("no change")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
