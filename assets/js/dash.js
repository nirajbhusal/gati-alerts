/* Dashboards first: a compact visual summary at the top of each page, details below.
   Built only from data already published in data/*.json. Counts are never summed across agencies:
   each agency gets its own row. Every block shows its source link and source time.
   Height is reserved before data arrives (CLS); bars draw in once on scroll; reduced motion draws at once. */
(function () {
  const G = window.Gati; if (!G) return;
  const PAGE = document.body.dataset.page || "", R = G.root, E = G.esc;
  const L = (ne, en) => (G.lang === "ne" ? ne : en), N = (n) => G.num(String(n));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AG = [["hydrology.gov.np", "https://www.dhm.gov.np/"], ["ndrrma.gov.np", "https://ndrrma.gov.np/"], ["neoc.moha.gov.np", "http://drrportal.gov.np/"], ["nepalpolice.gov.np", "https://www.nepalpolice.gov.np/notices/"], ["bipadportal.gov.np", "https://bipadportal.gov.np/"], ["seismonepal.gov.np", "https://seismonepal.gov.np/ne"], ["earthquake.usgs.gov", "https://earthquake.usgs.gov/"]];
  const agName = (s) => G.agencyOf({ sender: s });
  const SEVS = G.SEVORDER, sevL = (s) => L(G.SEV[s][0], G.SEV[s][1]);
  /* reserved heights (px) per page at 390 / wide; content is laid out to fit inside */
  const CFG = {
    home: { at: ".hhead", h: [993, 688], b: ["agency", "roads", "rivers", "wx5"] },
    alerts: { h: [715, 384], b: ["agency", "trust"] },
    earthquakes: { h: [498, 302], b: ["quakes"] },
    roads: { h: [265, 175], b: ["roads"] },
    route: { h: [265, 175], b: ["roads"] },
    rivers: { h: [250, 230], b: ["rivers"] },
    weather: { h: [328, 155], b: ["wx5", "air"] },
    sources: { h: [285, 206], b: ["health"] },
    contacts: { h: [169, 155], b: ["contacts"] },
    map: { h: [467, 313], b: ["agency"] },
    log: { h: [202, 165], b: ["log"] },
  };
  const C = CFG[PAGE]; if (!C) return;
  const main = document.getElementById("main"); if (!main) return;
  const box = document.createElement("section"); box.className = "gdash"; box.id = "gdash";
  box.setAttribute("aria-label", "सारांश · Summary");
  const wide = () => matchMedia("(min-width:760px)").matches;
  const reserve = () => (box.style.minHeight = (wide() ? C.h[1] : C.h[0]) + "px");
  reserve();
  let anchor = C.at ? main.querySelector(C.at) : main.querySelector("h1");
  if (anchor) { let n = anchor.nextElementSibling; while (n && n.matches("p.lead,p.hsub")) { anchor = n; n = n.nextElementSibling; } anchor.after(box); } else main.prepend(box);

  const src = (links, t) => `<p class="gdsrc">${L("स्रोत", "Source")}: ${links.map(([u, n]) => `<a href="${E(u)}" rel="noopener" target="_blank">${E(n)}</a>`).join(", ")}${t ? ` · <span class="gdtime">${E(t)}</span>` : ""}</p>`;
  const card = (title, body, links, t, cls) => `<div class="gdc ${cls || ""}"><h2 class="gdh">${title}</h2>${body}${src(links, t)}</div>`;
  const bar = (v, max, color, label) => `<span class="gdbar" role="img" aria-label="${E(label)}"><i style="--w:${max ? Math.max(2, (100 * v) / max) : 0}%;--c:${color}"></i></span>`;
  const tile = (n, lab, color) => `<div class="gdt"><b style="${color ? `--c:${color}` : ""}">${N(n)}</b><span>${lab}</span></div>`;

  /* ---------- blocks ---------- */
  const B = {};
  B.agency = (D) => { const A = D.alerts.alerts || [], now = Date.now(), wk = PAGE === "home";
    const pool = A.filter((a) => (wk ? now - new Date(a.sent) < 7 * 864e5 : true));
    const max = Math.max(1, ...AG.map(([s]) => pool.filter((a) => a.sender === s).length));
    const rows = AG.map(([s, u]) => { const mine = pool.filter((a) => a.sender === s), act = mine.filter((a) => !a.expired).length;
      const seg = SEVS.map((v) => [v, mine.filter((a) => a.severity === v).length]).filter((x) => x[1]);
      const last = mine.map((a) => a.sent).sort().pop();
      return `<li><a class="gdag" href="${E(u)}" rel="noopener" target="_blank">${E(agName(s))}</a><span class="gdstack" role="img" aria-label="${E(agName(s) + ": " + seg.map(([v, n]) => sevL(v) + " " + N(n)).join(", "))}" style="--w:${(100 * mine.length) / max}%">${seg.map(([v, n]) => `<i style="flex:${n};--c:${G.SEVCOLOR[v]}" title="${E(sevL(v))} ${N(n)}"></i>`).join("")}</span><span class="gdn">${N(mine.length)}${act ? ` <small>${L("चालु", "active")} ${N(act)}</small>` : ""}</span><span class="gdlast">${last ? G.ago(last) : L("छैन", "none")}</span></li>`; }).join("");
    const legend = `<p class="gdleg">${SEVS.map((v) => `<span><i style="--c:${G.SEVCOLOR[v]}"></i>${sevL(v)}</span>`).join("")}</p>`;
    return card(wk ? L("पछिल्लो ७ दिन: निकाय अनुसार, खतराको तह", "Last 7 days by agency and CAP severity") : L("निकाय अनुसार सूचना, खतराको तह", "Alerts by agency and CAP severity"),
      legend + `<ul class="gdrows">${rows}</ul><p class="gdnote">${L("हरेक निकाय छुट्टाछुट्टै देखाइएको छ; जोडिएको छैन।", "Each agency is shown on its own; counts are not added together.")}</p>`,
      [[R + "data/alerts.json", "alerts.json (CAP 1.2)"]], L("अद्यावधिक", "Updated") + " " + G.npt(D.alerts.generated), "gdwide"); };
  B.trust = (D) => { const A = D.alerts.alerts || [], T = ["Official", "Reported", "Verified", "Corrected"];
    const rows = AG.map(([s]) => { const m = A.filter((a) => a.sender === s); if (!m.length) return "";
      return `<div class="gdtr"><b>${E(agName(s))}</b>${T.map((t) => { const n = m.filter((a) => (a.state || a.trust) === t).length; return n ? `<span>${G.trustChip(t)} ${N(n)}</span>` : ""; }).join("")}</div>`; }).join("");
    return card(L("भरोसा चिह्न, निकाय अनुसार", "Trust labels by agency"), `<div class="gdtrs">${rows}</div>`, [[R + "about/#trust", L("भरोसा चिह्नको अर्थ", "What the labels mean")]], L("अद्यावधिक", "Updated") + " " + G.npt(D.alerts.generated)); };
  B.quakes = (D) => { const A = (D.alerts.alerts || []).filter((a) => a.hazard === "earthquake");
    const per = [["seismonepal.gov.np", "https://seismonepal.gov.np/ne"], ["earthquake.usgs.gov", "https://earthquake.usgs.gov/"]].map(([s, u]) => {
      const m = A.filter((a) => a.sender === s).map((a) => ({ t: a.sent, m: parseFloat(((a.info.en || a.info.ne).params || {})["gati:magnitude"]) || 0, id: a.identifier })).sort((x, y) => x.t.localeCompare(y.t));
      const mx = 7, w = 100 / Math.max(1, m.length);
      const svg = `<svg class="gdspark" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="${E(agName(s) + ": " + m.map((q) => N(q.m)).join(", "))}">${m.map((q, i) => `<rect class="gdgrow" x="${i * w + w * 0.2}" width="${w * 0.6}" y="${40 - (40 * q.m) / mx}" height="${(40 * q.m) / mx}" style="--c:var(--gdblue)"><title>${E(N(q.m))}</title></rect>`).join("")}</svg>`;
      const top = m.reduce((a, q) => (q.m > a ? q.m : a), 0), last = m[m.length - 1];
      return `<div class="gdq"><a class="gdag" href="${u}" rel="noopener" target="_blank">${E(agName(s))}</a><div class="gdtiles">${tile(m.length, L("घटना", "events"))}${tile(top.toFixed(1), L("ठूलो म्याग्निच्युड", "largest magnitude"))}</div>${svg}<span class="gdlast">${last ? L("पछिल्लो", "Latest") + " " + G.npt(last.t) : ""}</span></div>`; }).join("");
    return card(L("भूकम्प, निकाय अनुसार छुट्टै", "Earthquakes, each agency separately"), `<div class="gdcols">${per}</div><p class="gdnote">${L("NSC र USGS ले उही भूकम्प दुवैतिर दिन सक्छन्; जोडिएको छैन।", "NSC and USGS may list the same quake; they are not added together.")}</p>`, [[R + "data/alerts.json", "alerts.json"]], L("अद्यावधिक", "Updated") + " " + G.npt(D.alerts.generated), "gdwide"); };
  B.roads = (D) => { const RD = D.roads, rs = RD.routes || [], K = [["open", "खुला", "Open", "var(--gdok)"], ["oneway", "आंशिक", "Partial", "#F28C1E"], ["blocked", "अवरुद्ध", "Blocked", "#D93025"], ["none", "पुष्टि नभएको", "Not confirmed", "#8F9BB3"]];
    const c = K.map(([k, ne, en, col]) => [k, L(ne, en), col, rs.filter((r) => r.status === k).length]), tot = rs.length;
    let acc = 0; const ring = c.filter((x) => x[3]).map(([, , col, n]) => { const s = `<circle class="gdarc" r="15.9" cx="20" cy="20" pathLength="100" style="--c:${col};--da:${(100 * n) / tot};--off:${-acc}"/>`; acc += (100 * n) / tot; return s; }).join("");
    const srcs = Object.values(RD.sources || {}).map((s) => [s.u, L(s.ne, s.en)]);
    return card(L("राजमार्गको अवस्था", "Highway status"), `<div class="gdrow2"><svg class="gddonut" viewBox="0 0 40 40" role="img" aria-label="${E(c.map((x) => x[1] + " " + N(x[3])).join(", "))}"><circle r="15.9" cx="20" cy="20" class="gdtrack"/>${ring}<text x="20" y="22.5" text-anchor="middle">${N(tot)}</text></svg><div class="gdtiles">${c.map(([, lab, col, n]) => tile(n, lab, col)).join("")}</div></div>`,
      srcs, L(RD.as_of_ne, RD.as_of_en)); };
  B.rivers = (D) => { const RV = D.rivers, g = RV.gauges || [];
    const rows = g.map((x) => { const mx = x.danger * 1.1, st = x.level >= x.danger ? ["#D93025", L("खतरा", "Danger")] : x.level >= x.warning ? ["#F28C1E", L("चेतावनी", "Warning")] : ["var(--gdok)", L("सामान्य", "Normal")];
      return `<li><span class="gdag">${E(L(x.ne, x.en))}</span><span class="gdgauge" role="img" aria-label="${E(L(x.ne, x.en) + ": " + N(x.level) + " m, " + st[1])}">${bar(x.level, mx, st[0], "")}<em style="left:${(100 * x.warning) / mx}%" title="${L("चेतावनी", "Warning")}"></em><em class="d" style="left:${(100 * x.danger) / mx}%" title="${L("खतरा", "Danger")}"></em></span><span class="gdn">${N(x.level)} ${L("मि", "m")} <small>${st[1]}</small></span></li>`; }).join("");
    return card(L("गेज सतह: चेतावनी र खतराको रेखासँग", "Gauge level against warning and danger lines"), `<ul class="gdrows gdriv">${rows}</ul><p class="gdleg"><span><i class="ln"></i>${L("चेतावनी रेखा", "Warning line")}</span><span><i class="ln d"></i>${L("खतरा रेखा", "Danger line")}</span></p>`, [[RV.url, L("जल तथा मौसम विज्ञान विभाग (DHM)", "DHM")]], L(RV.as_of_ne, RV.as_of_en)); };
  B.wx5 = (D) => { const b = (D.weather || {}).bulletin5; if (!b) return "";
    const COL = { green: "var(--gdok)", yellow: "#F2C94C", orange: "#F28C1E", red: "#D93025" }, LV = { green: ["सामान्य", "No warning"], yellow: ["पहेँलो", "Yellow"], orange: ["सुन्तले", "Orange"], red: ["रातो", "Red"] };
    return card(L("५ दिनको चेतावनी तह", "5-day warning level"), `<ol class="gd5">${b.days.map((d) => `<li style="--c:${COL[d.level] || "#8F9BB3"}" title="${E(L(d.ne, d.en))}"><i></i><b>${E(G.bsDay ? G.bsDay(d) : d.ad)}</b><span>${E(L((LV[d.level] || [d.level, d.level])[0], (LV[d.level] || [d.level, d.level])[1]))}</span></li>`).join("")}</ol>`,
      [[b.url, L("जल तथा मौसम विज्ञान विभाग (DHM)", "DHM")]], L("जारी", "Issued") + " " + G.npt(b.issued)); };
  B.air = (D) => { const h = ((D.health || {}).sources || {})["doe-air"]; if (!h) return "";
    return card(L("हावाको गुणस्तर", "Air quality"), `<div class="gdtiles"><div class="gdt gdt-wide"><b style="--c:#8F9BB3">${L("छैन", "n/a")}</b><span>${L("AQI अंक अहिले उपलब्ध छैन (स्रोत नखुलेको)", "No AQI reading right now (source unreachable)")}</span></div></div>`, [["https://pollution.gov.np/portal/", L("वातावरण विभाग", "Department of Environment")]], h.lastChecked ? L("जाँचिएको", "Checked") + " " + G.npt(h.lastChecked) : ""); };
  B.health = (D) => { const S = D.sources || [], H = (D.health || {}).sources || {}, K = [["ok", "चालु", "Working", "var(--gdok)"], ["stale", "पुरानो", "Stale", "#F28C1E"], ["down", "नखुलेको", "Unreachable", "#D93025"], ["planned", "योजनामा", "Planned", "#8F9BB3"]];
    const st = S.map((s) => [s, G.srcStatus(s, H[s.id])]);
    return card(L("स्रोतको अवस्था", "Source health"), `<div class="gdtiles">${K.map(([k, ne, en, c]) => tile(st.filter((x) => x[1] === k).length, L(ne, en), c)).join("")}</div><ul class="gddots">${st.map(([s, k]) => `<li title="${E(L(s.agency.ne, s.agency.en))}" style="--c:${K.find((x) => x[0] === k)[3]}"><i></i>${E(s.id)}</li>`).join("")}</ul>`,
      [[R + "data/source-health.json", "source-health.json"]], D.health && D.health.checkedAt ? L("जाँचिएको", "Checked") + " " + G.npt(D.health.checkedAt) : ""); };
  B.contacts = (D) => { const c = D.contacts || {}, d = Object.keys(c.districts || {}).length;
    return card(L("आपतकालीन नम्बर", "Emergency numbers"), `<div class="gdtiles">${tile((c.national || []).length, L("राष्ट्रिय नम्बर", "national numbers"))}${tile(d, L("जिल्लाका नम्बर भएका जिल्ला", "districts with local numbers"))}</div>`,
      [[R + "data/contacts.json", "contacts.json"]], c.checked ? L("जाँचिएको", "Checked") + " " + E(c.checked) : ""); };
  B.log = (D) => { const A = D.alerts.alerts || [], now = Date.now(), days = 30, sp = Array.from({ length: days }, (_, i) => A.filter((a) => { const age = Math.floor((now - new Date(a.sent)) / 864e5); return age === days - 1 - i; }).length);
    const mx = Math.max(1, ...sp);
    return card(L("पछिल्लो ३० दिनमा प्रकाशित CAP सन्देश (दिन अनुसार)", "CAP messages published per day, last 30 days"), `<svg class="gdspark" viewBox="0 0 ${days} 20" preserveAspectRatio="none" role="img" aria-label="${E(L("दैनिक संख्या", "Daily counts") + ": " + sp.map(N).join(", "))}">${sp.map((n, i) => `<rect class="gdgrow" x="${i + 0.15}" width=".7" y="${20 - (20 * n) / mx}" height="${(20 * n) / mx}" style="--c:var(--gdblue)"><title>${N(n)}</title></rect>`).join("")}</svg><p class="gdnote">${L("सबै निकायका सन्देशको समयरेखा; निकाय अनुसार संख्या सूचना पृष्ठमा।", "A timeline of messages; per-agency counts are on the Alerts page.")} <a href="${R}alerts/">${L("सूचना", "Alerts")}</a></p>`,
      [[R + "data/alerts.json", "alerts.json"]], L("अद्यावधिक", "Updated") + " " + G.npt(D.alerts.generated), "gdwide"); };

  /* ---------- load, draw, animate ---------- */
  const need = new Set(); C.b.forEach((b) => ({ agency: ["alerts"], trust: ["alerts"], quakes: ["alerts"], log: ["alerts"], roads: ["roads"], rivers: ["rivers"], wx5: ["weather"], air: ["health"], health: ["sources", "health"], contacts: ["contacts"] }[b] || []).forEach((x) => need.add(x)));
  const FILE = { alerts: "data/alerts.json", roads: "data/roads.json", rivers: "data/rivers.json", weather: "data/weather.json", sources: "data/sources.json", health: "data/source-health.json", contacts: "data/contacts.json" };
  const D = {};
  let io = null, drawn = false;
  function anim() { if (drawn || reduce || !("IntersectionObserver" in window)) { box.classList.add("gdin"); return; }
    io = io || new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { drawn = true; box.classList.add("gdin"); io.disconnect(); } }), { threshold: 0.15 }); io.observe(box); }
  function draw() { try { box.innerHTML = `<div class="gdgrid gd-${PAGE}">${C.b.map((b) => { try { return B[b](D); } catch (e) { return ""; } }).join("")}</div>`; } catch (e) { box.innerHTML = ""; }
    if (drawn || reduce) box.classList.add("gdin"); anim(); }
  Promise.all([...need].map((k) => G.json(FILE[k]).then((v) => (D[k] = v)).catch(() => {}))).then(() => { draw(); G.listeners.push(() => setTimeout(draw, 0)); });
  addEventListener("resize", reserve);
})();
