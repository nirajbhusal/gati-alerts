/* The lead graphic on each section page, built from the shared chart kit (assets/js/viz.js).
   One answer first: a status word and a sentence, then one supporting chart where the data has one.
   Agencies are listed side by side and never added together. */
(function () {
  const G = window.Gati; if (!G || !G.viz) return;
  const PAGE = document.body.dataset.page, main = document.getElementById("main"); if (!main) return;
  const V = G.viz, R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v));
  const J = (p) => G.rawJson(p).catch(() => null), RK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };
  const day = (ms) => new Date(ms + G.tzMs).toISOString().slice(0, 10);
  const wd = (iso) => { const d = new Date(iso + "T00:00:00Z").getUTCDay(); return window.BS ? T(BS.WN[d].replace("बार", ""), BS.WE[d].slice(0, 3)) : ""; };
  const NEED = { rivers: ["data/rivers.json"], weather: ["data/weather.json"], roads: ["data/roads.json"], earthquakes: ["data/alerts.json"], alerts: ["data/alerts.json"] }[PAGE]; if (!NEED) return;
  const box = document.createElement("section"); box.id = "pviz"; box.className = "pviz";
  const h1 = main.querySelector("h1"), after = h1 && h1.nextElementSibling && h1.nextElementSibling.tagName === "P" ? h1.nextElementSibling : h1;
  if (after && after.parentNode === main) after.insertAdjacentElement("afterend", box); else if (after) after.parentNode.insertAdjacentElement("afterend", box); else main.prepend(box);
  let D = null;
  const active = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires || "2999-01-01") > Date.now();
  const mag = (a) => parseFloat(((a.info.en || {}).params || {})["gati:magnitude"] || "") || null;
  const B = {
    rivers([rv]) { if (!rv || !rv.gauges) return ""; const g = rv.gauges, dg = g.filter((x) => x.level >= x.danger).length, wn = g.filter((x) => x.level >= x.warning && x.level < x.danger).length;
      return V.answer({ tone: dg ? "bad" : wn ? "warn" : "calm", word: dg ? T("खतरा", "Danger") : wn ? T("चेतावनी", "Warning") : T("सामान्य", "Normal"),
        say: dg ? T(N(dg) + " केन्द्र खतरा तहमाथि छन्।", dg + (dg === 1 ? " station is" : " stations are") + " above danger level.") : wn ? T(N(wn) + " केन्द्र चेतावनी तहमाथि छन्।", wn + (wn === 1 ? " station is" : " stations are") + " above warning level.") : T("तल देखाइएका सबै " + N(g.length) + " केन्द्र चेतावनी तहभन्दा तल छन्।", "All " + g.length + " stations shown below are under their warning level."),
        sub: T("यी पढाइ पुराना हुन सक्छन्; समय तल हेर्नुहोस्।", "These readings can be old; check the time below."), source: T("DHM नदी निगरानी", "DHM river watch"), url: rv.url, time: E(T(rv.as_of_ne, rv.as_of_en)) }); },
    weather([wx]) { if (!wx) return ""; const b5 = wx.bulletin5, out = [];
      if (b5 && b5.days) { const worst = ["red", "orange", "yellow"].find((l) => b5.days.some((d) => d.level === l)), L = V.LEVEL[worst || "green"], wdays = b5.days.filter((d) => d.level !== "green");
        out.push(V.answer({ tone: worst === "red" ? "bad" : worst ? "warn" : "calm", word: T(L[1], L[2]),
          say: worst ? T("DHM को ५ दिने नक्सामा " + wdays.map((d) => d.bs).join(", ") + " मा चेतावनी छ।", "DHM's 5-day maps carry a warning on " + wdays.map((d) => G.bsDay(d)).join(", ") + ".") : T("DHM को ५ दिने नक्सामा पाँचै दिन देशभर कुनै मौसम चेतावनी छैन।", "DHM's 5-day maps show no weather warning anywhere on all five days."),
          sub: E(T(b5.advisory_ne, b5.advisory_en) || ""), source: T("जल तथा मौसम विज्ञान विभाग", "DHM"), url: b5.url, time: T("जारी", "issued") + " " + G.npt(b5.issued) })); }
      const o = wx.station_obs;
      if (o && o.stations && o.stations.length) { const wet = o.stations.filter((s) => s.rain_mm > 0).sort((a, b) => b.rain_mm - a.rain_mm), dry = o.stations.length - wet.length, top = wet[0];
        out.push(V.card({ title: T("DHM केन्द्रमा नापिएको वर्षा", "Rain measured at DHM stations"),
          say: top ? T(top.ne + " मा " + N(top.rain_mm) + " मि.मि.; " + N(dry) + " केन्द्रमा वर्षा भएन।", top.en + " recorded " + top.rain_mm + " mm; " + dry + " of " + o.stations.length + " stations recorded no rain.") : T("सबै " + N(o.stations.length) + " केन्द्रमा वर्षा भएन।", "None of the " + o.stations.length + " stations recorded rain."),
          body: wet.length ? V.bars(wet.slice(0, 8).map((s) => ({ name: T(s.ne, s.en), v: s.rain_mm })), { unit: " mm" }) : "",
          source: T("जल तथा मौसम विज्ञान विभाग, केन्द्रको अवलोकन", "DHM station observations"), url: o.url, time: T("अवलोकन", "observation of") + " " + G.npt(o.issued) + " · " + T("नापिएको, पूर्वानुमान होइन", "measured, not a forecast") })); }
      return out.join(""); },
    roads([rd]) { if (!rd || !rd.routes) return ""; const c = (s) => rd.routes.filter((r) => r.status === s), bl = c("blocked"), ow = c("oneway"), nm = (r) => E(T(r.name_ne, r.name_en));
      return V.answer({ tone: bl.length ? "bad" : ow.length ? "warn" : "calm", word: bl.length ? T("अवरुद्ध", "Blocked") : ow.length ? T("एकतर्फी", "One-way") : T("अवरोध छैन", "No blockage"),
        say: bl.length ? T(N(bl.length) + " खण्ड अवरुद्ध: ", bl.length + (bl.length === 1 ? " section blocked: " : " sections blocked: ")) + bl.slice(0, 3).map(nm).join("; ") : ow.length ? T("कुनै खण्ड पूर्ण अवरुद्ध छैन। एकतर्फी: ", "No section is fully blocked. One-way: ") + ow.slice(0, 3).map(nm).join("; ") : T("गतिले हेरेका सडकमा अवरोधको रिपोर्ट छैन।", "No blockage is reported on the roads Gati follows."),
        sub: T(N(c("none").length) + " खण्डको आधिकारिक रिपोर्ट छैन; यात्रा अघि प्रहरी वा सडक विभागसँग बुझ्नुहोस्।", c("none").length + " sections have no official report; check with the police or the Department of Roads before travelling."),
        source: T("नेपाल प्रहरी र सडक विभाग", "Nepal Police and Department of Roads"), url: rd.sources && rd.sources.pol ? rd.sources.pol.u : null, time: E(T(rd.as_of_ne, rd.as_of_en)) }); },
    earthquakes([al]) { if (!al) return ""; const q = al.alerts.filter((a) => a.hazard === "earthquake").sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent)); if (!q.length) return "";
      const last = q[0], m = mag(last), i = last.info[G.lang === "ne" ? "ne" : "en"] || last.info.en, since = Date.now() - 30 * 864e5, by = {};
      q.filter((a) => Date.parse(a.sent) >= since).forEach((a) => { const k = G.agencyOf(a); by[k] = (by[k] || 0) + 1; });
      const days = Math.floor((Date.now() - Date.parse(last.sent)) / 864e5);
      return V.answer({ tone: days < 1 ? "warn" : "calm", word: m ? "M " + N(m.toFixed(1)) : T("भूकम्प", "Quake"), say: T("पछिल्लो: ", "Latest: ") + E(i.headline),
        sub: T("पछिल्ला ३० दिनमा: ", "In the last 30 days: ") + (Object.entries(by).map(([k, n]) => E(k) + " " + N(n)).join(" · ") || T("कुनै छैन", "none")) + T("। निकायहरू जोडिएका छैनन्।", ". Agencies are not added together."),
        source: E(G.agencyOf(last)), url: i.web, time: G.npt(last.sent) }); },
    alerts([al]) { if (!al) return ""; const off = al.alerts.filter((a) => a.trust === "Official"), act = off.filter(active), by = {}; let top = null;
      act.forEach((a) => { const k = G.agencyOf(a); by[k] = (by[k] || 0) + 1; if ((RK[a.severity] || 0) > (RK[top] || 0)) top = a.severity; });
      const cols = [], keys = []; for (let k = 6; k >= 0; k--) { const d = day(Date.now() - k * 864e5); keys.push(d); cols.push({ top: wd(d), sub: N(Number(d.slice(8))), today: k === 0 }); }
      const rowsBy = {}; off.forEach((a) => { const idx = keys.indexOf(day(Date.parse(a.sent))); if (idx < 0) return; const ag = G.agencyOf(a), row = (rowsBy[ag] = rowsBy[ag] || keys.map(() => ({ n: 0, sev: null }))); row[idx].n++; if (!row[idx].sev || (RK[a.severity] || 0) > (RK[row[idx].sev] || 0)) row[idx].sev = RK[a.severity] ? a.severity : row[idx].sev || "Unknown"; });
      const rows = Object.entries(rowsBy).map(([name, cells]) => ({ name, cells })).sort((a, b) => b.cells.reduce((s, c) => s + c.n, 0) - a.cells.reduce((s, c) => s + c.n, 0));
      const s = top && G.SEV[top];
      return V.answer({ tone: RK[top] >= 3 ? "bad" : RK[top] === 2 ? "warn" : "calm", word: act.length ? (s ? T(s[0], s[1]) : T("सूचना", "Info")) : T("सक्रिय छैन", "None active"),
        say: act.length ? T("सक्रिय आधिकारिक सूचना, निकायअनुसार: ", "Active official notices, by agency: ") + Object.entries(by).map(([k, n]) => E(k) + " " + N(n)).join(" · ") : T("अहिले कुनै सक्रिय आधिकारिक सूचना छैन।", "There is no active official notice right now."),
        sub: act.length ? T("शब्दले सक्रिय सूचनामध्ये सबैभन्दा गम्भीर तह देखाउँछ। निकायहरू जोडिएका छैनन्।", "The word shows the most severe level among them. Agencies are not added together.") : "",
        source: T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), url: R + "api/", time: al.generated ? T("अद्यावधिक", "updated") + " " + G.npt(al.generated) : "" })
        + (rows.length ? V.card({ title: T("पछिल्ला ७ दिन, निकायअनुसार", "The last 7 days, by agency"), body: V.heat(rows, cols), say: T("हरेक खानामा त्यस दिन त्यो निकायले जारी गरेका आधिकारिक सूचनाको सङ्ख्या; रङले सबैभन्दा गम्भीर तह देखाउँछ।", "Each box is the number of official notices that agency issued that day; the colour is the most severe one."),
          source: T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), url: R + "api/", time: al.generated ? T("अद्यावधिक", "updated") + " " + G.npt(al.generated) : "" }) : ""); },
  };
  const draw = () => { if (D) box.innerHTML = B[PAGE](D) || ""; };
  Promise.all(NEED.map(J)).then((d) => { D = d; draw(); G.onLang(draw); });
})();
