(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const RD = await G.json("data/roads.json"), N = RD.nodes;
  const [RG, DG] = await Promise.all([G.json("data/geo/roads.geojson").catch(() => null), G.json("data/districts.geojson").catch(() => null)]);
  const COL = { open: "#16a34a", oneway: "#f59e0b", blocked: "#dc2626", none: "#86D8A0" };
  let map, lay;
  function drawMap(P, alt) {
    if (!window.L || !RG) return;
    if (!map) {
      map = L.map("rmap", { zoomSnap: 0.25, scrollWheelZoom: false, tap: true }); map.attributionControl.setPrefix("").addAttribution("© OpenStreetMap contributors (ODbL) · COD-AB / OCHA HDX · Open Knowledge Nepal");
      if (DG) L.geoJSON(DG, { style: { color: "#c3ccd6", weight: 0.7, fillColor: "#f3f6f9", fillOpacity: 1 }, interactive: false }).addTo(map);
      L.geoJSON(RG, { style: { color: "#cfd6de", weight: 3 }, interactive: false }).addTo(map);
    }
    if (lay) map.removeLayer(lay); lay = L.layerGroup().addTo(map);
    const ids = [...new Set(P.map((x) => x[2].id))], feats = RG.features.filter((f) => ids.includes(f.properties.id));
    (alt || []).forEach((A, k) => { const aids = [...new Set(A.map((x) => x[2].id))].filter((x) => !ids.includes(x)); if (!aids.length) return;
      L.geoJSON({ type: "FeatureCollection", features: RG.features.filter((f) => aids.includes(f.properties.id)) }, { style: (f) => { const r = RD.routes.find((x) => x.id === f.properties.id); return { color: COL[r.status] || COL.none, weight: 4, dashArray: "6 8", opacity: .85 }; } })
        .bindTooltip(T(`वैकल्पिक मार्ग ${G.num(k + 1)}`, `Alternative ${k + 1}`)).addTo(lay); });
    const g = L.geoJSON({ type: "FeatureCollection", features: feats }, { style: (f) => { const r = RD.routes.find((x) => x.id === f.properties.id); return { color: COL[r.status] || COL.none, weight: 7, opacity: .95, lineCap: "round", dashArray: r.status === "none" ? "2 10" : null }; },
      onEachFeature: (f, l) => { const r = RD.routes.find((x) => x.id === f.properties.id); l.bindPopup(`<b>${esc(T(r.name_ne, r.name_en))}</b><br>${esc(T(r.note_ne, r.note_en))}`); } }).addTo(lay);
    // casing under the coloured lines
    L.geoJSON({ type: "FeatureCollection", features: feats }, { style: { color: "#fff", weight: 11, opacity: .9 }, interactive: false }).addTo(lay).bringToBack();
    // pins on corridors that are not open
    feats.forEach((f) => { const r = RD.routes.find((x) => x.id === f.properties.id); if (r.status === "open") return;
      const cs = f.geometry.type === "LineString" ? f.geometry.coordinates : f.geometry.coordinates.flat(), mid = cs[Math.floor(cs.length / 2)];
      const src = (r.sources || []).map((k) => RD.sources[k]).filter(Boolean).map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(T(s.ne, s.en))} ↗</a>`).join("<br>");
      L.marker([mid[1], mid[0]], { icon: L.divIcon({ className: "rpin rp-" + r.status, html: r.status === "blocked" ? "⛔" : r.status === "oneway" ? "⚠" : "?", iconSize: [30, 30] }), keyboard: true, title: T(r.name_ne, r.name_en) })
        .bindPopup(`<b>${esc(T(r.name_ne, r.name_en))}</b><br>${esc(T(r.note_ne, r.note_en))}<br><small>${src}<br>${esc(T(RD.as_of_ne, RD.as_of_en))}</small>`).addTo(lay); });
    const s = N[P[0][0]], e = N[P[P.length - 1][1]];
    L.marker(s.ll, { icon: L.divIcon({ className: "rend rs", html: "A", iconSize: [28, 28] }) }).bindTooltip(esc(T(s.ne, s.en)), { permanent: true, direction: "top", offset: [0, -14], className: "rtip" }).addTo(lay);
    L.marker(e.ll, { icon: L.divIcon({ className: "rend re", html: "B", iconSize: [28, 28] }) }).bindTooltip(esc(T(e.ne, e.en)), { permanent: true, direction: "top", offset: [0, -14], className: "rtip" }).addTo(lay);
    // district labels for districts the route passes through
    if (DG) { const pts = feats.flatMap((f) => (f.geometry.type === "LineString" ? f.geometry.coordinates : f.geometry.coordinates.flat())).filter((_, k) => k % 6 === 0);
      const inR = (x, y, r) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [a, b] = r[i], [c, d] = r[j]; if ((b > y) !== (d > y) && x < ((c - a) * (y - b)) / (d - b) + a) o = !o; } return o; };
      DG.features.forEach((f) => { const P2 = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates; if (!pts.some(([x, y]) => P2.some((p) => inR(x, y, p[0])))) return;
        let x0 = 999, x1 = -999, y0 = 999, y1 = -999; P2.forEach((p) => p[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
        L.marker([(y0 + y1) / 2, (x0 + x1) / 2], { icon: L.divIcon({ className: "rdl", html: esc(T(f.properties.ne, f.properties.en)), iconSize: [90, 16] }), interactive: false }).addTo(lay); }); }
    map.fitBounds(g.getBounds().pad(0.15));
  }
  const hav = (a, b) => { const r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const EN = G.routeEngine(RD, RG), adj = EN.adj;
  const groups0 = (P) => P.some(([, , rt]) => rt.status !== "open" && rt.status !== "oneway");
  const RS = { open: ["खुला", "Open", "ok"], blocked: ["अवरुद्ध", "Blocked", "bad"], oneway: ["एकतर्फी", "One-way", "warn"], none: ["पुष्टि छैन", "Not confirmed", "nc"] };
  const f = document.getElementById("rfrom"), t = document.getElementById("rto");
  const ids = Object.keys(N).filter((k) => adj[k] || N[k].noroad);
  function opts() {
    const keep = [f.value || localStorage.getItem("gati-rfrom") || "ktm", t.value || localStorage.getItem("gati-rto") || "pokhara"];
    const o = ids.slice().sort((a, b) => T(N[a].ne, N[a].en).localeCompare(T(N[b].ne, N[b].en))).map((k) => `<option value="${k}">${esc(T(N[k].ne, N[k].en))}</option>`).join("");
    f.innerHTML = o; t.innerHTML = o; f.value = keep[0]; t.value = keep[1];
  }
  function draw() {
    try { localStorage.setItem("gati-rfrom", f.value); localStorage.setItem("gati-rto", t.value); } catch (e) {}
    const out = document.getElementById("rout");
    if (f.value === t.value) { out.innerHTML = `<div class="na">${T("फरक ठाउँ छान्नुहोस्।", "Choose two different places.")}</div>`; return; }
    const nr = [f.value, t.value].filter((k) => N[k].noroad);
    if (nr.length) { out.innerHTML = `<div class="na">${nr.map((k) => esc(T(N[k].ne, N[k].en))).join(", ")}: ${T("गतिको सडक तथ्याङ्कमा सडक जोडिएको छैन (OpenStreetMap मा सदरमुकामसम्म सडक पुगेको देखिँदैन)। हवाई वा पैदल मार्ग मात्र हुन सक्छ; पुष्टि भएको छैन।", "No road link in Gati's road data (OpenStreetMap shows no road reaching the HQ). It may be air or trail only; not confirmed.")}</div>`; return; }
    const RTS = EN.routes(f.value, t.value), P = RTS.length ? RTS[0].P : null;
    if (!P) { out.innerHTML = `<div class="na">${T("गतिको सडक तथ्याङ्कमा यी दुई ठाउँ जोड्ने बाटो छैन।", "Gati's road data has no path between these places.")}</div>`; return; }
    const CL = { terai: ["तराई", "Terai"], hill: ["पहाडी", "Hill"], mountain: ["हिमाली/कच्ची", "Mountain/earthen"] };
    const head = (r) => ({ ok: T("बाटोका सबै खण्ड खुला देखिन्छन्।", "Every corridor on the way shows open."), unk: T("केही खण्ड एकतर्फी छन्।", "Some corridors are one-way."), nc: T("केही खण्डको आधिकारिक स्थिति आएको छैन (हल्का हरियो): सामान्यतया खुला, तर पुष्टि नभएको।", "Some corridors have no official status (light green): usually open, not confirmed."), bad: T("बाटोमा अवरुद्ध खण्ड छ।", "A corridor on the way is blocked.") }[r.st]);
    const etaLine = (r) => `<p class="reta"><b>${EN.fmtKm(r.km)}</b> · <b>${EN.eta(r.h)}</b> <span class="retal">${T("अनुमानित, सामान्य अवस्थामा", "Estimate, normal conditions")}</span></p>${r.blocked ? `<p class="rblk">⛔ ${T("अवरुद्ध खण्ड छ; यो समय लागू हुँदैन।", "Includes a blocked corridor; this time does not apply.")}</p>` : ""}`;
    const steps = (r) => `<ol class="rsteps">${r.groups.map((g) => { const s = RS[g.rt.status] || RS.none; return `<li class="rstep r-${s[2]}"><div class="rdot" aria-hidden="true"></div><div><div class="rtop"><b>${esc(T(N[g.from].ne, N[g.from].en))} → ${esc(T(N[g.to].ne, N[g.to].en))}</b><span class="tag rs-${esc(g.rt.status)}">${T(s[0], s[1])}</span></div>
        <p class="meta">${esc(T(g.rt.name_ne, g.rt.name_en))} · ${EN.fmtKm(g.km)} · ${EN.eta(g.h)} · ${T(CL[g.cls][0], CL[g.cls][1])}</p><p>${esc(T(g.rt.note_ne, g.rt.note_en))}</p></div></li>`; }).join("")}</ol>`;
    const via = (r) => r.P.map(([a]) => esc(T(N[a].ne, N[a].en))).concat(esc(T(N[t.value].ne, N[t.value].en))).join(" → ");
    const alts = RTS.slice(1);
    out.innerHTML = `<section class="card rsum r-${RTS[0].st}"><p class="bigmsg">${head(RTS[0])}</p>${etaLine(RTS[0])}<p class="meta">${esc(T(RD.as_of_ne, RD.as_of_en))} · ${T("मानिएको गति: तराई ४०–५५, पहाडी २५–३५, हिमाली/कच्ची १२–२० कि.मि./घण्टा मानेर; प्रत्यक्ष ट्राफिक होइन।", "Speeds assumed: Terai 40–55, hill 25–35, mountain/earthen 12–20 km/h; not live traffic.")}</p>
      <p><a class="more" href="${R}map/?route=${encodeURIComponent(f.value + "," + t.value)}">${T("नक्सामा हेर्नुहोस् →", "View on map →")}</a></p></section>
      ${steps(RTS[0])}
      <section class="card ralts"><h2>${T("वैकल्पिक मार्ग", "Alternative routes")}</h2>${alts.length ? alts.map((r, k) => `<details class="ralt r-${r.st}"><summary><b>${T(`विकल्प ${G.num(k + 1)}`, `Option ${k + 1}`)}</b>: ${via(r)}<br>${etaLine(r)}<span class="tag rs-${r.st === "ok" ? "open" : r.st === "bad" ? "blocked" : r.st === "unk" ? "oneway" : "none"}">${head(r)}</span></summary>${steps(r)}</details>`).join("")
        : `<p class="meta">${T("गतिको सडक तथ्याङ्कमा फरक वैकल्पिक मार्ग छैन।", "No distinct alternative route in Gati's road data.")}</p>`}</section>
      <p><a class="btn" href="${R}roads/">${T("सबै सडक र स्रोत हेर्नुहोस् →", "See all roads and sources →")}</a></p>`;
    drawMap(P, alts.map((r) => r.P));
    document.getElementById("rnote").textContent = T("गतिको सडक तथ्याङ्कमा भएका मुख्य करिडोर मात्र। स्थानीय सडक समावेश छैन।", "Only the main corridors in Gati's road data. Local roads are not included.");
  }
  f.onchange = t.onchange = draw;
  document.getElementById("rgo").onclick = () => { draw(); const o = document.getElementById("rout"), h = o.querySelector(".rsum,.na");
    o.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }; document.getElementById("rswap").onclick = () => { [f.value, t.value] = [t.value, f.value]; draw(); };
  opts(); draw(); G.onLang(() => { opts(); draw(); });
})();
