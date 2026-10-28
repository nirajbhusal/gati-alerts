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
  let S = null, day = null, sel = null;
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
      return { sev: a.severity, ag: AG[a.sender] ? T(...AG[a.sender]) : a.sender, head: i.headline, href: `${R}alerts/${a.identifier}/`, web: i.web, sent: a.sent, ds: a.districts, road: a.hazard === "road" }; });
    if (day && S.ar) { const D = S.ar.days.find((x) => x.ad === day); if (D && D.ff) Object.entries(D.ff).forEach(([lv, sl]) => L.push({ sev: FF[lv], ag: "DHM", head: T(`${S.ar.event_ne}: आकस्मिक बाढी जोखिम, ${D.wd_ne} कात्तिक ${N(D.bs)}`, `${S.ar.event_en}: flash flood risk, ${D.wd_en} Kartik ${D.bs}`), web: S.ar.source.url, sent: S.ar.source.sent, ds: sl.map((s) => slug2code[s]).filter(Boolean), ff: lv })); }
    return L;
  }
  function draw() {
    const L = items(), top = {}, nat = L.filter((x) => !x.ds.length);
    L.forEach((x) => x.ds.forEach((c) => { if ((RK[x.sev] || 0) > (RK[top[c]] || 0)) top[c] = x.sev; }));
    const dist = S.dg.features.map((f) => { const c = f.properties.code, s = top[c];
      return `<path d="${S.paths[c]}" data-c="${c}" class="hmd${s ? " s-" + s : ""}${sel === c ? " on" : ""}" tabindex="0" role="button" aria-label="${E(T(f.properties.ne, f.properties.en))}${s ? ": " + E(T(G.SEV[s][0], G.SEV[s][1])) : ""}"/>`; }).join("");
    /* small icons: blocked roads (Nepal Police road alerts by district; roads.json routes marked blocked) and DHM gauges at warning or danger */
    const ic = [];
    L.filter((x) => x.road).forEach((x) => x.ds.forEach((c) => S.cen[c] && ic.push(`<g class="hmi hmr" transform="translate(${X(S.cen[c][0])},${Y(S.cen[c][1])})"><title>${E(x.head)}</title><rect x="-6" y="-6" width="12" height="12" rx="2.5"/><path d="M-3.2 3.2 3.2-3.2M-3.2-3.2 3.2 3.2"/></g>`)));
    if (S.rd) S.rd.routes.filter((r) => r.status === "blocked").forEach((r) => { const n = S.rd.nodes[r.segs[0][0]], m = S.rd.nodes[r.segs[0][1]]; if (n && m) ic.push(`<g class="hmi hmr" transform="translate(${X((n.ll[1] + m.ll[1]) / 2)},${Y((n.ll[0] + m.ll[0]) / 2)})"><title>${E(T(r.name_ne, r.name_en))}</title><rect x="-6" y="-6" width="12" height="12" rx="2.5"/><path d="M-3.2 3.2 3.2-3.2M-3.2-3.2 3.2 3.2"/></g>`); });
    const hot = S.rv ? S.rv.gauges.filter((g) => g.level >= g.warning) : [];
    hot.forEach((g) => ic.push(`<g class="hmi hmv${g.level >= g.danger ? " dg" : ""}" transform="translate(${X(g.ll[1])},${Y(g.ll[0])})"><title>${E(T(g.ne, g.en))}</title><circle r="5.5"/><path d="M-3 0q1.5-2 3 0t3 0"/></g>`));
    const any = Object.keys(top).length > 0;
    const slider = day && S.ar ? `<div class="hmday" role="group" aria-label="${E(T("दिन", "Day"))}">${S.ar.days.map((d) => `<button type="button" data-d="${d.ad}"${d.ad === day ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${T(d.wd_ne.slice(0, 3) + " " + N(d.bs), d.wd_en.slice(0, 3) + " " + d.bs)}</button>`).join("")}</div>` : "";
    const leg = `<div class="hmleg">${["Extreme", "Severe", "Moderate", "Minor"].map((s) => `<span><i class="s-${s}"></i>${E(T(G.SEV[s][0], G.SEV[s][1]))}</span>`).join("")}<span><i class="hmn"></i>${T("सूचना छैन", "No alert")}</span>${ic.length ? `<span><i class="hmli r"></i>${T("सडक अवरुद्ध", "Road blocked")}</span>` : ""}${hot.length ? `<span><i class="hmli v"></i>${T("नदी चेतावनी/खतरा तह", "River at warning/danger")}</span>` : ""}</div>`;
    const head = `<div class="hmhead"><h2>${T("जिल्लाअनुसार आधिकारिक सूचना", "Official alerts by district")}</h2><a class="hmchip" href="${R}trek/">${T("पदमार्ग", "Trekking routes")} →</a></div>`;
    const note = `<p class="meta hmnote">${T("हरेक जिल्लाको रङ: त्यस जिल्लालाई नाम लिएर जारी सक्रिय आधिकारिक सूचनामध्ये सबैभन्दा गम्भीर। देशव्यापी सूचना तल छुट्टै। जिल्लामा थिच्नुहोस्।", "Each district shows the most severe active official alert that names it. Nationwide notices are listed separately below. Tap a district.")}${day ? " " + E(T("कात्तिक " + N(S.ar.days.find((x) => x.ad === day).bs), "Kartik " + S.ar.days.find((x) => x.ad === day).bs + " (" + Number(day.slice(8)) + " Oct)")) : ""}</p>`;
    if (!any && !nat.length) { box.innerHTML = `${head}<p class="hmnone">${T("सक्रिय आधिकारिक सूचना छैन", "No active alerts")}</p>${slider}`; bind(); return; }
    box.innerHTML = `${head}${slider}<div class="hmw"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="hmsvg">${dist}${ic.join("")}</svg></div>${leg}${note}
      ${nat.length ? `<details class="hmnat"><summary>${T("देशव्यापी आधिकारिक सूचना", "Nationwide official notices")}: ${[...new Set(nat.map((x) => x.ag))].map((a) => `${E(a)} ${N(nat.filter((x) => x.ag === a).length)}`).join(" · ")}</summary>${list(nat)}</details>` : ""}
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
    box.querySelectorAll(".hmday button").forEach((b) => (b.onclick = () => { day = b.dataset.d; draw(); }));
    const pick = (c) => { sel = sel === c ? null : c; draw(); const sh = box.querySelector("#hmsheet"); if (sel && sh && sh.getBoundingClientRect().top > innerHeight - 80) sh.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    box.querySelectorAll(".hmd").forEach((p) => { p.onclick = () => pick(p.dataset.c); p.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(p.dataset.c); } }; });
    const x = box.querySelector(".hmx"); if (x) x.onclick = () => { sel = null; draw(); };
  }
})();
