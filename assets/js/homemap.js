/* Home hero map: districts coloured by the highest severity among active OFFICIAL alerts naming that district.
   Own districts.geojson as SVG, no basemap, no labels. Each agency's items stay separate; counts are never added. Gati relays, never issues. */
(function () {
  const box = document.getElementById("hmap"), G = window.Gati; if (!box || !G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const RK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 }, FF = { high: "Severe", moderate: "Moderate", low: "Minor" };
  const AG = { "hydrology.gov.np": ["DHM", "DHM"], "ndrrma.gov.np": ["NDRRMA", "NDRRMA"], "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "seismonepal.gov.np": ["NSC", "NSC"], "dor.gov.np": ["सडक विभाग", "DoR"] };
  const b0 = [80.0, 26.3, 88.25, 30.48], W = 600, K = W / (b0[2] - b0[0]), H = Math.round((b0[3] - b0[1]) * K * 1.12);
  const X = (x) => ((x - b0[0]) * K).toFixed(1), Y = (y) => ((b0[3] - y) * K * 1.12).toFixed(1);
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const pth = (g) => polys(g).map((p) => p.map((r) => "M" + r.map(([x, y]) => X(x) + " " + Y(y)).join("L") + "Z").join("")).join("");
  const ctr = (g) => { let sx = 0, sy = 0, n = 0; polys(g).forEach((p) => p[0].forEach(([x, y]) => { sx += x; sy += y; n++; })); return [sx / n, sy / n]; };
  const npt = (ms) => new Date(ms + 345 * 60000).toISOString().slice(0, 10);
  const today = npt(Date.now());
  box.style.setProperty("--hmar", `${W} / ${H}`);
  let S = null, day = null, sel = null, cat = "all", AQ = null, aqLoading = false;
  const CATS = [["all", "सबै", "All", null], ["flood", "बाढी र वर्षा", "Floods and rain", ["flood"]], ["landslide", "पहिरो", "Landslides", ["landslide"]], ["road", "सडक", "Roads", ["road"]], ["earthquake", "भूकम्प", "Earthquakes", ["earthquake"]], ["weather", "मौसम", "Weather", ["weather"]]];
  const FULL = { all: "", flood: "#hz=flood", landslide: "#hz=landslide", road: "#hz=road", earthquake: "#L=eq", weather: "#hz=weather" };
  /* Air quality: DoENV station data (pollution.gov.np) is the official source but has not been reachable from Gati; the full map already shows modelled US AQI (Open-Meteo, CAMS) for major cities, labelled Model. Same source and label here. */
  const CITIES = [["काठमाडौँ", "Kathmandu", 27.7172, 85.324], ["पोखरा", "Pokhara", 28.2096, 83.9856], ["विराटनगर", "Biratnagar", 26.4525, 87.2718], ["भरतपुर", "Bharatpur", 27.6766, 84.4303], ["नेपालगन्ज", "Nepalgunj", 28.05, 81.6167], ["धनगढी", "Dhangadhi", 28.6833, 80.6], ["जनकपुर", "Janakpur", 26.7288, 85.9263]];
  const AQURL = "https://open-meteo.com/en/docs/air-quality-api", AQBANDS = [[50, "#00a651", "राम्रो", "Good"], [100, "#d4b000", "मध्यम", "Moderate"], [150, "#f7941d", "संवेदनशीललाई अस्वस्थ", "Unhealthy for sensitive"], [200, "#e2231a", "अस्वस्थ", "Unhealthy"], [300, "#8f3f97", "धेरै अस्वस्थ", "Very unhealthy"], [1e9, "#7e0023", "खतरनाक", "Hazardous"]];
  const aqBand = (v) => AQBANDS.find((b) => v <= b[0]);
  function loadAQ() { if (AQ || aqLoading) return; aqLoading = true;
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${CITIES.map((c) => c[2]).join(",")}&longitude=${CITIES.map((c) => c[3]).join(",")}&current=us_aqi&timezone=Asia%2FKathmandu`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { AQ = d ? (Array.isArray(d) ? d : [d]) : []; if (cat === "weather") draw(); }).catch(() => { AQ = []; if (cat === "weather") draw(); }); }
  const QMS = 30 * 864e5, qmag = (a) => parseFloat((a.info.en.params || {})["gati:magnitude"] || "") || null;
  const go = () => Promise.all(["data/districts.geojson", "data/alerts.json", "data/arnab-advisory.json", "data/roads.json", "data/rivers.json"].map((p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([dg, al, ar, rd, rv]) => {
    if (!dg || !al) { box.querySelector(".hmw").innerHTML = `<p class="meta">${T("नक्सा लोड भएन।", "Map could not load.")}</p>`; return; }
    S = { dg, al: al.alerts, ar, rd, rv, paths: {}, cen: {} }; dg.features.forEach((f) => { S.paths[f.properties.code] = pth(f.geometry); S.cen[f.properties.code] = ctr(f.geometry); });
    if (ar && today <= ar.days[ar.days.length - 1].ad) { const i = ar.days.findIndex((d) => d.ad >= today); day = ar.days[Math.max(0, i)].ad; }
    draw(); G.onLang(draw);
  });
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "300px" }); io.observe(box); } else go();
  /* active items for the chosen day (or now): official, not expired, not superseded */
  function items() {
    const d = day || today, slug2code = {}; S.dg.features.forEach((f) => (slug2code[f.properties.slug] = f.properties.code));
    const on = (a) => { const st = npt(Date.parse(a.info.en.onset || a.info.en.effective || a.sent)), ex = a.expires ? npt(Date.parse(a.expires)) : "9999"; return day ? st <= d && d <= ex : !a.expired && Date.parse(a.expires || "2999-01-01") > Date.now(); };
    const L = S.al.filter((a) => a.trust === "Official" && !a.supersededBy && on(a)).map((a) => { const i = a.info[G.lang === "ne" ? "ne" : "en"] || a.info.en;
      return { sev: a.severity, ag: AG[a.sender] ? T(...AG[a.sender]) : a.sender, head: i.headline, href: `${R}alerts/${a.identifier}/`, web: i.web, sent: a.sent, ds: a.districts, road: a.hazard === "road", hz: a.hazard }; });
    if (day && S.ar) { const D = S.ar.days.find((x) => x.ad === day); if (D && D.ff) Object.entries(D.ff).forEach(([lv, sl]) => L.push({ sev: FF[lv], ag: "DHM", head: T(`${S.ar.event_ne}: आकस्मिक बाढी जोखिम, ${D.wd_ne} कात्तिक ${N(D.bs)}`, `${S.ar.event_en}: flash flood risk, ${D.wd_en} Kartik ${D.bs}`), web: S.ar.source.url, sent: S.ar.source.sent, ds: sl.map((s) => slug2code[s]).filter(Boolean), ff: lv, hz: "flood" })); }
    const C = CATS.find((c) => c[0] === cat); return C && C[3] ? L.filter((x) => C[3].includes(x.hz)) : L;
  }
  function draw() {
    const L = items(), top = {}, nat = L.filter((x) => !x.ds.length);
    L.forEach((x) => x.ds.forEach((c) => { if ((RK[x.sev] || 0) > (RK[top[c]] || 0)) top[c] = x.sev; }));
    const dist = S.dg.features.map((f) => { const c = f.properties.code, s = top[c];
      return `<path d="${S.paths[c]}" data-c="${c}" class="hmd${s ? " s-" + s : ""}${sel === c ? " on" : ""}" tabindex="0" role="button" aria-label="${E(T(f.properties.ne, f.properties.en))}${s ? ": " + E(T(G.SEV[s][0], G.SEV[s][1])) : ""}"/>`; }).join("");
    /* small icons: blocked roads (Nepal Police road alerts by district; roads.json routes marked blocked) and DHM gauges at warning or danger */
    const ic = [];
    (cat === "all" || cat === "road") && L.filter((x) => x.road).forEach((x) => x.ds.forEach((c) => S.cen[c] && ic.push(`<g class="hmi hmr" transform="translate(${X(S.cen[c][0])},${Y(S.cen[c][1])})"><title>${E(x.head)}</title><rect x="-6" y="-6" width="12" height="12" rx="2.5"/><path class="hmbar" d="M-3.6 0H3.6"/></g>`)));
    if (S.rd && (cat === "all" || cat === "road")) S.rd.routes.filter((r) => r.status === "blocked").forEach((r) => { const n = S.rd.nodes[r.segs[0][0]], m = S.rd.nodes[r.segs[0][1]]; if (n && m) ic.push(`<g class="hmi hmr" transform="translate(${X((n.ll[1] + m.ll[1]) / 2)},${Y((n.ll[0] + m.ll[0]) / 2)})"><title>${E(T(r.name_ne, r.name_en))}</title><rect x="-6" y="-6" width="12" height="12" rx="2.5"/><path class="hmbar" d="M-3.6 0H3.6"/></g>`); });
    const hot = S.rv && (cat === "all" || cat === "flood") ? S.rv.gauges.filter((g) => g.level >= g.warning) : [];
    hot.forEach((g) => ic.push(`<g class="hmi hmv${g.level >= g.danger ? " dg" : ""}" transform="translate(${X(g.ll[1])},${Y(g.ll[0])})"><title>${E(T(g.ne, g.en))}</title><circle r="5.5"/><path d="M-3 0q1.5-2 3 0t3 0"/></g>`));
    /* official context per category: never colours a district, never added across agencies */
    const icA = ic.length, cx = [], cxleg = []; let cxtxt = "";
    if (cat === "flood" && S.rv && S.rv.gauges.length) { const ok = S.rv.gauges.filter((g) => g.level < g.warning);
      ok.forEach((g) => ic.push(`<g class="hmi hmv ok" transform="translate(${X(g.ll[1])},${Y(g.ll[0])})"><title>${E(T(g.ne, g.en))}: ${E(N(g.level))} m</title><circle r="5.5"/><path d="M-3 0q1.5-2 3 0t3 0"/></g>`));
      if (ok.length) cxleg.push(`<span><i class="hmli v ok"></i>${T("नदी सामान्य तह", "River below warning")}</span>`);
      cxtxt = `<p class="meta hmcx">${T("DHM नदी मापन केन्द्र", "DHM river gauges")}: ${S.rv.gauges.map((g) => `${E(T(g.ne, g.en))} ${E(N(g.level))} m (${T("चेतावनी", "warning")} ${E(N(g.warning))})`).join(" · ")}<br>${T("स्रोत", "Source")}: <a href="${E(S.rv.url)}" target="_blank" rel="noopener">${E(T(S.rv.source_ne, S.rv.source_en))}</a> · ${E(T(S.rv.as_of_ne, S.rv.as_of_en))}</p>`; }
    if (cat === "earthquake") { const Q = S.al.filter((a) => a.hazard === "earthquake" && a.trust === "Official" && Date.now() - Date.parse(a.sent) <= QMS).sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent));
      Q.forEach((a) => { const c = ((a.areas[0] || {}).circles || [])[0]; if (!c) return; const [la, lo] = c.split(" ")[0].split(",").map(Number), m = qmag(a), i = a.info[G.lang === "ne" ? "ne" : "en"] || a.info.en;
        cx.push(`<g class="hmi hmq" transform="translate(${X(lo)},${Y(la)})"><title>${E(i.headline)}</title><circle r="${m ? (3 + m).toFixed(1) : 5}"/></g>`); });
      if (Q.length) { cxleg.push(`<span><i class="hmli q"></i>${T("हालको भूकम्प केन्द्रबिन्दु (३० दिन)", "Recent epicentres (30 days)")}</span>`);
        cxtxt = `<p class="meta hmcx">${T("पछिल्ला ३० दिनका भूकम्प, सक्रिय सूचना होइनन्", "Earthquakes in the last 30 days, not active alerts")}:</p><ul class="hml">${Q.map((a) => { const i = a.info[G.lang === "ne" ? "ne" : "en"] || a.info.en, p = i.params || {}; return `<li>${G.trustChip("Official")} <a href="${R}alerts/${a.identifier}/">${E(i.headline)}</a><br><span class="meta">${T("स्रोत", "Source")}: <a href="${E(p["gati:sourceUrl"] || i.web)}" target="_blank" rel="noopener">${E(AG[a.sender] ? T(...AG[a.sender]) : G.agencyOf(a))}</a> · ${G.npt(p["gati:sourceTime"] || a.sent)}</span></li>`; }).join("")}</ul>`; } }
    if (cat === "weather") { if (!AQ) loadAQ();
      const pts = (AQ || []).map((d, k) => [d && d.current && d.current.us_aqi, CITIES[k], d && d.current && d.current.time]).filter((x) => x[0] != null);
      pts.forEach(([v, c]) => { const b = aqBand(v); cx.push(`<g class="hmi hmaq" transform="translate(${X(c[3])},${Y(c[2])})"><title>${E(T(c[0], c[1]))}: US AQI ${E(N(Math.round(v)))}</title><rect x="-13" y="-8" width="26" height="16" rx="8" style="fill:${b[1]}"/><text y="4" text-anchor="middle">${E(N(Math.round(v)))}</text></g>`); });
      const aqleg = `<div class="hmleg hmaqleg"><b>${T("हावा (US AQI)", "Air (US AQI)")}</b>${AQBANDS.map((b, k) => `<span><i style="background:${b[1]}"></i>${E(N(k ? AQBANDS[k - 1][0] + 1 : 0))}${k < 5 ? "–" + E(N(b[0])) : "+"} ${E(T(b[2], b[3]))}</span>`).join("")}</div>`;
      cxtxt = aqleg + `<p class="meta hmcx">${pts.length ? `${T("हावाको गुणस्तर", "Air quality")}: ${pts.map(([v, c]) => `${E(T(c[0], c[1]))} ${E(N(Math.round(v)))}`).join(" · ")}<br>${G.trustChip("Model")} ${T("स्रोत", "Source")}: <a href="${AQURL}" target="_blank" rel="noopener">Open-Meteo (CAMS)</a> · ${G.npt(pts[0][2] + "+05:45")}. ` : AQ ? T("हावाको तथ्याङ्क अहिले उपलब्ध छैन। ", "Air quality data is not available right now. ") : T("हावाको तथ्याङ्क लोड हुँदैछ… ", "Loading air quality… ")}${T("यो मोडेल अनुमान हो, आधिकारिक मापन होइन। आधिकारिक स्टेसन मापन", "This is a model estimate, not an official measurement. Official station readings")}: <a href="https://pollution.gov.np/portal/" target="_blank" rel="noopener">${T("वातावरण विभाग", "Department of Environment")} (pollution.gov.np)</a></p>`; }
    ic.push(...cx);
    const any = Object.keys(top).length > 0;
    const slider = day && S.ar ? `<div class="hmday" role="group" aria-label="${E(T("दिन", "Day"))}">${S.ar.days.map((d) => `<button type="button" data-d="${d.ad}"${d.ad === day ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${T(d.wd_ne.slice(0, 3) + " " + N(d.bs), d.wd_en.slice(0, 3) + " " + d.bs)}</button>`).join("")}</div>` : "";
    const leg = `<div class="hmleg">${["Extreme", "Severe", "Moderate", "Minor"].map((s) => `<span><i class="s-${s}"></i>${E(T(G.SEV[s][0], G.SEV[s][1]))}</span>`).join("")}<span><i class="hmn"></i>${T("सूचना छैन", "No alert")}</span>${ic.slice(0, icA).some((x) => x.includes("hmr")) ? `<span><i class="hmli r"></i>${T("सडक अवरुद्ध", "Road blocked")}</span>` : ""}${hot.length ? `<span><i class="hmli v"></i>${T("नदी चेतावनी/खतरा तह", "River at warning/danger")}</span>` : ""}${cxleg.join("")}</div>`;
    const have = new Set(S.al.map((a) => a.hazard)); if (S.ar) have.add("flood");
    const chips = `<div class="hmcats" role="group" aria-label="${E(T("प्रकार", "Category"))}">${CATS.filter((c) => !c[3] || c[3].some((h) => have.has(h))).map((c) => `<button type="button" data-k="${c[0]}" aria-pressed="${c[0] === cat}">${E(T(c[1], c[2]))}</button>`).join("")}</div>`;
    const head = chips + `<div class="hmhead"><h2>${T("जिल्लाअनुसार आधिकारिक सूचना", "Official alerts by district")}</h2><span class="hmlinks"><a class="hmchip" href="${R}route/">${T("रुट जाँच", "Route check")} →</a><a class="hmchip hmfull" href="${R}map/${FULL[cat] || ""}">${T("पूरा नक्सा", "Full map")} →</a></span></div>`;
    const note = `<p class="meta hmnote">${T("हरेक जिल्लाको रङ: त्यस जिल्लालाई नाम लिएर जारी सक्रिय आधिकारिक सूचनामध्ये सबैभन्दा गम्भीर। देशव्यापी सूचना तल छुट्टै। जिल्लामा थिच्नुहोस्।", "Each district shows the most severe active official alert that names it. Nationwide notices are listed separately below. Tap a district.")}${day ? " " + E(T("कात्तिक " + N(S.ar.days.find((x) => x.ad === day).bs), "Kartik " + S.ar.days.find((x) => x.ad === day).bs + " (" + Number(day.slice(8)) + " Oct)")) : ""}</p>`;
    const none = !any && !nat.length && !icA ? `<p class="hmnone">${cat === "all" ? T("सक्रिय आधिकारिक सूचना छैन", "No active alerts") : T("यो प्रकारको सक्रिय आधिकारिक सूचना छैन", "No active official alerts in this category")}</p>` : "";
    if (none && !cxtxt) { box.innerHTML = `${head}${none}${slider}`; bind(); return; }
    box.innerHTML = `${head}${none}${slider}<div class="hmw"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="hmsvg">${dist}${ic.join("")}</svg></div>${leg}${cxtxt}${note}
      ${nat.length ? `<details class="hmnat"${cat === "weather" ? " open" : ""}><summary>${T("देशव्यापी आधिकारिक सूचना", "Nationwide official notices")}: ${[...new Set(nat.map((x) => x.ag))].map((a) => `${E(a)} ${N(nat.filter((x) => x.ag === a).length)}`).join(" · ")}</summary>${list(nat)}</details>` : ""}
      <div class="hmsheet" id="hmsheet" aria-live="polite">${sel ? sheet(sel, L) : ""}</div>`;
    bind();
  }
  function list(xs) { return `<ul class="hml">${xs.sort((a, b) => (RK[b.sev] || 0) - (RK[a.sev] || 0)).map((x) => `<li>${G.sevChip(x.sev)} ${G.trustChip("Official")} ${x.href ? `<a href="${x.href}">${E(x.head)}</a>` : E(x.head)}<br><span class="meta">${T("स्रोत", "Source")}: <a href="${E(x.web)}" target="_blank" rel="noopener">${E(x.ag)}</a> · ${G.npt(x.sent)}</span></li>`).join("")}</ul>`; }
  function sheet(c, L) {
    const f = S.dg.features.find((x) => x.properties.code === c), xs = L.filter((x) => x.ds.includes(c)), nat = L.filter((x) => !x.ds.length);
    const ags = [...new Set(xs.map((x) => x.ag))];
    return `<div class="hmsh"><div class="hmshh"><b>${E(T(f.properties.ne, f.properties.en))}</b><button type="button" class="hmx" aria-label="${T("बन्द गर्नुहोस्", "Close")}">×</button></div>
      ${xs.length ? ags.map((a) => `<p class="hmag">${E(a)} <span class="meta">(${N(xs.filter((x) => x.ag === a).length)})</span></p>${list(xs.filter((x) => x.ag === a))}`).join("") : `<p class="meta">${T("यो जिल्लालाई नाम लिएर सक्रिय आधिकारिक सूचना छैन।", "No active official alert names this district.")}</p>`}
      ${nat.length ? `<p class="meta">${T("देशव्यापी सूचना पनि लागू हुन सक्छन्, माथि हेर्नुहोस्।", "Nationwide notices above also cover this district.")}</p>` : ""}
      <p><a href="${R}affected/#d=${E(c)}">${T("यो जिल्लाको पूरा विवरण", "Full district view")} →</a></p></div>`;
  }
  function bind() {
    box.querySelectorAll(".hmcats button").forEach((b) => (b.onclick = () => { cat = b.dataset.k; draw(); }));
    box.querySelectorAll(".hmday button").forEach((b) => (b.onclick = () => { day = b.dataset.d; draw(); }));
    const pick = (c) => { sel = sel === c ? null : c; draw(); const sh = box.querySelector("#hmsheet"); if (sel && sh && sh.getBoundingClientRect().top > innerHeight - 80) sh.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    box.querySelectorAll(".hmd").forEach((p) => { p.onclick = () => pick(p.dataset.c); p.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(p.dataset.c); } }; });
    const x = box.querySelector(".hmx"); if (x) x.onclick = () => { sel = null; draw(); };
  }
})();
