/* Home dashboard: map, KPI strip, on-page charts, feed list and updates.
   Data: data/alerts.json (built from CAP files), data/roads.json, data/updates.json.
   Charts count Gati items only; figures from different agencies are never summed. */
(async function () {
  const G = window.Gati;
  const [data, districts, polys, roads, upd] = await Promise.all([G.json("data/alerts.json"), G.json("data/districts.json"),
    G.json("data/seed/district-polygons.json"), G.json("data/roads.json"), G.json("data/updates.json")]);
  const DN = Object.fromEntries(districts.map((d) => [d.id, d]));
  const now = Date.now();
  data.alerts.forEach((a) => (a.expired = new Date(a.expires).getTime() < now));
  const $ = (id) => document.getElementById(id);
  const ne = () => G.lang === "ne";
  const T = (n, e) => (ne() ? n : e);
  const sel = $("fDistrict"), sortSel = $("fSort"), showExp = $("fExpired");
  const params = new URLSearchParams(location.search);
  if (params.get("district")) sel.dataset.v = params.get("district");

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
      sorted.map((d) => `<option value="${d.id}">${G.esc(name(d))}${used.has(d.id) ? " •" : ""}</option>`).join("");
    sel.value = v;
  }
  const areaName = (a) => (a.districts[0] ? (ne() ? DN[a.districts[0]]?.ne : DN[a.districts[0]]?.en) || "" : a.info[G.lang].areas[0]?.desc || "");
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
      ${i.instruction && !a.expired ? `<div class="instr"><strong>${T("के गर्ने", "What to do")}:</strong> ${G.esc(i.instruction)}</div>` : ""}
      <p class="meta src">${T("स्रोत", "Source")}: <strong>${G.esc(i.senderName)}</strong> · <a href="${G.esc(i.web)}" rel="noopener" target="_blank">${T("मूल सूचना", "Original notice")} ↗</a>${src2 ? ` · <a href="${G.esc(src2)}" rel="noopener" target="_blank">${T("दोस्रो स्रोत", "Second source")} ↗</a>` : ""}</p>
      <details><summary>${T("पूरा विवरण", "Details")}</summary>
        ${a.expired && i.instruction ? `<p><strong>${T("त्यति बेलाको निर्देशन", "Instruction at the time")}:</strong> ${G.esc(i.instruction)}</p>` : ""}
        <p>${G.esc(i.description)}</p>
        <p class="meta">CAP: urgency ${en.urgency} · severity ${en.severity} · certainty ${en.certainty} · sender <code>${G.esc(a.sender)}</code><br>
        <a href="${G.esc(a.file)}">CAP 1.2 XML</a> · <a href="${G.esc(i.params["gati:bulletinFile"])}" rel="noopener">${T("बुलेटिन डेटा", "Bulletin data")}</a></p>
      </details></article>`;
  }

  /* ---------- map ---------- */
  let map, areaLayer, roadLayer, baseLayer;
  function popAlert(list) {
    return list.map((a) => { const i = a.info[G.lang];
      return `<div class="pop"><div class="chips">${G.sevChip(a.severity)}${G.trustChip(a.trust)}${a.expired ? `<span class="tag exp">${T("म्याद सकियो", "Expired")}</span>` : ""}</div>
      <strong>${G.esc(i.headline)}</strong><br><span class="meta">${G.esc(agency(a))} · ${G.npt(a.sent)}</span><br>
      <a href="#${encodeURIComponent(a.identifier)}">${T("सूचीमा हेर्नुहोस्", "See in list")}</a> · <a href="${G.esc(i.web)}" target="_blank" rel="noopener">${T("मूल सूचना", "Original")} ↗</a></div>`; }).join("<hr>");
  }
  function initMap() {
    if (!window.L) { $("map").innerHTML = `<p class="empty">${T("नक्सा खुलेन।", "Map unavailable.")}</p>`; return; }
    map = L.map("map", { scrollWheelZoom: false, tap: true, zoomSnap: 0.25 }).setView([28.3, 84.1], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 16, opacity: 0.55,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    baseLayer = L.featureGroup().addTo(map); areaLayer = L.featureGroup().addTo(map); roadLayer = L.featureGroup().addTo(map);
    Object.entries(polys).forEach(([id, p]) => L.polygon(p, { color: "#5b6b7b", weight: 0.8, fillColor: "#ffffff", fillOpacity: 0.35, interactive: false }).addTo(baseLayer));
    const fit = () => { map.invalidateSize(); map.fitBounds([[26.35, 80.06], [30.45, 88.2]], { padding: [4, 4] }); };
    fit(); requestAnimationFrame(fit); window.addEventListener("load", fit);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(fit, 200); });
    $("lyAreas").onchange = $("lyRoads").onchange = drawMap;
  }
  function drawMap() {
    if (!map) return;
    areaLayer.clearLayers(); roadLayer.clearLayers();
    const list = data.alerts.filter(inScope);
    if ($("lyAreas").checked) {
      // One shape per district, coloured by its highest severity; tap lists every alert there.
      const byD = {};
      list.forEach((a) => a.districts.forEach((d) => (byD[d] = byD[d] || []).push(a)));
      Object.entries(byD).forEach(([d, al]) => {
        al.sort((x, y) => (x.expired - y.expired) || G.SEVORDER.indexOf(x.severity) - G.SEVORDER.indexOf(y.severity));
        const top = al[0], c = G.SEVCOLOR[top.severity], allExp = al.every((a) => a.expired);
        if (!polys[d]) return;
        L.polygon(polys[d], { color: c, weight: allExp ? 1.5 : 2.5, dashArray: allExp ? "5 5" : null, fillColor: c, fillOpacity: allExp ? 0.22 : 0.5 })
          .bindPopup(`<h4 class="poph">${G.esc(ne() ? DN[d].ne : DN[d].en)} · ${G.num(al.length)} ${T("सूचना", al.length > 1 ? "alerts" : "alert")}</h4>` + popAlert(al), { maxWidth: 300, maxHeight: 320 }).addTo(areaLayer);
      });
      list.forEach((a) => a.info[G.lang].areas.forEach((ar) => ar.circles.forEach((cs) => {
        const [ll] = cs.split(" "); const [la, lo] = ll.split(",").map(Number); const c = G.SEVCOLOR[a.severity];
        L.circleMarker([la, lo], { radius: 8, color: "#fff", weight: 2, fillColor: c, fillOpacity: 1 }).bindPopup(`<strong>${G.esc(ar.desc)}</strong><hr>` + popAlert([a]), { maxWidth: 300 }).addTo(areaLayer);
      })));
    }
    if ($("lyRoads").checked) {
      const ord = (r) => (r.status === "none" ? 0 : 1);
      [...roads.routes].sort((a, b) => ord(a) - ord(b)).forEach((r) => {
        const pop = `<div class="pop"><strong>${G.esc(ne() ? r.name_ne : r.name_en)}</strong><br><span class="rpill" style="background:${RC[r.status]}">${G.esc(rw(r.status))}</span>
          <p>${G.esc(ne() ? r.note_ne : r.note_en)}</p>${r.sources.length ? `<p class="meta">${T("स्रोत", "Sources")}: ${r.sources.map((k) => `<a href="${G.esc(roads.sources[k].u)}" target="_blank" rel="noopener">${G.esc(ne() ? roads.sources[k].ne : roads.sources[k].en)}</a>`).join(" · ")}</p>` : ""}
          <p class="meta">${T("जाँचेको", "Checked")}: ${G.esc(ne() ? roads.as_of_ne : roads.as_of_en)}</p></div>`;
        r.segs.forEach(([a, b]) => {
          const pts = [roads.nodes[a].ll, roads.nodes[b].ll], q = r.status === "none";
          L.polyline(pts, { color: "#fff", weight: q ? 7 : 11, opacity: 0.9, interactive: false }).addTo(roadLayer);
          L.polyline(pts, { color: RC[r.status], weight: q ? 4 : 7, dashArray: q ? "4 8" : null, lineCap: "round" }).bindPopup(pop, { maxWidth: 300 }).addTo(roadLayer);
          L.polyline(pts, { color: "#000", opacity: 0, weight: 24 }).bindPopup(pop, { maxWidth: 300 }).addTo(roadLayer); // wide tap target
        });
      });
      Object.values(roads.nodes).forEach((n) => L.circleMarker(n.ll, { radius: 4, color: "#0E2A47", weight: 2, fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(G.esc(ne() ? n.ne : n.en), { direction: "top", className: "townlab" }).addTo(roadLayer));
    }
    document.querySelectorAll("[data-scope]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.scope === scope));
    $("mapLegend").innerHTML = `<div><strong>${T("सूचना क्षेत्र (खतरा)", "Alert areas (severity)")}</strong><ul>${G.SEVORDER.map((s) =>
      `<li><span class="sw" style="background:${G.SEVCOLOR[s]}"></span>${G.esc(ne() ? G.SEV[s][0] : G.SEV[s][1])}</li>`).join("")}
      <li><span class="sw sw-exp"></span>${T("म्याद सकिएको (टुटेको किनारा)", "Expired (dashed edge)")}</li></ul></div>
      <div><strong>${T("मुख्य सडक", "Main roads")}</strong><ul>${["open", "oneway", "closed", "none"].map((s) =>
      `<li><span class="ln ln-${s}" style="--c:${RC[s]}"></span>${G.esc(rw(s))}</li>`).join("")}</ul></div>`;
    $("mapNote").innerHTML = T(`थिच्नुहोस्: विवरण देखिन्छ। सडक: ${G.esc(roads.as_of_ne)} सम्मको अवस्था; ${G.esc(roads.geometry_note_ne)} ${G.esc(roads.rule_ne)} जिल्लाको सीमा मोटामोटी मात्र। पृष्ठभूमि नक्सा <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> बाट आउँछ — नक्सा खोल्दा हजुरको ब्राउजरले OSM सर्भरबाट टाइल ल्याउँछ।`,
      `Tap anything for details. Roads: status as of ${G.esc(roads.as_of_en)}; ${G.esc(roads.geometry_note_en)} ${G.esc(roads.rule_en)} District outlines are simplified. Background tiles come from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>: viewing the map makes your browser fetch tiles from OSM's servers.`);
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
    const mx = Math.max(...Object.values(byDay).map((l) => l.length)), W = 720, H = 210, pad = 28, bw = (W - pad * 2) / all.length;
    let s = `<svg viewBox="0 0 ${W} ${H + 40}" class="tl" role="img" aria-label="${G.esc(T("दैनिक सूचना सङ्ख्या", "Alerts per day"))}">`;
    for (let g = 0; g <= mx; g += Math.max(1, Math.ceil(mx / 4))) { const y = H - (g / mx) * (H - 20); s += `<line x1="${pad}" x2="${W - 8}" y1="${y}" y2="${y}" class="grid"/><text x="${pad - 6}" y="${y + 4}" text-anchor="end" class="ax">${G.num(g)}</text>`; }
    all.forEach((d, i) => {
      let y = H; const l = [...byDay[d]].sort((a, b) => G.SEVORDER.indexOf(b.severity) - G.SEVORDER.indexOf(a.severity));
      l.forEach((a) => { const h = (H - 20) / mx; y -= h; s += `<rect x="${pad + i * bw + 2}" y="${y}" width="${Math.max(2, bw - 4)}" height="${h - 1.5}" rx="2" fill="${G.SEVCOLOR[a.severity]}"><title>${G.esc(a.info[G.lang].headline)}</title></rect>`; });
      const dd = +d.slice(8), lab = dd === 1 || i === 0 || i === all.length - 1 || dd % 5 === 0;
      if (lab) s += `<text x="${pad + i * bw + bw / 2}" y="${H + 18}" text-anchor="middle" class="ax">${G.num(dd)}</text>`;
      if (dd === 1 || i === 0) s += `<text x="${pad + i * bw + bw / 2}" y="${H + 36}" text-anchor="middle" class="ax b">${T(["","","","","","","","","सेप्टेम्बर","अक्टोबर","नोभेम्बर",""][+d.slice(5, 7) - 1] || d.slice(5, 7), ["","","","","","","","","Sep","Oct","Nov",""][+d.slice(5, 7) - 1] || d.slice(5, 7))}</text>`;
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
    const u = new URL(location); d ? u.searchParams.set("district", d) : u.searchParams.delete("district"); history.replaceState(null, "", u);
  }
  function all() { kpis(); drawMap(); charts(); render(); updates(); }
  initMap(); fillDistricts(); all();
  sel.onchange = sortSel.onchange = showExp.onchange = render;
  document.querySelectorAll("[data-scope]").forEach((b) => (b.onclick = () => { scope = b.dataset.scope; drawMap(); }));
  G.onLang(() => { fillDistricts(); all(); });
})();
