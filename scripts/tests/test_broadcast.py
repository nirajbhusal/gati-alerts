"""Run: python -m unittest discover scripts/tests"""
import json, os, sys, unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import broadcast as B

NOW = datetime.fromisoformat("2026-11-11T12:00:00+05:45")


def alert(i="np.gati.t-1", trust="Official", sev="Severe", sent="2026-11-11T10:00:00+05:45", expires="2026-11-12T10:00:00+05:45", **kw):
    info = {"severity": sev, "expires": expires, "headline": "नारायणी नदीमा बाढीको चेतावनी", "instruction": "नदी किनारबाट टाढा रहनुहोस्",
            "senderName": "जल तथा मौसम विज्ञान विभाग · गति मार्फत प्रसारित", "web": "https://www.dhm.gov.np/x",
            "params": {"gati:trustLevel": trust, "gati:sourceTime": "2026-11-11T09:45:00+05:45"}}
    en = dict(info, headline="Flood warning on the Narayani", instruction="Stay away from the river bank", senderName="DHM · relayed by Gati")
    return dict({"identifier": i, "status": "Actual", "scope": "Public", "msgType": "Alert", "sent": sent, "info": {"ne": info, "en": en}}, **kw)


class Eligibility(unittest.TestCase):
    def test_official_active_is_eligible(self):
        self.assertTrue(B.eligible(alert(), NOW))

    def test_only_official_trust(self):
        for t in ("Reported", "Verified", "Model", "Unverified", None):
            self.assertFalse(B.eligible(alert(trust=t), NOW), t)

    def test_expired_old_test_and_private_are_skipped(self):
        self.assertFalse(B.eligible(alert(expires="2026-11-11T11:00:00+05:45"), NOW))
        self.assertFalse(B.eligible(alert(sent="2026-11-08T10:00:00+05:45"), NOW))
        self.assertFalse(B.eligible(alert(status="Test"), NOW))
        self.assertFalse(B.eligible(alert(scope="Restricted"), NOW))

    def test_severity_floor(self):
        self.assertFalse(B.eligible(alert(sev="Unknown"), NOW))
        self.assertFalse(B.eligible(alert(sev="Moderate"), NOW, "Severe"))
        self.assertTrue(B.eligible(alert(sev="Extreme"), NOW, "Severe"))


class Format(unittest.TestCase):
    def test_long_has_source_links_and_relay_line(self):
        t = B.format_long(alert())
        for s in ("नारायणी नदीमा बाढीको चेतावनी", "Flood warning on the Narayani", "जल तथा मौसम विज्ञान विभाग", "https://www.dhm.gov.np/x",
                  "alerts/np.gati.t-1/", "does not issue warnings", "2026-11-11T09:45:00+05:45"):
            self.assertIn(s, t)
        self.assertNotIn("गति मार्फत प्रसारित", t.split("स्रोत / Source:")[1].split("\n")[0])

    def test_update_is_marked(self):
        self.assertIn("अद्यावधिक / Update", B.format_long(alert(msgType="Update")))

    def test_short_fits_and_keeps_link(self):
        a = alert(); a["info"]["ne"]["headline"] = "क" * 900
        t = B.format_short(a)
        self.assertLessEqual(len(t), 300)
        self.assertIn("alerts/np.gati.t-1/", t)


class Run(unittest.TestCase):
    def setUp(self):
        self.calls = []
        self.senders = {c: (lambda a, c=c: self.calls.append((c, a["identifier"])) or True) for c in B.CHANNELS}
        self.quiet = lambda *a: None

    def test_first_run_is_baseline_only(self):
        st, rep = B.run([alert()], {"channels": {}}, NOW, ["telegram"], senders=self.senders, log=self.quiet)
        self.assertEqual(self.calls, [])
        self.assertEqual(rep["telegram"]["baseline"], 1)
        self.assertIn("np.gati.t-1", st["channels"]["telegram"]["sent"])

    def test_new_alert_sent_once(self):
        st = {"channels": {"telegram": {"sent": {}}}}
        B.run([alert()], st, NOW, ["telegram"], senders=self.senders, log=self.quiet)
        B.run([alert()], st, NOW + timedelta(minutes=30), ["telegram"], senders=self.senders, log=self.quiet)
        self.assertEqual(self.calls, [("telegram", "np.gati.t-1")])

    def test_failure_is_retried_and_does_not_block_other_channels(self):
        def boom(a): raise RuntimeError("secret-token-123")
        out = []
        st = {"channels": {"telegram": {"sent": {}}, "viber": {"sent": {}}}}
        _, rep = B.run([alert()], st, NOW, ["telegram", "viber"], senders=dict(self.senders, telegram=boom), log=out.append)
        self.assertEqual(rep["telegram"]["failed"], 1)
        self.assertNotIn("np.gati.t-1", st["channels"]["telegram"]["sent"])
        self.assertEqual(self.calls, [("viber", "np.gati.t-1")])
        self.assertFalse(any("secret-token-123" in str(x) for x in out))

    def test_sms_and_whatsapp_default_to_severe(self):
        st = {"channels": {"sms": {"sent": {}}, "telegram": {"sent": {}}}}
        B.run([alert(sev="Moderate")], st, NOW, ["sms", "telegram"], senders=self.senders, log=self.quiet)
        self.assertEqual(self.calls, [("telegram", "np.gati.t-1")])

    def test_dry_run_sends_and_records_nothing(self):
        st = {"channels": {"telegram": {"sent": {}}}}
        B.run([alert()], st, NOW, ["telegram"], dry=True, senders=self.senders, log=self.quiet)
        self.assertEqual(self.calls, [])
        self.assertEqual(st["channels"]["telegram"]["sent"], {})


class Senders(unittest.TestCase):
    def test_payloads(self):
        seen = []
        def post(url, data=None, headers=None, as_json=True, timeout=20):
            seen.append((url, data, headers or {}, as_json))
            return 200, '{"ok":true,"status":0}'
        env = {"TELEGRAM_BOT_TOKEN": "T", "TELEGRAM_CHAT_ID": "@c", "VIBER_AUTH_TOKEN": "V", "VIBER_FROM": "admin==",
               "WHATSAPP_TOKEN": "W", "WHATSAPP_PHONE_NUMBER_ID": "123", "WHATSAPP_RECIPIENTS": "9779800000001, 9779800000002",
               "SMS_TOKEN": "S", "SMS_FROM": "GatiAlert", "SMS_RECIPIENTS": "9800000001,9800000002"}
        old = dict(os.environ); os.environ.update(env)
        try:
            for ch in B.CHANNELS:
                self.assertTrue(B.configured(ch))
                self.assertTrue(B.SENDERS[ch](alert(), post=post), ch)
        finally:
            os.environ.clear(); os.environ.update(old)
        urls = [s[0] for s in seen]
        self.assertEqual(urls[0], "https://api.telegram.org/botT/sendMessage")
        self.assertEqual(urls[1], "https://chatapi.viber.com/pa/post")
        self.assertEqual(seen[1][2]["X-Viber-Auth-Token"], "V")
        self.assertEqual(urls.count("https://graph.facebook.com/v21.0/123/messages"), 2)
        wa = seen[2][1]; self.assertEqual(wa["template"]["name"], "gati_alert"); self.assertEqual(len(wa["template"]["components"][0]["parameters"]), 3)
        self.assertEqual(seen[-1][1]["to"], "9800000001,9800000002"); self.assertFalse(seen[-1][3])


if __name__ == "__main__":
    unittest.main()
