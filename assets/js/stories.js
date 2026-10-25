/* /feed/ (canonical; /stories/ redirects here): "सूचना फिड · Feed". Vertical swipe-up feed, one alert per screen, CSS scroll-snap.
   Active alerts first, then alerts sent in the last 30 days marked expired/superseded, then an "all caught up" card.
   Everything comes from data/alerts.json (the CAP messages). Nothing is invented. */
(function () {
  const G = window.Gati, b = G.b, esc = G.esc, R = G.root, SITE = "https://nirajbhusal.github.io/gati-alerts/";
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
        <div class="fhero">${art(a)}<div class="ftags">${G.sevChip(sev)}${status(a)}${G.district && G.district.get() && a.districts.includes(G.district.get()) ? `<span class="tag fmine">📍 ${T("मेरो जिल्ला", "My district")}</span>` : ""}<span class="tag">${esc(T(...(HZN[a.hazard] || [i.event, i.event])))}</span></div></div>
        <h2>${esc(i.headline)}</h2>
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
    const a = items[+t.dataset.k]; ({ share: shareSheet, qr: qrSheet, details: detailSheet })[t.dataset.act](a);
  });
  /* Lazy-load: each screen is an empty shell until it nears the viewport. */
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) fill(en.target); }), { root: feed, rootMargin: "100% 0px" });
  function fill(el) {
    if (el.dataset.done) return; el.dataset.done = "1"; io.unobserve(el);
    const k = +el.dataset.k; el.innerHTML = k < items.length ? card(items[k], k) : endCard(items.filter(isActive).length);
  }
  function draw() {
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
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); go(-1); }
  });
  /* Mouse wheel on desktop: one card per gesture. */
  let lock = 0;
  feed.addEventListener("wheel", (e) => { if (Math.abs(e.deltaY) < 4) return; e.preventDefault(); const n = Date.now(); if (n - lock < 600) return; lock = n; go(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  const dp = document.getElementById("fdist");
  const dpDraw = () => { const c = G.district.get(); (c ? G.district.name(c) : Promise.resolve("")).then((n) => (dp.innerHTML = `📍 <b>${n ? esc(n) : T("मेरो जिल्ला", "My district")}</b> ▾`)); };
  dp.onclick = () => G.district.open(() => location.reload());
  dpDraw(); G.onLang(dpDraw);
  G.json("data/alerts.json").then((d) => {
    by = Object.fromEntries(d.alerts.map((a) => [a.identifier, a]));
    const cut = Date.now() - 30 * 864e5;
    const act = d.alerts.filter(isActive).sort((x, y) => SR[x.severity] - SR[y.severity] || (y.sent > x.sent ? 1 : -1));
    const old = d.alerts.filter((a) => !isActive(a) && Date.parse(a.sent) >= cut).sort((x, y) => (y.sent > x.sent ? 1 : -1));
    const my = G.district ? G.district.get() : "";
    const mine = (a) => my && a.districts.includes(my);
    items = act.filter(mine).concat(act.filter((a) => !mine(a)), old.filter(mine), old.filter((a) => !mine(a))); draw();
  }).catch(() => { items = []; draw(); });
  G.onLang(draw);
  draw();
})();
