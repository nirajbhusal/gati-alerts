/* Know before you go: highway tracks on the Roads page. Official data only.
   Data: data/highways.json (track list), data/roads.json (Nepal Police / DoR status per segment),
   data/geo/roads.geojson (OSM geometry), data/alerts.json (official items), data/weather.json (DHM outlook).
   Each road segment keeps its own status and source; nothing is summed across agencies. */
(async () => {
  const G = window.Gati, box = document.getElementById("hwk"); if (!box) return;
  const T = (n, e) => (G.lang === "ne" ? n : e), ne = () => G.lang === "ne";
  const [hw, roads, geo, al, dist, wx, prov] = await Promise.all(["data/highways.json", "data/roads.json", "data/geo/roads.geojson", "data/alerts.json", "data/districts.json", "data/weather.json", "data/geo/provinces.geojson"].map((u) => G.json(u).catch(() => null)));
  if (!hw || !roads || !geo) return;
  const RC = { open: "#15803d", oneway: "#1d4ed8", blocked: "#b91c1c", closed: "#b91c1c", none: "#86D8A0" };
  const ST = G.ROADST || {};
  const byId = Object.fromEntries(roads.routes.map((r) => [r.id, r]));
  const gl = {}; geo.features.forEach((f) => { (gl[f.properties.id] = gl[f.properties.id] || []).push(f.geometry); });
  const dcode = Object.fromEntries((dist || []).map((d) => [d.en, d]));
  const lines = (g) => (g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []);
  const polys = (g) => (g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []);
  function svg(t) {
    const segs = t.routes.flatMap((id) => (gl[id] || []).flatMap(lines).map((c) => ({ c, st: (byId[id] || {}).status || "none" })));
    const pts = segs.flatMap((s) => s.c); if (!pts.length) return "";
    let [x0, y0, x1, y1] = [180, 90, -180, -90]; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const pad = Math.max(x1 - x0, y1 - y0) * 0.15 + 0.05; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const W = 320, H = 180, k = Math.min(W / (x1 - x0), H / (y1 - y0)), ox = (W - (x1 - x0) * k) / 2, oy = (H - (y1 - y0) * k) / 2;
    const P = (c) => c.map(([x, y]) => `${(ox + (x - x0) * k).toFixed(1)},${(oy + (y1 - y) * k).toFixed(1)}`).join(" ");
    const pv = prov ? prov.features.flatMap((f) => polys(f.geometry)).map((r) => `<polyline points="${P(r)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join("") : "";
    const rd = segs.map((s) => `<polyline points="${P(s.c)}" fill="none" stroke="${RC[s.st] || RC.none}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"${s.st === "none" ? ' stroke-dasharray="6 4"' : ""}/>`).join("");
    return `<svg class="hwmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="${G.esc(T(t.name_ne, t.name_en))}">${pv}${rd}</svg>`;
  }
  const src = (k) => { const s = roads.sources[k]; return s ? `<a href="${G.esc(s.u)}" target="_blank" rel="noopener">${G.esc(ne() ? s.ne : s.en)}</a>` : ""; };
  const now = Date.now();
  function items(t) {
    const codes = new Set(t.districts.map((d) => (dcode[d] || {}).code).filter(Boolean));
    return ((al && al.alerts) || []).filter((a) => !a.expired && !a.supersededBy && (!a.expires || new Date(a.expires) > now) && a.trust === "Official" && (a.districts || []).some((c) => codes.has(c)))
      .sort((a, b) => G.SEVORDER.indexOf(a.severity) - G.SEVORDER.indexOf(b.severity)).slice(0, 4);
  }
  function wxLine() {
    const b = wx && wx.bulletin5; if (!b) return `<p class="meta">${T("DHM मौसम पूर्वानुमान: उपलब्ध छैन।", "DHM weather outlook: not available.")}</p>`;
    const d = b.days && b.days[0];
    return `<p><b>${T("DHM मौसम", "DHM weather")}:</b> ${G.esc(ne() ? b.advisory_ne : b.advisory_en)}${d ? ` ${T("आज", "Today")}: ${G.esc(ne() ? d.ne : d.en)}` : ""}</p>
      <p class="meta">${T("स्रोत", "Source")}: <a href="${G.esc(b.url)}" target="_blank" rel="noopener">${T("जल तथा मौसम विज्ञान विभाग, ५ दिने चेतावनी", "DHM 5-day weather warning")}</a> · ${G.npt(b.issued)} · ${T("देशव्यापी सूचना; जिल्लागत छुट्टै छैन", "nationwide bulletin, not district-specific")}</p>`;
  }
  function card(t) {
    const segs = t.routes.map((id) => byId[id]).filter(Boolean).map((r) => {
      const st = ST[r.status] || ST.none || ["", ""];
      return `<li><i class="hwdot" style="background:${RC[r.status] || RC.none}"></i><span><b>${G.esc(ne() ? r.name_ne : r.name_en)}</b>: ${G.esc(T(st[0], st[1]))}<br><span class="meta">${G.esc(ne() ? r.note_ne : r.note_en)}</span><br><span class="meta">${T("स्रोत", "Source")}: ${r.sources.map(src).join(" · ")} · ${G.esc(ne() ? roads.as_of_ne : roads.as_of_en)}</span></span></li>`;
    }).join("");
    const its = items(t);
    const off = its.length ? `<ul class="hwal">${its.map((a) => { const i = a.info[G.lang === "ne" ? "ne" : "en"] || a.info.en; return `<li>${G.sevChip(a.severity)} <a href="${G.root}alerts/${G.esc(a.identifier)}/">${G.esc(i.headline)}</a><br><span class="meta">${G.esc(G.agencyOf(a))} · ${G.npt(a.sent)}${i.web ? ` · <a href="${G.esc(i.web)}" target="_blank" rel="noopener">${T("मूल स्रोत", "Original source")}</a>` : ""}</span></li>`; }).join("")}</ul>`
      : `<p class="meta">${T("यी जिल्लामा अहिले कुनै सक्रिय आधिकारिक सूचना छैन।", "No active official item for these districts right now.")}</p>`;
    const dn = t.districts.map((d) => (dcode[d] ? (ne() ? dcode[d].ne : dcode[d].en) : d)).join(", ");
    const hz = t.hazard ? `<p><b>${T("आधिकारिक खतरा सूचना", "Official hazard notice")}:</b> ${G.esc(ne() ? t.hazard.ne : t.hazard.en)}<br><span class="meta"><a href="${G.esc(t.hazard.u)}" target="_blank" rel="noopener">${G.esc(t.hazard.src)}</a> · ${G.esc(t.hazard.date)}</span></p>` : "";
    return `<details class="card hwcard" id="hw-${t.id}"><summary><span class="hwname">${G.esc(T(t.name_ne, t.name_en))}</span><span class="hwdots">${t.routes.map((id) => `<i class="hwdot" style="background:${RC[(byId[id] || {}).status] || RC.none}"></i>`).join("")}</span></summary>
      ${svg(t)}<p class="meta">${T("जिल्ला", "Districts")}: ${G.esc(dn)}</p>
      <h4>${T("सडकको अवस्था", "Road status")}</h4><ul class="hwseg">${segs}</ul>
      <h4>${T("आधिकारिक सूचना", "Official items")}</h4>${off}
      ${wxLine()}${hz}
      <p class="hwcall"><a class="aqcall sm" href="tel:100"><b>${G.num("100")}</b><span>${T("प्रहरी", "Police")}</span></a><a class="aqcall sm red" href="tel:1234"><b>${G.num("1234")}</b><span>${T("विपद्", "Disaster")}</span></a></p></details>`;
  }
  function draw() {
    const s = hw.safety;
    box.innerHTML = `<h2>${T(hw.title_ne, hw.title_en)}</h2><p class="meta">${G.esc(T(hw.rule_ne, hw.rule_en))} ${G.esc(T(hw.geometry_note_ne, hw.geometry_note_en))}</p>
      <div class="hwgrid">${hw.tracks.map(card).join("")}</div>
      <div class="card"><h3>${T("यात्रामा सुरक्षा", "Safety on the road")}</h3><ul>${s.steps.map((x) => `<li>${G.esc(T(x[0], x[1]))}</li>`).join("")}</ul>
      <p class="meta">${T("स्रोत", "Source")}: ${s.links.map((u, i) => `<a href="${G.esc(u)}" target="_blank" rel="noopener">NDRRMA ${G.num(i + 1)}</a>`).join(" · ")} · ${G.esc(T(s.src_ne, s.src_en))}</p></div>`;
    if (location.hash.startsWith("#hw-")) { const d = document.getElementById(location.hash.slice(1)); if (d) d.open = true; }
  }
  draw(); G.onLang(draw);
})();
