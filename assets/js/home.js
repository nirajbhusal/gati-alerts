/* Home dashboard: map, KPI strip, on-page charts, feed list and updates.
   Data: data/alerts.json (built from CAP files), data/roads.json, data/updates.json.
   Charts count Gati items only; figures from different agencies are never summed. */
(async function () {
  const G = window.Gati;
  const [data, districts, geo, roads, upd] = await Promise.all([G.json("data/alerts.json"), G.json("data/districts.json"),
    G.json("data/districts.geojson"), G.json("data/roads.json"), G.json("data/updates.json")]);
  const DN = Object.fromEntries(districts.map((d) => [d.code, d]));
  /* NP-DISTRICT code -> outer rings as [lat, lng] (COD-AB, simplified) */
  const polys = Object.fromEntries(geo.features.map((f) => {
    const g = f.geometry, parts = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    return [f.id, parts.map((p) => p[0].map(([lo, la]) => [la, lo]))];
  }));
  const now = Date.now();
  data.alerts.forEach((a) => (a.expired = new Date(a.expires).getTime() < now));
  const $ = (id) => document.getElementById(id);
  const ne = () => G.lang === "ne";
  const T = (n, e) => (ne() ? n : e);
  const sel = $("fDistrict"), sortSel = $("fSort"), showExp = $("fExpired");
  const params = new URLSearchParams(location.search);
  const MYD = "gati-district";
  if (!params.get("district") && localStorage.getItem(MYD)) sel.dataset.v = localStorage.getItem(MYD);
  if (params.get("district")) { const q = params.get("district"); sel.dataset.v = (districts.find((d) => d.id === q || d.code === q) || {}).code || ""; }

  const HAZ = { flood: ["बाढी", "Flood", "🌊"], road: ["सडक", "Road", "🛣"], weather: ["मौसम", "Weather", "🌧"], landslide: ["पहिरो", "Landslide", "⛰"],
    avalanche: ["हिमपहिरो", "Avalanche", "❄"], earthquake: ["भूकम्प", "Earthquake", "〰"], fire: ["आगलागी", "Fire", "🔥"] };
  const hz = (h) => HAZ[h] || [h || "अन्य", h || "Other", "•"];
  const AGENCY = { "hydrology.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "neoc.moha.gov.np": "NEOC", "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "bipadportal.gov.np": "BIPAD" };
  const agency = (a) => { const v = AGENCY[a.sender] || a.sender; return Array.isArray(v) ? T(v[0], v[1]) : v; };
  const RC = { open: "#15803d", oneway: "#1d4ed8", night: "#b45309", closed: "#b91c1c", none: "#94a3b8" };
  const RW = { open: ["खुला", "Open"], oneway: ["एकतर्फी", "One-way"], night: ["राति बन्द", "Closed at night"], closed: ["बन्द", "Blocked"], none: ["स्थिति पुष्टि भएन", "Not confirmed"] };
  const rw = (s) => T(...RW[s]);

  /* ---------- scope ---------- */
  const anyActive = data.alerts.some((a) => !a.expired);
  let scope = params.get("scope") || (anyActive ? "active" : "30");
  if (scope === "all") scope = "30";
  const inScope = (a) => scope === "all" ? true : scope === "active" ? !a.expired : now - new Date(a.sent) < 30 * 864e5;

  /* ---------- feed cards ---------- */
  function fillSort() { sortSel.querySelectorAll("option").forEach((o) => (o.textContent = o.dataset[G.lang])); }
  function fillDistricts() {
    fillSort();
    const used = new Set(data.alerts.flatMap((a) => a.districts));
    const name = (d) => (ne() ? d.ne : d.en);
    const sorted = [...districts].sort((a, b) => name(a).localeCompare(name(b), G.lang));
    const v = sel.value || sel.dataset.v || "";
    sel.innerHTML = `<option value="">${T("सबै जिल्ला", "All districts")}</option>` +
      sorted.map((d) => `<option value="${d.code}">${G.esc(name(d))}${used.has(d.code) ? " •" : ""}</option>`).join("");
    sel.value = v;
  }
  const areaName = (a) => (a.districts[0] ? (ne() ? DN[a.districts[0]]?.ne : DN[a.districts[0]]?.en) || "" : a.info[G.lang].areas[0]?.desc || "");
  const MT = { Alert: ["मूल सूचना", "Original"], Update: ["अद्यावधिक", "Update"], Cancel: ["रद्द", "Cancel"] };
  function chain(a) {
    if (!a.chain || !a.chain.length) return "";
    const steps = a.chain.map((c, k) => {
      const lab = `${G.num(k + 1)}. ${T(...MT[c.msgType])}${c.state ? " · " + T(...{ Corrected: ["सच्याइएको", "Corrected"], Retracted: ["फिर्ता लिइएको", "Retracted"] }[c.state]) : ""} <span class="meta">${G.npt(c.sent)}</span>`;
      return c.id === a.identifier ? `<strong aria-current="true">${lab}</strong>` : `<a href="#${G.esc(c.id)}">${lab}</a>`;
    }).join(" → ");
    const sup = a.supersededBy ? `<br><span class="meta">${T("यो सूचना पछि अद्यावधिक भएको छ। पछिल्लो संस्करण हेर्नुहोस्।", "This notice was later updated. See the latest version.")}</span>` : "";
    return `<div class="vchain"><span aria-hidden="true">🔗</span> ${T("संस्करण", "Versions")}: ${steps}${sup}</div>`;
  }
  function card(a) {
    const i = a.info[G.lang], en = a.info.en;
    const areas = i.areas.map((x) => x.desc).join(" · ");
    const corr = i.params["gati:correction"], src2 = i.params["gati:sourceUrl2"];
    return `<article class="card alert s-${a.severity}${a.expired ? " expired" : ""}" id="${G.esc(a.identifier)}">
      <div class="chips">${G.sevChip(a.severity)}${G.trustChip(a.trust)}${a.state ? G.trustChip(a.state) : ""}
        ${a.expired ? `<span class="tag exp">${T("म्याद सकियो", "Expired")}</span>` : `<span class="tag">${T("चालु", "Active")}</span>`}
        <span class="tag">${G.esc(i.event)}</span></div>
      <h4>${G.esc(i.headline)}</h4>
      <p class="meta">📍 ${G.esc(areas)}</p>
      <p class="meta">🕒 ${T("जारी", "Issued")}: ${G.npt(a.sent)} · ${T("म्याद", "Expires")}: ${G.npt(a.expires)}</p>
      ${corr ? `<div class="correction">✎ ${G.esc(corr)}</div>` : ""}
      ${chain(a)}
      ${i.instruction && !a.expired ? `<div class="instr"><strong>${T("के गर्ने", "What to do")}:</strong> ${G.esc(i.instruction)}</div>` : ""}
      <p class="meta src">${T("स्रोत", "Source")}: <strong>${G.esc(i.senderName)}</strong> · <a href="${G.esc(i.web)}" rel="noopener" target="_blank">${T("मूल सूचना", "Original notice")} ↗</a> · <a href="alerts/${G.esc(a.identifier)}/">${T("स्थायी लिङ्क र सेयर", "Permalink and share")}</a>${src2 ? ` · <a href="${G.esc(src2)}" rel="noopener" target="_blank">${T("दोस्रो स्रोत", "Second source")} ↗</a>` : ""}</p>
      <details><summary>${T("पूरा विवरण", "Details")}</summary>
        ${a.expired && i.instruction ? `<p><strong>${T("त्यति बेलाको निर्देशन", "Instruction at the time")}:</strong> ${G.esc(i.instruction)}</p>` : ""}
        <p>${G.esc(i.description)}</p>
        <p class="meta">CAP: urgency ${en.urgency} · severity ${en.severity} · certainty ${en.certainty} · sender <code>${G.esc(a.sender)}</code><br>
        <a href="${G.esc(a.file)}">CAP 1.2 XML</a> · <a href="${G.esc(i.params["gati:bulletinFile"])}" rel="noopener">${T("डेटा स्रोत", "Data provenance")}</a></p>
      </details></article>`;
  }

  /* ---------- map (no tile server: muted districts, real road lines, rivers) ---------- */
  const [roadGeo, riverGeo, gauges] = await Promise.all([G.json("data/geo/roads.geojson"), G.json("data/geo/rivers.geojson"), G.json("data/rivers.json")]);
  const ROADGEO = Object.fromEntries(roadGeo.features.map((f) => [f.properties.id, f]));
  const layersOn = { alerts: true, roads: true, rivers: true };
  let map, baseLayer, areaLayer, roadLayer, riverLayer, labelLayer, picked = null;
  const HZICON = { flood: "🌊", road: "🛣", weather: "🌦", landslide: "⛰", avalanche: "❄", earthquake: "〰", fire: "🔥" };
  const centroid = (p) => { let la = 0, lo = 0; p.forEach(([a, b]) => { la += a; lo += b; }); return [la / p.length, lo / p.length]; };
  const gaugePct = (g) => g.level / g.warning;
  const gaugeState = (g) => (g.danger && g.level >= g.danger ? "danger" : g.level >= g.warning ? "warning" : "below");
  const GSC = { below: "#0F7C86", warning: "#E8770E", danger: "#C81E1E" };
  const GSW = { below: ["चेतावनी तहमुनि", "Below warning"], warning: ["चेतावनी तहमाथि", "Above warning"], danger: ["खतरा तहमाथि", "Above danger"] };
  function fit() { if (!map) return; map.invalidateSize(); map.fitBounds([[26.35, 80.06], [30.45, 88.2]], { padding: matchMedia("(max-width:600px)").matches ? [0, 0] : [8, 8] }); }
  function initMap() {
    if (!window.L) { $("map").innerHTML = `<p class="empty">${T("नक्सा खुलेन।", "Map unavailable.")}</p>`; return; }
    map = L.map("map", { scrollWheelZoom: false, zoomSnap: 0.1, attributionControl: true, minZoom: 4.5, maxZoom: 12, maxBounds: [[24.5, 78], [32, 90.5]] });
    map.attributionControl.setPrefix("").addAttribution(T("सडक रेखा: © OpenStreetMap योगदानकर्ता", "Road lines: © OpenStreetMap contributors"));
    window.__gmap = map; baseLayer = L.featureGroup().addTo(map); riverLayer = L.featureGroup().addTo(map); areaLayer = L.featureGroup().addTo(map);
    roadLayer = L.featureGroup().addTo(map); labelLayer = L.featureGroup().addTo(map);
    Object.values(polys).forEach((p) => L.polygon(p.map((r) => [r]), { color: "#c9d3dd", weight: 0.8, fillColor: "#f1f4f7", fillOpacity: 1, interactive: false }).addTo(baseLayer));
    fit(); requestAnimationFrame(fit); window.addEventListener("load", fit);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(fit, 200); });
    map.on("click", () => { picked = null; summary(); });
    document.querySelectorAll(".lchip").forEach((b) => (b.onclick = () => { layersOn[b.dataset.layer] = !layersOn[b.dataset.layer]; drawMap(); }));
  }
  const pick = (p) => (e) => { L.DomEvent.stopPropagation(e); picked = p; summary(); if (matchMedia("(max-width:899px)").matches) $("sumcard").scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  function icon(html, cls, size = 40) { if (matchMedia("(max-width:600px)").matches) size = Math.round(size * 0.72); return L.divIcon({ className: "", html: `<span class="mk ${cls}" style="width:${size}px;height:${size}px">${html}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }); }
  function drawMap() {
    if (!map) return;
    [areaLayer, roadLayer, riverLayer, labelLayer].forEach((l) => l.clearLayers());
    const list = data.alerts.filter(inScope);
    if (layersOn.rivers) {
      riverGeo.features.forEach((f) => L.geoJSON(f, { style: { color: "#7FB8E6", weight: 2.5, opacity: 0.9 }, interactive: false })
        .eachLayer((l) => { l.addTo(riverLayer); }));
      [["नारायणी", "Narayani", 27.55, 84.2], ["कर्णाली", "Karnali", 28.95, 81.45], ["कोशी", "Koshi", 26.75, 87.05]].forEach(([n, e, la, lo]) =>
        L.marker([la, lo], { icon: L.divIcon({ className: "rivlab", html: G.esc(T(n, e)), iconSize: [90, 20], iconAnchor: [45, 10] }), interactive: false }).addTo(riverLayer));
      gauges.gauges.forEach((g) => { const st = gaugeState(g);
        L.marker(g.ll, { icon: icon("💧", "mk-gauge mk-" + st, 34), keyboard: true, title: T(g.ne, g.en) }).on("click", pick({ type: "gauge", g })).addTo(riverLayer); });
    }
    if (layersOn.alerts) {
      const byD = {};
      list.forEach((a) => a.districts.forEach((d) => (byD[d] = byD[d] || []).push(a)));
      Object.entries(byD).forEach(([d, al]) => {
        if (!polys[d]) return;
        al.sort((x, y) => (x.expired - y.expired) || G.SEVORDER.indexOf(x.severity) - G.SEVORDER.indexOf(y.severity));
        const c = G.SEVCOLOR[al[0].severity], allExp = al.every((a) => a.expired);
        L.polygon(polys[d].map((r) => [r]), { color: c, weight: allExp ? 1.5 : 2.5, dashArray: allExp ? "5 5" : null, fillColor: c, fillOpacity: allExp ? 0.18 : 0.42 })
          .on("click", pick({ type: "district", d, al })).addTo(areaLayer);
      });
      // one big hazard icon per alert: at its point(s), else at its first district's centre
      const seen = new Set();
      list.forEach((a) => {
        const i = a.info[G.lang], pts = [];
        i.areas.forEach((ar) => ar.circles.forEach((cs) => pts.push(cs.split(" ")[0].split(",").map(Number))));
        if (!pts.length && a.districts[0] && polys[a.districts[0]]) pts.push(centroid(polys[a.districts[0]][0]));
        if (a.hazard === "flood" && a.severity === "Unknown" && pts.length > 2) return; // river readings: shown as gauges
        pts.forEach((ll) => { const k = ll.join() + a.hazard; if (seen.has(k)) return; seen.add(k);
          L.marker(ll, { icon: icon(HZICON[a.hazard] || "⚠", `mk-alert s-${a.severity}${a.expired ? " is-exp" : ""}`, a.expired ? 34 : 44), title: i.headline, riseOnHover: true, zIndexOffset: a.expired ? 0 : 500 })
            .on("click", pick({ type: "alert", a })).addTo(areaLayer); });
      });
    }
    if (layersOn.roads) {
      const ord = (r) => (r.status === "none" ? 0 : 1);
      [...roads.routes].sort((a, b) => ord(a) - ord(b)).forEach((r) => {
        const f = ROADGEO[r.id]; if (!f) return; const q = r.status === "none";
        L.geoJSON(f, { style: { color: "#fff", weight: q ? 7 : 10, opacity: 1 }, interactive: false }).addTo(roadLayer);
        L.geoJSON(f, { style: { color: RC[r.status], weight: q ? 3.5 : 6, dashArray: q ? "5 7" : null, lineCap: "round" }, interactive: false }).addTo(roadLayer);
        L.geoJSON(f, { style: { color: "#000", opacity: 0, weight: 26 } }).on("click", pick({ type: "road", r })).addTo(roadLayer);
      });
      // Aarughat blockage (not one of the 17 corridors) is drawn by its alert icon.
    }
    const small = matchMedia("(max-width:600px)").matches;
    const TOWNS = small ? ["ktm", "pokhara", "butwal", "nepalgunj", "dhangadhi", "itahari"] : ["ktm", "pokhara", "butwal", "nepalgunj", "dhangadhi", "itahari", "hetauda", "narayanghat", "kakarbhitta", "dhunche", "baglung", "bardibas"];
    TOWNS.forEach((k) => { const n = roads.nodes[k]; if (!n) return;
      L.circleMarker(n.ll, { radius: k === "ktm" ? 5 : 3.5, color: "#0E2A47", weight: 2, fillColor: "#fff", fillOpacity: 1, interactive: false }).addTo(labelLayer);
      L.marker(n.ll, { icon: L.divIcon({ className: "townlab" + (k === "ktm" ? " cap" : ""), html: G.esc(T(n.ne, n.en).replace(/ \(.*\)/, "")), iconSize: [110, 18], iconAnchor: [-6, 20] }), interactive: false }).addTo(labelLayer); });
    document.querySelectorAll("[data-scope]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.scope === scope));
    document.querySelectorAll(".lchip").forEach((b) => b.setAttribute("aria-pressed", layersOn[b.dataset.layer]));
    $("mapLegend").innerHTML = `<ul>${G.SEVORDER.map((s) => `<li><span class="sw" style="background:${G.SEVCOLOR[s]}"></span>${G.esc(ne() ? G.SEV[s][0] : G.SEV[s][1])}</li>`).join("")}
      <li><span class="sw sw-exp"></span>${T("म्याद सकिएको", "Expired")}</li></ul>
      <ul>${["open", "oneway", "closed", "none"].map((s) => `<li><span class="ln ln-${s}" style="--c:${RC[s]}"></span>${G.esc(rw(s))}</li>`).join("")}
      <li><span class="mk mk-gauge mk-below mini">💧</span>${T("नदी मापन केन्द्र", "River gauge")}</li></ul>`;
    $("mapNote").innerHTML = T(`नक्सामा जुनसुकै चिह्न, सडक वा जिल्ला थिच्नुहोस्: सार देखिन्छ। सडक: ${G.esc(roads.as_of_ne)}। ${G.esc(roads.rule_ne)} ${G.esc(roads.geometry_note_ne)} जिल्लाको सीमा मोटामोटी मात्र। यो नक्सामा बाहिरी टाइल सर्भर छैन — सबै डेटा यही साइटबाट आउँछ।`,
      `Tap any icon, road or district for a summary. Roads: ${G.esc(roads.as_of_en)}. ${G.esc(roads.rule_en)} ${G.esc(roads.geometry_note_en)} District outlines are simplified. This map uses no outside tile server; all map data is served from this site.`);
    summary(); roadList();
  }
  function srcLinks(keys) { return keys.map((k) => `<a href="${G.esc(roads.sources[k].u)}" target="_blank" rel="noopener">${G.esc(ne() ? roads.sources[k].ne : roads.sources[k].en)}</a>`).join(" · "); }
  function alertBlock(a) { const i = a.info[G.lang];
    return `<div class="chips">${G.sevChip(a.severity)}${G.trustChip(a.trust)}${a.expired ? `<span class="tag exp">${T("म्याद सकियो", "Expired")}</span>` : `<span class="tag">${T("चालु", "Active")}</span>`}</div>
      <p class="sumh">${G.esc(i.headline)}</p><p class="meta">${G.esc(agency(a))} · ${G.npt(a.sent)}</p>
      <p class="meta"><a href="#${encodeURIComponent(a.identifier)}">${T("सूचीमा पूरा विवरण", "Full details in list")}</a> · <a href="${G.esc(i.web)}" target="_blank" rel="noopener">${T("मूल सूचना", "Original")} ↗</a></p>`; }
  function summary() {
    const el = $("sumcard"), p = picked;
    if (!p) {
      const act = data.alerts.filter((a) => !a.expired);
      el.innerHTML = `<p class="kick">${T("नक्सामा केही थिच्नुहोस्", "Tap something on the map")}</p>
        <p class="sumh">${act.length ? T(`${G.num(act.length)} चालु सूचना`, `${act.length} active alert${act.length > 1 ? "s" : ""}`) : T("कुनै चालु सूचना छैन", "No active alert")}</p>
        ${act.slice(0, 3).map((a) => `<button type="button" class="sumpick" data-id="${G.esc(a.identifier)}"><span aria-hidden="true">${HZICON[a.hazard] || "⚠"}</span> ${G.esc(a.info[G.lang].headline)}</button>`).join("")}`;
      el.querySelectorAll(".sumpick").forEach((b) => (b.onclick = () => { picked = { type: "alert", a: data.alerts.find((x) => x.identifier === b.dataset.id) }; summary(); }));
      return;
    }
    let h = "";
    if (p.type === "alert") h = `<p class="kick">${G.esc(T(hz(p.a.hazard)[0], hz(p.a.hazard)[1]))}</p>` + alertBlock(p.a);
    if (p.type === "district") h = `<p class="kick">${G.esc(ne() ? DN[p.d].ne : DN[p.d].en)} · ${G.num(p.al.length)} ${T("सूचना", p.al.length > 1 ? "alerts" : "alert")}</p>` + p.al.slice(0, 4).map(alertBlock).join("<hr>");
    if (p.type === "road") { const r = p.r;
      h = `<p class="kick">${T("मुख्य सडक", "Main road")}</p><p class="sumh">${G.esc(ne() ? r.name_ne : r.name_en)}</p>
        <span class="rpill" style="background:${RC[r.status]}">${G.esc(rw(r.status))}</span><p>${G.esc(ne() ? r.note_ne : r.note_en)}</p>
        ${r.sources.length ? `<p class="meta">${T("स्रोत", "Sources")}: ${srcLinks(r.sources)}</p>` : ""}<p class="meta">${G.esc(ne() ? roads.as_of_ne : roads.as_of_en)}</p>`; }
    if (p.type === "gauge") { const g = p.g, st = gaugeState(g);
      h = `<p class="kick">${T("नदी मापन केन्द्र", "River gauge")}</p><p class="sumh">${G.esc(T(g.ne, g.en))}</p>
        <span class="rpill" style="background:${GSC[st]}">${G.esc(T(...GSW[st]))}</span>${gaugeBar(g)}
        <p class="meta">${T("स्रोत", "Source")}: <a href="${G.esc(gauges.url)}" target="_blank" rel="noopener">${G.esc(T(gauges.source_ne, gauges.source_en))}</a> · ${G.esc(T(gauges.as_of_ne, gauges.as_of_en))}</p>`; }
    el.innerHTML = h + `<button type="button" class="btn alt small" id="sumclose">${T("बन्द गर्नुहोस्", "Close")}</button>`;
    $("sumclose").onclick = () => { picked = null; summary(); };
  }
  function roadList() {
    const order = { closed: 0, night: 1, oneway: 2, none: 3, open: 4 };
    $("roadList").innerHTML = [...roads.routes].sort((a, b) => order[a.status] - order[b.status]).map((r) =>
      `<li><button type="button" data-r="${r.id}"><span class="rl-bar" style="background:${RC[r.status]}"></span><span class="rl-n">${G.esc(ne() ? r.name_ne : r.name_en)}</span><span class="rl-s" style="color:${RC[r.status]}">${G.esc(rw(r.status))}</span></button></li>`).join("");
    $("roadList").querySelectorAll("button").forEach((b) => (b.onclick = () => { picked = { type: "road", r: roads.routes.find((x) => x.id === b.dataset.r) }; summary();
      const f = ROADGEO[b.dataset.r]; if (map && f) map.fitBounds(L.geoJSON(f).getBounds(), { padding: [30, 30], maxZoom: 9 }); }));
  }
  function gaugeBar(g) {
    const max = (g.danger || g.warning) * 1.15, pc = (v) => Math.min(100, (v / max) * 100), st = gaugeState(g);
    return `<div class="gbar" role="img" aria-label="${G.esc(`${T(g.ne, g.en)}: ${g.level} m; ${T("चेतावनी", "warning")} ${g.warning} m${g.danger ? `; ${T("खतरा", "danger")} ${g.danger} m` : ""}`)}">
      <span class="gfill" style="width:${pc(g.level)}%;background:${GSC[st]}"></span>
      <span class="gtick warn" style="left:${pc(g.warning)}%"></span>${g.danger ? `<span class="gtick dang" style="left:${pc(g.danger)}%"></span>` : ""}</div>
      <div class="gleg"><span><b>${G.num(g.level.toFixed(1))}</b> ${T("मि.", "m")}</span><span class="w">▲ ${T("चेतावनी", "Warning")} ${G.num(g.warning.toFixed(1))}</span>${g.danger ? `<span class="d">▲ ${T("खतरा", "Danger")} ${G.num(g.danger.toFixed(1))}</span>` : ""}</div>`;
  }
  function gaugesCard() {
    $("gauges").innerHTML = `<ul class="gauges">${gauges.gauges.map((g) => `<li><p class="gname">${G.esc(T(g.ne, g.en))} <span class="meta">· ${G.esc(ne() ? DN[g.district]?.ne : DN[g.district]?.en)}</span></p>${gaugeBar(g)}</li>`).join("")}</ul>
      <p class="meta">${T("बार = अहिलेको सतह; सुन्तला रेखा = चेतावनी तह; रातो रेखा = खतरा तह।", "Bar = current level; orange line = warning level; red line = danger level.")} ${T("स्रोत", "Source")}: <a href="${G.esc(gauges.url)}" target="_blank" rel="noopener">${G.esc(T(gauges.source_ne, gauges.source_en))}</a> · ${G.esc(T(gauges.as_of_ne, gauges.as_of_en))}</p>`;
  }
  function glance() {
    const act = data.alerts.filter((a) => !a.expired);
    const wx = data.alerts.filter((a) => a.hazard === "weather").sort((a, b) => b.sent.localeCompare(a.sent))[0];
    const rc = roads.routes.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
    const below = gauges.gauges.filter((g) => gaugeState(g) === "below").length;
    const roadAlerts = act.filter((a) => a.hazard === "road");
    const today = G.npt(new Date().toISOString()).split(" · ")[0];
    const tile = (ic, k, big, sub, cls = "") => `<div class="gl ${cls}"><span class="glic" aria-hidden="true">${ic}</span><div><p class="glk">${k}</p><p class="glb">${big}</p>${sub ? `<p class="gls">${sub}</p>` : ""}</div></div>`;
    $("glance").innerHTML = `<p class="gldate">${G.esc(today)}</p><div class="glgrid">` +
      tile("⚠", T("चालु सूचना", "Active alerts"), G.num(act.length), act.length ? act.map((a) => G.esc(T(hz(a.hazard)[0], hz(a.hazard)[1]))).filter((v, i, s) => s.indexOf(v) === i).join(" · ") : T("अहिले केही छैन", "None right now"), act.some((a) => ["Extreme", "Severe"].includes(a.severity)) ? "hot" : "") +
      tile("🌦", T("मौसम", "Weather"), wx && !wx.expired ? T("अधिकांश ठाउँमा सफा", "Mostly fair") : T("पुष्टि भएको छैन", "Not confirmed"), wx && !wx.expired ? G.esc(T("कोशी र गण्डकीका हिमालमा एक–दुई ठाउँमा हल्का वर्षा/हिमपात", "Light rain/snow at a few spots in the Koshi and Gandaki mountains")) + ` · ${G.trustChip(wx.trust)}` : "") +
      tile("💧", T("नदी", "Rivers"), T(`${G.num(below)}/${G.num(gauges.gauges.length)} चेतावनी तहमुनि`, `${below}/${gauges.gauges.length} below warning`), G.esc(T(gauges.as_of_ne, gauges.as_of_en)), below === gauges.gauges.length ? "ok" : "hot") +
      tile("🛣", T("मुख्य सडक", "Main roads"), T(`${G.num(rc.open || 0)} खुला`, `${rc.open || 0} open`), T(`${G.num(rc.closed || 0)} बन्द · ${G.num(rc.oneway || 0)} एकतर्फी · ${G.num(rc.none || 0)} पुष्टि भएन`, `${rc.closed || 0} blocked · ${rc.oneway || 0} one-way · ${rc.none || 0} not confirmed`)) +
      tile("🚧", T("अन्य सडक अवरोध", "Other road blockages"), G.num(roadAlerts.length), roadAlerts.map((a) => G.esc(a.info[G.lang].headline.split(":")[0])).join(" · ") || T("प्रहरीको सूचीमा छैन", "None on the Police list")) +
      `</div>`;
  }

  /* ---------- KPIs ---------- */
  function kpis() {
    const act = data.alerts.filter((a) => !a.expired), exp = data.alerts.filter((a) => a.expired);
    const hzc = {}; data.alerts.forEach((a) => (hzc[a.hazard] = (hzc[a.hazard] || 0) + 1));
    const dset = new Set(data.alerts.flatMap((a) => a.districts)), dact = new Set(act.flatMap((a) => a.districts));
    const latest = data.alerts.reduce((m, a) => (a.sent > m ? a.sent : m), "");
    const k = (n, l, sub, cls = "") => `<div class="kpi ${cls}"><b>${G.num(n)}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ""}</div>`;
    $("kpis").innerHTML =
      k(act.length, T("चालु सूचना", "Active alerts"), "", act.length ? "hot" : "") +
      k(exp.length, T("म्याद सकिएका", "Expired"), "") +
      k(dset.size, T("प्रभावित जिल्ला", "Districts affected"), T(`चालु: ${G.num(dact.size)}`, `active: ${dact.size}`)) +
      `<div class="kpi hz"><span>${T("खतराअनुसार", "By hazard")}</span><ul>${Object.entries(hzc).sort((a, b) => b[1] - a[1]).map(([h, n]) =>
        `<li><span aria-hidden="true">${hz(h)[2]}</span> ${G.esc(T(hz(h)[0], hz(h)[1]))} <b>${G.num(n)}</b></li>`).join("")}</ul></div>` +
      `<div class="kpi time"><span>${T("पछिल्लो अपडेट", "Last update")}</span><b class="sm">${G.npt(data.generated)}</b><small>${T("पछिल्लो सूचना जारी", "Newest item issued")}: ${G.npt(latest)}</small></div>`;
    const fresh = $("fresh");
    fresh.className = "fresh" + (act.length ? " on" : "");
    fresh.innerHTML = act.length
      ? T(`<strong>${G.num(act.length)} चालु सूचना।</strong> नक्सामा रङ लागेका जिल्ला थिचेर विवरण हेर्नुहोस्।`, `<strong>${act.length} active alert${act.length > 1 ? "s" : ""}.</strong> Tap a coloured district on the map for details.`)
      : T(`<strong>अहिले गतिमा कुनै चालु सूचना छैन।</strong> नक्सा र चार्टले पछिल्ला सूचना देखाउँछन् (पछिल्लो: ${G.ago(latest)})। खतरा छैन भन्ने होइन — DHM, NDRRMA र स्थानीय प्रशासनका सूचना पनि हेर्नुहोस्।`,
          `<strong>Gati has no active alert right now.</strong> The map and charts show recent items (newest: ${G.ago(latest)}). That does not mean there is no risk; also check DHM, NDRRMA and local administration.`);
  }

  /* ---------- charts (HTML/SVG, built here) ---------- */
  function bars(rows, opt = {}) {
    const max = Math.max(1, ...rows.map((r) => r.n));
    return `<ul class="bars">${rows.map((r) => `<li><span class="bl">${r.label}</span><span class="bt"><span class="bf${r.n ? "" : " z"}" style="width:${(r.n / max) * 100}%;background:${r.c || "var(--teal)"}"></span></span><b>${G.num(r.n)}</b></li>`).join("")}</ul>`;
  }
  function charts() {
    const A = data.alerts;
    const cnt = (f) => A.reduce((m, a) => ((m[f(a)] = (m[f(a)] || 0) + 1), m), {});
    const hzc = cnt((a) => a.hazard);
    $("cHazard").innerHTML = bars(Object.entries(hzc).sort((a, b) => b[1] - a[1]).map(([h, n]) => ({ label: `${hz(h)[2]} ${G.esc(T(hz(h)[0], hz(h)[1]))}`, n })));
    const sc = cnt((a) => a.severity);
    $("cSev").innerHTML = bars(G.SEVORDER.filter((s) => sc[s]).map((s) => ({ label: G.sevChip(s), n: sc[s], c: G.SEVCOLOR[s] })));
    const ac = cnt(agency);
    $("cAgency").innerHTML = bars(Object.entries(ac).sort((a, b) => b[1] - a[1]).map(([g, n]) => ({ label: G.esc(g), n, c: "var(--navy)" }))) +
      `<p class="meta">${T("हरेक निकायले जारी गरेका, गतिले राखेका सूचनाको सङ्ख्या। निकायका अङ्क आपसमा जोडिँदैनन्।", "Items Gati carries from each agency, counted separately. Agency figures are not added together.")}</p>`;
    // timeline: one column per day, stacked by severity
    const day = (iso) => new Date(new Date(iso).getTime() + 345 * 60000).toISOString().slice(0, 10);
    const days = [...new Set(A.map((a) => day(a.sent)))].sort();
    const first = new Date(days[0]), last = new Date(Math.max(new Date(day(new Date().toISOString())), new Date(days.at(-1))));
    const all = []; for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) all.push(d.toISOString().slice(0, 10));
    const byDay = Object.fromEntries(all.map((d) => [d, A.filter((a) => day(a.sent) === d)]));
    const mx = Math.max(...Object.values(byDay).map((l) => l.length)), W = 760, H = 250, pad = 34, bw = (W - pad * 2) / all.length;
    let s = `<svg viewBox="0 0 ${W} ${H + 46}" class="tl" role="img" aria-label="${G.esc(T("दैनिक सूचना सङ्ख्या", "Alerts per day"))}">`;
    for (let g = 0; g <= mx; g += Math.max(1, Math.ceil(mx / 4))) { const y = H - (g / mx) * (H - 20); s += `<line x1="${pad}" x2="${W - 8}" y1="${y}" y2="${y}" class="grid"/><text x="${pad - 6}" y="${y + 4}" text-anchor="end" class="ax">${G.num(g)}</text>`; }
    all.forEach((d, i) => {
      let y = H; const l = [...byDay[d]].sort((a, b) => G.SEVORDER.indexOf(b.severity) - G.SEVORDER.indexOf(a.severity));
      l.forEach((a) => { const h = (H - 20) / mx; y -= h; s += `<rect x="${pad + i * bw + 2}" y="${y}" width="${Math.max(2, bw - 4)}" height="${h - 1.5}" rx="2" fill="${G.SEVCOLOR[a.severity]}"><title>${G.esc(a.info[G.lang].headline)}</title></rect>`; });
      const dd = +d.slice(8), lab = dd === 1 || i === 0 || i === all.length - 1 || dd % 5 === 0;
      if (lab) s += `<text x="${pad + i * bw + bw / 2}" y="${H + 22}" text-anchor="middle" class="ax">${G.num(dd)}</text>`;
      if (dd === 1 || i === 0) s += `<text x="${pad + i * bw + bw / 2}" y="${H + 42}" text-anchor="middle" class="ax b">${T(["","","","","","","","","सेप्टेम्बर","अक्टोबर","नोभेम्बर",""][+d.slice(5, 7) - 1] || d.slice(5, 7), ["","","","","","","","","Sep","Oct","Nov",""][+d.slice(5, 7) - 1] || d.slice(5, 7))}</text>`;
    });
    $("cTime").innerHTML = `<div class="tlwrap">${s}</svg></div>` + `<p class="meta">${T("हरेक खण्ड एउटा सूचना हो, रङ खतराअनुसार। दायाँ छेउ आज। फोनमा दायाँबायाँ सार्न सकिन्छ।", "Each block is one alert, coloured by severity. The right edge is today. Swipe sideways on a phone.")}</p>`;
    // road status: 100% stacked bar
    const rc = roads.routes.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {}), tot = roads.routes.length;
    $("cRoads").innerHTML = `<div class="stack">${["open", "oneway", "night", "closed", "none"].filter((k) => rc[k]).map((k) =>
      `<span style="flex:${rc[k]};background:${RC[k]}" title="${G.esc(rw(k))}">${G.num(rc[k])}</span>`).join("")}</div>
      <ul class="keyl">${["open", "oneway", "closed", "none"].map((k) => `<li><span class="sw" style="background:${RC[k]}"></span>${G.esc(rw(k))}: <b>${G.num(rc[k] || 0)}</b></li>`).join("")}</ul>
      <p class="meta">${T(`${G.num(tot)} मुख्य मार्ग · ${G.esc(roads.as_of_ne)} सम्मको अवस्था। पुरानो हुन सक्छ — यात्रा अघि प्रहरीसँग बुझ्नुहोस्।`, `${tot} main routes · status as of ${G.esc(roads.as_of_en)}. May be out of date; check with the police before travelling.`)}</p>`;
    const tc = cnt((a) => a.trust);
    const TC = { Official: "var(--navy)", Verified: "var(--teal)", Reported: "#64748b", Unverified: "#94a3b8", Corrected: "#6b3fa0", Retracted: "#14202B" };
    $("cTrust").innerHTML = `<div class="two"><div><h4>${T("गतिका सूचना", "Gati alerts")}</h4>${bars(Object.keys(G.TRUST).filter((t) => tc[t]).map((t) => ({ label: G.trustChip(t), n: tc[t], c: TC[t] })))}</div>
      <div><h4>${T("नागरिक रिपोर्ट", "Citizen reports")}</h4><div id="cReports"><p class="meta">…</p></div></div></div>`;
    reportCounts();
  }
  let rcache = null;
  async function reportCounts() {
    const el = $("cReports"); if (!el) return;
    if (!rcache) {
      try {
        const q = (l) => fetch(`https://api.github.com/search/issues?per_page=1&q=${encodeURIComponent(`repo:nirajbhusal/gati-alerts is:issue label:${l}`)}`).then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => j.total_count);
        const [v, p, r] = await Promise.all([q("verified"), q("reported -label:verified -label:retracted"), q("retracted")]);
        rcache = { Verified: v, Reported: p, Retracted: r };
      } catch (e) { rcache = "fail"; }
    }
    if (rcache === "fail") { el.innerHTML = `<p class="meta">${T("GitHub बाट सङ्ख्या ल्याउन सकिएन।", "Could not load counts from GitHub.")}</p>`; return; }
    el.innerHTML = bars([{ label: G.trustChip("Verified"), n: rcache.Verified, c: "var(--teal)" }, { label: `<span class="trust t-Reported">◌ ${T("जाँच्न बाँकी", "Pending")}</span>`, n: rcache.Reported, c: "#94a3b8" },
      { label: G.trustChip("Retracted"), n: rcache.Retracted, c: "#14202B" }]) + `<p class="meta"><a href="reports/">${T("जाँचिएका रिपोर्ट हेर्नुहोस्", "See verified reports")}</a></p>`;
  }

  function updates() {
    $("updates").innerHTML = upd.updates.map((u) => `<li><time datetime="${u.date}">${G.npt(u.date + "T12:00:00+05:45").split(" · ")[0]}</time><p>${G.esc(ne() ? u.ne : u.en)}</p></li>`).join("");
  }

  function render() {
    const d = sel.value, s = sortSel.value;
    let list = data.alerts.filter((a) => !d || a.districts.includes(d));
    const cmp = {
      severity: (a, b) => G.SEVORDER.indexOf(a.severity) - G.SEVORDER.indexOf(b.severity) || b.sent.localeCompare(a.sent),
      time: (a, b) => b.sent.localeCompare(a.sent),
      area: (a, b) => areaName(a).localeCompare(areaName(b), G.lang) || b.sent.localeCompare(a.sent),
    }[s];
    list.sort(cmp);
    const act = list.filter((a) => !a.expired), exp = list.filter((a) => a.expired).sort((a, b) => s === "severity" ? b.sent.localeCompare(a.sent) : cmp(a, b));
    $("nActive").textContent = `(${G.num(act.length)})`;
    $("nExpired").textContent = `(${G.num(exp.length)})`;
    $("active").innerHTML = act.length ? act.map(card).join("") : `<div class="empty">${T(
      "अहिले यो ठाउँका लागि गतिमा कुनै चालु सूचना छैन। तर यसको अर्थ खतरा छैन भन्ने होइन — DHM, NDRRMA र स्थानीय प्रशासनका सूचना पनि हेर्नुहोस्।",
      "Gati is not relaying any active notice for this area right now. That does not mean there is no risk; also check DHM, NDRRMA and your local administration.")}</div>`;
    $("expired").innerHTML = exp.map(card).join("");
    document.querySelector(".g-exp").hidden = !showExp.checked;
    $("gen").textContent = T("सूचना अद्यावधिक: ", "Feed built: ") + G.npt(data.generated);
    const u = new URL(location); d ? u.searchParams.set("district", (DN[d] || {}).id || d) : u.searchParams.delete("district"); history.replaceState(null, "", u);
  }
  /* 'My district': saved in this browser only (localStorage), never sent anywhere. */
  function myDistrict() {
    const box = $("mydist"); if (!box) return;
    const cur = localStorage.getItem(MYD) || "", name = (d) => (ne() ? d.ne : d.en);
    const n = cur ? data.alerts.filter((a) => !a.expired && !a.supersededBy && a.districts.includes(cur)).length : 0;
    box.innerHTML = `<label for="myd"><strong>📍 ${T("मेरो जिल्ला", "My district")}</strong></label>
      <select id="myd"><option value="">${T("छान्नुहोस्", "Choose")}</option>${[...districts].sort((a, b) => name(a).localeCompare(name(b), G.lang))
        .map((d) => `<option value="${d.code}"${d.code === cur ? " selected" : ""}>${G.esc(name(d))}</option>`).join("")}</select>
      ${cur ? `<span class="meta">${n ? T(`${G.num(n)} चालु सूचना`, `${n} active`) : T("अहिले गतिमा चालु सूचना छैन; खतरा छैन भन्ने होइन", "No active item in Gati now; that does not mean no risk")}</span>` : `<span class="meta">${T("यो छनोट हजुरको ब्राउजरमा मात्र बस्छ।", "Saved in this browser only.")}</span>`}`;
    $("myd").onchange = (ev) => { const v = ev.target.value; v ? localStorage.setItem(MYD, v) : localStorage.removeItem(MYD); sel.value = v; render(); myDistrict(); };
  }
  function all() { myDistrict(); kpis(); glance(); drawMap(); gaugesCard(); charts(); render(); updates(); }
  initMap(); fillDistricts(); all();
  sel.onchange = sortSel.onchange = showExp.onchange = render;
  document.querySelectorAll("[data-scope]").forEach((b) => (b.onclick = () => { scope = b.dataset.scope; drawMap(); }));
  G.onLang(() => { fillDistricts(); all(); });
})();
/* Source health flag: shows when any active source is stale or unreachable. Links to /sources/. */

(function () {
  const G = window.Gati;
  const el = document.getElementById("srcflag"); if (!el) return;
  Promise.all([G.json("data/sources.json"), G.json("data/source-health.json")]).then(([S, h]) => {
    const H = (h && h.sources) || {};
    const draw = () => {
      const st = S.map((s) => G.srcStatus(s, H[s.id]));
      const stale = st.filter((x) => x === "stale").length, down = st.filter((x) => x === "down").length;
      if (!stale && !down) { el.hidden = true; return; }
      const ne = [stale ? `${G.num(stale)} पुरानो` : "", down ? `${G.num(down)} पहुँच नभएको` : ""].filter(Boolean).join(", ");
      const en = [stale ? `${stale} stale` : "", down ? `${down} unreachable` : ""].filter(Boolean).join(", ");
      el.innerHTML = `<a href="${document.body.dataset.root || ""}sources/#health"><span aria-hidden="true">⚠</span> ` +
        (G.lang === "ne" ? `केही स्रोत अद्यावधिक छैनन् (${ne})। स्रोतको अवस्था हेर्नुहोस्` : `Some sources are not up to date (${en}). See source health`) + "</a>";
      el.hidden = false;
    };
    draw(); G.onLang(draw);
  }).catch(() => {});
})();
