/* Home, "Nepal at a glance": four small graphics built from the shared chart kit (assets/js/viz.js).
   Each one answers a single question and carries its source and time. Agencies are never added together. */
(function () {
  const box = document.getElementById("hviz"), G = window.Gati; if (!box || !G || !G.viz) return;
  const V = G.viz, R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v));
  const J = (p) => G.rawJson(p).catch(() => null);
  const RK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };
  const day = (ms) => new Date(ms + G.tzMs).toISOString().slice(0, 10);
  const wd = (iso) => { const d = new Date(iso + "T00:00:00Z").getUTCDay(); return window.BS ? T(BS.WN[d].replace("बार", ""), BS.WE[d].slice(0, 3)) : ""; };
  let D = null;
  function draw() {
    if (!D) return; const [al, wx, rv, rd] = D, cards = [], today = day(Date.now());
    /* 1. DHM five-day warning */
    const b5 = wx && wx.bulletin5;
    if (b5 && b5.days && b5.days.length) { const days = b5.days.map((d) => ({ top: wd(d.ad), sub: G.lang === "ne" ? d.bs.replace(/^\S+\s/, "") : String(Number(d.ad.slice(8))), level: d.level, today: d.ad === today }));
      const worst = ["red", "orange", "yellow"].find((l) => b5.days.some((d) => d.level === l));
      cards.push(V.card({ title: T("DHM को ५ दिने मौसम चेतावनी", "DHM 5-day weather warning"), href: R + "weather/", more: T("मौसम", "Weather"), body: V.daystrip(days),
        say: worst ? T("यी पाँच दिनमध्ये कुनै दिन चेतावनी छ। विवरण मौसम पृष्ठमा।", "At least one of these five days carries a warning. Details on the Weather page.") : T("पाँचै दिन देशभर कुनै मौसम चेतावनी छैन।", "No weather warning anywhere on all five days."),
        source: T("जल तथा मौसम विज्ञान विभाग", "DHM"), url: b5.url, time: T("जारी", "issued") + " " + G.npt(b5.issued) })); }
    /* 2. rivers against their warning and danger levels */
    if (rv && rv.gauges && rv.gauges.length) { const hot = rv.gauges.filter((g) => g.level >= g.warning).length;
      cards.push(V.card({ title: T("नदीको तह", "River levels"), href: R + "rivers/", more: T("नदी", "Rivers"), body: rv.gauges.map((g) => V.gauge({ name: T(g.ne, g.en), level: g.level, warning: g.warning, danger: g.danger })).join("") + V.gaugeKey(),
        say: hot ? T(N(hot) + " केन्द्र चेतावनी तहमाथि छन्।", hot + (hot === 1 ? " station is" : " stations are") + " above warning level.") : T("देखाइएका सबै केन्द्र चेतावनी तहभन्दा तल छन्।", "Every station shown is below its warning level."),
        source: T("DHM नदी निगरानी", "DHM river watch"), url: rv.url, time: E(T(rv.as_of_ne, rv.as_of_en)) })); }
    /* 3. roads Gati follows, by status */
    if (rd && rd.routes) { const c = (s) => rd.routes.filter((r) => r.status === s).length, blocked = c("blocked"), one = c("oneway"), open = c("open"), none = c("none");
      cards.push(V.card({ title: T("मुख्य सडक", "Main roads"), href: R + "roads/", more: T("सडक", "Roads"),
        body: V.segbar([{ n: blocked, label: T("अवरुद्ध", "Blocked"), color: "#D93025" }, { n: one, label: T("एकतर्फी", "One-way"), color: "#F28C1E" }, { n: open, label: T("खुला पुष्टि भएको", "Confirmed open"), color: "#2E8B57" }, { n: none, label: T("कुनै रिपोर्ट छैन", "No report"), color: "#C9D3DF" }]),
        say: blocked ? T(N(blocked) + " खण्ड अवरुद्ध।", blocked + (blocked === 1 ? " section is blocked." : " sections are blocked.")) : one ? T("कुनै खण्ड पूर्ण अवरुद्ध छैन; " + N(one) + " एकतर्फी।", "No section is fully blocked; " + one + (one === 1 ? " is" : " are") + " one-way.") : T("गतिले हेरेका सडकमा अवरोधको रिपोर्ट छैन।", "No blockage is reported on the roads Gati follows."),
        source: T("नेपाल प्रहरी र सडक विभाग", "Nepal Police and Department of Roads"), url: R + "roads/", time: E(T(rd.as_of_ne, rd.as_of_en)) })); }
    /* 4. the last seven days, one row per agency */
    if (al && al.alerts) { const cols = [], keys = []; for (let k = 6; k >= 0; k--) { const d = day(Date.now() - k * 864e5); keys.push(d); cols.push({ top: wd(d), sub: N(Number(d.slice(8))), today: k === 0 }); }
      const by = {}; al.alerts.filter((a) => a.trust === "Official").forEach((a) => { const d = day(Date.parse(a.sent)), i = keys.indexOf(d); if (i < 0) return; const ag = G.agencyOf(a), row = (by[ag] = by[ag] || keys.map(() => ({ n: 0, sev: null })));
        row[i].n++; if ((RK[a.severity] || 0) > (RK[row[i].sev] || 0) || !row[i].sev) row[i].sev = RK[a.severity] ? a.severity : row[i].sev || "Unknown"; });
      const rows = Object.entries(by).map(([name, cells]) => ({ name, cells })).sort((a, b) => b.cells.reduce((s, c) => s + c.n, 0) - a.cells.reduce((s, c) => s + c.n, 0));
      if (rows.length) cards.push(V.card({ cls: "vzwide", title: T("पछिल्ला ७ दिन, निकायअनुसार", "The last 7 days, by agency"), href: R + "alerts/", more: T("सबै सूचना", "All alerts"), body: V.heat(rows, cols),
        say: T("हरेक खानामा त्यस दिन त्यो निकायले जारी गरेका आधिकारिक सूचनाको सङ्ख्या; रङले सबैभन्दा गम्भीर तह देखाउँछ। निकायहरू जोडिएका छैनन्।", "Each box is the number of official notices that agency issued that day; the colour is the most severe one. Agencies are not added together."),
        source: T("आधिकारिक निकाय, गतिमार्फत", "Official agencies, relayed by Gati"), url: R + "api/", time: al.generated ? T("अद्यावधिक", "updated") + " " + G.npt(al.generated) : "" })); }
    box.innerHTML = cards.length ? `<h2 class="vzt">${T("नेपाल एक नजरमा", "Nepal at a glance")}</h2><div class="vzgrid">${cards.join("")}</div>` : "";
  }
  const go = () => Promise.all(["data/alerts.json", "data/weather.json", "data/rivers.json", "data/roads.json"].map(J)).then((d) => { D = d; draw(); G.onLang(draw); });
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "400px" }); io.observe(box); } else go();
})();
