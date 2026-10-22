/* "Am I affected?": geolocation stays on this device. Nothing is sent anywhere; distances are computed in the browser
   from data Gati already publishes (alert circles and districts, roads.geojson, river gauges). */
(function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const KEY = "gati-near-km";
  const hav = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const inRing = (x, y, ring) => { let o = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; };
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  function distGeom(lat, lon, g) {
    let best = Infinity;
    for (const p of polys(g)) { if (inRing(lon, lat, p[0])) return 0; for (const [x, y] of p[0]) best = Math.min(best, hav(lat, lon, y, x)); }
    return best;
  }
  let data;
  async function load() {
    if (data) return data;
    const [al, geo, roads, rgeo, riv] = await Promise.all(["data/alerts.json", "data/districts.geojson", "data/roads.json", "data/geo/roads.geojson", "data/rivers.json"].map((p) => G.json(p).catch(() => null)));
    return (data = { al, geo, roads, rgeo, riv });
  }
  function compute(lat, lon, km) {
    const { al, geo, roads, rgeo, riv } = data, now = Date.now(), dg = {};
    (geo ? geo.features : []).forEach((f) => (dg[f.id] = f.geometry));
    const alerts = [], national = [];
    (al ? al.alerts : []).filter((a) => Date.parse(a.expires) > now && !a.supersededBy && a.info.en.params["gati:demo"] !== "true").forEach((a) => {
      let d = Infinity;
      a.areas.forEach((ar) => ar.circles.forEach((c) => { const [ll, rad] = c.split(" "), [y, x] = ll.split(",").map(Number); d = Math.min(d, Math.max(0, hav(lat, lon, y, x) - (+rad || 0))); }));
      a.districts.forEach((c) => dg[c] && (d = Math.min(d, distGeom(lat, lon, dg[c]))));
      if (d === Infinity && !a.districts.length) national.push(a); else if (d <= km) alerts.push([d, a]);
    });
    const st = {}; (roads ? roads.routes : []).forEach((r) => (st[r.id] = r));
    const segs = (rgeo ? rgeo.features : []).map((f) => { let d = Infinity; const cs = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates; cs.forEach((l) => l.forEach(([x, y]) => (d = Math.min(d, hav(lat, lon, y, x))))); return [d, st[f.properties.id]]; }).filter(([d, r]) => r && d <= km);
    const gauges = (riv ? riv.gauges : []).map((g) => [hav(lat, lon, g.ll[0], g.ll[1]), g]).filter(([d]) => d <= km);
    const s = (a, b) => a[0] - b[0];
    return { alerts: alerts.sort(s), national, segs: segs.sort(s), gauges: gauges.sort(s) };
  }
  const fmt = (d) => (d < 0.5 ? T("भित्रै", "inside") : `${G.num(d < 10 ? d.toFixed(1) : Math.round(d))} ${T("कि.मि.", "km")}`);
  const RS = { open: ["खुला", "Open"], blocked: ["अवरुद्ध", "Blocked"], oneway: ["एकतर्फी", "One-way"], none: ["पुष्टि छैन", "Not confirmed"] };
  let sheet, pos;
  function render() {
    const km = +(localStorage.getItem(KEY) || 25), body = sheet.querySelector(".nbody");
    sheet.querySelector(".nkm").value = km; sheet.querySelector(".nkmv").textContent = `${G.num(km)} ${T("कि.मि.", "km")}`;
    if (!pos) return;
    const r = compute(pos[0], pos[1], km);
    const sec = (h, L, f) => `<h3>${h} <span class="count">${G.num(L.length)}</span></h3>` + (L.length ? `<ul class="nlist">${L.map(f).join("")}</ul>` : `<p class="meta">${T("यो दूरीभित्र केही छैन।", "Nothing within this distance.")}</p>`);
    body.innerHTML = `<p class="meta">${T("तपाईंको स्थान यही उपकरणमा मात्र प्रयोग भयो; कतै पठाइएको छैन।", "Your location was used on this device only; it was not sent anywhere.")}</p>` +
      sec(T("चालु सूचना", "Active alerts"), r.alerts, ([d, a]) => `<li><a href="${R}alerts/${esc(a.identifier)}/">${G.sevChip(a.severity)} ${esc(a.info[G.lang].headline)}</a><span class="nd">${fmt(d)}</span></li>`) +
      (r.national.length ? `<p class="meta">${T("साथै देशभरका लागि", "Plus nationwide")}: ${r.national.map((a) => `<a href="${R}alerts/${esc(a.identifier)}/">${esc(a.info[G.lang].headline)}</a>`).join(" · ")}</p>` : "") +
      sec(T("सडक खण्ड", "Road segments"), r.segs, ([d, rt]) => `<li><a href="${R}roads/">${esc(T(rt.name_ne, rt.name_en))}</a><span class="tag rs-${esc(rt.status)}">${T(...(RS[rt.status] || RS.none))}</span><span class="nd">${fmt(d)}</span></li>`) +
      sec(T("नदी मापन केन्द्र", "River gauges"), r.gauges, ([d, g]) => `<li><a href="${R}rivers/">${esc(T(g.ne, g.en))}</a><span class="meta">${G.num(g.level)} / ${G.num(g.warning)} ${T("मि.", "m")}</span><span class="nd">${fmt(d)}</span></li>`) +
      `<p class="meta">${T("दूरी सीधा रेखामा, अनुमानित।", "Straight-line distances, approximate.")} ${data.roads ? esc(T(data.roads.as_of_ne, data.roads.as_of_en)) : ""}</p>`;
  }
  function locate() {
    const body = sheet.querySelector(".nbody");
    if (!navigator.geolocation) { body.innerHTML = `<div class="na">${T("यो ब्राउजरमा स्थान उपलब्ध छैन।", "Location is not available in this browser.")}</div>`; return; }
    body.innerHTML = `<p class="meta">${T("स्थान खोज्दै…", "Finding your location…")}</p>`;
    navigator.geolocation.getCurrentPosition(async (p) => { pos = [p.coords.latitude, p.coords.longitude]; await load(); render(); },
      () => { body.innerHTML = `<div class="na">${T("स्थान अनुमति दिइएन वा भेटिएन।", "Location permission was denied or unavailable.")}</div>`; }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  }
  function open() {
    if (!sheet) {
      sheet = document.createElement("div"); sheet.className = "nsheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-labelledby", "nh");
      sheet.innerHTML = `<div class="nback"></div><div class="npanel"><div class="nhead"><h2 id="nh"></h2><button type="button" class="nclose" aria-label="Close">✕</button></div>
        <label class="nrange"><span class="nlab"></span> <input type="range" class="nkm" min="5" max="100" step="5"> <b class="nkmv"></b></label><div class="nbody" aria-live="polite"></div></div>`;
      document.body.appendChild(sheet);
      const close = () => { sheet.hidden = true; btn && btn.focus(); };
      sheet.querySelector(".nback").onclick = close; sheet.querySelector(".nclose").onclick = close;
      sheet.addEventListener("keydown", (e) => e.key === "Escape" && close());
      sheet.querySelector(".nkm").oninput = (e) => { try { localStorage.setItem(KEY, e.target.value); } catch (x) {} render(); };
    }
    sheet.querySelector("#nh").textContent = T("के म प्रभावित छु?", "Am I affected?");
    sheet.querySelector(".nlab").textContent = T("दूरी", "Distance");
    sheet.hidden = false; sheet.querySelector(".nclose").focus(); locate();
  }
  let btn;
  function mount() {
    const slot = document.getElementById("nearbyslot"); if (!slot) return;
    slot.innerHTML = `<button type="button" class="nearbtn" aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>${T("के म प्रभावित छु?", "Am I affected?")}</button>`;
    btn = slot.firstChild; btn.onclick = open;
  }
  G.nearby = { open };
  mount(); G.onLang(() => { mount(); if (sheet && !sheet.hidden) { sheet.querySelector("#nh").textContent = T("के म प्रभावित छु?", "Am I affected?"); render(); } });
})();
