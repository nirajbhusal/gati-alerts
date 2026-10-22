/* Gati service worker: offline last-known state. Static only; no push (Web Push needs a server).
   Pages and data: network first, fall back to the last copy saved. Assets: cache first, refreshed in the background. */
const VERSION = "gati-v3";
const CORE = ["./", "index.html", "sources/", "about/", "api/", "alerts/", "stories/", "assets/js/stories.js", "patro/", "patro/gati.ics", "assets/js/patro.js", "data/calendar.json", "assets/js/bs.js", "manifest.webmanifest",
  "assets/css/gati.css", "assets/fonts/fonts.css", "assets/js/common.js", "assets/js/home.js", "assets/js/sources.js",
  "assets/vendor/leaflet/leaflet.css", "assets/vendor/leaflet/leaflet.js", "assets/img/gati-concept-A-ga-signal-icon.svg", "assets/img/icon-192.png",
  "data/alerts.json", "data/districts.json", "data/districts.geojson", "data/roads.json", "data/rivers.json", "data/updates.json",
  "data/geo/roads.geojson", "data/geo/rivers.geojson", "data/sources.json", "data/source-health.json"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const isData = (u) => /\/data\/|\.json$|\.geojson$|\.xml$|\.ics$/.test(u.pathname);
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || isData(url)) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((r) => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
