#!/usr/bin/env python3
"""Gati source poller (run by .github/workflows/poll.yml).

For each due source in data/sources.json:
  fetch once -> on success, compare a normalised content hash with the latest snapshot in
  data/raw/<id>/; write data/raw/<id>/<UTC ISO>.json only when the content changed.
Health (data/source-health.json) is rewritten only when a source's status changes, a new
snapshot was saved, or the last health write is 6 h old or more. This keeps time-only
updates from creating a commit on every run. Fetch failures are recorded and never raise.

Usage: python scripts/poll.py [--all] [--group dhm|other] [--timeout 30]
  Without --all, a source is due when the current UTC slot matches its pollMinutes
  (30 -> every run; 120 -> runs starting in the first half-hour of even UTC hours).
Retention: data/raw is an archive. Never delete snapshots; move old years to an archive
branch or release asset if the repo grows too large.
"""
import json, sys, re, hashlib, pathlib, datetime as dt, urllib.request, ssl, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
HP = ROOT / "data" / "source-health.json"
MAXBODY = 3_000_000
args = sys.argv[1:]
ALL = "--all" in args
GROUP = args[args.index("--group") + 1] if "--group" in args else None
TIMEOUT = int(args[args.index("--timeout") + 1]) if "--timeout" in args else 30
UA = "Mozilla/5.0 (compatible; GatiPoller/1.0; +https://nirajbhusal.github.io/gati-alerts/sources/)"


def now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0)


def iso(t):
    return t.isoformat().replace("+00:00", "Z")


def parse(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


def status(src, h, t):
    """Same rule as G.srcStatus in assets/js/common.js."""
    if src.get("status") == "planned" or not src.get("url"):
        return "planned"
    ls = parse(h.get("lastSuccess"))
    if not ls:
        return "down"
    if (t - ls).total_seconds() / 60 > 3 * src["pollMinutes"]:
        return "stale"
    lc = parse(h.get("lastChecked"))
    return "stale" if lc and lc > ls else "ok"


def normalise(body, ctype):
    """Strip volatile parts so a hash only changes when the content does."""
    if "json" in ctype or body.lstrip()[:1] in "{[":
        try:
            d = json.loads(body)
            if isinstance(d, dict):
                d.get("metadata", {}).pop("generated", None)  # USGS feed generation time
            return json.dumps(d, sort_keys=True, ensure_ascii=False)
        except Exception:
            pass
    s = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", body)
    s = re.sub(r"(?s)<!--.*?-->", " ", s)
    s = re.sub(r"(?i)\b(csrf[-_]?token|nonce|_token)\b[^>]*", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def latest(sid):
    d = RAW / sid
    files = sorted(d.glob("*.json")) if d.exists() else []
    return json.loads(files[-1].read_text(encoding="utf-8")) if files else None


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        r = urllib.request.urlopen(req, timeout=TIMEOUT)
    except ssl.SSLError:
        raise
    with r:
        raw = r.read(MAXBODY + 1)
        cs = r.headers.get_content_charset() or "utf-8"
        return r.status, r.headers.get("Content-Type", ""), raw[:MAXBODY].decode(cs, "replace"), len(raw) > MAXBODY


def due(src, t):
    if ALL:
        return True
    m = src["pollMinutes"]
    slot = t.hour * 60 + t.minute
    return (slot % m) < 30


def main():
    t0 = now()
    sources = json.loads((ROOT / "data/sources.json").read_text(encoding="utf-8"))
    health = json.loads(HP.read_text(encoding="utf-8")) if HP.exists() else {}
    H = health.setdefault("sources", {})
    before = {s["id"]: status(s, H.get(s["id"], {}), t0) for s in sources}
    new_snaps, report = 0, []
    for s in sources:
        sid = s["id"]
        if s.get("status") == "planned" or not s.get("url"):
            continue
        if GROUP == "dhm" and not sid.startswith("dhm"):
            continue
        if GROUP == "other" and sid.startswith("dhm"):
            continue
        if not due(s, t0):
            continue
        h = H.setdefault(sid, {"lastSuccess": None, "lastChecked": None, "lastResult": None})
        t = now()
        h["lastChecked"] = iso(t)
        try:
            code, ctype, body, trunc = fetch(s["url"])
            ok = 200 <= code < 400
            h["lastResult"] = f"HTTP {code}"
        except Exception as e:  # timeouts, DNS, TLS, HTTP errors: record, never fail
            ok, code = False, getattr(e, "code", None)
            reason = getattr(e, "reason", None) or e
            h["lastResult"] = f"{type(e).__name__}: {reason}"[:200]
        if ok:
            h["lastSuccess"] = iso(t)
            digest = hashlib.sha256(normalise(body, ctype).encode("utf-8")).hexdigest()
            prev = latest(sid)
            changed = not prev or prev.get("sha256") != digest
            if changed:
                d = RAW / sid
                d.mkdir(parents=True, exist_ok=True)
                snap = {"source": sid, "url": s["url"], "fetchedAt": iso(t), "httpStatus": code,
                        "contentType": ctype, "sha256": digest, "truncated": trunc, "body": body}
                (d / (iso(t).replace(":", "-") + ".json")).write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
                new_snaps += 1
            report.append(f"ok   {sid:<14} {h['lastResult']} {'new snapshot' if changed else 'unchanged'}")
        else:
            report.append(f"FAIL {sid:<14} {h['lastResult']}")
    t1 = now()
    after = {s["id"]: status(s, H.get(s["id"], {}), t1) for s in sources}
    for s in sources:
        H.setdefault(s["id"], {"lastSuccess": None, "lastChecked": None, "lastResult": None})["status"] = after[s["id"]]
    last_write = parse(health.get("writtenAt"))
    flips = [k for k in after if after[k] != before[k]]
    write = bool(flips) or new_snaps > 0 or not last_write or (t1 - last_write).total_seconds() >= 6 * 3600
    print("\n".join(report) or "no sources due")
    print(f"status changes: {flips or 'none'}; new snapshots: {new_snaps}; write health: {write}")
    if write:
        health["checkedAt"] = iso(t1)
        health["writtenAt"] = iso(t1)
        health["note"] = ("Checked by GitHub Actions runners (outside Nepal). Some .gov.np sites block or time out "
                          "for such servers even when they are up for people in Nepal.")
        HP.write_text(json.dumps(health, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # never fail the workflow
        print("poller error (ignored):", type(e).__name__, e)
