/* Cyclone Arnab: trekking routes coloured by DHM district flash flood risk, plus official travel notices. Gati relays, never issues. */
(function () {
  const box = document.getElementById("trek"), nbox = document.getElementById("tknotices"), G = window.Gati; if (!box || !G) return;
  const R = document.body.dataset.root || "./";
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const LV = { normal: ["Unknown", "सामान्य", "Normal", "var(--info)", 0], low: ["Minor", "न्युन जोखिम", "Low risk", "var(--minor)", 1], moderate: ["Moderate", "मध्यम जोखिम", "Moderate risk", "var(--moderate)", 2], high: ["Severe", "उच्च जोखिम", "High risk", "var(--severe)", 3] };
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v.slice(4, -1)).trim() || "#888";
  let A, DG, TK, TA, PV, day = 1, sel = null, map, dl, tl;
  Promise.all(["data/arnab-advisory.json", "data/districts.geojson", "data/geo/treks.geojson", "data/travel-advisory.json", "data/geo/provinces.geojson"].map((p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([a, d, t, ta, pv]) => {
    A = a; DG = d; TK = t; TA = ta; PV = pv;
    if (!A || !DG || !TK) { box.innerHTML = `<p class="meta">${T("नक्सा लोड भएन।", "Could not load the map.")}</p>`; return; }
    const h = new URLSearchParams(location.hash.slice(1)); const k = +h.get("k"); if (k >= 11 && k <= 15) day = k - 11; sel = h.get("r");
    build(); G.onLang(build);
  });
  function lvOf(D, slug) { if (!D.ff) return null; let lv = "low"; Object.entries(D.ff).forEach(([l, ds]) => { if (ds.includes(slug)) lv = l; }); return lv; }
  function routeLv(D, f) { if (!D.ff) return null; return f.properties.districts.map((s) => lvOf(D, s)).reduce((m, l) => (LV[l][4] > LV[m][4] ? l : m), "low"); }
  function chip(lv) { return lv ? `<span class="sev sev-${LV[lv][0]}">${T(LV[lv][1], LV[lv][2])}</span>` : `<span class="sev sev-Unknown">${T("जिल्ला नक्सा छैन", "No district map")}</span>`; }
  function dname(slug) { const f = DG.features.find((x) => x.properties.slug === slug); return f ? T(f.properties.ne, f.properties.en) : slug; }
  function src() { return `<p class="meta">${T("बाढी जोखिम स्रोत", "Flood risk source")}: <a href="${E(A.source.url)}" target="_blank" rel="noopener">${E(T(A.source.ne, A.source.en))}</a> · <time datetime="${A.source.sent}">${E(T(A.source.sent_ne, A.source.sent_en))}</time> ${G.trustChip(A.trust)}</p>`; }
  function detail() {
    const D = A.days[day];
    if (!sel) return `<p class="anHint">${T("नक्सामा वा तलको सूचीमा पदमार्ग छान्नुहोस्।", "Pick a route on the map or in the list below.")}</p>`;
    const f = TK.features.find((x) => x.id === sel); if (!f) return "";
    const lv = routeLv(D, f);
    return `<h3>${E(T(f.properties.ne, f.properties.en))}</h3><p>${T("कात्तिक " + N(D.bs), "Kartik " + D.bs)}: ${chip(lv)}</p>
      <ul class="tkdl">${f.properties.districts.map((s) => `<li>${E(dname(s))} ${chip(lvOf(D, s))}</li>`).join("")}</ul>
      <p class="meta">${E(T("यो मार्गका लागि छुट्टै आधिकारिक पदयात्रा सूचना छैन; DHM को जिल्लागत आकस्मिक बाढी जोखिम मात्र देखाइएको।", "No separate official trekking notice for this route; only DHM's district flash flood risk is shown."))}</p>
      ${f.properties.osm ? `<p class="meta"><a href="${E(f.properties.osm)}" target="_blank" rel="noopener">${T("OpenStreetMap मा मार्ग", "Route on OpenStreetMap")}</a></p>` : ""}${src()}`;
  }
  function style() {
    const D = A.days[day];
    const ff = {}; if (D.ff) Object.entries(D.ff).forEach(([l, ds]) => ds.forEach((x) => (ff[x] = l)));
    dl.setStyle((f) => { const lv = ff[f.properties.slug]; return { color: css("var(--slate)"), weight: 0.5, opacity: 0.5, fillColor: lv ? css(LV[lv][3]) : css("var(--surface2)"), fillOpacity: lv ? 0.3 : 1 }; });
    tl.eachLayer((l) => { const f = l.feature, lv = routeLv(D, f), on = sel === f.id; if (l.options.halo) l.setStyle({ weight: on ? 10 : 7, color: css("var(--ink)"), opacity: on ? 0.95 : 0.75 }); else l.setStyle({ color: lv ? css(LV[lv][3]) : css("var(--surface)"), weight: on ? 5 : 3.5, opacity: 1, dashArray: lv ? null : "5 5" }); if (on) l.bringToFront(); });
  }
  function build() {
    const D = A.days[day];
    box.innerHTML = `<div class="sechead" style="margin-top:0"><h2>${E(T("पदमार्ग नक्सा: दिनअनुसार बाढी जोखिम", "Trekking route map: flood risk by day"))}</h2>${G.trustChip(A.trust)}</div>
      <div class="anDays" role="group" aria-label="${T("दिन", "Day")}">${A.days.map((d, i) => `<button type="button" class="anDay" aria-pressed="${i === day}" data-i="${i}"><b>${T("कात्तिक " + N(d.bs), "Kartik " + d.bs)}</b><span>${E(T(d.wd_ne, d.wd_en.slice(0, 3)))}</span><i style="background:${LV[d.level][3]}"></i></button>`).join("")}</div>
      <div class="tkgrid"><div id="tkmap" role="region" aria-label="${E(T("पदमार्ग नक्सा", "Trekking route map"))}"></div><div class="tkside"><p class="anDayT"><b>${T("कात्तिक " + N(D.bs) + " (" + D.wd_ne + ")", "Kartik " + D.bs + " (" + D.wd_en + ")")}</b> <span class="sev sev-${LV[D.level][0]}">${T(LV[D.level][1], LV[D.level][2])}</span></p><p>${E(T(D.ne, D.en))}</p><div id="tkdet" aria-live="polite">${detail()}</div></div></div>
      <div class="anLeg"><span><i style="background:var(--minor)"></i>${T("न्युन जोखिम", "Low risk")}</span><span><i style="background:var(--moderate)"></i>${T("मध्यम जोखिम", "Moderate risk")}</span><span><i style="background:var(--severe)"></i>${T("उच्च जोखिम", "High risk")}</span><span><i class="dash"></i>${T("यस दिन जिल्ला नक्सा छैन", "No district map this day")}</span></div>
      <div class="tklist" role="list">${TK.features.map((f) => { const lv = routeLv(D, f); return `<button type="button" role="listitem" class="tkr" data-r="${f.id}" aria-pressed="${sel === f.id}"><i style="background:${lv ? LV[lv][3] : "var(--line)"}"></i>${E(T(f.properties.ne, f.properties.en))}</button>`; }).join("")}</div>
      <p class="meta">${E(T("मार्ग रङ: मार्ग पर्ने जिल्लामध्ये DHM ले तोकेको सबैभन्दा उच्च आकस्मिक बाढी जोखिम। मार्ग रेखा देखाउनका लागि मात्र, बाटो पत्ता लगाउन होइन।", "Route colour: the highest DHM flash flood risk among the districts the route passes. Lines are for display only, not for navigation."))}</p>`;
    if (map) { map.remove(); map = null; }
    map = L.map("tkmap", { zoomSnap: 0.25, scrollWheelZoom: false, attributionControl: true, minZoom: 6, maxZoom: 13 });
    map.attributionControl.setPrefix("").addAttribution("© OpenStreetMap contributors (ODbL) · COD-AB / OCHA HDX · Open Knowledge Nepal · DHM");
    dl = L.geoJSON(DG, { interactive: false }).addTo(map);
    if (PV) L.geoJSON(PV, { interactive: false, style: { color: css("var(--slate)"), weight: 1.2, fill: false, opacity: 0.6 } }).addTo(map);
    tl = L.featureGroup().addTo(map);
    TK.features.forEach((f) => {
      const halo = L.geoJSON(f, { style: { color: "#222", weight: 7, opacity: 0.75 }, halo: true, interactive: false }).getLayers(); halo.forEach((l) => { l.feature = f; l.options.halo = true; tl.addLayer(l); });
      L.geoJSON(f).getLayers().forEach((l) => { l.feature = f; l.bindTooltip(E(T(f.properties.ne, f.properties.en)), { sticky: true }); l.on("click", () => pick(f.id)); tl.addLayer(l); });
    });
    map.fitBounds(sel ? L.geoJSON(TK.features.find((x) => x.id === sel)).getBounds() : tl.getBounds(), { padding: [10, 10], maxZoom: 10 });
    style();
    const set = (i) => { day = i; hash(); build(); };
    box.querySelectorAll(".anDay").forEach((b) => (b.onclick = () => set(+b.dataset.i)));
    box.querySelectorAll(".tkr").forEach((b) => (b.onclick = () => { pick(b.dataset.r); map.fitBounds(L.geoJSON(TK.features.find((x) => x.id === b.dataset.r)).getBounds(), { padding: [20, 20], maxZoom: 10 }); }));
    notices();
  }
  function hash() { history.replaceState(null, "", "#k=" + (11 + day) + (sel ? "&r=" + sel : "")); }
  function pick(id) { sel = id; hash(); box.querySelector("#tkdet").innerHTML = detail(); box.querySelectorAll(".tkr").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.r === id))); style(); }
  function notices() {
    if (!nbox) return; if (!TA) { nbox.innerHTML = `<p class="meta">${T("सूचना लोड भएन।", "Could not load notices.")}</p>`; return; }
    const D = A.days[day];
    nbox.innerHTML = `<div class="sechead" style="margin-top:0"><h2>${E(T("आधिकारिक यात्रा तथा पदयात्रा सूचना", "Official travel and trekking notices"))}</h2></div>
      <ul class="tkn">${TA.notices.map((n) => `<li class="${n.days.includes(D.bs) ? "on" : ""}"><p><b>${E(T(n.ne_agency, n.en_agency))}</b> ${G.trustChip(n.trust)}${n.days.includes(D.bs) ? ` <span class="sev sev-Moderate">${T("कात्तिक " + N(D.bs) + " लागू", "Covers Kartik " + D.bs)}</span>` : ""}</p><p>${E(T(n.ne, n.en))}</p>
        <p class="meta">${T("स्रोत", "Source")}: <a href="${E(n.url)}" target="_blank" rel="noopener">${E(n.url_label)}</a>${n.url2 ? ` · <a href="${E(n.url2)}" target="_blank" rel="noopener">${E(n.url2_label)}</a>` : ""} · <time datetime="${E(n.sent)}">${E(T(n.sent_ne, n.sent_en))}</time>${n.trust === "Reported" ? " · " + E(T("मूल सूचना हामीले खोल्न सकेनौं; समाचार स्रोत", "original notice not opened by us; news report")) : ""}</p></li>`).join("")}</ul>
      <ul class="tkn tknone">${TA.none_found.map((x) => `<li class="meta">${E(T(x.ne, x.en))}</li>`).join("")}</ul>
      <p class="meta">${E(T(TA.note_ne, TA.note_en))} ${T("जाँचेको", "Checked")}: <time datetime="${TA.checked}">${E(T(TA.checked_ne, TA.checked_en))}</time>. ${T("निकायका तथ्याङ्क कहिल्यै जोडिँदैनन्।", "Figures from different agencies are never summed.")}</p>
      <p class="meta">${E(T(A.hotline_ne, A.hotline_en))} <a href="tel:1155">☎ ${N(1155)}</a></p>`;
  }
})();
