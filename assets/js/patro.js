/* /patro/: BS month view (Gregorian toggle), week view. Holidays only from data/calendar.json (cited);
   tithi omitted (no citable source); Kathmandu sunrise/sunset computed (NOAA solar equations);
   hazard dots from data/alerts.json (onset to expires). Seasonal bands are approximate. */
(async function () {
  const G = window.Gati, BS = window.BS, esc = G.esc, R = G.root;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const [cal, al] = await Promise.all([G.json("data/calendar.json").catch(() => ({ entries: [], seasons: [] })), G.json("data/alerts.json").catch(() => ({ alerts: [] }))]);
  let alerts = al.alerts;
  const MON_NE = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"];
  const MON_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const WS_NE = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"], WS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const DAY = 864e5;
  const t = BS.todayNP();
  let mode = G.cal === "ad" && localStorage.getItem("gati-patro-cal") === "ad" ? "ad" : (localStorage.getItem("gati-patro-cal") || "bs");
  let view = localStorage.getItem("gati-patro-view") || "month";
  const tb = BS.toBS(t.y, t.m, t.d);
  let cur = { y: mode === "bs" ? tb.y : t.y, m: mode === "bs" ? tb.m : t.m };
  let weekStart = Date.UTC(t.y, t.m - 1, t.d) - new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay() * DAY;
  let sel = null;

  /* Sunrise/sunset for Kathmandu (27.7172 N, 85.3240 E), NOAA algorithm, zenith 90.833 deg, output NPT. */
  const LAT = 27.7172, LON = 85.324, rad = Math.PI / 180;
  function sun(ms) {
    const n = Math.round(ms / DAY + 2440587.5 - 2451545.0 + 0.0008); /* ms = 00:00 UTC of the date */
    const Jt = n - LON / 360; const M = (357.5291 + 0.98560028 * Jt) % 360;
    const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const lam = (M + C + 180 + 102.9372) % 360;
    const Jtr = 2451545.0 + Jt + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);
    const dec = Math.asin(Math.sin(lam * rad) * Math.sin(23.44 * rad));
    const cw = (Math.sin(-0.833 * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
    const w = Math.acos(cw) / rad;
    const toNPT = (j) => { const d = new Date((j - 2440587.5) * DAY + 345 * 60000); return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };
    return [toNPT(Jtr - w / 360), toNPT(Jtr + w / 360)];
  }
  const ms = (s) => Date.parse(s + "T00:00:00Z");
  const hol = {}; (cal.entries || []).forEach((e) => (hol[e.date_ad] = hol[e.date_ad] || []).push(e));
  function seasonsOn(adIso) {
    const md = adIso.slice(5);
    return (cal.seasons || []).filter((s) => s.from_ad ? adIso >= s.from_ad && adIso <= s.to_ad
      : s.from_md <= s.to_md ? md >= s.from_md && md <= s.to_md : md >= s.from_md || md <= s.to_md);
  }
  function alertsOn(adIso) {
    const a0 = ms(adIso) - 345 * 60000, a1 = a0 + DAY;
    return alerts.filter((a) => {
      const i = a.info.en, s = Date.parse(i.onset || i.effective || a.sent), e = Date.parse(a.expires);
      return s < a1 && e > a0 && a.msgType !== "Cancel";
    });
  }
  const SR = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
  function day(msUTC) {
    const d = new Date(msUTC), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    const b = BS.toBS(y, m, dd), ad = iso(y, m, dd);
    return { ms: msUTC, ad, y, m, d: dd, bs: b, wd: d.getUTCDay(), hol: hol[ad] || [], al: alertsOn(ad), se: seasonsOn(ad), sun: sun(msUTC) };
  }
  function range() {
    if (view === "week") return [...Array(7)].map((_, k) => weekStart + k * DAY);
    let a, n;
    if (mode === "bs") { const s = BS.toAD(cur.y, cur.m, 1); a = Date.UTC(s.y, s.m - 1, s.d); n = BS.len(cur.y, cur.m); }
    else { a = Date.UTC(cur.y, cur.m - 1, 1); n = new Date(Date.UTC(cur.y, cur.m, 0)).getUTCDate(); }
    return [...Array(n)].map((_, k) => a + k * DAY);
  }
  const bsLab = (b) => (G.lang === "ne" ? `${BS.MN[b.m - 1]} ${G.num(b.d)}, ${G.num(b.y)}` : `${b.d} ${BS.ME[b.m - 1]} ${b.y} BS`);
  const adLab = (x) => (G.lang === "ne" ? G.num(`${MON_NE[x.m - 1]} ${x.d}, ${x.y}`) : `${x.d} ${MON_EN[x.m - 1]} ${x.y}`);
  function title(days) {
    if (view === "week") return `${T("हप्ता", "Week")}: ${mode === "bs" ? bsLab(days[0].bs) : adLab(days[0])} – ${mode === "bs" ? bsLab(days[6].bs) : adLab(days[6])}`;
    if (mode === "bs") { const f = days[0], l = days[days.length - 1];
      return `${G.lang === "ne" ? BS.MN[cur.m - 1] + " " + G.num(cur.y) : BS.ME[cur.m - 1] + " " + cur.y + " BS"} <small>(${T(MON_NE[f.m - 1], MON_EN[f.m - 1].slice(0, 3))}${f.m !== l.m ? "/" + T(MON_NE[l.m - 1], MON_EN[l.m - 1].slice(0, 3)) : ""} ${G.num(l.y)})</small>`; }
    const f = days[0], l = days[days.length - 1];
    return `${T(MON_NE[cur.m - 1], MON_EN[cur.m - 1])} ${G.num(cur.y)} <small>(${T(BS.MN[f.bs.m - 1], BS.ME[f.bs.m - 1])}/${T(BS.MN[l.bs.m - 1], BS.ME[l.bs.m - 1])} ${G.num(l.bs.y)})</small>`;
  }
  const dots = (x) => [...new Set(x.al.map((a) => a.severity))].sort((p, q) => SR[p] - SR[q]).map((s) => `<i class="hdot" style="background:${G.SEVCOLOR[s] || G.SEVCOLOR.Unknown}" title="${esc(T(G.SEV[s][0], G.SEV[s][1]))}"></i>`).join("");
  const bands = (x) => x.se.map((s) => `<i class="band" style="background:${s.colour}" title="${esc(T(s.title_ne, s.title_en))}"></i>`).join("");
  function cell(x) {
    const today = x.ad === iso(t.y, t.m, t.d);
    const big = mode === "bs" ? G.num(x.bs.d) : G.num(x.d), small = mode === "bs" ? G.num(x.d) : G.num(x.bs.d);
    const aria = `${bsLab(x.bs)} · ${adLab(x)}${x.hol.length ? " · " + x.hol.map((h) => T(h.title_ne, h.title_en)).join(", ") : ""}${x.al.length ? " · " + G.num(x.al.length) + T(" सूचना", " alerts") : ""}`;
    return `<button type="button" class="pday${x.hol.length || x.wd === 6 ? " hol" : ""}${today ? " today" : ""}${sel === x.ad ? " sel" : ""}" data-ad="${x.ad}" aria-label="${esc(aria)}">
      <span class="pbig">${big}</span><span class="psmall">${small}</span>
      ${x.hol.length ? `<span class="phol">${esc(T(x.hol[0].title_ne, x.hol[0].title_en))}${x.hol.length > 1 ? " +" + G.num(x.hol.length - 1) : ""}</span>` : ""}
      <span class="psun">☀ ${G.num(x.sun[0])} · ${G.num(x.sun[1])}</span>
      <span class="pmarks">${dots(x)}</span><span class="pbands">${bands(x)}</span></button>`;
  }
  function weekRow(x) {
    return `<div class="pwrow${x.ad === iso(t.y, t.m, t.d) ? " today" : ""}">
      <div class="pwd"><strong>${T(BS.WN[x.wd], BS.WE[x.wd])}</strong><br>${bsLab(x.bs)}<br><span class="meta">${adLab(x)}</span></div>
      <div>${detail(x, true)}</div></div>`;
  }
  function detail(x, inline) {
    const h = x.hol.map((e) => `<li>🎉 <strong>${esc(T(e.title_ne, e.title_en))}</strong> ${G.trustChip(e.trust)} <span class="meta">${T("स्रोत", "Source")}: <a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">${esc(e.source)}</a></span></li>`).join("");
    const a = x.al.map((a) => { const i = a.info[G.lang] || a.info.ne; return `<li>${G.sevChip(a.severity)} ${G.trustChip(a.trust)} <a href="${R}alerts/${esc(a.identifier)}/">${esc(i.headline)}</a>
      <span class="meta">${T("स्रोत", "Source")}: <a href="${esc(i.web)}" target="_blank" rel="noopener">${esc((i.senderName || "").split(" — ")[0])}</a> · ${G.npt(i.params["gati:sourceTime"] || a.sent)}</span></li>`; }).join("");
    const s = x.se.map((s) => `<li><i class="band" style="background:${s.colour}"></i> ${esc(T(s.title_ne, s.title_en))} <span class="meta">${esc(s.source)}</span></li>`).join("");
    return `${inline ? "" : `<h3>${T(BS.WN[x.wd], BS.WE[x.wd])} · ${bsLab(x.bs)} · ${adLab(x)}</h3>`}
      <p class="meta">☀ ${T("सूर्योदय", "Sunrise")} ${G.num(x.sun[0])} · ${T("सूर्यास्त", "Sunset")} ${G.num(x.sun[1])} NPT (${T("काठमाडौँ, गणना गरिएको", "Kathmandu, computed")})${x.bs.provisional ? " · " + T("वि.सं. मिति अस्थायी", "BS date provisional") : ""}</p>
      ${h ? `<ul class="plist">${h}</ul>` : ""}
      ${a ? `<h4>${T("यो दिन लागू सूचना", "Alerts in force this day")}</h4><ul class="plist">${a}</ul>` : `<p class="meta">${T("यो दिनका लागि गतिमा कुनै सूचना छैन। यसको अर्थ खतरा छैन भन्ने होइन।", "No Gati alert covers this day. That does not mean there is no risk.")}</p>`}
      ${s ? `<ul class="plist">${s}</ul>` : ""}`;
  }
  function draw() {
    const days = range().map(day);
    document.getElementById("ptitle").innerHTML = title(days);
    const g = document.getElementById("pgrid");
    if (view === "week") g.innerHTML = `<div class="pweek">${days.map(weekRow).join("")}</div>`;
    else g.innerHTML = `<div class="pmonth">${(G.lang === "ne" ? WS_NE : WS_EN).map((w, k) => `<div class="pwh${k === 6 ? " hol" : ""}">${w}</div>`).join("")}
      ${'<div></div>'.repeat(days[0].wd)}${days.map(cell).join("")}</div>`;
    g.querySelectorAll(".pday").forEach((b) => (b.onclick = () => { sel = b.dataset.ad; draw(); }));
    const p = document.getElementById("ppanel");
    const sd = sel && days.find((d) => d.ad === sel);
    p.hidden = !sd || view === "week"; if (sd && view !== "week") p.innerHTML = `<button type="button" class="pclose" aria-label="${T("बन्द", "Close")}">✕</button>` + detail(sd);
    const pc = p.querySelector(".pclose"); if (pc) pc.onclick = () => { sel = null; draw(); };
    document.getElementById("pprev").textContent = "‹ " + T("अघिल्लो", "Previous");
    document.getElementById("pnext").textContent = T("अर्को", "Next") + " ›";
    document.getElementById("ptoday").textContent = T("आज", "Today");
    const [cb, ca] = document.querySelectorAll("#pcal button"); cb.textContent = T("वि.सं.", "BS"); ca.textContent = T("ई.सं. (ग्रेगोरियन)", "Gregorian");
    cb.setAttribute("aria-pressed", mode === "bs"); ca.setAttribute("aria-pressed", mode === "ad");
    const [vm, vw] = document.querySelectorAll("#pview button"); vm.textContent = T("महिना", "Month"); vw.textContent = T("हप्ता", "Week");
    vm.setAttribute("aria-pressed", view === "month"); vw.setAttribute("aria-pressed", view === "week");
    document.getElementById("plegend").innerHTML = `<p>${G.SEVORDER.map((s) => `<i class="hdot" style="background:${G.SEVCOLOR[s]}"></i> ${T(G.SEV[s][0], G.SEV[s][1])}`).join(" · ")} · 🎉 ${T("सार्वजनिक बिदा", "Public holiday")}</p>
      <p>${(cal.seasons || []).map((s) => `<i class="band" style="background:${s.colour}"></i> ${esc(T(s.title_ne, s.title_en))}`).join(" · ")}</p>`;
    document.getElementById("pnotes").innerHTML = `<p>${esc(T(cal.note_ne || "", cal.note_en || ""))}</p><p>${esc(T(cal.festivals_note_ne || "", cal.festivals_note_en || ""))}</p>
      <p>${esc(T(cal.tithi_note_ne || "", cal.tithi_note_en || ""))}</p><p>${esc(T(cal.seasons_note_ne || "", cal.seasons_note_en || ""))}</p>
      <p>${T("सूर्योदय र सूर्यास्त काठमाडौँ (२७.७१७२° उ, ८५.३२४०° पू) का लागि NOAA सौर्य समीकरणबाट गणना गरिएको हो, एक दुई मिनेट फरक पर्न सक्छ।", "Sunrise and sunset are computed for Kathmandu (27.7172 N, 85.3240 E) with the NOAA solar equations and may differ by a minute or two.")}
      ${T("वि.सं. महिनाको लम्बाइ: ", "BS month lengths: ")}nepali-date-converter 3.4.0 / bikram-sambat 1.8.1 (${T("assets/js/bs.js मा उद्धृत", "cited in assets/js/bs.js")}). <a href="gati.ics">gati.ics</a></p>`;
  }
  function step(k) {
    sel = null;
    if (view === "week") weekStart += k * 7 * DAY;
    else { cur.m += k; if (cur.m > 12) { cur.m = 1; cur.y++; } if (cur.m < 1) { cur.m = 12; cur.y--; } }
    draw();
  }
  document.getElementById("pprev").onclick = () => step(-1);
  document.getElementById("pnext").onclick = () => step(1);
  document.getElementById("ptoday").onclick = () => { cur = { y: mode === "bs" ? tb.y : t.y, m: mode === "bs" ? tb.m : t.m }; weekStart = Date.UTC(t.y, t.m - 1, t.d) - new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay() * DAY; sel = iso(t.y, t.m, t.d); draw(); };
  document.querySelectorAll("#pcal button").forEach((b) => (b.onclick = () => {
    const days = range().map(day), mid = days[Math.min(10, days.length - 1)];
    mode = b.dataset.v; localStorage.setItem("gati-patro-cal", mode);
    cur = mode === "bs" ? { y: mid.bs.y, m: mid.bs.m } : { y: mid.y, m: mid.m }; draw();
  }));
  document.querySelectorAll("#pview button").forEach((b) => (b.onclick = () => { view = b.dataset.v; localStorage.setItem("gati-patro-view", view); draw(); }));
  G.patro = { setAlerts(list) { alerts = list; draw(); } };
  G.onLang(draw);
  draw();
})();
