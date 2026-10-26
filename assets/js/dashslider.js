/* Home dashboard slider: one visualization per slide, each with source, time, trust and a link.
   Counts are shown per agency or per item; nothing is summed across agencies. No auto-advance. */
(async function () {
  const G = window.Gati, box = document.getElementById("dslider"); if (!G || !box) return;
  const R = document.body.dataset.root || "./", T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc;
  const get = (p) => G.json(p).catch(() => null);
  const [AL, WX, RD, RV, GEO] = await Promise.all(["data/alerts.json", "data/weather.json", "data/roads.json", "data/rivers.json", "data/districts.geojson"].map(get));
  const AG = { "hydrology.gov.np": "DHM", "dhm.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "neoc.moha.gov.np": "NEOC", "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "bipadportal.gov.np": "BIPAD", "seismonepal.gov.np": "NSC", "earthquake.usgs.gov": "USGS" };
  const agency = (a) => { const v = AG[a.sender] || a.sender; return Array.isArray(v) ? T(v[0], v[1]) : v; };
  const SEVS = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const now = Date.now(), active = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > now;
  const alerts = AL ? AL.alerts : [];
  /* projected district outlines for mini maps */
  const W = 200, H = 100, X = (x) => (((x - 80) / 8.3) * W), Y = (y) => (((30.5 - y) / 4.2) * H);
  const DP = GEO ? GEO.features.map((f) => { const P = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    return [f.id, P.map((p) => "M" + p[0].filter((_, k) => k % 3 === 0).map(([x, y]) => X(x).toFixed(1) + " " + Y(y).toFixed(1)).join("L") + "Z").join("")]; }) : [];
  const miniMap = (fill, extra = "", label = "") => DP.length ? `<svg class="dsmap" viewBox="0 0 200 100" role="img" aria-label="${E(label)}">${DP.map(([id, d]) => `<path d="${d}" fill="${fill(id) || "var(--line)"}" stroke="var(--surface2)" stroke-width=".5"/>`).join("")}${extra}</svg>`
    : `<p class="meta">${T("नक्सा उपलब्ध छैन", "Map not available")}</p>`;
  const foot = (src, time, trust, href, label) => `<div class="dsfoot"><p class="meta">${T("स्रोत", "Source")}: ${src}${time ? ` · ${time}` : ""}</p><div class="dsfr">${trust || ""}<a class="dsmore" href="${R}${href}">${label} →</a></div></div>`;
  const na = (what, checked) => `<p class="dsna">${what}<br><span class="meta">${T("अहिले उपलब्ध छैन", "Not available right now")}${checked ? ` · ${T("पछिल्लो जाँच", "last checked")} ${checked}` : ""}</span></p>`;
  async function draw() {
  const slides = [];

  /* 1. Alerts: severity mix per agency (stacked bar per agency) + districts map */
  {
    const act = alerts.filter(active), by = {};
    act.forEach((a) => { const k = agency(a); (by[k] = by[k] || { n: {}, t: 0 }); by[k].n[a.severity] = (by[k].n[a.severity] || 0) + 1; by[k].t++; });
    const rows = Object.entries(by).map(([k, v]) => `<div class="dsrow"><span class="dslab">${E(k)}</span><span class="dsbar">${SEVS.filter((s) => v.n[s]).map((s) => `<i style="flex:${v.n[s]};background:${G.SEVCOLOR[s]}" title="${E((G.SEV[s] || G.SEV.Unknown)[G.lang === "ne" ? 0 : 1])}: ${v.n[s]}"></i>`).join("")}</span><b>${G.num(String(v.t))}</b></div>`).join("");
    const worst = {}; act.forEach((a) => a.districts.forEach((d) => { if (!worst[d] || SEVS.indexOf(a.severity) < SEVS.indexOf(worst[d])) worst[d] = a.severity; }));
    const legend = SEVS.filter((s) => act.some((a) => a.severity === s)).map((s) => `<span><i style="background:${G.SEVCOLOR[s]}"></i>${E((G.SEV[s] || G.SEV.Unknown)[G.lang === "ne" ? 0 : 1])}</span>`).join("");
    slides.push({ k: "alerts", t: T("चालु सूचना", "Active alerts"), body: act.length ? `<div class="dsgrid2"><div>${rows}<p class="meta dsnote">${T("हरेक निकायको आफ्नै सङ्ख्या; निकायहरू जोडिएका छैनन्।", "Each agency's own count; agencies are never added together.")}</p><div class="dsleg">${legend}</div></div>${miniMap((id) => worst[id] && G.SEVCOLOR[worst[id]], "", T("चालु सूचना भएका जिल्ला", "Districts with active alerts"))}</div>` : `<p class="dsna">${T("अहिले गतिमा चालु सूचना छैन।", "No active alerts in Gati right now.")}</p>`,
      foot: foot(T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), AL ? G.npt(AL.generated) : "", G.trustChip("Official"), "alerts/", T("सबै सूचना", "All alerts")) });
  }
  /* 2. Weather: DHM 5-day strip */
  {
    const b = WX && WX.bulletin5;
    slides.push({ k: "weather", t: T("मौसम: DHM ५ दिने", "Weather: DHM 5-day"), body: b ? `<ol class="dswx">${b.days.map((d) => `<li class="lv-${d.level}"><b>${E(T(d.bs, new Date(d.ad + "T12:00:00+05:45").toLocaleDateString("en-GB", { day: "numeric", month: "short" })))}</b><i></i><span>${E(T(...({ yellow: ["पहेँलो", "Yellow"], orange: ["सुन्तले", "Orange"], red: ["रातो", "Red"] }[d.level] || ["हरियो", "Green"])))}</span></li>`).join("")}</ol><p class="dssum">${E(T(b.days.find((d) => d.level !== "green")?.ne || b.days[0].ne, b.days.find((d) => d.level !== "green")?.en || b.days[0].en))}</p>` : na(T("DHM बुलेटिन", "DHM bulletin"), WX && WX.checked ? G.npt(WX.checked) : ""),
      foot: foot(b ? `<a href="${E(b.url)}" target="_blank" rel="noopener">DHM @NMD_Weather</a>` : "DHM", b ? `${T("जारी", "issued")} ${G.npt(b.issued)}` : "", G.trustChip("Official"), "weather/", T("मौसम", "Weather")) });
  }
  /* 3. Roads: status bar per corridor */
  {
    const COL = { open: "#16a34a", oneway: "#f59e0b", blocked: "#dc2626", none: "#8a96a3" }, LB = { open: ["खुला", "Open"], oneway: ["एकतर्फी", "One-way"], blocked: ["अवरुद्ध", "Blocked"], none: ["पुष्टि छैन", "Not confirmed"] };
    const rs = RD ? RD.routes : [];
    slides.push({ k: "roads", t: T("मुख्य सडक", "Main roads"), body: rs.length ? `<ul class="dsroads">${rs.map((r) => `<li><span class="dslab">${E(T(r.name_ne, r.name_en))}</span><span class="dsst" style="--c:${COL[r.status] || COL.none}"><i></i>${E(T(...(LB[r.status] || LB.none)))}</span></li>`).join("")}</ul>` : na(T("सडक अवस्था", "Road status"), ""),
      foot: foot(RD ? E(T(RD.sources.pol.ne, RD.sources.pol.en)) : T("नेपाल प्रहरी", "Nepal Police"), RD ? E(T(RD.as_of_ne, RD.as_of_en)) : "", G.trustChip("Official"), "roads/", T("सडक", "Roads")) });
  }
  /* 4. Rivers: level against warning and danger */
  {
    const gs = RV ? RV.gauges : [];
    slides.push({ stale: RV ? G.isStale(RV.as_of + "T12:00:00+05:45") : false, k: "rivers", t: T("नदी सतह", "River levels"), body: gs.length ? `<ul class="dsriv">${gs.map((g) => { const mx = g.danger * 1.15, c = g.level >= g.danger ? "#D93025" : g.level >= g.warning ? "#F28C1E" : "#2F6FED";
      return `<li><span class="dslab">${E(T(g.ne, g.en))}</span><span class="dsrb"><i class="lvl" style="width:${Math.min(100, (g.level / mx) * 100).toFixed(1)}%;background:${c}"></i><i class="mk w" style="left:${((g.warning / mx) * 100).toFixed(1)}%"></i><i class="mk d" style="left:${((g.danger / mx) * 100).toFixed(1)}%"></i></span><b>${G.num(g.level.toFixed(1))} m</b></li>`; }).join("")}</ul><div class="dsleg"><span><i class="mk w"></i>${T("चेतावनी तह", "Warning")}</span><span><i class="mk d"></i>${T("खतरा तह", "Danger")}</span></div>` : na(T("नदी सतह", "River levels"), ""),
      foot: foot(RV ? E(T(RV.source_ne, RV.source_en)) : "DHM", RV ? E(T(RV.as_of_ne, RV.as_of_en)) : "", G.trustChip("Official") + (RV ? G.staleChip(RV.as_of + "T12:00:00+05:45") : ""), "rivers/", T("नदी", "Rivers")) });
  }
  /* 5. Earthquakes: latest on a mini map */
  {
    const q = alerts.filter((a) => a.hazard === "earthquake").sort((a, b) => b.sent.localeCompare(a.sent))[0];
    let body = na(T("भूकम्प", "Earthquakes"), ""), ft = foot("NSC", "", "", "earthquakes/", T("भूकम्प", "Earthquakes"));
    if (q) { const i = q.info[G.lang] || q.info.en, c = (q.areas[0] && q.areas[0].circles[0] || "").split(" ")[0].split(",").map(Number), mag = (q.info.en.params || {})["gati:magnitude"] || "";
      const dot = c.length === 2 && !isNaN(c[0]) ? `<circle cx="${X(c[1]).toFixed(1)}" cy="${Y(c[0]).toFixed(1)}" r="9" fill="#7c3aed" fill-opacity=".18"/><circle cx="${X(c[1]).toFixed(1)}" cy="${Y(c[0]).toFixed(1)}" r="3.5" fill="#7c3aed" stroke="#fff" stroke-width="1"/>` : "";
      body = `<div class="dsgrid2"><div><p class="dsbig">${E(G.num(mag))}</p><p class="dssum">${E(i.headline)}</p><p class="meta">${E(G.npt((i.params || {})["gati:sourceTime"] || q.sent))}</p></div>${miniMap(() => "", dot, T("पछिल्लो भूकम्पको केन्द्र", "Latest earthquake epicentre"))}</div>`;
      ft = foot(`<a href="${E((i.params || {})["gati:sourceUrl"] || i.web || "#")}" target="_blank" rel="noopener">${E(agency(q))}</a>`, G.npt(q.sent), G.trustChip(q.trust), "earthquakes/", T("भूकम्प", "Earthquakes")); }
    slides.push({ k: "quake", t: T("पछिल्लो भूकम्प", "Latest earthquake"), body, foot: ft });
  }
  /* 6. Air: AQI gauge (Open-Meteo / CAMS model, Kathmandu) */
  slides.push({ k: "air", t: T("हावाको गुणस्तर (काठमाडौँ)", "Air quality (Kathmandu)"), body: `<div id="dsair">${T("लोड हुँदै…", "Loading…")}</div>`,
    foot: foot(`<a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">Open-Meteo</a> (Copernicus CAMS)`, `<span id="dsairt"></span>`, G.trustChip("Model"), "weather/#air", T("मौसम र हावा", "Weather & air")) });

  /* stale slides sort below fresh ones */
  slides.sort((a, b) => (a.stale ? 1 : 0) - (b.stale ? 1 : 0));
  box.innerHTML = `<section class="dslider" aria-roledescription="carousel" aria-label="${T("तथ्याङ्क झलक", "Data at a glance")}">
    <div class="dshead"><h2>${T("तथ्याङ्क झलक", "At a glance")}</h2><div class="dsnav"><button type="button" class="dsprev" aria-label="${T("अघिल्लो", "Previous")}">‹</button><button type="button" class="dsnext" aria-label="${T("अर्को", "Next")}">›</button></div></div>
    <div class="dstrack" tabindex="0">${slides.map((s, k) => `<article class="dslide ds-${s.k}" role="group" aria-roledescription="slide" aria-label="${k + 1} / ${slides.length}: ${E(s.t)}"><h3>${s.t}</h3><div class="dsbody">${s.body}</div>${s.foot}</article>`).join("")}</div>
    <div class="dsdots" role="tablist">${slides.map((s, k) => `<button type="button" role="tab" aria-label="${E(s.t)}" aria-selected="${k === 0}" data-k="${k}"></button>`).join("")}</div></section>`;
  const tr = box.querySelector(".dstrack"), dots = [...box.querySelectorAll(".dsdots button")], items = [...tr.children];
  const go = (k) => { k = Math.max(0, Math.min(items.length - 1, k)); tr.scrollTo({ left: items[k].offsetLeft - tr.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const cur = () => Math.round(tr.scrollLeft / (items[0].offsetWidth + 16));
  tr.addEventListener("scroll", () => { const c = cur(); dots.forEach((d, i) => d.setAttribute("aria-selected", i === c)); box.querySelector(".dsprev").disabled = tr.scrollLeft < 5; box.querySelector(".dsnext").disabled = tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 5; }, { passive: true });
  dots.forEach((d) => (d.onclick = () => go(+d.dataset.k)));
  box.querySelector(".dsprev").onclick = () => go(cur() - 1); box.querySelector(".dsnext").onclick = () => go(cur() + 1);
  tr.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(cur() + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(cur() - 1); } });
  tr.dispatchEvent(new Event("scroll"));
  /* air */
  try {
    const a = await fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=27.7172&longitude=85.324&current=us_aqi,pm2_5&timezone=Asia%2FKathmandu").then((r) => r.ok ? r.json() : null);
    const v = a && a.current ? a.current.us_aqi : null; if (v == null) throw 0;
    const BAND = [[50, "#00a651", "राम्रो", "Good"], [100, "#d4b000", "मध्यम", "Moderate"], [150, "#f7941d", "संवेदनशीललाई हानिकारक", "Unhealthy for sensitive groups"], [200, "#e2231a", "हानिकारक", "Unhealthy"], [300, "#8f3f97", "धेरै हानिकारक", "Very unhealthy"], [999, "#7e0023", "खतरनाक", "Hazardous"]];
    const b = BAND.find((x) => v <= x[0]), pct = Math.min(1, v / 300);
    document.getElementById("dsair").innerHTML = `<div class="dsaq"><svg viewBox="0 0 120 70" class="dsgauge" role="img" aria-label="AQI ${v}"><path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="var(--line)" stroke-width="12" stroke-linecap="round"/><path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="${b[1]}" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${(pct * 100).toFixed(1)} 100"/><text x="60" y="56" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${G.num(String(Math.round(v)))}</text></svg><div><p class="dsbig" style="font-size:1.2rem">${T(b[2], b[3])}</p><p class="meta">US AQI · PM2.5 ${G.num(String(a.current.pm2_5))} µg/m³</p><p class="meta">${T("मोडेल अनुमान, मापन होइन", "Model estimate, not a measurement")}</p></div></div>`;
    document.getElementById("dsairt").textContent = G.npt(a.current.time + "+05:45");
  } catch (e) { const el = document.getElementById("dsair"); if (el) el.innerHTML = na("AQI", G.npt(new Date().toISOString())); }
  }
  draw(); G.onLang && G.onLang(() => draw());
})();
