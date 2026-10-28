/* trek/?trek=...&from=start|end&date=YYYY-MM-DD : trekking route check. Gati relays official notices, never issues advice. */
(function () {
  const box = document.getElementById("tkcheck"), G = window.Gati; if (!box || !G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const J = (p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const tm = (iso) => (iso ? `<time datetime="${E(iso)}">${G.npt(iso)}</time>` : "");
  const LV = { low: ["Minor", "न्युन जोखिम", "Low risk"], moderate: ["Moderate", "मध्यम जोखिम", "Moderate risk"], high: ["Severe", "उच्च जोखिम", "High risk"] };
  const KIND = { hospital: ["अस्पताल/स्वास्थ्य केन्द्र", "Hospital or clinic"], health_post: ["स्वास्थ्य चौकी", "Health post"], helipad: ["हेलिप्याड", "Helipad"], police: ["प्रहरी", "Police"] };
  const today = new Date(Date.now() + 345 * 60000).toISOString().slice(0, 10);
  let S = {}, P = new URLSearchParams(location.search);
  Promise.all(["data/geo/treks.geojson", "data/geo/trekinfo.json", "data/trek-meta.json", "data/alerts.json", "data/arnab-advisory.json", "data/travel-advisory.json", "data/roads.json", "data/districts.json"].map(J)).then(([tk, ti, tm_, al, ar, ta, rd, ds]) => {
    S = { tk, ti, meta: tm_, al: al ? al.alerts : [], ar, ta, rd, ds }; if (!tk || !ti) { box.innerHTML = `<p class="meta">${T("पदमार्ग जानकारी लोड भएन।", "Could not load trek data.")}</p>`; return; }
    draw(); G.onLang(draw);
  });
  function setP(k, v) { if (v) P.set(k, v); else P.delete(k); history.replaceState(null, "", location.pathname + "?" + P.toString() + location.hash); draw(); }
  function profile(info, rev) {
    const pr = info.profile.filter((p) => p[1] != null); if (pr.length < 2) return "";
    const L = info.length_km, W = 640, H = 170, pad = 34, mn = Math.min(...pr.map((p) => p[1])), mx = Math.max(...pr.map((p) => p[1]));
    const X = (k) => (pad + ((rev ? L - k : k) / L) * (W - pad - 8)).toFixed(1), Y = (e) => (H - 22 - ((e - mn) / Math.max(1, mx - mn)) * (H - 40)).toFixed(1);
    const pts = pr.map((p) => `${X(p[0])},${Y(p[1])}`).join(" ");
    const st = info.stages.filter((s) => s.elev != null).map((s) => `<circle cx="${X(s.km)}" cy="${Y(s.elev)}" r="3.5" class="tkpS"><title>${E(s.name)} · ${N(s.elev)} m</title></circle>`).join("");
    return `<svg class="tkprof" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(T("उचाइ रेखाचित्र", "Altitude profile"))}"><polyline points="${pad},${H - 22} ${pts} ${W - 8},${H - 22}" class="tkpA"/><polyline points="${pts}" class="tkpL"/>${st}
      <text x="2" y="${Y(mx)}" class="tkpT">${N(mx)} m</text><text x="2" y="${Y(mn)}" class="tkpT">${N(mn)} m</text><text x="${pad}" y="${H - 6}" class="tkpT">${N(0)} km</text><text x="${W - 8}" y="${H - 6}" class="tkpT" text-anchor="end">${N(L)} km</text></svg>
      <p class="meta">${E(T("उचाइ: SRTM ३० मिटर (NASA/USGS), OpenTopoData मार्फत; मार्ग रेखा OpenStreetMap। देखाउनका लागि मात्र।", "Altitude: SRTM 30 m (NASA/USGS) via OpenTopoData; route line OpenStreetMap. For display only."))} ${T("निर्माण", "Built")} ${tm(S.ti.built)}</p>`;
  }
  function draw() {
    const id = P.get("trek"), rev = P.get("from") === "end", date = P.get("date") || today;
    const opts = S.tk.features.map((f) => `<option value="${f.id}"${f.id === id ? " selected" : ""}>${E(T(f.properties.ne, f.properties.en))}</option>`).join("");
    let h = `<div class="sechead" style="margin-top:0"><h2>${E(T("पदमार्ग जाँच", "Trek check"))}</h2></div>
      <div class="tkcf"><label>${T("पदमार्ग", "Trek")} <select id="tkSel"><option value="">${T("छान्नुहोस्", "Choose")}</option>${opts}</select></label>
      <label>${T("सुरु", "Start from")} <select id="tkFrom"><option value="start"${!rev ? " selected" : ""}>${T("मार्गको सुरु", "Route start")}</option><option value="end"${rev ? " selected" : ""}>${T("मार्गको अन्त्य", "Route end")}</option></select></label>
      <label>${T("मिति", "Date")} <input type="date" id="tkDate" value="${E(date)}"></label></div>`;
    const f = id && S.tk.features.find((x) => x.id === id), info = f && S.ti.treks[id];
    if (!f || !info) { box.innerHTML = h + `<p class="anHint">${T("माथिबाट पदमार्ग छान्नुहोस्।", "Choose a trek above.")}</p>`; bind(); return; }
    const m = (S.meta && S.meta.treks[id]) || {}, slugs = f.properties.districts, codes = slugs.map((s) => (S.ds.find((d) => d.id === s) || {}).code).filter(Boolean);
    const stages = rev ? info.stages.slice().reverse() : info.stages;
    const dnm = (s) => { const d = S.ds.find((x) => x.id === s); return d ? T(d.ne, d.en) : s; };
    h += `<h3>${E(T(f.properties.ne, f.properties.en))}</h3><p class="meta">${T("जिल्ला", "Districts")}: ${slugs.map(dnm).map(E).join(", ")} · ${T("रेखाको लम्बाइ", "Line length")} ${N(info.length_km)} km (OpenStreetMap) · ${T("हिँड्ने समय देखाइँदैन।", "No walking time shown.")}</p>`;
    h += profile(info, rev);
    h += `<details class="tkst" open><summary>${T("गाउँ र बिसौनी (OpenStreetMap)", "Villages and stages (OpenStreetMap)")}</summary><ol>${stages.map((s) => `<li>${E(s.name)} <span class="meta">${N(rev ? Math.round((info.length_km - s.km) * 10) / 10 : s.km)} km${s.elev != null ? " · " + N(s.elev) + " m" : ""}</span></li>`).join("")}</ol><p class="meta">${E(T("नाम Nominatim (OpenStreetMap) बाट; दूरी रेखाअनुसार, बाटोको हिँडाइ होइन।", "Names from Nominatim (OpenStreetMap); distance along the drawn line, not a walking distance."))}</p></details>`;
    /* official alerts on the date along the route districts */
    const on = (a) => { const st = ((a.info.en.onset || a.info.en.effective || a.sent) + "").slice(0, 10), ex = ((a.expires || a.info.en.expires || "9999") + "").slice(0, 10); return st <= date && date <= ex; };
    const al = S.al.filter((a) => !a.supersededBy && on(a) && (!a.districts.length || a.districts.some((c) => codes.includes(c))));
    h += `<section class="tksec"><h3>${T("यो मितिका आधिकारिक सूचना", "Official notices for this date")} <span class="meta">(${E(N(date))})</span></h3>`;
    h += al.length ? `<ul class="tkn">${al.map((a) => { const i = a.info[G.lang === "ne" ? "ne" : "en"] || a.info.en; return `<li><p>${G.trustChip(a.trust)} ${G.sevChip ? G.sevChip(a.severity) : ""} <a href="${R}alerts/${E(a.identifier)}/">${E(i.headline)}</a>${a.districts.length ? "" : ` <span class="meta">${T("(देशव्यापी)", "(nationwide)")}</span>`}</p><p class="meta">${T("स्रोत", "Source")}: <a href="${E(i.web)}" target="_blank" rel="noopener">${E((i.senderName || a.sender).split(" · ")[0])}</a> · ${tm(a.sent)}</p></li>`; }).join("")}</ul>` : `<p class="meta">${T("यो मिति र जिल्लाका लागि गतिमा आधिकारिक सूचना छैन।", "No official notice in Gati for this date and these districts.")}</p>`;
    const day = S.ar && S.ar.days.find((d) => d.ad === date);
    if (day) { const lv = (s) => { if (!day.ff) return null; let l = "low"; Object.entries(day.ff).forEach(([k, v]) => { if (v.includes(s)) l = k; }); return l; };
      h += `<p><b>${E(T(S.ar.event_ne, S.ar.event_en))}, DHM ${T("आकस्मिक बाढी जोखिम", "flash flood risk")}:</b> ${slugs.map((s) => { const l = lv(s); return `${E(dnm(s))} ${l ? `<span class="sev sev-${LV[l][0]}">${T(LV[l][1], LV[l][2])}</span>` : `<span class="meta">${T("जिल्ला नक्सा छैन", "no district map")}</span>`}`; }).join(" · ")} <span class="meta">· <a href="${E(S.ar.source.url)}" target="_blank" rel="noopener">DHM</a> · ${tm(S.ar.source.sent)}</span></p>`; }
    if (S.ta && day) { const tn = S.ta.notices.filter((n) => n.days.includes(day.bs));
      if (tn.length) h += `<ul class="tkn">${tn.map((n) => `<li><p><b>${E(T(n.ne_agency, n.en_agency))}</b> ${G.trustChip(n.trust)}</p><p>${E(T(n.ne, n.en))}</p><p class="meta"><a href="${E(n.url)}" target="_blank" rel="noopener">${E(n.url_label)}</a> · ${E(T(n.sent_ne, n.sent_en))}${n.trust === "Reported" ? " · " + T("मूल सूचना हामीले खोल्न सकेनौं", "original not opened by us") : ""}</p></li>`).join("")}</ul>`; }
    h += `</section>`;
    /* roads to trailhead, flights */
    const rr = (m.roads || []).map((r) => S.rd && S.rd.routes.find((x) => x.id === r)).filter(Boolean);
    const ST = { open: ["खुला", "Open"], none: ["स्थिति पुष्टि भएन", "Not confirmed"], blocked: ["अवरुद्ध", "Blocked"], partial: ["आंशिक खुला", "Partly open"] };
    if (rr.length || m.flight) {
      h += `<section class="tksec"><h3>${T("पदमार्ग सुरु हुने ठाउँसम्म", "Getting to the trailhead")}</h3>`;
      if (rr.length) h += `<ul class="tkdl">${rr.map((r) => `<li>${E(T(r.name_ne, r.name_en))}: <b>${E(T(...(ST[r.status] || ST.none)))}</b><br><span class="meta">${E(T(r.note_ne, r.note_en))}</span></li>`).join("")}</ul><p class="meta">${T("सडक", "Roads")}: ${Object.values(S.rd.sources).map((s) => `<a href="${E(s.u)}" target="_blank" rel="noopener">${E(T(s.ne, s.en))}</a>`).join(" · ")} · ${E(T(S.rd.as_of_ne, S.rd.as_of_en))}</p>`;
      if (m.flight && S.meta.flights[m.flight]) { const fl = S.meta.flights[m.flight]; h += `<p>${E(T(fl.ne, fl.en))}: ${fl.links.map(([n, u]) => `<a href="${E(u)}" target="_blank" rel="noopener">${E(n)}</a>`).join(" · ")} <span class="meta">${T("(लिङ्क मात्र; गतिले उडान स्थिति देखाउँदैन)", "(links only; Gati does not show flight status)")}</span></p>`; }
      h += `</section>`;
    }
    /* help nearby */
    const hra = S.meta ? S.meta.hra.posts.filter((p) => p.treks.includes(id)) : [];
    h += `<section class="tksec"><h3>${T("नजिकको सहायता (रेखाबाट करिब ५ किमी)", "Help nearby (about 5 km of the line)")}</h3>`;
    if (hra.length) h += `<ul class="tkdl">${hra.map((p) => `<li><b>${E(T(p.ne, p.name))}</b> · ${E(T(p.season_ne, p.season_en))} <span class="meta">· <a href="${E(S.meta.hra.source)}" target="_blank" rel="noopener">HRA</a> · ${E(T(S.meta.hra.checked_ne, S.meta.hra.checked_en))} · ${T("स्थान अनुमानित", "approximate location")}</span></li>`).join("")}</ul>`;
    h += info.help.length ? `<ul class="tkdl">${info.help.slice(0, 12).map((x) => `<li>${E(T(...KIND[x.kind]))}${x.name ? ": " + E(x.name) : ""} <span class="meta">· ${N(x.dist_km)} km ${T("रेखाबाट", "from line")}</span></li>`).join("")}</ul>` : `<p class="meta">${T("OSM मा केही भेटिएन।", "Nothing found in OSM.")}</p>`;
    h += `<p class="meta">${E(T("OSM, पुरानो हुन सक्छ", "OSM, may be outdated"))}: ${E(S.ti.sources.health)}; ${E(S.ti.sources.helipads)}; ${E(T("प्रहरी", "police"))}: ${E(S.ti.sources.police)}, ${T("ल्याइएको", "fetched")} ${tm(S.ti.built)}. ${E(T("हेलिप्याड आपतकालीन अवतरणका लागि स्वीकृत स्थलको सूची होइन।", "Helipads are not a list of approved emergency landing sites."))}</p></section>`;
    h += `<section class="tksec tkplain"><p><b>${T("आधिकारिक हिमपहिरो बुलेटिन छैन।", "There is no official avalanche bulletin.")}</b> ${T("गतिसँग पदमार्ग वा लज खुला/बन्दको प्रत्यक्ष जानकारी छैन।", "Gati has no live trail or lodge status.")} ${T("गतिले आफ्नो सल्लाह जारी गर्दैन; आधिकारिक सूचना मात्र पुनः प्रसारण गर्छ।", "Gati does not issue its own advice; it relays official notices only.")}</p></section>`;
    box.innerHTML = h; bind();
  }
  function bind() {
    const s = box.querySelector("#tkSel"), fr = box.querySelector("#tkFrom"), d = box.querySelector("#tkDate");
    if (s) s.onchange = () => setP("trek", s.value); if (fr) fr.onchange = () => setP("from", fr.value === "end" ? "end" : ""); if (d) d.onchange = () => setP("date", d.value);
  }
})();
