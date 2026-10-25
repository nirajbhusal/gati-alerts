/* Home 'आज / Today' card: a compact glance. Every line links to its page with time and trust; stale data is greyed with 'last checked'.
   Counts are per agency, never summed. The slider below holds the detailed charts. */
(async function () {
  const G = window.Gati, box = document.getElementById("today"); if (!G || !box) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, R = G.root, get = (p) => G.json(p).catch(() => null);
  const [AL, WX, RD, RV, CAL, DG] = await Promise.all(["data/alerts.json", "data/weather.json", "data/roads.json", "data/rivers.json", "data/calendar.json", "data/districts.geojson"].map(get));
  const now = Date.now(), DAY = 864e5, SEVS = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const isAct = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > now;
  const stale = (iso, h = 24) => !iso || now - Date.parse(iso) > h * 36e5;
  const adShort = (iso) => G.npt(iso).split(",")[0];
  let sun = null, aq = null, fc = null;
  const N = (v) => G.num(String(v));
  const LC = (k) => `${T("पछिल्लो जाँच", "last checked")} `;
  const SV = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICO = { sun: SV('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
    cloud: SV('<path d="M7 18a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 12 3 3 0 0 1 18 18z"/>'),
    part: SV('<path d="M8 4.5v1.2M3.8 8.7H5M5 5.6l.9.9M11.2 5.6l-.9.9"/><path d="M5.6 10.6A3 3 0 0 1 10.9 8"/><path d="M8.5 19a3.5 3.5 0 1 1 .8-6.9 4.8 4.8 0 0 1 9.2 1.4A2.8 2.8 0 0 1 18 19z"/>'),
    rain: SV('<path d="M7 15a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 9 3 3 0 0 1 18 15z"/><path d="M8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"/>'),
    snow: SV('<path d="M7 15a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 9 3 3 0 0 1 18 15z"/><path d="M8 19h.01M12 20h.01M16 19h.01"/>'),
    warn: SV('<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.01"/>') };
  const icoOf = (d) => d.level !== "green" ? "warn" : /हिमपात|snow/i.test(d.en) && !/rain/i.test(d.en) ? "snow" : /मुख्यतया सफा|mostly fair/i.test(d.en) ? "part" : /वर्षा|rain|shower/i.test(d.en) ? "rain" : /आंशिक|partly/i.test(d.en) ? "part" : /बदली|cloud/i.test(d.en) ? "cloud" : "sun";
  const LVC = { green: "#3cb043", yellow: "#F5D90A", orange: "#f7941d", red: "#e2231a" };
  const seg = (parts, cls = "") => `<span class="tdseg ${cls}">${parts.filter((p) => p.n).map((p) => `<i style="flex:${p.n};background:${p.c}" title="${E(p.l)}: ${N(p.n)}"><b>${N(p.n)}</b></i>`).join("")}</span>`;
  const key = (parts) => `<span class="tdkey">${parts.filter((p) => p.n).map((p) => `<span><i style="background:${p.c}"></i>${E(p.l)} ${N(p.n)}</span>`).join("")}</span>`;
  function draw() {
    const t = new Date(now + 345 * 6e4), ad = t.toISOString().slice(0, 10), bs = window.BS ? BS.toBS(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) : null;
    const bsTxt = bs ? (G.lang === "ne" ? `${BS.MN[bs.m - 1]} ${G.num(String(bs.d))}, ${G.num(String(bs.y))}` : `${bs.d} ${BS.ME[bs.m - 1]} ${bs.y} BS`) : "";
    const adTxt = `${T(BS.WN[t.getUTCDay()], BS.WE[t.getUTCDay()])}, ${G.npt(new Date(now).toISOString()).split(" · ")[0]}`;
    const hol = CAL ? CAL.entries.filter((e) => e.date_ad === ad) : [];
    const row = (k, href, label, body, meta, isStale) => `<a class="tdrow td-${k}${isStale ? " stale" : ""}" href="${R}${href}"><span class="tdk">${label}</span><span class="tdv">${body}</span><span class="tdm">${meta}</span></a>`;
    const rows = [];
    /* weather: DHM outlook, 5-day strip; temperature and rain chance from the Open-Meteo model for my district */
    const b5 = WX && WX.bulletin5;
    if (b5) { const td = b5.days.find((d) => d.ad === ad) || b5.days[0], st = stale(b5.issued, 30);
      const days = b5.days.slice(0, 5), fd = (a) => fc && fc.time ? fc.time.indexOf(a) : -1;
      const lo = fc ? Math.min(...fc.tmin) : 0, hi = fc ? Math.max(...fc.tmax) : 1, sp = Math.max(1, hi - lo);
      const strip = `<span class="tdwx">${days.map((d) => { const i = fd(d.ad), mn = i >= 0 ? fc.tmin[i] : null, mx = i >= 0 ? fc.tmax[i] : null, rp = i >= 0 ? fc.rain[i] : null;
        return `<span class="tdday${d.ad === ad ? " now" : ""}"><span class="tddn">${E(d.ad === ad ? T("आज", "Today") : T(d.bs.split(" ").pop(), BS.WE[new Date(d.ad + "T12:00:00Z").getUTCDay()].slice(0, 3)))}</span><span class="tdwi" title="${E(T(d.ne, d.en))}">${ICO[icoOf(d)]}</span><i class="tdlv" style="background:${LVC[d.level] || LVC.green}"></i>`
          + (mx != null ? `<span class="tdtr"><b>${N(Math.round(mx))}°</b><span class="tdtb"><i style="bottom:${((mn - lo) / sp * 100).toFixed(0)}%;top:${((hi - mx) / sp * 100).toFixed(0)}%"></i></span><span>${N(Math.round(mn))}°</span></span><span class="tdrp" title="${T("वर्षाको सम्भावना", "Rain chance")}"><svg viewBox="0 0 10 12" width="8" height="10" aria-hidden="true"><path d="M5 1C3 4.5 1.5 6.3 1.5 8a3.5 3.5 0 0 0 7 0C8.5 6.3 7 4.5 5 1z" fill="#2F6FED"/></svg>${N(rp == null ? "-" : rp)}%</span>` : "") + `</span>`; }).join("")}</span>`;
      rows.push(row("wx", "weather/", T("मौसम", "Weather"), `<span class="tdtxt">${E(T(td.ne, td.en))}</span>${strip}`,
        `DHM · ${st ? LC() : ""}${G.npt(b5.issued)} ${G.trustChip(b5.trust || "Official")}${fc ? ` <span class="tdsep">${T("तापक्रम, वर्षा सम्भावना", "Temp, rain chance")}: Open-Meteo${dn ? " · " + E(dn) : ""} · ${G.npt(fc.t)} ${G.trustChip("Model")}</span>` : ""}`, st)); }
    else rows.push(row("wx", "weather/", T("मौसम", "Weather"), T("DHM बुलेटिन उपलब्ध छैन", "DHM bulletin not available"), WX && WX.checked ? LC() + G.npt(WX.checked) : "", true));
    /* alerts: one segmented bar per agency, never summed across agencies */
    const act = AL ? AL.alerts.filter(isAct) : [], by = {};
    act.forEach((a) => { const k = G.agencyOf(a); (by[k] = by[k] || {})[a.severity] = (by[k][a.severity] || 0) + 1; });
    const sl = (s) => (G.SEV[s] || G.SEV.Unknown)[G.lang === "ne" ? 0 : 1];
    rows.push(row("al", "alerts/", T("चालु सूचना", "Active alerts"), Object.keys(by).length ? `<span class="tdags">${Object.entries(by).map(([k, v]) => `<span class="tdag"><span class="tdagn">${E(k)}</span>${seg(SEVS.map((s) => ({ n: v[s] || 0, c: G.SEVCOLOR[s], l: sl(s) })))}</span>`).join("")}</span>${key(SEVS.map((s) => ({ n: act.some((a) => a.severity === s) ? 1 : 0, c: G.SEVCOLOR[s], l: sl(s) }))).replace(/ [०-९\d]+<\/span>/g, "</span>")}` : T("चालु आधिकारिक सूचना छैन", "No active official alert"),
      `${T("प्रति निकाय, जोडिँदैन", "per agency, never added")} · ${AL ? G.npt(AL.generated) : ""}`, !AL || stale(AL.generated, 6)));
    /* roads */
    if (RD) { const c = { open: 0, oneway: 0, none: 0, blocked: 0 }; RD.routes.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1)); const st = stale(RD.as_of, 30);
      const P = [{ n: c.open, c: "#16a34a", l: T("खुला", "Open") }, { n: c.oneway, c: "#f59e0b", l: T("एकतर्फी", "One-way") }, { n: c.none, c: "#8a96a3", l: T("पुष्टि छैन", "Not confirmed") }, { n: c.blocked, c: "#dc2626", l: T("अवरुद्ध", "Blocked") }];
      rows.push(row("rd", "roads/", T("मुख्य सडक", "Main roads"), seg(P, "wide") + key(P), `${E(T("नेपाल प्रहरी", "Nepal Police"))} · ${st ? LC() : ""}${E(T(RD.as_of_ne, RD.as_of_en))} ${G.trustChip("Official")}${G.staleChip(RD.as_of)}`, st)); }
    /* rivers: level vs warning and danger for the stations closest to danger */
    if (RV) { const st = stale(RV.as_of + "T23:59:00+05:45", 24), top = [...RV.gauges].sort((a, b) => b.level / b.danger - a.level / a.danger).slice(0, 3);
      const gauge = (g) => { const mx = g.danger * 1.15, col = g.level >= g.danger ? "#D93025" : g.level >= g.warning ? "#F28C1E" : "#2F6FED";
        return `<span class="tdgg"><span class="tdggn">${E(T(g.ne, g.en))}</span><span class="tdggb"><i style="width:${Math.min(100, g.level / mx * 100).toFixed(0)}%;background:${col}"></i><u style="left:${(g.warning / mx * 100).toFixed(0)}%" title="${T("चेतावनी", "Warning")}"></u><u class="d" style="left:${(g.danger / mx * 100).toFixed(0)}%" title="${T("खतरा", "Danger")}"></u></span><span class="tdggv">${N(g.level.toFixed(1))}/${N(g.danger.toFixed(1))} m</span></span>`; };
      rows.push(row("rv", "rivers/", T("नदी", "Rivers"), `<span class="tdggs">${top.map(gauge).join("")}</span><span class="tdkey"><span><u></u>${T("चेतावनी", "Warning")}</span><span><u class="d"></u>${T("खतरा तह", "Danger level")}</span></span>`,
        `DHM · ${st ? LC() : ""}${E(T(RV.as_of_ne, RV.as_of_en))} ${G.trustChip("Official")}${G.staleChip(RV.as_of + "T12:00:00+05:45")}`, st || G.isStale(RV.as_of + "T12:00:00+05:45"))); }
    /* latest quake with magnitude chip */
    const q = AL ? AL.alerts.filter((a) => a.hazard === "earthquake").sort((a, b) => b.sent.localeCompare(a.sent))[0] : null;
    if (q) { const qi = q.info[G.lang] || q.info.ne, mg = ((q.info.en.params || {})["gati:magnitude"]) || "", mv = parseFloat(mg) || 0, ar = q.areas[0] ? (q.areas[0][G.lang] || q.areas[0].en) : "";
      rows.push(row("eq", "earthquakes/", T("पछिल्लो भूकम्प", "Latest quake"), `<span class="tdmag" style="--mc:${mv >= 6 ? "#D93025" : mv >= 5 ? "#F28C1E" : mv >= 4 ? "#7c3aed" : "#8a96a3"}">M ${N(mg.replace(/\s*ML/, ""))}<small>ML</small></span><span class="tdtxt">${E(ar || qi.headline)}</span>`,
        `${E(G.agencyOf(q))} · ${G.npt((qi.params || {})["gati:sourceTime"] || q.sent)} ${G.trustChip(q.trust)}`, false)); }
    /* air gauge */
    const aqCol = (v) => (v <= 50 ? "#00a651" : v <= 100 ? "#d4b000" : v <= 150 ? "#f7941d" : v <= 200 ? "#e2231a" : "#8f3f97");
    const aqLb = (v) => v <= 50 ? T("राम्रो", "Good") : v <= 100 ? T("मध्यम", "Moderate") : v <= 150 ? T("संवेदनशीलका लागि हानिकारक", "Unhealthy for sensitive groups") : v <= 200 ? T("हानिकारक", "Unhealthy") : T("धेरै हानिकारक", "Very unhealthy");
    const arcP = "M6 30a22 22 0 0 1 44 0";
    rows.push(row("aq", "weather/#air", T("हावा", "Air") + (dn ? ` · ${E(dn)}` : ""), aq && aq.v != null ? `<span class="tdaq"><svg class="tdg" viewBox="0 0 56 34" aria-hidden="true"><path d="${arcP}" fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/><path d="${arcP}" fill="none" stroke="${aqCol(aq.v)}" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.max(2, Math.min(100, aq.v / 3)).toFixed(0)} 100"/></svg><b>${N(Math.round(aq.v))}</b></span><span class="tdtxt">US AQI · ${aqLb(aq.v)}</span>` : aq ? T("अहिले उपलब्ध छैन", "Not available right now") : T("लोड हुँदै…", "Loading…"),
      `Open-Meteo (CAMS)${aq && aq.t ? " · " + G.npt(aq.t) : ""} ${G.trustChip("Model")}`, aq && aq.v == null));
    /* sunrise and sunset: small day arc with the sun's position now */
    if (sun) { const m = (h) => +h.slice(0, 2) * 60 + +h.slice(3, 5), nm = t.getUTCHours() * 60 + t.getUTCMinutes(), fr = Math.max(0, Math.min(1, (nm - m(sun.r)) / (m(sun.s) - m(sun.r)))), an = Math.PI * (1 - fr), x = 30 + 24 * Math.cos(an), y = 28 - 22 * Math.sin(an), up = nm > m(sun.r) && nm < m(sun.s);
      rows.push(row("sun", "patro/", T("सूर्योदय / सूर्यास्त", "Sunrise / sunset"), `<svg class="tdarc" viewBox="0 0 60 34" aria-hidden="true"><path d="M2 28h56" stroke="var(--line)" stroke-width="1"/><path d="M6 28a24 22 0 0 1 48 0" fill="none" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="2 3"/>${up ? `<circle class="tdsundot" cx="0" cy="0" r="4" fill="#f5b800" style="offset-path:path('M6 28A24 22 0 0 1 54 28');offset-distance:${(fr * 100).toFixed(1)}%;--sd:${(fr * 100).toFixed(1)}%"/>` : ""}</svg><span class="tdtxt"><span class="tdsun">${T("उदय", "Rise")} <b>${G.num(sun.r)}</b></span> <span class="tdsun">${T("अस्त", "Set")} <b>${G.num(sun.s)}</b></span></span>`, `Open-Meteo${dn ? " · " + E(dn) : ""}`, false)); }
    box.innerHTML = `<section class="tdcard" aria-labelledby="tdh"><div class="tdhead"><h2 id="tdh">${T("आज", "Today")}</h2><p class="tddate"><b>${E(bsTxt)}</b> · ${E(adTxt)}${hol.length ? ` · <a class="tdhol" href="${R}patro/">${hol.map((h) => E(T(h.title_ne, h.title_en))).join(", ")}</a> ${G.trustChip(hol[0].trust)}` : ""}</p></div><div class="tdrows">${[...rows.filter((r) => !/class="tdrow[^"]* stale/.test(r)), ...rows.filter((r) => /class="tdrow[^"]* stale/.test(r))].join("")}</div></section>`;
  }
  /* my district centre for air and sun */
  const my = G.district && G.district.get(), f = DG && (DG.features.find((x) => x.id === my) || DG.features.find((x) => x.properties.en === "Kathmandu"));
  let dn = f ? T(f.properties.ne, f.properties.en) : "", ll = [27.7172, 85.324];
  if (f) { let a = [180, 90, -180, -90]; (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).forEach((p) => p[0].forEach(([x, y]) => (a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]))); ll = [(a[1] + a[3]) / 2, (a[0] + a[2]) / 2]; }
  draw();
  const q = `latitude=${ll[0].toFixed(3)}&longitude=${ll[1].toFixed(3)}&timezone=Asia%2FKathmandu`;
  Promise.all([fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi`).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.open-meteo.com/v1/forecast?${q}&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=6`).then((r) => r.ok ? r.json() : null).catch(() => null)]).then(([a, s]) => {
    aq = { v: a && a.current ? a.current.us_aqi : null, t: a && a.current ? a.current.time + "+05:45" : "" };
    if (s && s.daily) { const hm = (x) => x.slice(11, 16); sun = { r: hm(s.daily.sunrise[0]), s: hm(s.daily.sunset[0]) }; fc = { time: s.daily.time, tmax: s.daily.temperature_2m_max, tmin: s.daily.temperature_2m_min, rain: s.daily.precipitation_probability_max, t: new Date().toISOString() }; }
    draw(); });
  G.onLang(() => { if (f) dn = T(f.properties.ne, f.properties.en); draw(); });
})();
