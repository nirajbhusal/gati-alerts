#!/usr/bin/env python3
"""Remove CSS rules that cannot match anything, from assets/css/gati.css.

A selector is dropped only when it names a class or id that appears nowhere in the site's
own code (pages, scripts, build scripts, templates, vendor files). Names that are built at
run time ("s-" + severity) are kept: if the part before a hyphen is found in the code right
before a quote, a backtick or "${", every class starting with it stays.

  python3 scripts/prune_css.py           report only
  python3 scripts/prune_css.py --write   rewrite the file

Keyframes, font faces and anything without a class or id are never touched.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = ROOT / "assets/css/gati.css"


def corpus():
    parts = []
    globs = ["*.html", "*/index.html", "assets/js/*.js", "assets/vendor/**/*.js", "assets/vendor/**/*.css", "scripts/*.py", "scripts/*.html",
             "scripts/brand/*", "web/src/**/*", "worker/**/*.js", "sw.js", "embed/*.html", "lite/*.html"]
    seen = set()
    for g in globs:
        for p in ROOT.glob(g):
            if p.is_file() and p not in seen and "node_modules" not in p.parts and p != CSS:
                seen.add(p)
                try:
                    parts.append(p.read_text(encoding="utf-8", errors="ignore"))
                except OSError:
                    pass
    # one generated alert page stands for the rest
    for p in list((ROOT / "alerts").glob("*/index.html"))[:1]:
        parts.append(p.read_text(encoding="utf-8", errors="ignore"))
    return "\n".join(parts)


TEXT = corpus()
WORDS = set(re.findall(r"[A-Za-z0-9_-]+", TEXT))
DYN = set(m.group(1) for m in re.finditer(r"([A-Za-z][A-Za-z0-9_]*-)(?=[\"'`]|\$\{|\"\s*\+|'\s*\+)", TEXT))
DYN |= set(m.group(1) for m in re.finditer(r"[\"'`\s]([A-Za-z][A-Za-z0-9_]*-)\$\{", TEXT))
# names glued together without a hyphen ("pg" + n, `lv${x}`): keep every class that starts with such a piece
GLUE = set(m.group(1) for m in re.finditer(r"[\"'`\s.]([A-Za-z]{2,})\$\{", TEXT)) | set(m.group(1) for m in re.finditer(r"[\"'`]([A-Za-z]{2,})[\"'`]\s*\+", TEXT))


def alive(tok):
    if tok in WORDS:
        return True
    if "-" in tok:
        parts = tok.split("-")
        for k in range(1, len(parts)):
            if "-".join(parts[:k]) + "-" in DYN:
                return True
    return any(tok.startswith(g) and len(tok) > len(g) for g in GLUE)


TOKEN = re.compile(r"[.#](-?[A-Za-z_][A-Za-z0-9_-]*)")


def selector_alive(sel):
    s = re.sub(r"\[[^\]]*\]", "", sel)          # attribute selectors can hold dots and hashes
    s = re.sub(r"\"[^\"]*\"|'[^']*'", "", s)
    return all(alive(t) for t in TOKEN.findall(s))


def split_selectors(prelude):
    out, depth, cur = [], 0, ""
    for ch in prelude:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur); cur = ""
        else:
            cur += ch
    out.append(cur)
    return out


def scan(src):
    """Yield top-level pieces as (kind, prelude, body, raw). kind: 'rule', 'at', 'other'."""
    i, n, out, start = 0, len(src), [], 0
    while i < n:
        if src.startswith("/*", i):
            j = src.find("*/", i + 2); j = n if j < 0 else j + 2
            i = j; continue
        ch = src[i]
        if ch in "\"'":
            j = i + 1
            while j < n and src[j] != ch:
                j += 2 if src[j] == "\\" else 1
            i = j + 1; continue
        if ch == ";" :
            out.append(("other", "", "", src[start:i + 1])); i += 1; start = i; continue
        if ch == "{":
            depth, j = 1, i + 1
            while j < n and depth:
                if src.startswith("/*", j):
                    k = src.find("*/", j + 2); j = n if k < 0 else k + 2; continue
                if src[j] in "\"'":
                    q = src[j]; j += 1
                    while j < n and src[j] != q:
                        j += 2 if src[j] == "\\" else 1
                    j += 1; continue
                depth += src[j] == "{"; depth -= src[j] == "}"; j += 1
            prelude, body = src[start:i], src[i + 1:j - 1]
            kind = "at" if prelude.strip().lstrip("/* \n").startswith("@") or re.search(r"(^|\*/)\s*@", prelude) else "rule"
            out.append((kind, prelude, body, src[start:j])); i = j; start = i; continue
        i += 1
    if start < n:
        out.append(("other", "", "", src[start:]))
    return out


STATS = {"rules": 0, "selectors": 0, "names": set()}


def prune(src):
    res = []
    for kind, prelude, body, raw in scan(src):
        if kind == "other":
            res.append(raw); continue
        lead = re.match(r"(?:\s|/\*.*?\*/)*", prelude, re.S).group(0)   # comments and space before the selector stay
        head = prelude[len(lead):]
        if kind == "at":
            name = head.strip().split("(")[0].split()[0] if head.strip() else ""
            if name in ("@media", "@supports", "@layer", "@container"):
                inner = prune(body)
                if not re.sub(r"\s|/\*.*?\*/", "", inner, flags=re.S):
                    STATS["rules"] += 1; res.append(lead); continue
                res.append(prelude + "{" + inner + "}")
            else:
                res.append(raw)
            continue
        sels = split_selectors(head)
        keep = [s for s in sels if selector_alive(s)]
        if len(keep) == len(sels):
            res.append(raw); continue
        for s in sels:
            if s not in keep:
                STATS["selectors"] += 1
                STATS["names"].update(t for t in TOKEN.findall(re.sub(r"\[[^\]]*\]", "", s)) if not alive(t))
        if not keep:
            STATS["rules"] += 1; res.append(lead); continue
        res.append(lead + ",".join(keep) + "{" + body + "}")
    return "".join(res)


def main():
    src = CSS.read_text(encoding="utf-8")
    out = prune(src)
    out = re.sub(r"\n{3,}", "\n\n", out)
    print("before %d bytes, after %d bytes (%.1f%% smaller)" % (len(src.encode()), len(out.encode()), 100 * (1 - len(out.encode()) / len(src.encode()))))
    print("rules removed: %d, selectors removed: %d, unused names: %d" % (STATS["rules"], STATS["selectors"], len(STATS["names"])))
    if "--names" in sys.argv:
        print(" ".join(sorted(STATS["names"])))
    if "--write" in sys.argv:
        CSS.write_text(out, encoding="utf-8"); print("written")


if __name__ == "__main__":
    main()
