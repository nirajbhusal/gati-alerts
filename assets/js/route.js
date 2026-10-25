(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const RD = await G.json("data/roads.json"), N = RD.nodes;
  const [RG, DG] = await Promise.all([G.json("data/geo/roads.geojson").catch(() => null), G.json("data/districts.geojson").catch(() => null)]);
  const COL = { open: "#16a34a", oneway: "#f59e0b", blocked: "#dc2626", none: "#8a96a3" };
  let map, lay;
  function drawMap(P, alt) {
    if (!window.L || !RG) return;
    if (!map) {
      map = L.map("rmap", { zoomSnap: 0.25, scrollWheelZoom: false, tap: true }); map.attributionControl.setPrefix("").addAttribution("© OpenStreetMap contributors (ODbL) · COD-AB / OCHA HDX");
      if (DG) L.geoJSON(DG, { style: { color: "#c3ccd6", weight: 0.7, fillColor: "#f3f6f9", fillOpacity: 1 }, interactive: false }).addTo(map);
      L.geoJSON(RG, { style: { color: "#cfd6de", weight: 3 }, interactive: false }).addTo(map);
    }
    if (lay) map.removeLayer(lay); lay = L.layerGroup().addTo(map);
    const ids = [...new Set(P.map((x) => x[2].id))], feats = RG.features.filter((f) => ids.includes(f.properties.id));
    if (alt) { const aids = [...new Set(alt.map((x) => x[2].id))].filter((i) => !ids.includes(i)); L.geoJSON({ type: "FeatureCollection", features: RG.features.filter((f) => aids.includes(f.properties.id)) }, { style: { color: "#003893", weight: 4, dashArray: "6 7", opacity: .8 } }).bindTooltip(T("वैकल्पिक मार्ग", "Alternative route")).addTo(lay); }
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
  const adj = {};
  RD.routes.forEach((rt) => rt.segs.forEach(([a, b]) => { const w = hav(N[a].ll, N[b].ll); (adj[a] = adj[a] || []).push([b, w, rt]); (adj[b] = adj[b] || []).push([a, w, rt]); }));
  function path(s, t, avoid) {
    const d = { [s]: 0 }, prev = {}, Q = new Set(Object.keys(adj));
    while (Q.size) { let u = null; Q.forEach((q) => { if (d[q] !== undefined && (u === null || d[q] < d[u])) u = q; }); if (u === null || u === t) break; Q.delete(u);
      adj[u].forEach(([v, w, rt]) => { if (avoid && avoid(rt)) return; if (d[u] + w < (d[v] ?? Infinity)) { d[v] = d[u] + w; prev[v] = [u, rt]; } }); }
    if (d[t] === undefined) return null; const out = []; let c = t; while (c !== s) { const [p, rt] = prev[c]; out.unshift([p, c, rt]); c = p; } return out;
  }
  const groups0 = (P) => P.some(([, , rt]) => rt.status !== "open" && rt.status !== "oneway");
  const RS = { open: ["खुला", "Open", "ok"], blocked: ["अवरुद्ध", "Blocked", "bad"], oneway: ["एकतर्फी", "One-way", "warn"], none: ["पुष्टि छैन", "Not confirmed", "unk"] };
  const f = document.getElementById("rfrom"), t = document.getElementById("rto");
  const ids = Object.keys(N).filter((k) => adj[k]);
  function opts() {
    const keep = [f.value || localStorage.getItem("gati-rfrom") || "ktm", t.value || localStorage.getItem("gati-rto") || "pokhara"];
    const o = ids.slice().sort((a, b) => T(N[a].ne, N[a].en).localeCompare(T(N[b].ne, N[b].en))).map((k) => `<option value="${k}">${esc(T(N[k].ne, N[k].en))}</option>`).join("");
    f.innerHTML = o; t.innerHTML = o; f.value = keep[0]; t.value = keep[1];
  }
  function draw() {
    try { localStorage.setItem("gati-rfrom", f.value); localStorage.setItem("gati-rto", t.value); } catch (e) {}
    const out = document.getElementById("rout");
    if (f.value === t.value) { out.innerHTML = `<div class="na">${T("फरक ठाउँ छान्नुहोस्।", "Choose two different places.")}</div>`; return; }
    const P = path(f.value, t.value);
    if (!P) { out.innerHTML = `<div class="na">${T("गतिको सडक तथ्याङ्कमा यी दुई ठाउँ जोड्ने बाटो छैन।", "Gati's road data has no path between these places.")}</div>`; return; }
    const altP = groups0(P) ? path(f.value, t.value, (rt) => rt.status === "blocked" || rt.status === "none") : null;
    const groups = []; P.forEach(([a, b, rt]) => { const g = groups[groups.length - 1]; if (g && g.rt === rt) g.to = b; else groups.push({ rt, from: a, to: b }); });
    const worst = groups.some((g) => g.rt.status === "blocked") ? "bad" : groups.some((g) => g.rt.status === "none" || g.rt.status === "oneway") ? "unk" : "ok";
    const head = { ok: T("बाटोका सबै खण्ड खुला देखिन्छन्।", "Every corridor on the way shows open."), unk: T("केही खण्डको अवस्था पुष्टि छैन वा एकतर्फी छ।", "Some corridors are not confirmed or one-way."), bad: T("बाटोमा अवरुद्ध खण्ड छ।", "A corridor on the way is blocked.") }[worst];
    out.innerHTML = `<section class="card rsum r-${worst}"><p class="bigmsg">${head}</p><p class="meta">${esc(T(RD.as_of_ne, RD.as_of_en))}</p>${altP ? `<p class="ralt">🔀 ${T("ज्ञात वैकल्पिक मार्ग (अवरुद्ध वा पुष्टि नभएका खण्ड छलेर)", "Known alternative (avoiding blocked or unconfirmed corridors)")}: <b>${altP.map(([a]) => esc(T(N[a].ne, N[a].en))).concat(esc(T(N[t.value].ne, N[t.value].en))).join(" → ")}</b></p>` : groups0(P) ? `<p class="ralt">${T("गतिको सडक तथ्याङ्कमा वैकल्पिक मार्ग छैन।", "No alternative route in Gati's road data.")}</p>` : ""}</section>
      <ol class="rsteps">${groups.map((g) => { const s = RS[g.rt.status] || RS.none; return `<li class="rstep r-${s[2]}"><div class="rdot" aria-hidden="true"></div><div><div class="rtop"><b>${esc(T(N[g.from].ne, N[g.from].en))} → ${esc(T(N[g.to].ne, N[g.to].en))}</b><span class="tag rs-${esc(g.rt.status)}">${T(s[0], s[1])}</span></div>
        <p class="meta">${esc(T(g.rt.name_ne, g.rt.name_en))}</p><p>${esc(T(g.rt.note_ne, g.rt.note_en))}</p></div></li>`; }).join("")}</ol>
      <p><a class="btn" href="${R}roads/">${T("सबै सडक र स्रोत हेर्नुहोस् →", "See all roads and sources →")}</a></p>`;
    drawMap(P, altP);
    document.getElementById("rnote").textContent = T("गतिको सडक तथ्याङ्कमा भएका मुख्य करिडोर मात्र। स्थानीय सडक समावेश छैन।", "Only the main corridors in Gati's road data. Local roads are not included.");
  }
  f.onchange = t.onchange = draw; document.getElementById("rswap").onclick = () => { [f.value, t.value] = [t.value, f.value]; draw(); };
  opts(); draw(); G.onLang(() => { opts(); draw(); });
})();
