/* Feature 3: push by district, behind a flag (?push=1 once, or localStorage gati-flag-push=1).
   Needs before it can go live: a VAPID key pair (public key in data/push.json as {"vapidPublicKey": "..."})
   and a sender service that stores subscriptions and sends a push when an Official alert covers the district.
   Until then subscribe() reports "not configured" and nothing leaves the browser. */
(function () {
  const G = window.Gati; if (!G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  try { const q = new URLSearchParams(location.search).get("push"); if (q === "1") localStorage.setItem("gati-flag-push", "1"); if (q === "0") localStorage.removeItem("gati-flag-push"); } catch (e) {}
  const on = () => { try { return localStorage.getItem("gati-flag-push") === "1" && "serviceWorker" in navigator && "PushManager" in window; } catch (e) { return false; } };
  const b64 = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  async function subscribe(district) {
    if (!on()) return { ok: false, msg: T("यो सुविधा बन्द छ", "This feature is off") };
    const cfg = await G.json("data/push.json").catch(() => null);
    if (!cfg || !cfg.vapidPublicKey || !cfg.endpoint) return { ok: false, msg: T("पुस सूचना अझै सेटअप भएको छैन", "Push is not set up yet") };
    if ((await Notification.requestPermission()) !== "granted") return { ok: false, msg: T("अनुमति दिइएन", "Permission not given") };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.vapidPublicKey) });
    await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ district, subscription: sub }) });
    try { localStorage.setItem("gati-push-district", district); } catch (e) {}
    return { ok: true, msg: T("सदस्यता भयो", "Subscribed") };
  }
  G.push = { on, subscribe };
})();
