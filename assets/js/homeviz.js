/* Home, "Nepal at a glance": four small graphics built from the shared chart kit (assets/js/viz.js).
   Each one answers a single question and carries its source and time. Agencies are never added together. */
(function () {
  const box = document.getElementById("hviz"), G = window.Gati; if (!box || !G || !G.viz) return;
  const V = G.viz, R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v));
  const J = (p) => G.rawJson(p).catch(() => null);
  const RK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };
  const day = (ms) => new Date(ms + G.tzMs).toISOString().slice(0, 10);
  const wd = (iso) => { const d = new Date(iso + "T00:00:00Z").getUTCDay(); return window.BS ? T(BS.WN[d].replace("बार", ""), BS.WE[d].slice(0, 3)) : ""; };
  let D = null, AQ = null, all = false;
  const CITIES = [["काठमाडौँ", "Kathmandu", 27.7172, 85.324], ["पोखरा", "Pokhara", 28.2096, 83.9856], ["विराटनगर", "Biratnagar", 26.4525, 87.2718], ["भरतपुर", "Bharatpur", 27.6766, 84.4303], ["नेपालगन्ज", "Nepalgunj", 28.05, 81.6167], ["धनगढी", "Dhangadhi", 28.6833, 80.6], ["जनकपुर", "Janakpur", 26.7288, 85.9263]];
  const AQB = [[50, "#00a651", "राम्रो", "Good"], [100, "#d4b000", "मध्यम", "Moderate"], [150, "#f7941d", "संवेदनशीललाई अस्वस्थ", "Unhealthy for sensitive groups"], [200, "#e2231a", "अस्वस्थ", "Unhealthy"], [300, "#8f3f97", "धेरै अस्वस्थ", "Very unhealthy"], [1e9, "#7e0023", "खतरनाक", "Hazardous"]];
  const km = (a, b) => { const r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r), y = (b[0] - a[0]) * r; return Math.sqrt(x * x + y * y) * 6371; };
  const active = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires || "2999-01-01") > Date.now();
  const mag = (a) => parseFloat(((a.info.en || {}).params || {})["gati:magnitude"] || "") || null;
  const tile = (label, value, tone, ic) => `<div class="vzmt${tone ? " " + tone : ""}">${ic ? V.icon(ic) : ""}<div><span>${label}</span><b>${value}</b></div></div>`;
  function draw() {
    if (!D) return; const [al, wx, rv, rd, geo] = D, cards = [], today = day(Date.now());
    /* 0. my district: everything Gati holds for one place, in one panel */
    { const code = G.district ? G.district.get() : "", f = geo && code && geo.features.find((x) => x.id === code || x.properties.code === code);
      if (!f) cards.push(`<section class="vz vzwide vzme"><div class="vzh"><h3>${T("मेरो जिल्ला", "My district")}</h3></div><p class="vzsay">${T("आफ्नो जिल्ला छान्नुहोस्: त्यहाँका सूचना, मौसम चेतावनी, नापिएको वर्षा र नजिकको नदी केन्द्र यहीँ देखिन्छ।", "Choose your district to see its alerts, weather warning, measured rain and nearest river gauge here.")}</p><p><button type="button" class="hmchip vzpick">${T("जिल्ला छान्नुहोस्", "Choose district")}</button></p></section>`);
      else { let sx = 0, sy = 0, n = 0; (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).forEach((poly) => poly[0].forEach(([x, y]) => { sx += x; sy += y; n++; })); const c = [sy / n, sx / n];
        const mine = al ? al.alerts.filter((a) => a.trust === "Official" && active(a) && (a.districts || []).includes(f.properties.code)) : [], by = {}; let top = null;
        mine.forEach((a) => { const k = G.agencyOf(a); by[k] = (by[k] || 0) + 1; if ((RK[a.severity] || 0) > (RK[top] || 0)) top = a.severity; });
        const dd = wx && wx.bulletin5 && wx.bulletin5.days.find((d) => d.ad === today), lvl = dd && dd.level !== "green" && (dd.provinces || []).includes(f.properties.province) ? dd.level : "green", L = V.LEVEL[lvl];
        const st = wx && wx.station_obs && wx.station_obs.stations.map((s2) => [km(c, s2.ll), s2]).sort((a, b) => a[0] - b[0])[0];
        const gg = rv && rv.gauges.map((g) => [km(c, g.ll), g]).sort((a, b) => a[0] - b[0])[0];
        cards.push(V.card({ cls: "vzwide vzme", title: T("मेरो जिल्ला: ", "My district: ") + E(T(f.properties.ne, f.properties.en)), href: R + "affected/#d=" + E(f.properties.code), more: T("पूरा विवरण", "Full view"),
          say: mine.length ? T("यो जिल्लालाई नाम लिएर सक्रिय आधिकारिक सूचना: ", "Active official notices naming this district: ") + Object.entries(by).map(([k, v]) => E(k) + " " + N(v)).join(" · ") : T("यो जिल्लालाई नाम लिएर कुनै सक्रिय आधिकारिक सूचना छैन।", "No active official notice names this district."),
          body: `<div class="vzmini">${tile(T("सबैभन्दा गम्भीर सूचना", "Most severe notice"), top ? T(G.SEV[top][0], G.SEV[top][1]) : T("छैन", "None"), RK[top] >= 3 ? "bad" : RK[top] === 2 ? "warn" : "", "alert")}
            ${tile(T("DHM मौसम चेतावनी, आज", "DHM weather warning, today"), T(L[1], L[2]), lvl === "red" ? "bad" : lvl !== "green" ? "warn" : "", "cloud")}
            ${st ? tile(T("नापिएको वर्षा", "Measured rain") + " · " + E(T(st[1].ne, st[1].en)) + " (" + N(Math.round(st[0])) + " km)", N(st[1].rain_mm) + T(" मि.मि.", " mm"), "", "drop") : ""}</div>
            ${gg ? `<div class="vzmg"><p class="vzf" style="padding:0">${T("सबैभन्दा नजिकको नदी केन्द्र", "Nearest river gauge")} (${N(Math.round(gg[0]))} km)</p>${V.gauge({ name: T(gg[1].ne, gg[1].en), level: gg[1].level, warning: gg[1].warning, danger: gg[1].danger })}</div>` : ""}
            <p><button type="button" class="hmchip vzpick">${T("जिल्ला फेर्नुहोस्", "Change district")}</button></p>`,
          source: T("DHM र सम्बन्धित निकाय, गतिमार्फत", "DHM and the agencies named, relayed by Gati"), time: (wx && wx.station_obs ? T("वर्षा अवलोकन", "rain observation") + " " + G.npt(wx.station_obs.issued) : "") })); } }
    /* 1. DHM five-day warning */
    const b5 = wx && wx.bulletin5;
    if (b5 && b5.days && b5.days.length) { const days = b5.days.map((d) => ({ top: wd(d.ad), sub: G.lang === "ne" ? d.bs.replace(/^\S+\s/, "") : String(Number(d.ad.slice(8))), level: d.level, today: d.ad === today }));
      const worst = ["red", "orange", "yellow"].find((l) => b5.days.some((d) => d.level === l));
      cards.push(V.card({ title: T("DHM को ५ दिने मौसम चेतावनी", "DHM 5-day weather warning"), href: R + "weather/", more: T("मौसम", "Weather"), body: V.daystrip(days),
        say: worst ? T("यी पाँच दिनमध्ये कुनै दिन चेतावनी छ। विवरण मौसम पृष्ठमा।", "At least one of these five days carries a warning. Details on the Weather page.") : T("पाँचै दिन देशभर कुनै मौसम चेतावनी छैन।", "No weather warning anywhere on all five days."),
        source: T("जल तथा मौसम विज्ञान विभाग", "DHM"), url: b5.url, time: T("जारी", "issued") + " " + G.npt(b5.issued) })); }
    /* 1b. DHM's forecast for the next 24 hours, as two tiles */
    const k24 = wx && wx.forecast24 && wx.forecast24.kathmandu;
    if (k24) cards.push(V.card({ cls: "vzx", title: T("DHM पूर्वानुमान, २४ घण्टा: ", "DHM forecast, 24 hours: ") + E(T(k24.name_ne, k24.name_en)), href: R + "weather/", more: T("मौसम", "Weather"),
      body: `<div class="vzdn"><div>${V.icon("sun")}<span>${T("दिन", "Day")}</span><b>${k24.day_from_c != null ? N(k24.day_from_c) + "°" : "–"}</b><em>${E(T(k24.day_ne, k24.day_en))}</em>${k24.day_rain_pct != null ? `<i>${T("वर्षाको सम्भावना", "Rain chance")} ${N(k24.day_rain_pct)}%</i>` : ""}</div><div class="n">${V.icon("moon")}<span>${T("रात", "Night")}</span><b>${k24.night_from_c != null ? N(k24.night_from_c) + "°" : "–"}</b><em>${E(T(k24.night_ne, k24.night_en))}</em></div></div>`,
      source: T("जल तथा मौसम विज्ञान विभाग", "DHM"), url: k24.url, time: T("जारी", "issued") + " " + G.npt(k24.issued) }));
    /* 1c. rain measured at DHM stations */
    const ob = wx && wx.station_obs;
    if (ob && ob.stations && ob.stations.length) { const wet = ob.stations.filter((x) => x.rain_mm > 0).sort((a, b) => b.rain_mm - a.rain_mm), dry = ob.stations.length - wet.length;
      cards.push(V.card({ title: T("नापिएको वर्षा", "Measured rain"), href: R + "weather/", more: T("मौसम", "Weather"),
        say: wet.length ? T(wet[0].ne + " मा " + N(wet[0].rain_mm) + " मि.मि.; " + N(dry) + " केन्द्रमा वर्षा भएन।", wet[0].en + " recorded " + wet[0].rain_mm + " mm; " + dry + " of " + ob.stations.length + " stations had no rain.") : T("सबै " + N(ob.stations.length) + " केन्द्रमा वर्षा भएन।", "None of the " + ob.stations.length + " stations recorded rain."),
        body: wet.length ? V.raintubes(wet.slice(0, 5).map((x) => ({ name: T(x.ne, x.en), v: x.rain_mm })), T(" मि.मि.", " mm")) : "",
        source: T("DHM केन्द्रको अवलोकन", "DHM station observations"), url: ob.url, time: G.npt(ob.issued) + " · " + T("नापिएको, पूर्वानुमान होइन", "measured, not a forecast") })); }
    /* 2. rivers against their warning and danger levels */
    if (rv && rv.gauges && rv.gauges.length) { const hot = rv.gauges.filter((g) => g.level >= g.warning).length;
      cards.push(V.card({ cls: "vzx", title: T("नदीको तह", "River levels"), href: R + "rivers/", more: T("नदी", "Rivers"), body: V.tanks(rv.gauges.map((g) => ({ name: T(g.ne, g.en).split(/ at | · /)[0], level: g.level, warning: g.warning, danger: g.danger }))),
        say: hot ? T(N(hot) + " केन्द्र चेतावनी तहमाथि छन्।", hot + (hot === 1 ? " station is" : " stations are") + " above warning level.") : T("देखाइएका सबै केन्द्र चेतावनी तहभन्दा तल छन्।", "Every station shown is below its warning level."),
        source: T("DHM नदी निगरानी", "DHM river watch"), url: rv.url, time: E(T(rv.as_of_ne, rv.as_of_en)) })); }
    /* 3. roads Gati follows, by status */
    if (rd && rd.routes) { const c = (s) => rd.routes.filter((r) => r.status === s).length, blocked = c("blocked"), one = c("oneway"), open = c("open"), none = c("none");
      cards.push(V.card({ title: T("मुख्य सडक", "Main roads"), href: R + "roads/", more: T("सडक", "Roads"),
        body: V.road([{ n: blocked, label: T("अवरुद्ध", "Blocked"), color: "#D93025" }, { n: one, label: T("एकतर्फी", "One-way"), color: "#F28C1E" }, { n: open, label: T("खुला पुष्टि भएको", "Confirmed open"), color: "#2E8B57" }, { n: none, label: T("कुनै रिपोर्ट छैन", "No report"), color: "#C9D3DF" }]),
        say: blocked ? T(N(blocked) + " खण्ड अवरुद्ध।", blocked + (blocked === 1 ? " section is blocked." : " sections are blocked.")) : one ? T("कुनै खण्ड पूर्ण अवरुद्ध छैन; " + N(one) + " एकतर्फी।", "No section is fully blocked; " + one + (one === 1 ? " is" : " are") + " one-way.") : T("गतिले हेरेका सडकमा अवरोधको रिपोर्ट छैन।", "No blockage is reported on the roads Gati follows."),
        source: T("नेपाल प्रहरी र सडक विभाग", "Nepal Police and Department of Roads"), url: R + "roads/", time: E(T(rd.as_of_ne, rd.as_of_en)) })); }
    /* 3b. earthquakes in the last 30 days, each agency named on its own bar */
    if (al && al.alerts) { const q = al.alerts.filter((a) => a.hazard === "earthquake" && Date.parse(a.sent) >= Date.now() - 30 * 864e5 && mag(a)).sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent));
      if (q.length) { const dm = (a) => { const d = new Date(Date.parse(a.sent) + G.tzMs); return N(d.getUTCDate()) + "/" + N(d.getUTCMonth() + 1); };
        cards.push(V.card({ cls: "vzx", title: T("भूकम्प, ३० दिन", "Earthquakes, 30 days"), href: R + "earthquakes/", more: T("भूकम्प", "Earthquakes"),
          say: T("पछिल्लो: ", "Latest: ") + E((q[0].info[G.lang === "ne" ? "ne" : "en"] || q[0].info.en).headline),
          body: V.quakes(q.slice(0, 8).map((a) => ({ m: mag(a), t: Date.parse(a.sent), agency: G.agencyOf(a), title: G.agencyOf(a) + " · " + dm(a) + " · M" + mag(a) }))) + `<p class="vzf" style="padding:0">${T("गोलोको आकार: म्याग्निच्युड। ", "Circle size is magnitude. ")}${q.slice(0, 4).map((a) => E(G.agencyOf(a)) + " " + dm(a) + ": M" + N(mag(a))).join(" · ")}. ${T("NSC र USGS का मापन फरक हुन्छन् र जोडिएका छैनन्।", "NSC and USGS use different scales and are not merged.")}</p>`,
          source: "NSC, USGS", url: R + "earthquakes/", time: T("पछिल्लो", "latest") + " " + G.npt(q[0].sent) })); } }
    /* 3c. air quality in the main cities: a model, tagged as an estimate */
    if (AQ && AQ.length) { const rows = AQ.map((d, k) => [d && d.current && d.current.us_aqi, CITIES[k]]).filter((x) => x[0] != null).sort((a, b) => b[0] - a[0]);
      if (rows.length) { const band = (v) => AQB.find((b) => v <= b[0]), w = band(rows[0][0]);
        cards.push(V.card({ cls: "vzx", est: true, title: T("हावाको गुणस्तर (US AQI)", "Air quality (US AQI)"), href: R + "weather/#air", more: T("हावा", "Air"),
          say: T(rows[0][1][0] + " मा सबैभन्दा बढी: " + w[2] + "।", "Highest in " + rows[0][1][1] + ": " + w[3] + "."),
          body: V.dial(rows[0][0], AQB, { label: T(rows[0][1][0], rows[0][1][1]) }) + `<ul class="vzaq">${rows.slice(1).map(([v, c]) => `<li><i style="background:${band(v)[1]}"></i>${E(T(c[0], c[1]))} <b>${N(Math.round(v))}</b></li>`).join("")}</ul>`,
          source: "Open-Meteo (Copernicus CAMS)", url: "https://open-meteo.com/en/docs/air-quality-api", time: T("मोडेल, मापन केन्द्रको पढाइ होइन", "model, not a station reading") })); } }
    /* 4. the last seven days, one row per agency */
    if (al && al.alerts) { const cols = [], keys = []; for (let k = 6; k >= 0; k--) { const d = day(Date.now() - k * 864e5); keys.push(d); cols.push({ top: wd(d), sub: N(Number(d.slice(8))), today: k === 0 }); }
      const by = {}; al.alerts.filter((a) => a.trust === "Official").forEach((a) => { const d = day(Date.parse(a.sent)), i = keys.indexOf(d); if (i < 0) return; const ag = G.agencyOf(a), row = (by[ag] = by[ag] || keys.map(() => ({ n: 0, sev: null })));
        row[i].n++; if ((RK[a.severity] || 0) > (RK[row[i].sev] || 0) || !row[i].sev) row[i].sev = RK[a.severity] ? a.severity : row[i].sev || "Unknown"; });
      const rows = Object.entries(by).map(([name, cells]) => ({ name, cells })).sort((a, b) => b.cells.reduce((s, c) => s + c.n, 0) - a.cells.reduce((s, c) => s + c.n, 0));
      const loose = cards.filter((x) => !x.includes("vzwide")).length % 3;
      if (rows.length) cards.push(V.card({ cls: "vzx " + (loose === 1 ? "vzwide2" : loose === 2 ? "" : "vzwide"), title: T("पछिल्ला ७ दिन, निकायअनुसार", "The last 7 days, by agency"), href: R + "alerts/", more: T("सबै सूचना", "All alerts"), body: V.heat(rows, cols),
        say: T("हरेक खानामा त्यस दिन त्यो निकायले जारी गरेका आधिकारिक सूचनाको सङ्ख्या; रङले सबैभन्दा गम्भीर तह देखाउँछ। निकायहरू जोडिएका छैनन्।", "Each box is the number of official notices that agency issued that day; the colour is the most severe one. Agencies are not added together."),
        source: T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), url: R + "api/", time: al.generated ? T("अद्यावधिक", "updated") + " " + G.npt(al.generated) : "" })); }
    const pick = () => box.querySelectorAll(".vzpick").forEach((b) => (b.onclick = () => G.district && G.district.open && G.district.open(draw)));
    setTimeout(pick, 0); setTimeout(() => { const m = box.querySelector(".vzmore"); if (m) m.onclick = () => { all = !all; draw(); }; }, 0);
    box.innerHTML = cards.length ? `<h2 class="vzt">${T("नेपाल एक नजरमा", "Nepal at a glance")}</h2><div class="vzgrid${all ? " vzall" : ""}">${cards.join("")}</div><button type="button" class="vzmore" aria-expanded="${all}">${all ? T("कम देखाउनुहोस्", "Show fewer") : T("सबै " + N(cards.length) + " कार्ड देखाउनुहोस्", "Show all " + cards.length + " cards")} ${all ? "▴" : "▾"}</button><figure class="vztoday"><a href="${R}share/today.png" target="_blank" rel="noopener"><img src="${R}share/today.png" alt="${T("आजको नेपाल कार्ड: नक्सा, DHM चेतावनी, नदी, सडक र नापिएको वर्षा", "Today's Nepal card: map, DHM warning, rivers, roads and measured rain")}" width="1200" height="630" loading="lazy"></a><figcaption><b>${T("आजको कार्ड", "Today's card")}</b><span>${T("साथीभाइलाई पठाउन मिल्ने एउटै तस्विर।", "One image you can send to family and friends.")}</span><span class="vzshare"><a class="hmchip" href="${R}share/today.png" download="gati-nepal-today.png">${T("डाउनलोड", "Download")} ↓</a> <a class="hmchip" href="${R}share/today-square.png" download="gati-nepal-today-square.png">${T("वर्गाकार", "Square")} ↓</a></span></figcaption></figure>` : "";
  }
  const go = () => Promise.all(["data/alerts.json", "data/weather.json", "data/rivers.json", "data/roads.json", "data/districts.geojson"].map(J)).then((d) => { D = d; draw(); G.onLang(draw); addEventListener("gati:district", draw);
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${CITIES.map((c) => c[2]).join(",")}&longitude=${CITIES.map((c) => c[3]).join(",")}&current=us_aqi&timezone=Asia%2FKathmandu`).then((r) => (r.ok ? r.json() : null)).then((x) => { AQ = x ? (Array.isArray(x) ? x : [x]) : null; if (AQ) draw(); }).catch(() => {}); });
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "400px" }); io.observe(box); } else go();
})();
