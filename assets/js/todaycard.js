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
  let sun = null, aq = null;
  function draw() {
    const t = new Date(now + 345 * 6e4), ad = t.toISOString().slice(0, 10), bs = window.BS ? BS.toBS(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) : null;
    const bsTxt = bs ? (G.lang === "ne" ? `${BS.MN[bs.m - 1]} ${G.num(String(bs.d))}, ${G.num(String(bs.y))}` : `${bs.d} ${BS.ME[bs.m - 1]} ${bs.y} BS`) : "";
    const adTxt = `${T(BS.WN[t.getUTCDay()], BS.WE[t.getUTCDay()])}, ${G.npt(new Date(now).toISOString()).split(" · ")[0]}`;
    const hol = CAL ? CAL.entries.filter((e) => e.date_ad === ad) : [];
    const row = (k, href, label, body, meta, isStale) => `<a class="tdrow${isStale ? " stale" : ""}" href="${R}${href}"><span class="tdk">${label}</span><span class="tdv">${body}</span><span class="tdm">${meta}</span></a>`;
    const rows = [];
    /* weather: DHM today + 5-day strip */
    const b5 = WX && WX.bulletin5;
    if (b5) { const td = b5.days.find((d) => d.ad === ad) || b5.days[0], ic = td.level !== "green" ? "⚠" : /वर्षा|rain|snow|हिम/i.test(td.en) ? "☂" : /बदली|cloud/i.test(td.en) ? "☁" : "☀", st = stale(b5.issued, 30);
      rows.push(row("wx", "weather/", T("मौसम", "Weather"), `<span class="tdic" aria-hidden="true">${ic}</span><span class="tdtxt">${E(T(td.ne, td.en))}</span><span class="tdstrip" aria-label="${T("५ दिन", "5 days")}">${b5.days.map((d) => `<i class="lv-${d.level}" title="${E(d.bs)}"></i>`).join("")}</span>`,
        `DHM · ${st ? T("पछिल्लो जाँच", "last checked") + " " : ""}${G.npt(b5.issued)} ${G.trustChip("Official")}`, st)); }
    else rows.push(row("wx", "weather/", T("मौसम", "Weather"), T("DHM बुलेटिन उपलब्ध छैन", "DHM bulletin not available"), WX && WX.checked ? T("पछिल्लो जाँच", "last checked") + " " + G.npt(WX.checked) : "", true));
    /* alerts per agency */
    const act = AL ? AL.alerts.filter(isAct) : [], by = {};
    act.forEach((a) => { const k = G.agencyOf(a); (by[k] = by[k] || {})[a.severity] = (by[k][a.severity] || 0) + 1; });
    rows.push(row("al", "alerts/", T("चालु सूचना", "Active alerts"), Object.keys(by).length ? `<span class="tdags">${Object.entries(by).map(([k, v]) => `<span class="tdag"><b>${E(k)}</b><span class="tdbar">${SEVS.filter((s) => v[s]).map((s) => `<i style="flex:${v[s]};background:${G.SEVCOLOR[s]}"></i>`).join("")}</span>${G.num(String(Object.values(v).reduce((x, y) => x + y, 0)))}</span>`).join("")}</span>` : T("चालु आधिकारिक सूचना छैन", "No active official alert"),
      `${T("प्रति निकाय", "per agency")} · ${AL ? G.npt(AL.generated) : ""}`, !AL || stale(AL.generated, 6)));
    /* roads */
    if (RD) { const c = { open: 0, oneway: 0, none: 0, blocked: 0 }; RD.routes.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1)); const COL = { open: "#16a34a", oneway: "#f59e0b", none: "#8a96a3", blocked: "#dc2626" };
      const st = stale(RD.as_of, 30);
      rows.push(row("rd", "roads/", T("मुख्य सडक", "Main roads"), `<span class="tdbar wide">${Object.keys(COL).filter((k) => c[k]).map((k) => `<i style="flex:${c[k]};background:${COL[k]}"></i>`).join("")}</span><span class="tdtxt">${G.num(String(c.open))} ${T("खुला", "open")} · ${G.num(String(c.none + c.oneway))} ${T("पुष्टि छैन/एकतर्फी", "unknown/one-way")} · ${G.num(String(c.blocked))} ${T("अवरुद्ध", "blocked")}</span>`,
        `${E(T("नेपाल प्रहरी", "Nepal Police"))} · ${st ? T("पछिल्लो जाँच", "last checked") + " " : ""}${E(T(RD.as_of_ne, RD.as_of_en))} ${G.trustChip("Official")}`, st)); }
    /* rivers */
    if (RV) { const up = RV.gauges.filter((g) => g.level >= g.warning).length, st = stale(RV.as_of + "T23:59:00+05:45", 24);
      rows.push(row("rv", "rivers/", T("नदी", "Rivers"), st ? `${T("तथ्याङ्क", "Data as of")} ${adShort(RV.as_of + "T12:00:00+05:45")}${T(" को", "")}` : up ? `${G.num(String(up))}/${G.num(String(RV.gauges.length))} ${T("केन्द्र चेतावनी तहमाथि", "stations above warning")}` : T(`${G.num(String(RV.gauges.length))} केन्द्र, कुनै पनि चेतावनी तहमाथि छैन`, `${RV.gauges.length} stations, none above warning`),
        `DHM · ${st ? T("पछिल्लो जाँच", "last checked") + " " : ""}${E(T(RV.as_of_ne, RV.as_of_en))} ${G.trustChip("Official")}`, st)); }
    /* latest quake */
    const q = AL ? AL.alerts.filter((a) => a.hazard === "earthquake").sort((a, b) => b.sent.localeCompare(a.sent))[0] : null;
    if (q) rows.push(row("eq", "earthquakes/", T("पछिल्लो भूकम्प", "Latest quake"), `<span class="tdtxt">${E((q.info[G.lang] || q.info.ne).headline)}</span>`, `${E(G.agencyOf(q))} · ${G.npt(q.sent)} ${G.trustChip(q.trust)}`, false));
    /* air + sun */
    const aqCol = (v) => (v <= 50 ? "#00a651" : v <= 100 ? "#d4b000" : v <= 150 ? "#f7941d" : v <= 200 ? "#e2231a" : "#8f3f97");
    rows.push(row("aq", "weather/#air", T("हावा", "Air") + (dn ? ` · ${E(dn)}` : ""), aq && aq.v != null ? `<svg class="tdg" viewBox="0 0 40 24" aria-hidden="true"><path d="M4 20a16 16 0 0 1 32 0" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/><path d="M4 20a16 16 0 0 1 32 0" fill="none" stroke="${aqCol(aq.v)}" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.min(100, aq.v / 3).toFixed(0)} 100"/></svg><span class="tdtxt">US AQI <b>${G.num(String(Math.round(aq.v)))}</b></span>` : aq ? T("अहिले उपलब्ध छैन", "Not available right now") : T("लोड हुँदै…", "Loading…"),
      `Open-Meteo (CAMS)${aq && aq.t ? " · " + G.npt(aq.t) : ""} ${G.trustChip("Model")}`, aq && aq.v == null));
    if (sun) rows.push(row("sun", "patro/", T("सूर्योदय / सूर्यास्त", "Sunrise / sunset"), `<span class="tdtxt">☼ ${G.num(sun.r)} · ☾ ${G.num(sun.s)}</span>`, `Open-Meteo${dn ? " · " + E(dn) : ""}`, false));
    box.innerHTML = `<section class="tdcard" aria-labelledby="tdh"><div class="tdhead"><h2 id="tdh">${T("आज", "Today")}</h2><p class="tddate"><b>${E(bsTxt)}</b> · ${E(adTxt)}${hol.length ? ` · <a class="tdhol" href="${R}patro/">${hol.map((h) => E(T(h.title_ne, h.title_en))).join(", ")}</a> ${G.trustChip(hol[0].trust)}` : ""}</p></div><div class="tdrows">${rows.join("")}</div></section>`;
  }
  /* my district centre for air and sun */
  const my = G.district && G.district.get(), f = DG && (DG.features.find((x) => x.id === my) || DG.features.find((x) => x.properties.en === "Kathmandu"));
  let dn = f ? T(f.properties.ne, f.properties.en) : "", ll = [27.7172, 85.324];
  if (f) { let a = [180, 90, -180, -90]; (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).forEach((p) => p[0].forEach(([x, y]) => (a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]))); ll = [(a[1] + a[3]) / 2, (a[0] + a[2]) / 2]; }
  draw();
  const q = `latitude=${ll[0].toFixed(3)}&longitude=${ll[1].toFixed(3)}&timezone=Asia%2FKathmandu`;
  Promise.all([fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi`).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.open-meteo.com/v1/forecast?${q}&daily=sunrise,sunset&forecast_days=1`).then((r) => r.ok ? r.json() : null).catch(() => null)]).then(([a, s]) => {
    aq = { v: a && a.current ? a.current.us_aqi : null, t: a && a.current ? a.current.time + "+05:45" : "" };
    if (s && s.daily) { const hm = (x) => x.slice(11, 16); sun = { r: hm(s.daily.sunrise[0]), s: hm(s.daily.sunset[0]) }; }
    draw(); });
  G.onLang(() => { if (f) dn = T(f.properties.ne, f.properties.en); draw(); });
})();
