/* Gati map with filters. Every layer cites its source; counts are per layer or per agency, never summed across agencies.
   Filters live in the URL hash so a view can be shared. Colour is used only for data. */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, R = G.root;
  const get = (p) => G.json(p).catch(() => null);
  const [AL, DIST, PROV, DL, RV, RD, RG, WX, HL, AV] = await Promise.all(["data/alerts.json", "data/districts.geojson", "data/geo/provinces.geojson", "data/districts.json",
    "data/rivers.json", "data/roads.json", "data/geo/roads.geojson", "data/weather.json", "data/geo/health.json", "data/geo/aviation.json"].map(get));
  const ALERTS = AL ? AL.alerts : [], now = Date.now();
  const SEVS = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"], SVN = (s) => (G.SEV[s] || G.SEV.Unknown)[G.lang === "ne" ? 0 : 1];
  const HZ = { flood: ["बाढी", "Flood"], landslide: ["पहिरो", "Landslide"], weather: ["मौसम", "Weather"], road: ["सडक", "Road"], fire: ["आगलागी", "Fire"], lightning: ["चट्याङ", "Lightning"], cold: ["शीतलहर", "Cold wave"], glof: ["हिमताल", "GLOF"], other: ["अन्य", "Other"] };
  const TR = ["Official", "Reported", "Model"].filter((t) => G.TRUST[t]);
  const isAct = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > now;
  const RCOL = { open: "#16a34a", oneway: "#f59e0b", blocked: "#dc2626", none: "#86D8A0" }, RLB = { open: ["खुला", "Open"], oneway: ["एकतर्फी", "One-way"], blocked: ["अवरुद्ध", "Blocked"], none: ["पुष्टि छैन", "Not confirmed"] };
  const VCOL = { normal: "#2F6FED", warning: "#F28C1E", danger: "#D93025" }, VLB = { normal: ["सामान्य", "Normal"], warning: ["चेतावनी तह", "Above warning"], danger: ["खतरा तह", "Above danger"] };
  const gstat = (g) => (g.level >= g.danger ? "danger" : g.level >= g.warning ? "warning" : "normal");
  const mag = (a) => parseFloat(((a.info.en.params || {})["gati:magnitude"]) || "") || null;
  const hazards = [...new Set(ALERTS.filter((a) => a.hazard !== "earthquake").map((a) => a.hazard))];
  const agencies = [...new Set(ALERTS.map((a) => G.agencyOf(a)))];
  /* ---- state <-> hash ---- */
  const DEF = { hz: hazards, sv: SEVS, st: "active", ag: agencies, tr: TR, tm: "30d", pr: "", d: "", L: ["alerts", "wx", "rv", "rd", "eq", "lab"], rvs: ["normal", "warning", "danger"], rds: ["open", "oneway", "blocked", "none"], eqm: "0" };
  const LISTS = ["hz", "sv", "ag", "tr", "L", "rvs", "rds"];
  let S = JSON.parse(JSON.stringify(DEF));
  const readHash = () => { const q = new URLSearchParams(location.hash.slice(1)); S = JSON.parse(JSON.stringify(DEF)); q.forEach((v, k) => { if (!(k in S)) return; S[k] = LISTS.includes(k) ? (v ? v.split(",") : []) : v; }); };
  const writeHash = () => { const q = new URLSearchParams(); Object.keys(S).forEach((k) => { const a = LISTS.includes(k) ? S[k].join(",") : S[k], b = LISTS.includes(k) ? DEF[k].join(",") : DEF[k]; if (a !== b) q.set(k, a); }); history.replaceState(null, "", "#" + q.toString()); };
  readHash();
  /* ---- map ---- */
  const map = L.map("mxmap", { zoomSnap: 0.25, minZoom: 6, maxBounds: [[25.5, 79], [31.2, 89]] }).fitBounds([[26.3, 80.0], [30.48, 88.2]]);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 16, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  const LG = {}; ["prov", "alerts", "wx", "rv", "rd", "eq", "aq", "hos", "heli", "lab", "focus"].forEach((k) => (LG[k] = L.layerGroup().addTo(map)));
  if (PROV) L.geoJSON(PROV, { style: { color: "#5f6670", weight: 1, opacity: 0.6, fill: false, dashArray: "4 4" }, interactive: false }).addTo(LG.prov);
  const distF = DIST ? Object.fromEntries(DIST.features.map((f) => [f.id, f])) : {};
  const distName = (id) => { const f = distF[id]; return f ? T(f.properties.ne, f.properties.en) : id; };
  const inArea = (codes) => (S.d ? codes.includes(S.d) : S.pr ? codes.some((c) => c.startsWith(S.pr)) : true);
  const tmOk = (iso) => S.tm === "all" || now - Date.parse(iso) <= { "24h": 864e5, "7d": 6048e5, "30d": 2592e6 }[S.tm];
  const alertOk = (a) => (S.st === "all" || (S.st === "active") === isAct(a)) && S.sv.includes(a.severity) && S.ag.includes(G.agencyOf(a)) && S.tr.includes(a.trust) && tmOk(a.sent) && (!a.districts.length || inArea(a.districts));
  const pop = (a) => { const i = a.info[G.lang] || a.info.ne; return `<b>${E(i.headline)}</b><br>${G.sevChip(a.severity)} ${G.trustChip(a.trust)}<br><span class="meta">${E(G.agencyOf(a))} · ${G.npt((i.params || {})["gati:sourceTime"] || a.sent)}</span><br><a href="${E(i.web || "#")}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a> · <a href="${R}alerts/${a.identifier}/">${T("पूरा सूचना", "Full notice")}</a>`; };
  let aqData = null, aqLoading = false;
  const CITIES = [["काठमाडौँ", "Kathmandu", 27.7172, 85.324], ["पोखरा", "Pokhara", 28.2096, 83.9856], ["विराटनगर", "Biratnagar", 26.4525, 87.2718], ["भरतपुर", "Bharatpur", 27.6766, 84.4303], ["नेपालगन्ज", "Nepalgunj", 28.05, 81.6167], ["धनगढी", "Dhangadhi", 28.6833, 80.6], ["जनकपुर", "Janakpur", 26.7288, 85.9263]];
  const aqCol = (v) => (v <= 50 ? "#00a651" : v <= 100 ? "#d4b000" : v <= 150 ? "#f7941d" : v <= 200 ? "#e2231a" : v <= 300 ? "#8f3f97" : "#7e0023");
  function loadAQ() { if (aqData || aqLoading) return; aqLoading = true;
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${CITIES.map((c) => c[2]).join(",")}&longitude=${CITIES.map((c) => c[3]).join(",")}&current=us_aqi&timezone=Asia%2FKathmandu`).then((r) => r.ok ? r.json() : null)
      .then((d) => { aqData = d ? (Array.isArray(d) ? d : [d]) : []; draw(); }).catch(() => { aqData = []; draw(); }); }
  const counts = {};
  let ITEMS = [], selId = null;
  const RV_STALE = RV && RV.as_of ? (now - Date.parse(RV.as_of + "T23:59:00+05:45")) > 1728e5 : false;
  const llOf = (a) => { for (const ar of a.areas) for (const c of ar.circles) { const [la, lo] = c.split(" ")[0].split(",").map(Number); if (!isNaN(la)) return [la, lo]; } return null; };
  const bOf = (a) => { const ll = llOf(a); if (ll) return L.latLngBounds([ll, ll]); const fs = a.districts.map((d) => distF[d]).filter(Boolean); return fs.length ? L.geoJSON({ type: "FeatureCollection", features: fs }).getBounds() : null; };
  const reg = (it) => { it.id = it.k + ":" + ITEMS.length; ITEMS.push(it); };
  const aItem = (a, k) => { const i = a.info[G.lang] || a.info.ne, p = i.params || {}; return { k, col: k === "eq" ? "#7c3aed" : G.SEVCOLOR[a.severity], title: i.headline, sub: (k === "eq" && mag(a) ? "M" + G.num(String(mag(a))) + " · " : "") + (a.areas.map((x) => x[G.lang] || x.en).filter(Boolean)[0] || ""), sev: a.severity, agency: G.agencyOf(a), trust: a.trust, url: p["gati:sourceUrl"] || i.web, time: p["gati:sourceTime"] || a.sent, act: isAct(a), b: bOf(a), html: pop(a), more: `<p>${E(i.description || "")}</p>${i.instruction ? `<p><b>${T("के गर्ने", "What to do")}:</b> ${E(i.instruction)}</p>` : ""}<p class="meta">${T("म्याद", "Expires")}: ${G.npt(a.expires)}</p><p><a href="${R}alerts/${a.identifier}/">${T("पूरा सूचना", "Full notice")} →</a></p>` }; };
  function draw() {
    Object.entries(LG).forEach(([k, g]) => { if (k !== "prov") g.clearLayers(); }); ITEMS = [];
    const on = (k) => S.L.includes(k);
    /* alerts (not earthquakes): district fill by worst severity + point circles */
    const A = ALERTS.filter((a) => a.hazard !== "earthquake" && S.hz.includes(a.hazard) && alertOk(a));
    counts.ag = {}; ALERTS.filter((a) => a.hazard !== "earthquake" ? S.hz.includes(a.hazard) : on("eq")).filter((a) => (S.st === "all" || (S.st === "active") === isAct(a)) && tmOk(a.sent)).forEach((a) => { const k = G.agencyOf(a); counts.ag[k] = (counts.ag[k] || 0) + 1; });
    if (on("alerts")) { const worst = {}, by = {}; A.forEach((a) => reg(aItem(a, "alerts")));
      A.forEach((a) => { const ds = a.districts.length ? a.districts : []; ds.forEach((d) => { if (!worst[d] || SEVS.indexOf(a.severity) < SEVS.indexOf(worst[d])) worst[d] = a.severity; (by[d] = by[d] || []).push(a); });
        a.areas.forEach((ar) => ar.circles.forEach((c) => { const [la, lo] = c.split(" ")[0].split(",").map(Number); if (!isNaN(la)) L.circleMarker([la, lo], { radius: 7, color: "#fff", weight: 1.5, fillColor: G.SEVCOLOR[a.severity], fillOpacity: 0.95, className: isAct(a) && now - Date.parse(a.sent) < 864e5 ? "mxpulse" : "" }).bindPopup(pop(a)).addTo(LG.alerts); })); });
      Object.entries(worst).forEach(([d, s]) => { const f = distF[d]; if (!f) return; L.geoJSON(f, { style: { color: G.SEVCOLOR[s], weight: 1.5, fillColor: G.SEVCOLOR[s], fillOpacity: isAct(by[d][0]) ? 0.4 : 0.15, dashArray: isAct(by[d][0]) ? null : "3 3" } })
        .bindPopup(`<b>${E(distName(d))}</b><br>` + by[d].map(pop).join("<hr>")).addTo(LG.alerts); }); }
    /* weather warnings: DHM 5-day bulletin provinces */
    const b5 = WX && WX.bulletin5, wxDays = b5 ? b5.days.filter((d) => d.level !== "green") : [], WXC = { yellow: ["#c9a800", "#F5D90A", "पहेँलो चेतावनी", "yellow warning"], orange: ["#b8650a", "#f7941d", "सुन्तले चेतावनी", "orange warning"], red: ["#9e1810", "#e2231a", "रातो चेतावनी", "red warning"] };
    counts.wx = wxDays.length;
    if (on("wx") && b5 && PROV) wxDays.forEach((d) => { const fs = (d.provinces || []).map((p) => PROV.features.find((x) => x.id === p)).filter(Boolean); reg({ k: "wx", col: (WXC[d.level] || WXC.yellow)[0], title: `DHM: ${G.bsDay(d)} ${T(...(WXC[d.level] || WXC.yellow).slice(2))}`, sub: T(d.ne, d.en), agency: T("जल तथा मौसम विज्ञान विभाग", "DHM"), trust: b5.trust || "Official", url: b5.url, time: b5.issued, act: true, b: fs.length ? L.geoJSON({ type: "FeatureCollection", features: fs }).getBounds() : null, html: `<b>DHM: ${E(G.bsDay(d))}</b><br>${E(T(d.ne, d.en))}` }); });
    if (on("wx") && b5 && PROV) wxDays.forEach((d) => (d.provinces || []).forEach((p) => { const f = PROV.features.find((x) => x.id === p); if (f) L.geoJSON(f, { style: { color: (WXC[d.level] || WXC.yellow)[0], weight: 2, dashArray: "6 4", fillColor: (WXC[d.level] || WXC.yellow)[1], fillOpacity: 0.25 } })
      .bindPopup(`<b>DHM: ${E(G.bsDay(d))} ${T(...(WXC[d.level] || WXC.yellow).slice(2))}</b><br>${E(T(d.ne, d.en))}<br>${G.trustChip(b5.trust || "Official")} <span class="meta">${T("जारी", "issued")} ${G.npt(b5.issued)}</span><br><a href="${E(b5.url)}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a>`).addTo(LG.wx); }));
    /* rivers */
    const gs = RV ? RV.gauges.filter((g) => S.rvs.includes(gstat(g)) && (!S.d || DL && (DL.find((x) => x.id === g.district) || {}).code === S.d) && (!S.pr || DL && ((DL.find((x) => x.id === g.district) || {}).code || "").startsWith(S.pr))) : [];
    counts.rv = gs.length;
    const staleTxt = RV_STALE ? T(`पुरानो डेटा: अन्तिम डेटा ${RV.as_of_ne}`, `Stale: last data ${RV.as_of_en}`) : "";
    if (on("rv")) gs.forEach((g) => reg({ k: "rv", col: VCOL[gstat(g)], title: T(g.ne, g.en), sub: `${G.num(g.level.toFixed(2))} m · ${T(...VLB[gstat(g)])}`, agency: T(RV.source_ne, RV.source_en), trust: "Official", url: RV.url, time: RV.as_of, timeTxt: T(RV.as_of_ne, RV.as_of_en), stale: staleTxt, act: !RV_STALE, b: L.latLngBounds([g.ll, g.ll]), html: `<b>${E(T(g.ne, g.en))}</b>`, more: `<p>${T("सतह", "Level")} ${G.num(g.level.toFixed(2))} m · ${T("चेतावनी", "warning")} ${G.num(String(g.warning))} m · ${T("खतरा", "danger")} ${G.num(String(g.danger))} m</p>` }));
    if (on("rv")) gs.forEach((g) => L.circleMarker(g.ll, { radius: 7, color: "#fff", weight: 2, fillColor: VCOL[gstat(g)], fillOpacity: 1 })
      .bindPopup(`<b>${E(T(g.ne, g.en))}</b><br>${G.num(g.level.toFixed(2))} m · ${T("चेतावनी", "warning")} ${G.num(String(g.warning))} · ${T("खतरा", "danger")} ${G.num(String(g.danger))}<br>${G.trustChip("Official")} <span class="meta">${E(T(RV.source_ne, RV.source_en))} · ${E(T(RV.as_of_ne, RV.as_of_en))}</span>${staleTxt ? `<br><span class="mxstale">${E(staleTxt)}</span>` : ""}<br><a href="${E(RV.url)}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a>`, { }).addTo(LG.rv));
    /* roads */
    const rts = RD ? RD.routes.filter((r) => S.rds.includes(r.status)) : [];
    counts.rd = rts.length;
    if (on("rd") && RG) rts.forEach((r) => { const fs = RG.features.filter((f) => f.properties.id === r.id), su = RD.sources[(r.sources || ["pol"])[0]] || RD.sources.pol; reg({ k: "rd", col: RCOL[r.status], title: T(r.name_ne, r.name_en), sub: T(...RLB[r.status]), agency: T(su.ne, su.en), trust: "Official", url: su.u, time: RD.as_of, timeTxt: T(RD.as_of_ne, RD.as_of_en), act: true, b: fs.length ? L.geoJSON({ type: "FeatureCollection", features: fs }).getBounds() : null, html: `<b>${E(T(r.name_ne, r.name_en))}</b>`, more: `<p>${E(T(r.note_ne || "", r.note_en || ""))}</p>` + (r.sources || []).map((k) => RD.sources[k]).filter(Boolean).map((x) => `<a href="${E(x.u)}" target="_blank" rel="noopener">${E(T(x.ne, x.en))} ↗</a>`).join("<br>") }); });
    if (on("rd") && RG) RG.features.forEach((f) => { const r = rts.find((x) => x.id === f.properties.id); if (!r) return;
      L.geoJSON(f, { style: { color: RCOL[r.status], weight: 4, opacity: 0.9, dashArray: r.status === "none" ? "3 6" : null } })
        .bindPopup(`<b>${E(T(r.name_ne, r.name_en))}</b><br>${E(T(...RLB[r.status]))}<br>${G.trustChip("Official")} <span class="meta">${E(T(RD.sources.pol.ne, RD.sources.pol.en))} · ${E(T(RD.as_of_ne, RD.as_of_en))}</span><br><a href="${E(RD.sources.pol.u)}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a>`).addTo(LG.rd); });
    /* earthquakes */
    const Q = ALERTS.filter((a) => a.hazard === "earthquake" && S.ag.includes(G.agencyOf(a)) && S.tr.includes(a.trust) && tmOk(a.sent) && (mag(a) || 0) >= +S.eqm && inArea(a.districts));
    counts.eq = {}; Q.forEach((a) => { const k = G.agencyOf(a); counts.eq[k] = (counts.eq[k] || 0) + 1; });
    if (on("eq")) Q.forEach((a) => reg(aItem(a, "eq")));
    if (on("eq")) Q.forEach((a) => a.areas.forEach((ar) => ar.circles.forEach((c) => { const [la, lo] = c.split(" ")[0].split(",").map(Number), m = mag(a) || 4;
      L.circleMarker([la, lo], { radius: Math.min(18, 4 + Math.max(0, m - 3) * 4), color: "#7c3aed", weight: 1.5, fillColor: "#7c3aed", fillOpacity: 0.3 }).bindPopup(pop(a)).addTo(LG.eq); })));
    /* air */
    if (on("aq")) { if (!aqData) loadAQ(); else aqData.forEach((d, k) => { const v = d && d.current && d.current.us_aqi; if (v == null) return; const c = CITIES[k];
      reg({ k: "aq", col: aqCol(v), title: T(c[0], c[1]), sub: "US AQI " + G.num(String(Math.round(v))), agency: "Open-Meteo (CAMS)", trust: "Model", url: "https://open-meteo.com/en/docs/air-quality-api", time: d.current.time + "+05:45", act: true, b: L.latLngBounds([[c[2], c[3]], [c[2], c[3]]]), html: `<b>${E(T(c[0], c[1]))}</b>: US AQI ${G.num(String(v))}` });
      L.marker([c[2], c[3]], { icon: L.divIcon({ className: "mxaq", html: `<span style="background:${aqCol(v)}">${G.num(String(Math.round(v)))}</span>`, iconSize: [34, 22] }) })
        .bindPopup(`<b>${E(T(c[0], c[1]))}</b>: US AQI ${G.num(String(v))}<br>${G.trustChip("Model")} <span class="meta">Open-Meteo (CAMS) · ${G.npt(d.current.time + "+05:45")}</span><br><a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a>`).addTo(LG.aq); }); }
    counts.aq = aqData ? aqData.filter((d) => d && d.current && d.current.us_aqi != null).length : null;
    /* facilities */
    const inB = (p) => { if (!S.d && !S.pr) return true; return focusB ? focusB.contains([p[0], p[1]]) : true; };
    const hos = HL ? HL.hospitals.filter(inB) : [], heli = AV ? AV.helipads.filter(inB) : [];
    counts.hos = HL ? hos.length : null; counts.heli = AV ? heli.length : null;
    if (on("hos")) hos.forEach((p) => L.circleMarker([p[0], p[1]], { radius: 3.5, color: "#fff", weight: 1, fillColor: "#5f6670", fillOpacity: 1 }).bindTooltip(E(p[2] || T("अस्पताल", "Hospital"))).addTo(LG.hos));
    if (on("heli")) heli.forEach((p) => L.marker([p[0], p[1]], { icon: L.divIcon({ className: "mxheli", html: "H", iconSize: [16, 16] }) }).bindTooltip(E(p[2] || "Helipad")).addTo(LG.heli));
    /* labels */
    if (on("lab")) { if (PROV) PROV.features.forEach((f) => L.marker(f.properties.label, { icon: L.divIcon({ className: "mxlab prov", html: E(T(f.properties.ne, f.properties.en)), iconSize: null }), interactive: false }).addTo(LG.lab));
      if (DIST && map.getZoom() >= 8) DIST.features.forEach((f) => { const c = L.geoJSON(f).getBounds().getCenter(); L.marker(c, { icon: L.divIcon({ className: "mxlab", html: E(T(f.properties.ne, f.properties.en)), iconSize: null }), interactive: false }).addTo(LG.lab); }); }
    /* focus outline */
    if (focusF) L.geoJSON(focusF, { style: { color: "#0B1424", weight: 2.5, fill: false }, interactive: false }).addTo(LG.focus);
    panel(); legend(); details(); writeHash();
  }
  let focusF = null, focusB = null;
  function setFocus(zoom) { focusF = S.d ? distF[S.d] : S.pr && PROV ? PROV.features.find((f) => f.id === S.pr) : null; focusB = focusF ? L.geoJSON(focusF).getBounds() : null; if (zoom) focusB ? map.fitBounds(focusB, { padding: [20, 20] }) : map.fitBounds([[26.3, 80.0], [30.48, 88.2]]); }
  /* ---- panel ---- */
  const P = document.getElementById("mxpanel");
  const chip = (grp, val, label, n, extra = "") => `<button type="button" class="mxchip" data-g="${grp}" data-v="${E(val)}" aria-pressed="${LISTS.includes(grp) ? S[grp].includes(val) : S[grp] === val}"${extra}>${label}${n != null ? ` <span class="mxn">${G.num(String(n))}</span>` : ""}</button>`;
  const perAg = (o) => o && Object.keys(o).length ? Object.entries(o).map(([k, v]) => `${E(k)} ${G.num(String(v))}`).join(" · ") : "";
  function panel() {
    const sw = (c) => `<i class="mxsw" style="background:${c}"></i>`;
    P.querySelector(".mxbody").innerHTML = `
      <fieldset><legend>${T("तहहरू", "Layers")}</legend><div class="mxchips">
        ${chip("L", "alerts", T("सूचना", "Alerts"))}${chip("L", "wx", T("मौसम चेतावनी (DHM)", "Weather warnings (DHM)"), counts.wx)}${chip("L", "rv", T("नदी मापन केन्द्र", "River gauges"), counts.rv)}
        ${chip("L", "rd", T("मुख्य सडक", "Main roads"), counts.rd)}${chip("L", "eq", T("भूकम्प", "Earthquakes"))}${chip("L", "aq", T("हावा (AQI)", "Air (AQI)"), counts.aq)}
        ${chip("L", "hos", T("अस्पताल", "Hospitals"), counts.hos)}${chip("L", "heli", T("हेलिप्याड", "Helipads"), counts.heli)}
        <button type="button" class="mxchip" disabled title="${T("खुला स्थानको डेटा उपलब्ध छैन", "Open-space data not available")}">${T("खुला स्थान", "Open spaces")} <span class="mxn">${T("उपलब्ध छैन", "n/a")}</span></button>
        ${chip("L", "lab", T("नाम", "Labels"))}</div>
        ${S.L.includes("eq") && perAg(counts.eq) ? `<p class="mxhint">${T("भूकम्प, निकायअनुसार", "Earthquakes by agency")}: ${perAg(counts.eq)}</p>` : ""}</fieldset>
      <fieldset><legend>${T("अवस्था र समय", "Status and time")}</legend><div class="mxseg">${chip("st", "active", T("चालु", "Active"))}${chip("st", "expired", T("म्याद सकिएको", "Expired"))}${chip("st", "all", T("सबै", "All"))}</div>
        <div class="mxseg">${chip("tm", "24h", T("२४ घण्टा", "24h"))}${chip("tm", "7d", T("७ दिन", "7d"))}${chip("tm", "30d", T("३० दिन", "30d"))}${chip("tm", "all", T("सबै", "All"))}</div></fieldset>
      <fieldset><legend>${T("स्थान", "Place")}</legend><div class="mxplace">
        <select id="mxpr" aria-label="${T("प्रदेश", "Province")}"><option value="">${T("सबै प्रदेश", "All provinces")}</option>${PROV ? PROV.features.map((f) => `<option value="${f.id}"${S.pr === f.id ? " selected" : ""}>${E(T(f.properties.ne, f.properties.en))}</option>`).join("") : ""}</select>
        <select id="mxd" aria-label="${T("जिल्ला", "District")}"><option value="">${T("सबै जिल्ला", "All districts")}</option>${DIST ? DIST.features.filter((f) => !S.pr || f.properties.province === S.pr).sort((a, b) => T(a.properties.ne, a.properties.en).localeCompare(T(b.properties.ne, b.properties.en))).map((f) => `<option value="${f.id}"${S.d === f.id ? " selected" : ""}>${E(T(f.properties.ne, f.properties.en))}</option>`).join("") : ""}</select></div></fieldset>
      <fieldset><legend>${T("प्रकोप", "Hazard")}</legend><div class="mxchips">${hazards.map((h) => chip("hz", h, E(T(...(HZ[h] || HZ.other))))).join("")}</div></fieldset>
      <fieldset><legend>${T("गम्भीरता", "Severity")}</legend><div class="mxchips">${SEVS.map((s) => chip("sv", s, sw(G.SEVCOLOR[s]) + E(SVN(s)))).join("")}</div></fieldset>
      <fieldset><legend>${T("स्रोत निकाय", "Source agency")}</legend><div class="mxchips">${agencies.map((a) => chip("ag", a, E(a), counts.ag[a] || 0)).join("")}</div>
        <p class="mxhint">${T("सङ्ख्या हरेक निकायको आफ्नै हो; जोडिँदैन।", "Each count is that agency's own; never added together.")}</p></fieldset>
      <fieldset><legend>${T("विश्वास तह", "Trust label")}</legend><div class="mxchips">${TR.map((t) => chip("tr", t, G.trustChip(t))).join("")}</div></fieldset>
      <fieldset><legend>${T("नदी अवस्था", "River status")}</legend><div class="mxchips">${Object.keys(VCOL).map((k) => chip("rvs", k, sw(VCOL[k]) + E(T(...VLB[k])))).join("")}</div></fieldset>
      <fieldset><legend>${T("सडक अवस्था", "Road status")}</legend><div class="mxchips">${Object.keys(RCOL).map((k) => chip("rds", k, sw(RCOL[k]) + E(T(...RLB[k])))).join("")}</div></fieldset>
      <fieldset><legend>${T("भूकम्प म्याग्निच्युड", "Earthquake magnitude")}</legend><div class="mxseg">${["0", "3", "4", "5"].map((m) => chip("eqm", m, m === "0" ? T("सबै", "All") : G.num(m) + "+")).join("")}</div></fieldset>`;
    P.querySelectorAll(".mxchip[data-g]").forEach((b) => (b.onclick = () => { const g = b.dataset.g, v = b.dataset.v;
      if (LISTS.includes(g)) S[g] = S[g].includes(v) ? S[g].filter((x) => x !== v) : [...S[g], v]; else S[g] = v; draw(); }));
    P.querySelector("#mxpr").onchange = (e) => { S.pr = e.target.value; S.d = ""; setFocus(true); draw(); };
    P.querySelector("#mxd").onchange = (e) => { S.d = e.target.value; if (S.d) S.pr = S.d.slice(0, 4); setFocus(true); draw(); };
  }
  function legend() {
    const on = (k) => S.L.includes(k), sw = (c, cls = "") => `<i class="mxsw ${cls}" style="background:${c}"></i>`, rows = [];
    const nc = (k) => { const n = ITEMS.filter((it) => it.k === k).length; return ` <span class="mxn">${G.num(String(n))}</span>`; };
    if (on("alerts")) rows.push(`<div><b>${T("सूचना", "Alerts")}${nc("alerts")}</b>${S.sv.map((s) => `<span>${sw(G.SEVCOLOR[s])}${E(SVN(s))}</span>`).join("")}${S.st !== "active" ? `<span>${sw("transparent", "dash")}${T("म्याद सकिएको", "Expired")}</span>` : ""}</div>`);
    if (on("wx") && counts.wx) rows.push(`<div><b>DHM${nc("wx")}</b><span>${sw("#F5D90A")}${T("पहेँलो चेतावनी (प्रदेश)", "Yellow warning (province)")}</span></div>`);
    if (on("rv")) rows.push(`<div><b>${T("नदी", "Rivers")}${nc("rv")}</b>${RV_STALE ? `<span class="mxstale">${T("पुरानो डेटा", "Stale")}</span>` : ""}${S.rvs.map((k) => `<span>${sw(VCOL[k], "dot")}${E(T(...VLB[k]))}</span>`).join("")}</div>`);
    if (on("rd")) rows.push(`<div><b>${T("सडक", "Roads")}${nc("rd")}</b>${S.rds.map((k) => `<span>${sw(RCOL[k], "line")}${E(T(...RLB[k]))}</span>`).join("")}</div>`);
    if (on("eq")) rows.push(`<div><b>${T("भूकम्प", "Earthquakes")}</b>${perAg(counts.eq) ? `<span class="mxn">${perAg(counts.eq)}</span>` : ""}<span>${sw("#7c3aed", "dot")}${T("ठूलो घेरा = ठूलो म्याग्निच्युड", "Bigger circle = bigger magnitude")}</span></div>`);
    if (on("aq")) rows.push(`<div><b>AQI${counts.aq != null ? nc("aq") : ""}</b>${[[50, "0–50"], [100, "51–100"], [150, "101–150"], [200, "151–200"], [300, "201+"]].map(([v, l]) => `<span>${sw(aqCol(v))}${l}</span>`).join("")}</div>`);
    if (on("hos")) rows.push(`<div><span>${sw("#5f6670", "dot")}${T("अस्पताल (OSM)", "Hospital (OSM)")} <span class="mxn">${G.num(String(counts.hos || 0))}</span></span></div>`);
    if (on("heli")) rows.push(`<div><span><i class="mxheli s">H</i>${T("हेलिप्याड (OSM)", "Helipad (OSM)")} <span class="mxn">${G.num(String(counts.heli || 0))}</span></span></div>`);
    const src = [on("alerts") || on("eq") ? T("सूचना: आधिकारिक निकाय, गतिमार्फत", "Alerts: official agencies via Gati") : "", on("wx") && WX && WX.bulletin5 ? `DHM ${T("५ दिने बुलेटिन", "5-day bulletin")}, ${G.npt(WX.bulletin5.issued)}` : "", on("rv") && RV ? `${E(T(RV.source_ne, RV.source_en))}, ${E(T(RV.as_of_ne, RV.as_of_en))}` : "", on("rd") && RD ? `${E(T(RD.sources.pol.ne, RD.sources.pol.en))}` : "", on("aq") ? "Open-Meteo (CAMS) " + T("मोडेल", "model") : "", on("hos") || on("heli") ? "OpenStreetMap / HOT (HDX)" : ""].filter(Boolean);
    document.getElementById("mxlegend").innerHTML = (rows.join("") || `<p class="meta">${T("कुनै तह छानिएको छैन", "No layer selected")}</p>`) + `<p class="mxsrc">${T("स्रोत", "Sources")}: ${src.join(" · ")}</p>`;
  }
  /* ---- details panel: visible items with agency, trust, source link and source time ---- */
  const DP = document.getElementById("mxdet");
  const LAYN = { alerts: ["सूचना", "Alerts"], wx: ["मौसम चेतावनी (DHM)", "Weather warnings (DHM)"], rv: ["नदी मापन केन्द्र", "River gauges"], rd: ["मुख्य सडक", "Main roads"], eq: ["भूकम्प", "Earthquakes"], aq: ["हावा (AQI)", "Air (AQI)"] };
  const tm = (it) => it.timeTxt ? E(it.timeTxt) : G.npt(it.time);
  const srcLine = (it) => `<span class="meta">${E(it.agency)} · ${tm(it)}</span>${it.url ? ` <a href="${E(it.url)}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a>` : ""}`;
  function focusItem(it) { if (it.b && it.b.isValid()) { const c = it.b.getCenter(); if (it.b.getNorthEast().equals(it.b.getSouthWest())) map.setView(c, Math.max(map.getZoom(), 9)); else map.fitBounds(it.b, { padding: [30, 30], maxZoom: 10 }); L.popup().setLatLng(c).setContent(it.k === "alerts" || it.k === "eq" ? it.html : it.html + "<br>" + srcLine(it)).openOn(map); } }
  function details() { if (!DP) return;
    const vis = ITEMS.filter((it) => !it.b || !it.b.isValid() || map.getBounds().intersects(it.b));
    const sel = ITEMS.find((it) => it.id === selId);
    const head = `<div class="mxdh"><button type="button" class="mxdgrab" aria-expanded="${DP.classList.contains("open")}" aria-label="${T("विवरण खोल्नुहोस् वा बन्द गर्नुहोस्", "Open or close details")}"><i></i></button><h2>${T("नक्सामा देखिएका", "On the map")} <span class="mxn">${G.num(String(vis.length))}</span></h2></div>`;
    if (sel) { DP.querySelector(".mxdin").innerHTML = head + `<div class="mxdsel"><button type="button" class="mxback">← ${T("सूची", "List")}</button>
      <p class="mxdk"><i class="mxsw" style="background:${sel.col}"></i>${E(T(...LAYN[sel.k]))}</p><h3>${E(sel.title)}</h3>${sel.sub ? `<p>${E(sel.sub)}</p>` : ""}
      <p>${sel.sev ? G.sevChip(sel.sev) + " " : ""}${G.trustChip(sel.trust)}${sel.k === "alerts" && !sel.act ? ` <span class="meta">${T("म्याद सकिएको", "Expired")}</span>` : ""}</p>
      ${sel.stale ? `<p class="mxstale">${E(sel.stale)}</p>` : ""}
      <dl class="mxdl"><dt>${T("निकाय", "Agency")}</dt><dd>${E(sel.agency)}</dd><dt>${T("स्रोत समय", "Source time")}</dt><dd>${tm(sel)}</dd><dt>${T("स्रोत", "Source")}</dt><dd>${sel.url ? `<a href="${E(sel.url)}" target="_blank" rel="noopener">${E(sel.url.replace(/^https?:\/\//, "").slice(0, 48))} ↗</a>` : "-"}</dd></dl>${sel.more || ""}</div>`; }
    else { const groups = Object.keys(LAYN).map((k) => [k, vis.filter((it) => it.k === k)]).filter(([, a]) => a.length);
      DP.querySelector(".mxdin").innerHTML = head + (groups.length ? groups.map(([k, a]) => `<section><h3>${E(T(...LAYN[k]))} <span class="mxn">${G.num(String(a.length))}</span></h3>${k === "rv" && RV_STALE ? `<p class="mxstale">${T(`पुरानो डेटा: अन्तिम डेटा ${RV.as_of_ne}`, `Stale: last data ${RV.as_of_en}`)}</p>` : ""}<ul>${a.map((it) => `<li><button type="button" class="mxitem" data-id="${it.id}"><i class="mxsw dot" style="background:${it.col}"></i><span><b>${E(it.title)}</b>${it.sub ? `<small>${E(it.sub)}</small>` : ""}<small>${E(it.agency)} · ${tm(it)} · ${G.trustChip(it.trust)}</small></span></button>${it.url ? `<a class="mxsrcl" href="${E(it.url)}" target="_blank" rel="noopener" aria-label="${T("स्रोत", "Source")}">↗</a>` : ""}</li>`).join("")}</ul></section>`).join("")
        : `<p class="meta">${T("यो दृश्यमा कुनै वस्तु छैन। नक्सा सार्नुहोस् वा फिल्टर बदल्नुहोस्।", "Nothing in this view. Move the map or change filters.")}</p>`)
        + (S.L.includes("hos") || S.L.includes("heli") ? `<p class="mxhint">${T("अस्पताल र हेलिप्याड नक्सामा मात्र देखाइन्छ", "Hospitals and helipads are shown on the map only")} (OpenStreetMap / HOT, HDX).</p>` : ""); }
    DP.querySelectorAll(".mxitem").forEach((b) => (b.onclick = () => { selId = b.dataset.id; const it = ITEMS.find((x) => x.id === selId); DP.classList.add("open"); details(); focusItem(it); }));
    const bk = DP.querySelector(".mxback"); if (bk) bk.onclick = () => { selId = null; map.closePopup(); details(); };
    DP.querySelector(".mxdgrab").onclick = () => { DP.classList.toggle("open"); details(); };
  }
  map.on("moveend", () => { if (!selId) details(); });
  /* ---- controls ---- */
  P.querySelector(".mxreset").onclick = () => { S = JSON.parse(JSON.stringify(DEF)); setFocus(true); draw(); };
  P.querySelector(".mxmine").onclick = () => { const my = G.district && G.district.get(); if (!my) { G.district && G.district.open && G.district.open(() => { S.d = G.district.get() || ""; S.pr = S.d.slice(0, 4); setFocus(true); draw(); }); return; } S.d = my; S.pr = my.slice(0, 4); setFocus(true); draw(); };
  P.querySelector(".mxshare").onclick = async () => { const u = location.href; try { if (navigator.share) await navigator.share({ title: document.title, url: u }); else { await navigator.clipboard.writeText(u); P.querySelector(".mxshare").textContent = T("लिङ्क कपी भयो", "Link copied"); } } catch (e) {} };
  const sheet = document.getElementById("mxsheetbtn"); sheet.onclick = () => { const o = P.classList.toggle("open"); sheet.setAttribute("aria-expanded", o); document.querySelector(".mxwrap").classList.toggle("fopen", o); setTimeout(() => map.invalidateSize(), 260); };
  P.querySelector(".mxclose").onclick = () => { P.classList.remove("open"); document.querySelector(".mxwrap").classList.remove("fopen"); setTimeout(() => map.invalidateSize(), 260); sheet.setAttribute("aria-expanded", "false"); };
  map.on("zoomend", () => S.L.includes("lab") && draw());
  window.addEventListener("hashchange", () => { readHash(); setFocus(true); draw(); });
  G.onLang(() => draw());
  setFocus(!!(S.d || S.pr)); if (!(S.d || S.pr) && innerWidth < 600) map.setView([28.25, 84.1], 6.25); draw();
  /* Route from Route check: map/?route=from,to draws the chosen route bold and up to 2 alternatives dashed, in status colours */
  const rq = new URLSearchParams(location.search).get("route");
  if (rq && G.routeEngine && RD && RG) { const [a, b] = rq.split(","), EN = G.routeEngine(RD, RG);
    if (RD.nodes[a] && RD.nodes[b] && a !== b) { const RTS = EN.routes(a, b), fb = []; map.createPane("gatiRoute").style.zIndex = 460; const RLG = L.layerGroup().addTo(map), PN = { pane: "gatiRoute" }; document.getElementById("mxmap").classList.add("mxrouting");
      const featsOf = (r) => RG.features.filter((f) => r.ids.includes(f.properties.id));
      const sty = (f, main) => { const r = RD.routes.find((x) => x.id === f.properties.id) || {}; return main ? { color: RCOL[r.status] || RCOL.none, weight: 9, opacity: 1, lineCap: "round" } : { color: RCOL[r.status] || RCOL.none, weight: 4, opacity: .95, dashArray: "8 7" }; };
      RTS.slice(1).forEach((r, k) => { L.geoJSON({ type: "FeatureCollection", features: featsOf(r) }, { ...PN, style: { color: "#fff", weight: 8, opacity: .95 }, interactive: false }).addTo(RLG); const g = L.geoJSON({ type: "FeatureCollection", features: featsOf(r) }, { ...PN, style: (f) => sty(f, false) }).bindTooltip(T(`वैकल्पिक मार्ग ${G.num(k + 1)}`, `Alternative ${k + 1}`)).addTo(RLG); fb.push(g.getBounds()); });
      if (RTS[0]) { L.geoJSON({ type: "FeatureCollection", features: featsOf(RTS[0]) }, { ...PN, style: { color: "#fff", weight: 15, opacity: 1 }, interactive: false }).addTo(RLG);
        const g = L.geoJSON({ type: "FeatureCollection", features: featsOf(RTS[0]) }, { ...PN, style: (f) => sty(f, true) }).bindTooltip(T("छानिएको मार्ग", "Chosen route")).addTo(RLG); fb.unshift(g.getBounds());
        [a, b].forEach((k, i) => L.marker(RD.nodes[k].ll, { zIndexOffset: 1000, icon: L.divIcon({ className: "rend " + (i ? "re" : "rs"), html: i ? "B" : "A", iconSize: [28, 28] }) }).bindTooltip(E(T(RD.nodes[k].ne, RD.nodes[k].en)), { permanent: true, direction: "top", offset: [0, -14], className: "rtip" }).addTo(RLG));
        const bb = fb.reduce((x, y) => x.extend(y)); const fit = () => { map.invalidateSize(); map.fitBounds(bb.pad(0.1)); }; fit(); setTimeout(fit, 400);
        const box = document.createElement("div"); box.className = "mxroute card"; box.setAttribute("role", "status");
        const paint = () => { box.innerHTML = `<b>${E(T(RD.nodes[a].ne, RD.nodes[a].en))} → ${E(T(RD.nodes[b].ne, RD.nodes[b].en))}</b><ul>${RTS.map((r, k) => `<li><i class="${k ? "alt" : "main"}"></i>${k ? T(`विकल्प ${G.num(k)}`, `Option ${k}`) : T("छानिएको", "Chosen")}: ${EN.fmtKm(r.km)} · ${EN.eta(r.h)}${r.blocked ? " ⛔" : ""}</li>`).join("")}</ul><small>${T("अनुमानित, सामान्य अवस्थामा", "Estimate, normal conditions")} · <a href="${R}route/">${T("मार्ग जाँच", "Route check")}</a></small>`; };
        paint(); G.onLang(paint); const C = L.control({ position: "bottomleft" }); C.onAdd = () => { L.DomEvent.disableClickPropagation(box); return box; }; C.addTo(map); } } }
  window.__mx = { map, S };
})();
