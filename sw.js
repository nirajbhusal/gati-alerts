/* Gati service worker: offline last-known state. Static only; no push (Web Push needs a server).
   Pages and data: network first, fall back to the last copy saved. Assets: cache first, refreshed in the background. */
const VERSION = "gati-v45";
const BUILD = "20261025T1157"; /* written by scripts/stamp.py (pre-commit hook and render.py) */
const CACHE_NAME = VERSION + "-" + BUILD;
const CORE = ["./", "index.html", "sources/", "about/", "api/", "alerts/", "stories/", "weather/", "contacts/", "safety/", "route/", "assets/js/wxmodel.js", "earthquakes/", "air/", "assets/js/quakes.js", "assets/js/route.js", "assets/js/nearby.js", "assets/js/askpop.js", "assets/js/watch.js", "assets/js/services.js", "assets/js/contacts.js", "data/contacts.json", "assets/js/weather.js", "data/weather.json", "map/", "rivers/", "roads/", "assets/js/stories.js", "assets/js/district.js", "patro/", "ask/", "patro/gati.ics", "assets/js/patro.js", "data/calendar.json", "assets/js/bs.js", "manifest.webmanifest",
  "assets/css/gati.css", "assets/fonts/fonts.css", "assets/js/common.js", "assets/js/home.js", "assets/js/sources.js",
  "assets/vendor/leaflet/leaflet.css", "assets/vendor/leaflet/leaflet.js", "assets/js/dashslider.js", "assets/js/mapx.js", "assets/js/affectcore.js", "assets/js/affected.js", "assets/js/todaycard.js", "assets/js/search.js", "affected/", "assets/img/brand/logo-h.png", "assets/img/brand/logo-h-white.png", "assets/img/brand/mark-192.png", "assets/img/brand/favicon-32.png", "assets/img/icon-192.png",
  "data/alerts.json", "data/districts.json", "data/districts.geojson", "data/roads.json", "data/rivers.json", "data/updates.json",
  "data/geo/roads.geojson", "data/geo/rivers.geojson", "data/geo/provinces.geojson", "assets/js/maplayers.js", "data/sources.json", "data/source-health.json"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const isData = (u) => /\/data\/|\.json$|\.geojson$|\.xml$|\.ics$/.test(u.pathname);
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || isData(url)) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((r) => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
