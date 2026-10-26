/* Am I affected? page. Location stays in this browser. Verdict is worded per official sources; counts are per agency, never summed. */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, R = G.root;
  const get = (p) => G.json(p).catch(() => null);
  const [AL, WX, RV, RD, RG, DG, PROV, DL] = await Promise.all(["data/alerts.json", "data/weather.json", "data/rivers.json", "data/roads.json", "data/geo/roads.geojson", "data/districts.geojson", "data/geo/provinces.geojson", "data/districts.json"].map(get));
  let LU = null; const loadLU = () => LU ? Promise.resolve(LU) : get("data/localunits.geojson").then((g) => (LU = g));
  const D = { AL, WX }, box = document.getElementById("afresult"), now = Date.now();
  const distF = DG ? Object.fromEntries(DG.features.map((f) => [f.id, f])) : {};
  const dname = (c) => (distF[c] ? T(distF[c].properties.ne, distF[c].properties.en) : c);
  const hav = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const inRing = (x, y, ring) => { let o = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; };
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const inGeom = (lon, lat, g) => polys(g).some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));
  const bbox = (g) => { let a = [180, 90, -180, -90]; polys(g).forEach((p) => p[0].forEach(([x, y]) => { a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; })); return a; };
  const centre = (g) => { const b = bbox(g); return [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2]; };
  const lineCoords = (f) => (f.geometry.type === "MultiLineString" ? f.geometry.coordinates.flat() : f.geometry.coordinates);
  /* which districts a road corridor passes through (sampled point-in-polygon) */
  const routeDistricts = (id) => { const f = RG && RG.features.find((x) => x.properties.id === id); if (!f || !DG) return []; const s = new Set(); lineCoords(f).filter((_, k) => k % 4 === 0).forEach(([x, y]) => { const d = DG.features.find((g) => inGeom(x, y, g.geometry)); if (d) s.add(d.id); }); return [...s]; };
  const routesIn = (code) => (RD ? RD.routes.filter((r) => routeDistricts(r.id).includes(code)) : []);
  const RS = { open: ["खुला", "Open", "#16a34a"], oneway: ["एकतर्फी", "One-way", "#f59e0b"], blocked: ["अवरुद्ध", "Blocked", "#dc2626"], none: ["पुष्टि छैन", "Not confirmed", "#8a96a3"] };
  const gst = (g) => (g.level >= g.danger ? ["खतरा तह माथि", "Above danger", "#D93025"] : g.level >= g.warning ? ["चेतावनी तह माथि", "Above warning", "#F28C1E"] : ["सामान्य", "Normal", "#2F6FED"]);
  let SAFE = null; const safety = () => SAFE ? Promise.resolve(SAFE) : fetch(R + "safety/").then((r) => r.text()).then((h) => (SAFE = new DOMParser().parseFromString(h, "text/html"))).catch(() => null);
  const HZS = { flood: ["flood"], landslide: ["landslide"], weather: ["flood", "landslide"], earthquake: ["earthquake"], glof: ["glof"], lightning: ["lightning"], cold: ["coldwave"], fire: ["fire"] };
  /* ---- input ---- */
  const inp = document.getElementById("afinput");
  let curTab = "d";
  function buildInput() {
  inp.innerHTML = `${G.affect.radiusUI(G.affect.getR())}<div class="aftabs" role="tablist">${[["d", "जिल्ला", "District"], ["loc", "मेरो स्थान", "Locate me"], ["r", "मार्ग", "Route"]].map(([k, ne, en], i) => `<button type="button" role="tab" data-t="${k}" aria-selected="${i === 0}">${T(ne, en)}</button>`).join("")}</div>
    <div class="afpane" data-p="d"><select id="afd" aria-label="${T("जिल्ला", "District")}"><option value="">${T("जिल्ला छान्नुहोस्", "Choose a district")}</option>${DG ? DG.features.slice().sort((a, b) => T(a.properties.ne, a.properties.en).localeCompare(T(b.properties.ne, b.properties.en))).map((f) => `<option value="${f.id}">${E(T(f.properties.ne, f.properties.en))}</option>`).join("") : ""}</select></div>
    <div class="afpane" data-p="loc" hidden><button type="button" class="afbtn" id="afloc">⌖ ${T("मेरो स्थान प्रयोग गर्नुहोस्", "Use my location")}</button><p class="meta">${T("स्थान यही उपकरणमा मात्र प्रयोग हुन्छ; कतै पठाइँदैन।", "Your location is used only on this device; nothing is sent.")}</p></div>
    <div class="afpane" data-p="r" hidden><select id="afr" aria-label="${T("मार्ग", "Route")}"><option value="">${T("मार्ग छान्नुहोस्", "Choose a route")}</option>${RD ? RD.routes.map((r) => `<option value="${r.id}">${E(T(r.name_ne, r.name_en))}</option>`).join("") : ""}</select></div>`;
  G.affect.bindRadius(inp, () => { const q = Object.fromEntries(new URLSearchParams(location.hash.slice(1))); render(q); });
  const tab = (k) => { curTab = k; inp.querySelectorAll("[data-t]").forEach((b) => b.setAttribute("aria-selected", b.dataset.t === k)); inp.querySelectorAll(".afpane").forEach((p) => (p.hidden = p.dataset.p !== k)); };
  inp.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => tab(b.dataset.t)));
  inp.querySelector("#afd").onchange = (e) => e.target.value && go({ d: e.target.value });
  inp.querySelector("#afr").onchange = (e) => e.target.value && go({ r: e.target.value });
  inp.querySelector("#afloc").onclick = () => { const b = inp.querySelector("#afloc"); b.textContent = T("खोज्दै…", "Locating…");
    navigator.geolocation.getCurrentPosition(async (p) => { const { latitude: la, longitude: lo } = p.coords; const lu = await loadLU();
      const u = lu && lu.features.find((f) => inGeom(lo, la, f.geometry)); const d = u ? u.properties.district : (DG && (DG.features.find((f) => inGeom(lo, la, f.geometry)) || {}).id);
      b.textContent = "⌖ " + T("मेरो स्थान प्रयोग गर्नुहोस्", "Use my location");
      if (d) go({ d, u: u ? u.properties.code : "" }); else box.innerHTML = `<p class="afna">${T("हजुरको स्थान नेपालभित्र भेटिएन। जिल्ला छान्नुहोस्।", "Your location was not found inside Nepal. Please choose a district.")}</p>`; },
      () => { b.textContent = "⌖ " + T("मेरो स्थान प्रयोग गर्नुहोस्", "Use my location"); box.innerHTML = `<p class="afna">${T("स्थान अनुमति मिलेन। जिल्ला छान्नुहोस्।", "Location permission was not given. Please choose a district.")}</p>`; }, { timeout: 10000 }); };
    const h0 = new URLSearchParams(location.hash.slice(1)); if (h0.get("d")) inp.querySelector("#afd").value = h0.get("d"); if (h0.get("r")) inp.querySelector("#afr").value = h0.get("r"); tab(curTab);
  }
  buildInput();
  function go(q) { history.replaceState(null, "", "#" + new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString()); render(q); }
  /* ---- result ---- */
  const line = (icon, title, body, src, time, trust) => `<li class="afl"><span class="afi" aria-hidden="true">${icon}</span><div><h3>${title}</h3>${body}<p class="afsrc">${T("स्रोत", "Source")}: ${src}${time ? ` · ${time}` : ""} ${trust || ""}</p></div></li>`;
  async function render(q) {
    try { if (q && q.d) localStorage.setItem("gati-aff-last", q.d); } catch (e) {}
    let codes = [], title = "", unit = "", route = null;
    if (q.r && RD) { route = RD.routes.find((r) => r.id === q.r); if (!route) return; codes = routeDistricts(route.id); title = T(route.name_ne, route.name_en); inp.querySelector("#afr").value = q.r; tab("r"); }
    else if (q.d) { codes = [q.d]; title = dname(q.d); inp.querySelector("#afd").value = q.d;
      if (q.u) { const lu = await loadLU(); const f = lu && lu.features.find((x) => x.properties.code === q.u); if (f) unit = f.properties.ne || f.properties.en; } }
    else { box.innerHTML = ""; return; }
    const v = G.affect.verdict(codes, { ...D, DG }, route ? 0 : G.affect.getR()); if (!route) codes = v.area; const place = title; if (!route) title = G.affect.label(title, v.r);
    let lv = v.lv; if (route) { const rl = { open: 0, none: 1, oneway: 2, blocked: 3 }[route.status] || 0; if (rl > lv) lv = rl; }
    const V = { ...G.affect.LV[lv] }, label = T(V.ne, V.en);
    const checked = G.npt(new Date().toISOString()), gen = AL ? G.npt(AL.generated) : "";
    /* weather */
    const b5 = WX && WX.bulletin5, prov = [...new Set(codes.map((c) => c.slice(0, 4)))];
    const wxBody = b5 ? `<ol class="afwx">${b5.days.map((d) => { const hit = d.level !== "green" && (!d.provinces || d.provinces.some((p) => prov.includes(p))); const lvl = hit ? d.level : "green";
      return `<li class="lv-${lvl}"><i></i><b>${E(G.lang === "ne" ? d.bs : new Date(d.ad + "T12:00:00+05:45").toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}</b><span>${T(lvl === "green" ? "हरियो" : lvl === "yellow" ? "पहेँलो" : lvl === "orange" ? "सुन्तले" : lvl === "red" ? "रातो" : lvl, lvl === "green" ? "Green" : lvl[0].toUpperCase() + lvl.slice(1))}</span></li>`; }).join("")}</ol>${v.wx.length ? `<p>${E(T(v.wx[0].ne, v.wx[0].en))}</p>` : `<p>${T("यो क्षेत्रका लागि ५ दिनमा DHM चेतावनी छैन।", "No DHM warning for this area in the 5 days.")}</p>`}` : `<p>${T("DHM बुलेटिन अहिले उपलब्ध छैन।", "DHM bulletin not available right now.")}</p>`;
    /* rivers near */
    const cs = codes.map((c) => distF[c] && centre(distF[c].geometry)).filter(Boolean);
    const gs = RV ? RV.gauges.map((g) => ({ g, km: Math.min(...cs.map((c) => hav(c[0], c[1], g.ll[0], g.ll[1]))) })).filter((x) => x.km <= 60 || codes.includes((DL || []).find((d) => d.id === x.g.district)?.code)).sort((a, b) => a.km - b.km) : [];
    const rvBody = gs.length ? `<ul class="afrows">${gs.map(({ g, km }) => { const s = gst(g); return `<li><span>${E(T(g.ne, g.en))} <small>${G.num(String(Math.round(km)))} km</small></span><span class="afst" style="--c:${s[2]}"><i></i>${T(s[0], s[1])} · ${G.num(g.level.toFixed(1))} m</span></li>`; }).join("")}</ul>` : `<p>${T("नजिक DHM मापन केन्द्रको तथ्याङ्क गतिमा छैन।", "No nearby DHM gauge reading in Gati.")}</p>`;
    /* roads */
    const rts = route ? [route] : codes.flatMap(routesIn), roadAl = v.alerts.filter((a) => a.hazard === "road");
    const rdBody = rts.length ? `<ul class="afrows">${rts.map((r) => `<li><span>${E(T(r.name_ne, r.name_en))}</span><span class="afst" style="--c:${RS[r.status][2]}"><i></i>${T(RS[r.status][0], RS[r.status][1])}</span></li>`).join("")}</ul>${roadAl.map((a) => `<p><a href="${R}alerts/${a.identifier}/">${E((a.info[G.lang] || a.info.ne).headline)}</a></p>`).join("")}` : `<p>${T("यो जिल्ला भएर जाने मुख्य सडक गतिको सूचीमा छैन।", "No main corridor in Gati's list passes through here.")}</p>`;
    /* earthquakes nearby (30 days, 150 km) */
    const qs = (AL ? AL.alerts : []).filter((a) => a.hazard === "earthquake" && now - Date.parse(a.sent) < 2592e6).map((a) => { const c = (a.areas[0] && a.areas[0].circles[0] || "").split(" ")[0].split(",").map(Number); return { a, km: c.length === 2 ? Math.min(...cs.map((x) => hav(x[0], x[1], c[0], c[1]))) : Infinity, c }; }).filter((x) => x.km <= 150).sort((a, b) => b.a.sent.localeCompare(a.a.sent));
    const eqBody = qs.length ? `<ul class="afrows">${qs.slice(0, 4).map(({ a, km }) => `<li><span><a href="${R}alerts/${a.identifier}/">${E((a.info[G.lang] || a.info.ne).headline)}</a> <small>${G.num(String(Math.round(km)))} km</small></span><span class="meta">${E(G.agencyOf(a))} · ${G.npt(a.sent)} ${G.trustChip(a.trust)}</span></li>`).join("")}</ul>` : `<p>${T("पछिल्लो ३० दिनमा १५० किमीभित्र गतिमा भूकम्प सूचना छैन।", "No earthquake notice in Gati within 150 km in the last 30 days.")}</p>`;
    /* official alerts per agency (never summed) */
    const byAg = {}; v.alerts.forEach((a) => (byAg[G.agencyOf(a)] = byAg[G.agencyOf(a)] || []).push(a));
    const alBody = v.alerts.length ? Object.entries(byAg).map(([k, L]) => `<p class="afag"><b>${E(k)}</b>: ${L.map((a) => `${G.sevChip(a.severity)} <a href="${R}alerts/${a.identifier}/">${E((a.info[G.lang] || a.info.ne).headline)}</a> <span class="meta">${G.npt(a.sent)}</span>`).join("<br>")}</p>`).join("") : `<p>${T("यो क्षेत्रमा चालु आधिकारिक सूचना गतिमा छैन। खतरा छैन भन्ने होइन; स्थानीय प्रशासनको सूचना पनि हेर्नुहोस्।", "No active official notice for this area in Gati. This does not mean there is no risk; also follow your local administration.")}</p>`;
    /* safety actions */
    const hz = new Set(); v.alerts.forEach((a) => (HZS[a.hazard] || []).forEach((h) => hz.add(h))); if (v.wx.length) HZS.weather.forEach((h) => hz.add(h)); if (qs.length) hz.add("earthquake");
    const doc = await safety();
    const acts = doc ? [...hz].map((h) => { const c = doc.getElementById(h); if (!c) return ""; const items = [...c.querySelectorAll("li")].slice(0, 3).map((li) => (li.querySelector(G.lang === "ne" ? ".ne-only" : ".en-only") || li).textContent);
      return `<div class="afdo"><h3>${E((c.querySelector("h2 " + (G.lang === "ne" ? ".ne-only" : ".en-only")) || {}).textContent || h)}</h3><ul>${items.map((t) => `<li>${E(t)}</li>`).join("")}</ul><a href="${R}safety/#${h}">${T("पूरा निर्देशन", "Full guidance")} →</a></div>`; }).join("") : "";
    const share = `${T("आधिकारिक स्रोतअनुसार", "Per official sources")}, ${title}${unit ? ` (${unit})` : ""}: ${label}. ${T("जाँचेको", "Checked")} ${checked}. ${location.href}`;
    const SENT = G.affect.sentences(v, place);
    box.innerHTML = `
      <section class="afverdict" style="--vc:${V.c}"><p class="afwhere">${E(title)}${unit ? ` · ${E(unit)}` : ""}</p>${v.r ? `<p class="meta afnote">${E(G.affect.note(v))}</p>` : ""}<button type="button" class="afbtn afreset" id="afreset">↺ ${T("रिसेट", "Reset")}</button>
        <p class="afv"><i></i>${T("आधिकारिक स्रोतअनुसार", "Per official sources")}: <b>${label}</b></p>
        <p class="meta">${T("यो गतिको आफ्नै निर्णय होइन; आधिकारिक निकायका सूचनामा आधारित।", "This is not Gati's own judgement; it is based on notices from official agencies.")} ${T("पछिल्लो जाँच", "Last checked")}: ${checked}${gen ? ` · ${T("डेटा", "data")} ${gen}` : ""}</p></section>
      <section class="afsent" aria-label="${T("हजुरको जिल्लाका लागि", "For your district")}"><ul>${SENT.map((x, k) => `<li class="${x.none ? "none" : "yes"}"${x.a ? ` style="--vc:${G.SEVCOLOR[x.a.severity] || G.SEVCOLOR.Unknown}"` : ""}><p class="afst1">${E(x.text)}</p>
        ${x.a ? `<p class="meta">${T("स्रोत", "Source")}: ${E(x.agency)} · ${G.npt(x.sent)} · <a href="${E(x.web)}" target="_blank" rel="noopener">${T("मूल सूचना", "Original notice")} ↗</a> ${G.trustChip(x.a.trust)}</p>` : `<p class="meta">${T("पछिल्लो जाँच", "Last checked")}: ${checked}</p>`}
        <button type="button" class="afbtn afsh" data-s="${k}">${G.SHAREICON || ""}${T("सेयर", "Share")}</button></li>`).join("")}</ul></section>
      <div class="afgrid"><div>
        <ul class="aflist">
          ${line("⚠", T("आधिकारिक सूचना (निकायअनुसार)", "Official notices (by agency)"), alBody, T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), gen, G.trustChip("Official"))}
          ${line("☁", T("मौसम: आज र ५ दिन", "Weather: today and 5 days"), wxBody, b5 ? `<a href="${E(b5.url)}" target="_blank" rel="noopener">DHM</a>` : "DHM", b5 ? `${T("जारी", "issued")} ${G.npt(b5.issued)}` : "", G.trustChip("Official"))}
          ${line("≋", T("नजिकका नदी", "Rivers nearby"), rvBody, RV ? E(T(RV.source_ne, RV.source_en)) : "DHM", RV ? E(T(RV.as_of_ne, RV.as_of_en)) : "", G.trustChip("Official"))}
          ${line("⇄", route ? T("यो मार्ग", "This route") : T("भित्र र बाहिर जाने सडक", "Roads in and out"), rdBody, RD ? E(T(RD.sources.pol.ne, RD.sources.pol.en)) : T("नेपाल प्रहरी", "Nepal Police"), RD ? E(T(RD.as_of_ne, RD.as_of_en)) : "", G.trustChip("Official"))}
          ${line("∿", T("नजिकका भूकम्प", "Earthquakes nearby"), eqBody, "NSC / USGS", "", "")}
          ${line("◌", T("हावाको गुणस्तर", "Air quality"), `<div id="afair">${T("लोड हुँदै…", "Loading…")}</div>`, `<a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">Open-Meteo</a> (CAMS)`, `<span id="afairt"></span>`, G.trustChip("Model"))}
        </ul></div>
        <aside class="afside">
          <div class="afmap">${miniMap(codes, v, gs, qs, rts)}</div>
          <div class="afnow"><h2>${T("अहिले के गर्ने", "What to do now")}</h2>${acts || `<p>${T("आपतकालीन झोला तयार राख्नुहोस् र आधिकारिक सूचना हेरिरहनुहोस्।", "Keep an emergency bag ready and keep following official notices.")} <a href="${R}safety/">${T("के गर्ने", "What to do")} →</a></p>`}
            <div class="afcalls"><a class="afcall key" href="tel:1234">☎ ${T("१२३४ विपद्", "1234 Disaster")}</a><a class="afcall" href="tel:100">☎ ${T("१०० प्रहरी", "100 Police")}</a></div>
            <div class="afacts"><button type="button" class="afbtn" id="afwatch">☆ ${T("निगरानी सूचीमा राख्नुहोस्", "Save to watchlist")}</button>${G.push && G.push.on() ? `<button type="button" class="afbtn" id="afpush" data-d="${E(codes[0] || "")}">${T("यो जिल्लाका सूचना पाउनुहोस्", "Notify me for this district")}</button>` : `<button type="button" class="afbtn" disabled>${T("सूचना पाउनुहोस्", "Notify me")} <small>${T("छिट्टै", "coming soon")}</small></button>`}</div></div>
          <div class="afshare"><h2>${T("मेरो अवस्था सेयर गर्नुहोस्", "Share my status")}</h2><p class="afsharecard" style="--vc:${V.c}">${E(share)}</p><button type="button" class="afbtn" id="afshare">${T("सेयर / कपी", "Share / copy")}</button></div>
        </aside></div>`;
    box.querySelector("#afreset").onclick = () => G.affect.reset((undo) => { if (undo) { const d = G.district.get() || localStorage.getItem("gati-aff-last"); buildInput(); if (d) go({ d }); return; } history.replaceState(null, "", location.pathname); box.innerHTML = ""; buildInput(); const s = inp.querySelector("#afd"); if (s) s.focus(); });
    const w = box.querySelector("#afwatch"); if (codes.length) w.onclick = () => { let s = {}; try { s = JSON.parse(localStorage.getItem("gati-watch") || "{}"); } catch (e) {} s.d = [...new Set([...(s.d || []), ...codes])]; s.r = s.r || []; localStorage.setItem("gati-watch", JSON.stringify(s)); w.textContent = "★ " + T("निगरानी सूचीमा राखियो", "Saved to watchlist"); };
    const pb = box.querySelector("#afpush"); if (pb) pb.onclick = async () => { const r = await G.push.subscribe(pb.dataset.d); pb.textContent = r.msg; };
    box.querySelectorAll(".afsh").forEach((b) => (b.onclick = () => { const x = SENT[+b.dataset.s]; const u = x.a ? new URL(x.perma, location.href).href : location.href;
      G.share({ url: u, title: x.text, text: x.a ? `${x.text} ${T("स्रोत", "Source")}: ${x.agency}, ${G.npt(x.sent)}.` : `${x.text} ${T("जाँचेको", "Checked")} ${checked}.` }); }));
    box.querySelector("#afshare").onclick = async (e) => { try { if (navigator.share) await navigator.share({ text: share }); else { await navigator.clipboard.writeText(share); e.target.textContent = T("कपी भयो", "Copied"); } } catch (x) {} };
    /* air at the first district centre */
    const c0 = cs[0]; if (c0) fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c0[0].toFixed(3)}&longitude=${c0[1].toFixed(3)}&current=us_aqi,pm2_5&timezone=Asia%2FKathmandu`).then((r) => r.ok ? r.json() : null).then((a) => {
      const el = document.getElementById("afair"); if (!el) return; const x = a && a.current && a.current.us_aqi; if (x == null) { el.innerHTML = `<p>${T("अहिले उपलब्ध छैन", "Not available right now")}</p>`; return; }
      const B = [[50, "#00a651", "राम्रो", "Good"], [100, "#d4b000", "मध्यम", "Moderate"], [150, "#f7941d", "संवेदनशीललाई हानिकारक", "Unhealthy for sensitive groups"], [200, "#e2231a", "हानिकारक", "Unhealthy"], [999, "#8f3f97", "धेरै हानिकारक", "Very unhealthy"]].find((b) => x <= b[0]);
      el.innerHTML = `<p><span class="afst" style="--c:${B[1]}"><i></i>US AQI ${G.num(String(Math.round(x)))} · ${T(B[2], B[3])}</span> <span class="meta">${T("मोडेल अनुमान", "Model estimate")}</span></p>`;
      const t = document.getElementById("afairt"); if (t) t.textContent = G.npt(a.current.time + "+05:45"); }).catch(() => { const el = document.getElementById("afair"); if (el) el.innerHTML = `<p>${T("अहिले उपलब्ध छैन", "Not available right now")}</p>`; });
  }
  function miniMap(codes, v, gs, qs, rts) {
    if (!DG || !codes.length) return "";
    let b = [180, 90, -180, -90]; codes.forEach((c) => { const x = distF[c] && bbox(distF[c].geometry); if (x) b = [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])]; });
    const pad = 0.12, W = 320, k = Math.min(W / (b[2] - b[0] + 2 * pad), 220 / (b[3] - b[1] + 2 * pad)), H = Math.round((b[3] - b[1] + 2 * pad) * k);
    const X = (x) => ((x - b[0] + pad) * k).toFixed(1), Y = (y) => ((b[3] + pad - y) * k).toFixed(1);
    const path = (g) => polys(g).map((p) => "M" + p[0].map(([x, y]) => X(x) + " " + Y(y)).join("L") + "Z").join("");
    const near = DG.features.filter((f) => { const x = bbox(f.geometry); return x[2] > b[0] - pad && x[0] < b[2] + pad && x[3] > b[1] - pad && x[1] < b[3] + pad; });
    const worst = {}; v.alerts.forEach((a) => a.districts.forEach((d) => { const s = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 }; if (!worst[d] || s[a.severity] > s[worst[d]]) worst[d] = a.severity; }));
    const wxFill = v.wx.length ? "#F5D90A" : null;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T("जिल्लाको नक्सा, चालु तहसहित", "District map with active layers")}">
      ${near.map((f) => `<path d="${path(f.geometry)}" fill="${worst[f.id] ? G.SEVCOLOR[worst[f.id]] : codes.includes(f.id) && wxFill ? wxFill : "var(--surface2)"}" fill-opacity="${codes.includes(f.id) ? 0.55 : 0.3}" stroke="${codes.includes(f.id) ? "#1f2328" : "var(--line)"}" stroke-width="${codes.includes(f.id) ? 1.6 : 0.6}"/>`).join("")}
      ${RG ? rts.map((r) => { const f = RG.features.find((x) => x.properties.id === r.id); return f ? `<polyline points="${lineCoords(f).map(([x, y]) => X(x) + "," + Y(y)).join(" ")}" fill="none" stroke="${RS[r.status][2]}" stroke-width="3" stroke-linecap="round"/>` : ""; }).join("") : ""}
      ${gs.map(({ g }) => `<circle cx="${X(g.ll[1])}" cy="${Y(g.ll[0])}" r="5" fill="${gst(g)[2]}" stroke="#fff" stroke-width="1.5"/>`).join("")}
      ${qs.map(({ c }) => c.length === 2 ? `<circle cx="${X(c[1])}" cy="${Y(c[0])}" r="6" fill="#7c3aed" fill-opacity=".35" stroke="#7c3aed"/>` : "").join("")}
    </svg><p class="afleg"><span><i style="background:#1f2328"></i>${T("छानिएको क्षेत्र", "Selected area")}</span>${v.wx.length ? `<span><i style="background:#F5D90A"></i>DHM ${T("पहेँलो", "yellow")}</span>` : ""}<span><i style="background:#2F6FED;border-radius:50%"></i>${T("नदी मापन", "River gauge")}</span><span><i style="background:#16a34a;height:3px"></i>${T("सडक", "Road")}</span></p>`;
  }
  const h = new URLSearchParams(location.hash.slice(1)); const my = G.district && G.district.get();
  if (h.get("r")) render({ r: h.get("r") }); else if (h.get("d")) render({ d: h.get("d"), u: h.get("u") || "" }); else if (my) go({ d: my });
  addEventListener("gati:radius", () => { buildInput(); render(Object.fromEntries(new URLSearchParams(location.hash.slice(1)))); });
  G.onLang(() => { buildInput(); const q = Object.fromEntries(new URLSearchParams(location.hash.slice(1))); render(q); });
})();
