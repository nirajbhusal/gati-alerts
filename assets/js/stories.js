/* /feed/ (canonical; /stories/ redirects here): "सूचना फिड · Feed". Vertical swipe-up feed, one alert per screen, CSS scroll-snap.
   Active alerts first, then alerts sent in the last 30 days marked expired/superseded, then an "all caught up" card.
   Everything comes from data/alerts.json (the CAP messages). Nothing is invented. */
(function () {
  const G = window.Gati, b = G.b, esc = G.esc, R = G.root, SITE = G.country.site;
  const feed = document.getElementById("feed"), sheet = document.getElementById("sheet"), sb = document.getElementById("sheetbody");
  const dash = document.getElementById("stdash");
  try { localStorage.setItem("gati-view", "stories"); } catch (e) {}
  dash.onclick = () => { try { localStorage.setItem("gati-view", "dashboard"); } catch (e) {} };
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const SR = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
  const MT = { Alert: ["मूल सूचना", "Original"], Update: ["अद्यावधिक", "Update"], Cancel: ["रद्द", "Cancel"] };
  const isActive = (a) => new Date(a.expires) > Date.now() && !a.supersededBy && a.msgType !== "Cancel";
  const agency = (i) => (i.senderName || "").split(" — ")[0].split(" · ")[0];
  const srcTime = (a, i) => i.params["gati:sourceTime"] || a.sent;
  let items = [], by = {};
  const url = (a) => (a.demo ? "?demo=0" : `${SITE}alerts/${a.identifier}/`);

  function status(a) {
    if (isActive(a)) return `<span class="tag">${T("चालु", "Active")}</span>`;
    return `<span class="tag exp">${new Date(a.expires) <= Date.now() ? T("म्याद सकियो", "Expired") : T("पछि अद्यावधिक भयो", "Superseded")}</span>`;
  }
  /* Hazard art (inline SVG line icons on a severity-tinted disc) */
  const HZ = {
    flood: '<path d="M4 30c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3"/><path d="M4 38c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3"/><path d="M14 22V12l10-6 10 6v10"/><path d="M21 22v-6h6v6"/>',
    landslide: '<path d="M4 40 22 10l10 14 6-6 8 22z"/><circle cx="30" cy="34" r="2.5"/><circle cx="37" cy="30" r="2"/><circle cx="24" cy="36" r="1.8"/>',
    earthquake: '<path d="M4 26h8l4-12 6 24 6-18 4 6h12"/><path d="M10 40l6-4 6 4 6-4 6 4"/>',
    weather: '<path d="M14 30a8 8 0 1 1 2-15.8A11 11 0 0 1 37 18a6 6 0 0 1-1 12z"/><path d="M16 36l-2 5M24 36l-2 5M32 36l-2 5"/>',
    road: '<path d="M18 6 10 42M30 6l8 36"/><path d="M24 8v6M24 20v6M24 32v6"/><path d="M20 30h8l3 8H17z" fill="currentColor" opacity=".25"/>',
    fire: '<path d="M24 42c-8 0-13-5-13-12 0-8 7-11 8-20 5 4 6 8 6 11 2-2 3-5 3-7 5 4 9 9 9 16 0 7-5 12-13 12z"/>',
    lightning: '<path d="M27 4 12 26h11l-4 18 17-24H25z"/>',
    cold: '<path d="M24 4v40M7 14l34 20M41 14 7 34"/><path d="m19 8 5 4 5-4M19 40l5-4 5 4"/>',
    glof: '<path d="M4 22 14 10l8 8 6-6 16 10"/><path d="M4 32c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3"/><path d="M4 40c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3"/>',
    other: '<path d="M24 6 4 42h40z"/><path d="M24 20v10M24 35v.01"/>',
  };
  const HZN = { flood: ["बाढी", "Flood"], landslide: ["पहिरो", "Landslide"], earthquake: ["भूकम्प", "Earthquake"], weather: ["मौसम", "Weather"], road: ["सडक", "Road"], fire: ["आगलागी", "Fire"], lightning: ["चट्याङ", "Lightning"], cold: ["शीतलहर", "Cold wave"], glof: ["हिमताल", "GLOF"] };
  const art = (a) => `<div class="fart" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${HZ[a.hazard] || HZ.other}</svg></div>`;
  /* Mini map of affected districts, projected from data/districts.geojson */
  let DP = null;
  G.json("data/districts.geojson").then((g) => {
    const W = 200, H = 100, X = (x) => (((x - 80) / 8.3) * W).toFixed(1), Y = (y) => (((30.5 - y) / 4.2) * H).toFixed(1);
    DP = g.features.map((f) => { const P = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      return [f.id, P.map((p) => "M" + p[0].filter((_, k) => k % 3 === 0).map(([x, y]) => X(x) + " " + Y(y)).join("L") + "Z").join("")]; });
    feed.querySelectorAll(".fmini[data-k]").forEach((m) => { const a = items[+m.dataset.k]; if (a) m.innerHTML = mini(a); });
  }).catch(() => {});
  function mini(a) {
    if (!DP) return "";
    const all = !a.districts.length, c = G.SEVCOLOR[a.severity] || G.SEVCOLOR.Unknown;
    const dots = a.areas.flatMap((x) => x.circles).map((cc) => { const [y, x] = cc.split(" ")[0].split(",").map(Number); return `<circle cx="${((x - 80) / 8.3) * 200}" cy="${((30.5 - y) / 4.2) * 100}" r="3.5" fill="${c}" stroke="#fff" stroke-width="1.2"/>`; }).join("");
    return `<svg viewBox="0 0 200 100" role="img" aria-label="${esc(T("प्रभावित जिल्ला नक्सा", "Map of affected districts"))}">${DP.map(([id, d]) => `<path d="${d}" fill="${all || a.districts.includes(id) ? c : "rgba(120,128,138,.18)"}" fill-opacity="${all ? ".45" : "1"}" stroke="rgba(255,255,255,.35)" stroke-width=".4"/>`).join("")}${dots}</svg>`;
  }
  const LV = { Extreme: 5, Severe: 4, Moderate: 3, Minor: 2, Unknown: 1 };
  function left(a) {
    const ms = Date.parse(a.expires) - Date.now();
    if (ms <= 0) return [T("सकियो", "Ended"), T("म्याद", "Expiry")];
    const h = Math.round(ms / 36e5); return h < 48 ? [`${G.num(String(h))} ${T("घण्टा", "h")}`, T("बाँकी", "left")] : [`${G.num(String(Math.round(h / 24)))} ${T("दिन", "days")}`, T("बाँकी", "left")];
  }
  function card(a, k) {
    const i = a.info[G.lang] || a.info.ne, sev = G.SEV[a.severity] ? a.severity : "Unknown", act = isActive(a);
    const areas = a.areas.map((x) => x[G.lang] || x.en).filter(Boolean).join(" · ");
    const lv = LV[sev], tl = left(a), nd = a.districts.length;
    return `<div class="fbg"></div>
      <div class="fmain">
        <div class="fhero">${art(a)}<div class="ftags">${G.sevChip(sev)}${status(a)}${G.roadOngoingChip(a)}${G.district && G.district.get() && a.districts.includes(G.district.get()) ? `<span class="tag fmine">📍 ${T("मेरो जिल्ला", "My district")}</span>` : ""}<span class="tag">${esc(T(...(HZN[a.hazard] || [i.event, i.event])))}</span></div></div>
        <h2>${esc(i.headline)}</h2>
        ${G.roadOngoingLine(a)}
        <div class="fviz"><div class="fmini" data-k="${k}">${mini(a)}</div>
          <div class="finfo">
            <div class="fi"><div class="fmeter" aria-label="${esc(T(G.SEV[sev][0], G.SEV[sev][1]))}">${[1, 2, 3, 4, 5].map((n) => `<i${n <= lv ? ' class="on"' : ""}></i>`).join("")}</div><span>${T("गम्भीरता", "Severity")}</span></div>
            <div class="fi"><b>${nd ? G.num(String(nd)) : T("देशभर", "All")}</b><span>${nd ? T("जिल्ला", "districts") : T("नेपाल", "Nepal")}</span></div>
            <div class="fi"><b>${tl[0]}</b><span>${tl[1]}</span></div>
          </div></div>
        ${i.instruction ? `<p class="fins"><strong>${act ? T("के गर्ने", "What to do") : T("त्यति बेलाको निर्देशन", "Instruction at the time")}:</strong> ${esc(i.instruction)}</p>` : ""}
      </div>
      <div class="flow" style="--sc:${G.SEVCOLOR[sev]}">
        <p class="fsrcline">🕒 ${G.npt(srcTime(a, i))} · <a href="${esc(i.web)}" target="_blank" rel="noopener">${esc(agency(i))} ↗</a> ${G.trustChip(a.trust)}</p>
        <details class="fsrc"><summary>${T("स्रोत विवरण", "Source")}</summary>
          ${areas ? `<p>📍 ${esc(areas)}</p>` : ""}${a.state ? `<p>${G.trustChip(a.state)}</p>` : ""}
          <p>${T("स्रोतको समय", "Source time")}: ${G.npt(srcTime(a, i))} · ${T("म्याद", "Expires")}: ${G.npt(a.expires)}</p>
          <p class="fdisc"><a class="relaylink" href="${G.root}about/">${T("गतिले आधिकारिक स्रोत मात्र प्रसारण गर्छ", "Gati relays official sources")}</a></p></details>
      </div>
      <div class="rail">
        <button type="button" data-act="share" data-k="${k}">${G.SHAREICON || ""}${T("सेयर", "Share")}</button>
        <button type="button" data-act="qr" data-k="${k}"><span aria-hidden="true">▦</span>QR</button>
        <button type="button" data-act="follow" data-k="${k}"><span aria-hidden="true">＋</span>${T("पछ्याउनुहोस्", "Follow")}</button>
        <button type="button" data-act="details" data-k="${k}"><span aria-hidden="true">≡</span>${T("विवरण", "Details")}</button>
      </div>`;
  }
  function endCard(nAct) {
    return `<div class="fmain fend"><h2>${nAct ? T("सबै हेरिसक्नुभयो", "You're all caught up") : T("अहिले गतिमा कुनै चालु सूचना छैन", "No active alert in Gati right now")}</h2>
      <p>${T("यसको अर्थ खतरा छैन भन्ने होइन। आफ्नो क्षेत्रको आधिकारिक सूचना र मौसम हेरिरहनुहोस्।", "This is not an all clear and implies no absence of risk. Keep checking official notices and the weather for your area.")}</p>
      <p><a href="${R}alerts/">${T("सबै सूचनाको अभिलेख", "Archive of all alerts")}</a> · <a href="${R}?view=dashboard">${T("ड्यासबोर्ड", "Dashboard")}</a> · <a href="${R}patro/">${T("पात्रो", "Patro")}</a></p>
      <p class="fdisc">${T("आपत्कालमा १००, १०१, १०२ वा १२३४ मा फोन गर्नुहोस्।", "In an emergency call 100, 101, 102 or 1234.")}</p></div>`;
  }
  function openSheet(html, label) { sb.innerHTML = html; sheet.hidden = false; sheet.setAttribute("aria-label", label); document.getElementById("sheetx").focus(); }
  const closeSheet = () => { sheet.hidden = true; };
  document.getElementById("sheetx").onclick = closeSheet;
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  function shareSheet(a) {
    const i = a.info[G.lang] || a.info.ne; G.share({ url: url(a), title: i.headline, text: i.headline });
  }

  /* Follow: add the alert's districts to My watchlist (localStorage "gati-watch", same as /me/ watchlist). */
  const wget = () => { try { const w = JSON.parse(localStorage.getItem("gati-watch") || "{}"); return { d: w.d || [], r: w.r || [] }; } catch (e) { return { d: [], r: [] }; } };
  function followSheet(a) {
    if (!a.districts.length) { openSheet(`<h3>${T("जिल्ला पछ्याउनुहोस्", "Follow district")}</h3><p>${T("यो सूचना देशभरका लागि हो।", "This alert covers all of Nepal.")}</p>`, T("पछ्याउनुहोस्", "Follow")); return; }
    Promise.all(a.districts.map((c) => G.district.name(c).then((n) => [c, n]))).then((L) => { const w = wget();
      openSheet(`<h3>${T("जिल्ला पछ्याउनुहोस्", "Follow district")}</h3><p class="meta">${T("पछ्याएका जिल्ला मेरो सूची र सूचना पृष्ठमा देखिन्छन्। यही ब्राउजरमा मात्र।", "Followed districts show in My watchlist and on the notifications page. This browser only.")}</p><p><a href="${G.root}notifications/">🔔 ${T("सूचना र नोटिफिकेसन", "Alerts & notifications")}</a></p>
        <div class="fopts">${L.map(([c, n]) => `<button type="button" class="fopt" data-c="${esc(c)}" aria-pressed="${w.d.includes(c)}">📍 ${esc(n)}</button>`).join("")}</div><p><a href="${R}me/">${T("मेरो सूची", "My watchlist")} →</a></p>`, T("पछ्याउनुहोस्", "Follow"));
      sb.querySelectorAll(".fopt[data-c]").forEach((o) => (o.onclick = () => { const w = wget(), c = o.dataset.c; w.d = w.d.includes(c) ? w.d.filter((x) => x !== c) : w.d.concat(c); try { localStorage.setItem("gati-watch", JSON.stringify(w)); } catch (e) {} o.setAttribute("aria-pressed", w.d.includes(c)); }));
    });
  }
  function qrSheet(a) {
    openSheet(`<h3>QR · ${T("स्थायी लिङ्क", "Permalink")}</h3>${a.demo ? `<p>DEMO</p>` : `<img class="fqr" src="${R}stories/qr/${esc(a.identifier)}.svg" alt="QR" width="220" height="220">
      <p><a href="${esc(url(a))}">${esc(url(a))}</a></p><p><a href="${R}stories/img/${esc(a.identifier)}.png" download>${T("फिड तस्बिर (१०८०×१९२०)", "Feed image (1080×1920)")}</a></p>`}`, "QR");
  }
  function detailSheet(a) {
    const i = a.info[G.lang] || a.info.ne;
    const chain = (a.chain || []).map((c, k) => { const lab = `${G.num(k + 1)}. ${T(MT[c.msgType][0], MT[c.msgType][1])} · ${G.npt(c.sent)}`;
      return c.id === a.identifier ? `<li><strong>${lab}</strong></li>` : `<li><a href="${a.demo ? "#" : R + "alerts/" + esc(c.id) + "/"}">${lab}</a></li>`; }).join("");
    const corr = i.params["gati:correction"];
    openSheet(`<div class="chips">${G.sevChip(a.severity)}${G.trustChip(a.trust)}${a.state ? G.trustChip(a.state) : ""}${status(a)}</div>
      <h3>${esc(i.headline)}</h3>
      <p class="meta">🕒 ${T("स्रोतको समय", "Source time")}: ${G.npt(srcTime(a, i))} · ${T("म्याद", "Expires")}: ${G.npt(a.expires)}</p>
      ${corr ? `<div class="correction">✎ ${esc(corr)}</div>` : ""}
      <p>${esc(i.description)}</p>
      ${i.instruction ? `<div class="instr"><strong>${T("निर्देशन", "Instruction")}:</strong> ${esc(i.instruction)}</div>` : ""}
      ${chain ? `<h4>🔗 ${T("संस्करण", "Versions")}</h4><ol class="plist">${chain}</ol>` : ""}
      <p class="meta src">${T("स्रोत", "Source")}: <strong>${esc(agency(i))}</strong> · <a href="${esc(i.web)}" target="_blank" rel="noopener">${T("मूल सूचना", "Original notice")} ↗</a>
      ${a.demo ? "" : ` · <a href="${R}alerts/${esc(a.identifier)}/">${T("पूरा पृष्ठ", "Full page")}</a> · <a href="${R}cap/${esc(a.identifier)}.xml">CAP</a>`}</p>`, T("विवरण", "Details"));
  }
  feed.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = items[+t.dataset.k]; ({ share: shareSheet, qr: qrSheet, details: detailSheet, follow: followSheet })[t.dataset.act](a);
  });
  /* Lazy-load: each screen is an empty shell until it nears the viewport. */
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) fill(en.target); }), { root: feed, rootMargin: "100% 0px" });
  function fill(el) {
    if (el.dataset.done) return; el.dataset.done = "1"; io.unobserve(el);
    const k = +el.dataset.k; el.innerHTML = k < items.length ? card(items[k], k) : endCard(items.filter(isActive).length);
  }
  /* Compact view: a plain list grouped by day of source time (NPT), newest day first within active/older. Saved locally. */
  const VK = "gati-feed-view", vb = document.getElementById("fview");
  let compact = (() => { try { return localStorage.getItem(VK) === "list"; } catch (e) { return false; } })();
  vb.onclick = () => { compact = !compact; try { localStorage.setItem(VK, compact ? "list" : ""); } catch (e) {} draw(); };
  const dayKey = (t) => new Date(Date.parse(t) + 345 * 6e4).toISOString().slice(0, 10);
  const MN = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"], WN = ["आइत", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"];
  const dayLab = (k) => { const d = new Date(k + "T12:00:00Z"); if (G.lang === "ne") return `${WN[d.getUTCDay()]}, ${MN[d.getUTCMonth()]} ${G.num(String(d.getUTCDate()))}, ${G.num(String(d.getUTCFullYear()))}`;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };
  function row(a, k) { const i = a.info[G.lang] || a.info.ne, sev = G.SEV[a.severity] ? a.severity : "Unknown";
    return `<li class="frow${isActive(a) ? "" : " old"}" style="--sc:${G.SEVCOLOR[sev]}"><div class="ftags">${G.sevChip(sev)}${status(a)}${G.roadOngoingChip(a)}<span class="tag">${esc(T(...(HZN[a.hazard] || [i.event, i.event])))}</span></div>
      <a class="frh" href="${esc(url(a))}">${esc(i.headline)}</a>
      ${G.roadOngoingLine(a)}
      <p class="meta">🕒 ${G.npt(srcTime(a, i))} · <a href="${esc(i.web)}" target="_blank" rel="noopener">${esc(agency(i))} ↗</a> ${G.trustChip(a.trust)}</p>
      <p class="frb"><button type="button" class="fopt" data-act="share" data-k="${k}">${T("सेयर", "Share")}</button> <button type="button" class="fopt" data-act="follow" data-k="${k}">${T("जिल्ला पछ्याउनुहोस्", "Follow district")}</button> <button type="button" class="fopt" data-act="details" data-k="${k}">${T("विवरण", "Details")}</button></p></li>`; }
  function drawList() {
    feed.classList.add("flist"); let html = "", cur = "", sect = "";
    items.forEach((a, k) => { const s = isActive(a) ? "a" : "o", d = dayKey(srcTime(a, a.info.en || a.info.ne));
      if (s !== sect) { if (sect) html += "</ul>"; html += `<h3 class="fgrp">${s === "a" ? T("चालु सूचना", "Active alerts") : T("पछिल्ला ३० दिन (संग्रह)", "Last 30 days (archive)")}</h3><ul class="flistul">`; sect = s; cur = ""; }
      if (d !== cur) { html += `<li class="fday">${esc(dayLab(d))}</li>`; cur = d; }
      html += row(a, k); });
    feed.innerHTML = (html ? html + "</ul>" : "") + `<div class="fendl">${endCard(items.filter(isActive).length)}</div>`;
  }
  function draw() {
    vb.textContent = compact ? T("कार्ड", "Cards") : T("सूची", "List"); vb.title = compact ? T("कार्ड दृश्य", "Card view") : T("सूची दृश्य", "List view"); vb.setAttribute("aria-pressed", compact);
    dash.textContent = T("ड्यासबोर्ड", "Dashboard");
    if (compact) return drawList();
    feed.classList.remove("flist");
    const pos = feed.scrollTop;
    feed.innerHTML = [...items, null].map((a, k) => `<section class="fcard${a && !isActive(a) ? " old" : ""}${a ? "" : " fendc"}" data-k="${k}" style="--sc:${a ? G.SEVCOLOR[a.severity] || G.SEVCOLOR.Unknown : "#0F7C86"}"
      aria-label="${G.num(k + 1)} / ${G.num(items.length + 1)}"></section>`).join("");
    feed.querySelectorAll(".fcard").forEach((s) => io.observe(s));
    feed.scrollTop = pos;
    dash.textContent = T("ड्यासबोर्ड", "Dashboard");
  }
  const go = (d) => feed.scrollBy({ top: d * feed.clientHeight, behavior: "smooth" });
  addEventListener("keydown", (e) => {
    if (!sheet.hidden) { if (e.key === "Escape") closeSheet(); return; }
    if (compact) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); go(-1); }
  });
  /* Mouse wheel on desktop: one card per gesture. */
  let lock = 0;
  feed.addEventListener("wheel", (e) => { if (compact || Math.abs(e.deltaY) < 4) return; e.preventDefault(); const n = Date.now(); if (n - lock < 600) return; lock = n; go(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  const dp = document.getElementById("fdist");
  const dpDraw = () => { const c = G.district.get(); (c ? G.district.name(c) : Promise.resolve("")).then((n) => (dp.innerHTML = `📍 <b>${n ? esc(n) : T("मेरो जिल्ला", "My district")}</b> ▾`)); };
  dp.onclick = () => G.district.open(() => location.reload());
  dpDraw(); G.onLang(dpDraw);
  G.json("data/alerts.json").then((d) => {
    by = Object.fromEntries(d.alerts.map((a) => [a.identifier, a]));
    G.alertById = by;
    const cut = Date.now() - 30 * 864e5;
    const act = d.alerts.filter(isActive).sort((x, y) => SR[x.severity] - SR[y.severity] || (y.sent > x.sent ? 1 : -1));
    const old = d.alerts.filter((a) => !isActive(a) && Date.parse(a.sent) >= cut).sort((x, y) => (y.sent > x.sent ? 1 : -1));
    const my = G.district ? G.district.get() : "";
    const mine = (a) => my && a.districts.includes(my);
    ALL = act.filter(mine).concat(act.filter((a) => !mine(a)), old.filter(mine), old.filter((a) => !mine(a))); apply();
  }).catch(() => { ALL = []; apply(); });
  /* Filters: category (hazard), severity, agency, only active, my district only. Saved in this browser; URL ?hz=&sev=&ag=&act=1&mine=1 also works. */
  const FK = "gati-feed-filter";
  let ALL = [], F = (() => { try { return JSON.parse(localStorage.getItem(FK) || "{}"); } catch (e) { return {}; } })();
  (() => { const q = new URLSearchParams(location.search); ["hz", "sev", "ag"].forEach((k) => { if (q.get(k)) F[k] = q.get(k).split(","); }); ["act", "mine"].forEach((k) => { if (q.get(k)) F[k] = q.get(k) === "1"; }); })();
  const agk = (a) => { const n = agency(a.info.en || a.info.ne); if (/^BIPAD/.test(n)) return "BIPAD"; const m = n.match(/\(([A-Z]{2,})\)/); return m ? m[1] : n.replace(/ Headquarters$/, ""); };
  const fsave = () => { try { localStorage.setItem(FK, JSON.stringify(F)); } catch (e) {} };
  const nF = () => (F.hz || []).length + (F.sev || []).length + (F.ag || []).length + (F.act ? 1 : 0) + (F.mine ? 1 : 0);
  const pass = (a) => { const my = G.district ? G.district.get() : "";
    return (!(F.hz || []).length || F.hz.includes(a.hazard || "other")) && (!(F.sev || []).length || F.sev.includes(G.SEV[a.severity] ? a.severity : "Unknown"))
      && (!(F.ag || []).length || F.ag.includes(agk(a))) && (!F.act || isActive(a)) && (!F.mine || (my && (a.districts.includes(my) || !a.districts.length))); };
  const fb = document.getElementById("ffilt"), chips = document.getElementById("fchips");
  function apply() { items = ALL.filter(pass); draw(); fdraw(); }
  function fdraw() { const n = nF();
    fb.innerHTML = `<span aria-hidden="true">⚲</span> ${T("छान्नुहोस्", "Filter")}${n ? ` <b class="fcount">${G.num(String(n))}</b>` : ""}`;
    fb.setAttribute("aria-label", T("फिड छान्नुहोस्", "Filter the feed") + (n ? ` (${n})` : ""));
    chips.innerHTML = n ? `<span>${G.num(String(items.length))} / ${G.num(String(ALL.length))} ${T("सूचना", "alerts")}</span> <button type="button" class="fclr" id="fclr">${T("सबै देखाउनुहोस्", "Show all")} ✕</button>` : "";
    chips.hidden = !n; const c = document.getElementById("fclr"); if (c) c.onclick = () => { F = {}; fsave(); apply(); }; }
  const chip = (grp, v, lab) => `<button type="button" class="fopt" data-g="${grp}" data-v="${esc(v)}" aria-pressed="${(F[grp] || []).includes(v)}">${lab}</button>`;
  fb.onclick = () => {
    const hz = [...new Set(ALL.map((a) => a.hazard || "other"))], ags = [...new Set(ALL.map(agk))].sort();
    openSheet(`<h3>${T("फिड छान्नुहोस्", "Filter the feed")}</h3>
      <h4>${T("प्रकार", "Category")}</h4><div class="fopts">${hz.map((h) => chip("hz", h, esc(T(...(HZN[h] || ["अन्य", "Other"]))))).join("")}</div>
      <h4>${T("गम्भीरता", "Severity")}</h4><div class="fopts">${Object.keys(SR).map((s) => chip("sev", s, G.sevChip(s))).join("")}</div>
      <h4>${T("स्रोत निकाय", "Source agency")}</h4><div class="fopts">${ags.map((g) => chip("ag", g, esc(g))).join("")}</div>
      <div class="fopts"><label class="ftog"><input type="checkbox" id="fact"${F.act ? " checked" : ""}> ${T("चालु मात्र", "Only active")}</label>
      <label class="ftog"><input type="checkbox" id="fmine"${F.mine ? " checked" : ""}> ${T("मेरो जिल्ला मात्र", "My district only")}</label></div>
      <p class="meta">${T("छनोट यही ब्राउजरमा मात्र सुरक्षित हुन्छ। म्याद सकिएका सूचना हटाइँदैनन्, संग्रहमा रहन्छन्।", "Choices are saved in this browser only. Expired alerts are never removed; they stay in the archive.")}</p>
      <p><button type="button" class="btn" id="fdone">${T("देखाउनुहोस्", "Show")}</button> <button type="button" class="stbtn" id="freset">${T("सबै हटाउनुहोस्", "Clear all")}</button></p>`, T("छान्नुहोस्", "Filter"));
    sb.querySelectorAll(".fopt").forEach((o) => (o.onclick = () => { const g = o.dataset.g, v = o.dataset.v, L = F[g] || []; F[g] = L.includes(v) ? L.filter((x) => x !== v) : L.concat(v); o.setAttribute("aria-pressed", F[g].includes(v)); fsave(); apply(); }));
    sb.querySelector("#fact").onchange = (e) => { F.act = e.target.checked; fsave(); apply(); };
    sb.querySelector("#fmine").onchange = (e) => { if (e.target.checked && !G.district.get()) { e.target.checked = false; closeSheet(); G.district.open(() => { F.mine = true; fsave(); location.reload(); }); return; } F.mine = e.target.checked; fsave(); apply(); };
    sb.querySelector("#fdone").onclick = closeSheet;
    sb.querySelector("#freset").onclick = () => { F = {}; fsave(); apply(); closeSheet(); };
  };
  G.onLang(fdraw); fdraw();
  G.onLang(draw);
  draw();
})();
