#!/usr/bin/env python3
"""Broadcast new official alerts to messaging channels.

Reads data/alerts.json and posts each new, active, Official alert once to every configured channel:
Telegram channel, Viber channel, WhatsApp (Cloud API template to an opt-in list) and SMS (HTTP gateway).

Rules (do not weaken):
  * Only items whose gati:trustLevel is "Official" are sent. Reported, Verified and Model items never are.
  * The agency's own headline is sent with its source, source time and original link. Nothing is rewritten.
  * Every message says Gati is a relay and does not issue warnings.
  * A channel's first run only records what already exists; it sends nothing (no flood of old alerts).
  * Tokens and recipient numbers come from environment variables and are never printed.

Usage:
  python scripts/broadcast.py --dry-run          # print what would be sent, change nothing
  python scripts/broadcast.py                    # send to every channel that has its secrets set
  python scripts/broadcast.py --channels telegram,viber
  python scripts/broadcast.py --count            # how many sends are due (used by the workflow)
  python scripts/broadcast.py --test --channels telegram   # post one labelled test message; changes no state

Standard library only. See docs/BROADCAST.md.
"""
import argparse, json, os, sys, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "data" / "broadcast-state.json"
SEV_ORDER = {"Extreme": 4, "Severe": 3, "Moderate": 2, "Minor": 1, "Unknown": 0}
SEV = {"Extreme": ("🟣", "अति गम्भीर", "Extreme"), "Severe": ("🔴", "गम्भीर", "Severe"), "Moderate": ("🟠", "मध्यम", "Moderate"),
       "Minor": ("🟡", "सामान्य", "Minor"), "Unknown": ("🔵", "जानकारी", "Info")}
MSGTYPE = {"Update": ("अद्यावधिक", "Update"), "Cancel": ("रद्द", "Cancelled")}
MAX_AGE_HOURS = 48      # never broadcast an alert first sent longer ago than this
KEEP_DAYS = 60          # how long sent ids stay in the state file
CHANNELS = ("telegram", "viber", "whatsapp", "sms")
# Chat channels take everything from Minor up. WhatsApp and SMS interrupt people and cost money: Severe and up.
DEFAULT_MIN = {"telegram": "Minor", "viber": "Minor", "whatsapp": "Severe", "sms": "Severe"}


def parse_time(s):
    try:
        return datetime.fromisoformat(s)
    except (TypeError, ValueError):
        return None


def load_json(path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def country():
    return load_json(ROOT / "data" / "country.json", {}) or {}


def site_base():
    return (os.environ.get("GATI_SITE") or country().get("site") or "").rstrip("/") + "/"


def helpline_text():
    nums = [h["number"] for h in country().get("helplines", [])]
    return " / ".join(nums) if nums else ""


def eligible(alert, now, min_sev="Minor"):
    """True when this alert may be broadcast at all."""
    ne = (alert.get("info") or {}).get("ne") or {}
    if alert.get("status") != "Actual" or alert.get("scope") != "Public":
        return False
    if (ne.get("params") or {}).get("gati:trustLevel") != "Official":
        return False
    sent, exp = parse_time(alert.get("sent")), parse_time(ne.get("expires"))
    if not sent or now - sent > timedelta(hours=MAX_AGE_HOURS) or sent - now > timedelta(hours=1):
        return False
    if exp and exp <= now:
        return False
    return SEV_ORDER.get(ne.get("severity"), 0) >= SEV_ORDER.get(min_sev, 1)


def agency(info):
    """'नेपाल प्रहरी प्रधान कार्यालय · गति मार्फत प्रसारित' -> 'नेपाल प्रहरी प्रधान कार्यालय'."""
    return str(info.get("senderName") or "").split(" · ")[0].strip()


def clip(text, n):
    text = " ".join(str(text or "").split())
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def permalink(alert):
    return f"{site_base()}alerts/{alert['identifier']}/"


def format_long(alert):
    """Telegram / Viber text: Nepali first, then English, then source and links."""
    ne, en = alert["info"]["ne"], (alert["info"].get("en") or {})
    icon, sne, sen = SEV.get(ne.get("severity"), SEV["Unknown"])
    tag = MSGTYPE.get(alert.get("msgType"))
    head = f"{icon} {sne} · {sen}" + (f" · {tag[0]} / {tag[1]}" if tag else "")
    src_time = (ne.get("params") or {}).get("gati:sourceTime") or alert.get("sent") or ""
    lines = [head, "", clip(ne.get("headline"), 400)]
    if ne.get("instruction"):
        lines.append(clip(ne["instruction"], 400))
    if en.get("headline"):
        lines += ["", clip(en["headline"], 400)]
        if en.get("instruction"):
            lines.append(clip(en["instruction"], 400))
    lines += ["", f"स्रोत / Source: {agency(ne)}" + (f" ({agency(en)})" if en and agency(en) != agency(ne) else ""),
              f"स्रोत समय / Source time: {src_time}"]
    if ne.get("web"):
        lines.append(f"आधिकारिक सूचना / Official notice: {ne['web']}")
    lines.append(f"गति / Gati: {permalink(alert)}")
    hl = helpline_text()
    lines += ["", "गतिले आधिकारिक सूचना मात्र प्रसारण गर्छ; आफैं चेतावनी जारी गर्दैन। / Gati only relays official notices; it does not issue warnings."
              + (f" आपत्काल / Emergency: {hl}" if hl else "")]
    return "\n".join(lines)


def format_short(alert, limit=300):
    """SMS text: agency, headline, link. Nepali text is Unicode, so one SMS part is about 70 characters."""
    ne = alert["info"]["ne"]
    link = permalink(alert)
    prefix = f"[{agency(ne)}] "
    room = max(40, limit - len(prefix) - len(link) - 8)
    return f"{prefix}{clip(ne.get('headline'), room)} {link} -गति"


# ---------- senders ----------
def http_post(url, data=None, headers=None, as_json=True, timeout=20):
    body = json.dumps(data).encode("utf-8") if as_json else urllib.parse.urlencode(data).encode("utf-8")
    h = {"Content-Type": "application/json" if as_json else "application/x-www-form-urlencoded", "User-Agent": "gati-broadcast"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=body, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as e:
        return 0, type(e).__name__


def recipients(var):
    return [x.strip() for x in os.environ.get(var, "").replace("\n", ",").split(",") if x.strip()]


def send_telegram(alert, post=http_post, text=None):
    token, chat = os.environ["TELEGRAM_BOT_TOKEN"], os.environ["TELEGRAM_CHAT_ID"]
    code, body = post(f"https://api.telegram.org/bot{token}/sendMessage",
                      {"chat_id": chat, "text": (text or format_long(alert))[:4096], "disable_web_page_preview": True})
    return code == 200 and '"ok":true' in body.replace(" ", "")


def send_viber(alert, post=http_post, text=None):
    """Viber Channels Post API. VIBER_FROM is the channel super admin's user id (from get_account_info)."""
    code, body = post("https://chatapi.viber.com/pa/post",
                      {"from": os.environ["VIBER_FROM"], "type": "text", "text": (text or format_long(alert))[:7000]},
                      headers={"X-Viber-Auth-Token": os.environ["VIBER_AUTH_TOKEN"]})
    return code == 200 and '"status":0' in body.replace(" ", "")


TEST_TEXT = ("🧪 परीक्षण सन्देश / Test message\n\n"
             "यो गतिको च्यानल जडान जाँच्ने परीक्षण मात्र हो। यो कुनै सूचना वा चेतावनी होइन।\n"
             "This only checks that Gati's channel connection works. It is not an alert or a warning.\n\n")


def send_test(channels, post=http_post, log=print):
    """Post one clearly labelled test message to the chat channels. WhatsApp and SMS are left out on purpose:
    they reach people's phones, and a WhatsApp template can only carry an approved alert layout."""
    ok_all = True
    for ch in channels:
        if ch not in ("telegram", "viber"):
            log(f"{ch}: test not sent (only Telegram and Viber take test messages)")
            continue
        try:
            ok = {"telegram": send_telegram, "viber": send_viber}[ch](None, post=post, text=TEST_TEXT + site_base())
        except Exception as e:
            ok = False
            log(f"{ch}: error {type(e).__name__}")
        log(f"{ch}: test {'sent' if ok else 'FAILED'}")
        ok_all = ok_all and ok
    return ok_all


def send_whatsapp(alert, post=http_post):
    """WhatsApp Cloud API, pre-approved template with three body variables: headline, source, link.
    Sent only to the opt-in numbers in WHATSAPP_RECIPIENTS. WhatsApp Channels have no posting API."""
    ne = alert["info"]["ne"]
    ver = os.environ.get("WHATSAPP_GRAPH_VERSION", "v21.0")
    url = f"https://graph.facebook.com/{ver}/{os.environ['WHATSAPP_PHONE_NUMBER_ID']}/messages"
    params = [clip(ne.get("headline"), 500), clip(agency(ne), 100), permalink(alert)]
    ok = True
    for to in recipients("WHATSAPP_RECIPIENTS"):
        code, _ = post(url, {"messaging_product": "whatsapp", "to": to, "type": "template", "template": {
            "name": os.environ.get("WHATSAPP_TEMPLATE", "gati_alert"), "language": {"code": os.environ.get("WHATSAPP_TEMPLATE_LANG", "ne")},
            "components": [{"type": "body", "parameters": [{"type": "text", "text": p} for p in params]}]}},
            headers={"Authorization": "Bearer " + os.environ["WHATSAPP_TOKEN"]})
        ok = ok and code in (200, 201)
    return ok


def send_sms(alert, post=http_post):
    """HTTP SMS gateway. Defaults match Sparrow SMS (Nepal): form fields token, from, to, text."""
    to = recipients("SMS_RECIPIENTS")
    ok = True
    for i in range(0, len(to), 50):
        code, _ = post(os.environ.get("SMS_API_URL", "https://api.sparrowsms.com/v2/sms/"),
                       {"token": os.environ["SMS_TOKEN"], "from": os.environ["SMS_FROM"], "to": ",".join(to[i:i + 50]),
                        "text": format_short(alert)}, as_json=False)
        ok = ok and code == 200
    return ok


SENDERS = {"telegram": send_telegram, "viber": send_viber, "whatsapp": send_whatsapp, "sms": send_sms}
REQUIRED = {"telegram": ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"], "viber": ["VIBER_AUTH_TOKEN", "VIBER_FROM"],
            "whatsapp": ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_RECIPIENTS"],
            "sms": ["SMS_TOKEN", "SMS_FROM", "SMS_RECIPIENTS"]}


def configured(channel):
    return all(os.environ.get(v, "").strip() for v in REQUIRED[channel])


def min_severity(channel):
    v = os.environ.get(f"{channel.upper()}_MIN_SEVERITY", "").strip().capitalize()
    return v if v in SEV_ORDER else DEFAULT_MIN[channel]


def run(alerts, state, now, channels, dry=False, senders=SENDERS, log=print):
    """Send what is due. Returns (state, report). `state` is updated in place and also returned."""
    chans = state.setdefault("channels", {})
    report = {}
    cutoff = (now - timedelta(days=KEEP_DAYS)).isoformat()
    for ch in channels:
        due = sorted((a for a in alerts if eligible(a, now, min_severity(ch))), key=lambda a: a["sent"])
        if ch not in chans:
            # First run: remember what exists, send nothing.
            if not dry:
                chans[ch] = {"sent": {a["identifier"]: "baseline" for a in due}, "since": now.isoformat()}
            report[ch] = {"baseline": len(due), "sent": 0, "failed": 0}
            log(f"{ch}: first run, recorded {len(due)} existing alert(s), sent nothing")
            continue
        sent = chans[ch].setdefault("sent", {})
        new = [a for a in due if a["identifier"] not in sent]
        ok_n = fail_n = 0
        for a in new:
            if dry:
                log(f"--- {ch} would send {a['identifier']} ---\n{format_short(a) if ch == 'sms' else format_long(a)}\n")
                continue
            try:
                ok = senders[ch](a)
            except Exception as e:  # never let one channel stop the others; never print secrets
                ok = False
                log(f"{ch}: error {type(e).__name__} on {a['identifier']}")
            if ok:
                sent[a["identifier"]] = now.isoformat()
                ok_n += 1
            else:
                fail_n += 1
            log(f"{ch}: {'sent' if ok else 'FAILED'} {a['identifier']}")
        for k in [k for k, v in sent.items() if v != "baseline" and v < cutoff]:
            del sent[k]
        report[ch] = {"sent": ok_n, "failed": fail_n, "pending": len(new) if dry else fail_n}
    return state, report


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--dry-run", action="store_true", help="print messages, send nothing, write nothing")
    ap.add_argument("--channels", default="", help="comma list; default: every channel whose secrets are set")
    ap.add_argument("--alerts", default=str(ROOT / "data" / "alerts.json"))
    ap.add_argument("--state", default=str(STATE))
    ap.add_argument("--now", default="", help="ISO time override, for testing")
    ap.add_argument("--count", action="store_true", help="print how many sends (or first-run baselines) are due, then exit")
    ap.add_argument("--test", action="store_true", help="post one labelled test message to Telegram/Viber and exit; changes no state")
    args = ap.parse_args(argv)
    now = parse_time(args.now) if args.now else datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    if args.test:
        want = [c for c in args.channels.split(",") if c] or ["telegram", "viber"]
        ready = [c for c in want if c in CHANNELS and configured(c)]
        for c in want:
            if c not in ready:
                print(f"{c}: not configured, skipped")
        if not ready:
            return 1
        return 0 if send_test(ready) else 1
    data = load_json(args.alerts)
    if not data or "alerts" not in data:
        print("No alerts file; nothing to do.")
        return 0
    asked = [c for c in args.channels.split(",") if c] or list(CHANNELS)
    bad = [c for c in asked if c not in CHANNELS]
    if bad:
        print("Unknown channel: " + ", ".join(bad))
        return 2
    state = load_json(args.state, {"version": 1, "channels": {}})
    if args.dry_run:
        chans = asked
        for c in chans:           # a dry run shows messages even before a channel's baseline exists
            state["channels"].setdefault(c, {"sent": {}})
    else:
        chans = [c for c in asked if configured(c)]
        for c in asked:
            if c not in chans and not args.count:
                print(f"{c}: not configured, skipped")
    if args.count:
        n = 0
        for c in chans:
            ch = state["channels"].get(c)
            n += 1 if ch is None else sum(1 for x in data["alerts"] if eligible(x, now, min_severity(c)) and x["identifier"] not in ch.get("sent", {}))
        print(n)
        return 0
    _, report = run(data["alerts"], state, now, chans, dry=args.dry_run)
    if not args.dry_run and chans:
        Path(args.state).write_text(json.dumps(state, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
