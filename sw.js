/* Gati service worker: offline last-known state. Push only behind a flag (needs VAPID keys and a sender).
   Pages and data: network first, fall back to the last copy saved. Assets: cache first, refreshed in the background. */
const VERSION = "gati-v102";
const BUILD = "20261028T1516"; /* written by scripts/stamp.py (pre-commit hook and render.py) */
const CACHE_NAME = VERSION + "-" + BUILD;
const CORE = ["./", "index.html", "sources/", "about/", "me/", "assets/js/me.js", "api/", "alerts/", "feed/", "stories/", "log/", "assets/js/log.js", "offline/", "data/navigate.json", "assets/js/navigate.js", "assets/js/bs.js", "data/weather.json", "data/calendar.json", "data/contacts.json", "weather/", "trek/", "assets/js/trek.js", "assets/js/trekcard.js", "assets/js/homemap.js", "assets/js/trekcheck.js", "assets/js/homeinfo.js", "data/caan.json", "data/geo/trekinfo.json", "data/trek-meta.json", "data/trek-permits.json", "data/geo/treks.geojson", "data/travel-advisory.json", "contacts/", "safety/", "route/", "assets/js/wxmodel.js", "earthquakes/", "air/", "assets/js/quakes.js", "assets/js/route.js", "assets/js/routeeng.js", "assets/js/nearby.js", "assets/js/askpop.js", "assets/js/watch.js", "assets/js/services.js", "assets/js/contacts.js", "data/contacts.json", "assets/js/weather.js", "data/weather.json", "map/", "rivers/", "roads/", "assets/js/stories.js", "assets/js/district.js", "patro/", "ask/", "patro/gati.ics", "assets/js/patro.js", "data/calendar.json", "assets/js/bs.js", "manifest.webmanifest",
  "assets/css/gati.css", "assets/fonts/fonts.css", "assets/js/common.js", "assets/js/home.js", "assets/js/sources.js",
  "assets/vendor/leaflet/leaflet.css", "assets/vendor/leaflet/leaflet.js", "assets/js/dashslider.js", "assets/js/mapx.js", "assets/js/affectcore.js", "assets/js/affected.js", "assets/js/todaycard.js", "assets/js/motion.js", "assets/js/dash.js", "assets/js/push.js", "assets/js/search.js", "affected/", "assets/img/brand/logo-h.png", "assets/img/brand/logo-h-white.png", "assets/img/brand/mark-192.png", "assets/img/brand/favicon-32.png", "assets/img/icon-192.png",
  "data/alerts.json", "data/districts.json", "data/districts.geojson", "data/roads.json", "data/rivers.json", "data/updates.json",
  "data/geo/roads.geojson", "data/geo/rivers.geojson", "data/geo/provinces.geojson", "assets/js/maplayers.js", "assets/js/arnab.js", "data/arnab-advisory.json", "data/sources.json", "data/source-health.json"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME && k !== "gati-pushlog" && k !== "gati-trekpack").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const isData = (u) => /\/data\/|\.json$|\.geojson$|\.xml$|\.ics$/.test(u.pathname);
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || isData(url)) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((r) => r || (req.mode === "navigate" ? caches.match("offline/").then((o) => o || caches.match("./")) : caches.match("./")))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});

/* Feature 3 (behind a flag): show pushes from the district sender; tapping opens the alert permalink. */
/* offline trek pack: the page sends a URL list; saved in its own cache so a version bump keeps it */
self.addEventListener("message", (e) => { const d = e.data || {}; if (d.type !== "trekpack" || !Array.isArray(d.urls)) return;
  const reply = (ok) => e.ports && e.ports[0] && e.ports[0].postMessage({ ok });
  e.waitUntil(caches.open("gati-trekpack").then((c) => Promise.all(d.urls.filter((u) => typeof u === "string" && u.startsWith(self.registration.scope.replace(location.origin, ""))).map((u) => c.add(new Request(u, { cache: "reload" }))))).then(() => reply(true), () => reply(false))); });
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: e.data && e.data.text() }; }
  const entry = { id: d.id || "", title: d.title || "गति Gati", body: d.body || "", url: d.url || "./", source: d.source || "", sent: d.sent || "", received: new Date().toISOString() };
  const log = caches.open("gati-pushlog").then((c) => c.match("pushlog").then((r) => (r ? r.json() : [])).then((l) => c.put("pushlog", new Response(JSON.stringify([entry, ...l].slice(0, 200)), { headers: { "Content-Type": "application/json" } }))));
  e.waitUntil(Promise.all([log, self.registration.showNotification(entry.title, { body: entry.body, tag: entry.id || "gati", data: { url: entry.url }, icon: "assets/img/brand/favicon-64.png" })]));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.openWindow(e.notification.data && e.notification.data.url || "./")); });
