/* /stories/ (alias /feed/): "सूचना फिड · Feed". Vertical swipe-up feed, one alert per screen, CSS scroll-snap.
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
  function card(a, k) {
    const i = a.info[G.lang] || a.info.ne, sev = G.SEV[a.severity] ? a.severity : "Unknown", act = isActive(a);
    const areas = a.areas.map((x) => x[G.lang] || x.en).filter(Boolean).join(" · ");
    return `<div class="fbg"></div>
      <div class="fmain">
        <div class="ftags">${G.sevChip(sev)}${status(a)}<span class="tag">${esc(i.event)}</span></div>
        <h2>${esc(i.headline)}</h2>
        ${i.instruction ? `<p class="fins"><strong>${act ? T("के गर्ने", "What to do") : T("त्यति बेलाको निर्देशन", "Instruction at the time")}:</strong> ${esc(i.instruction)}</p>` : ""}
      </div>
      <div class="flow" style="--sc:${G.SEVCOLOR[sev]}">
        <div class="fsev">${G.sevChip(sev)} ${G.trustChip(a.trust)}${a.state ? G.trustChip(a.state) : ""}</div>
        ${areas ? `<p>📍 ${esc(areas)}</p>` : ""}
        <p>🕒 ${T("स्रोतको समय", "Source time")}: ${G.npt(srcTime(a, i))} · ${esc(agency(i))}</p>
        <p class="fdisc">${T("गतिले आधिकारिक चेतावनी जारी गर्दैन; मूल स्रोत हेर्नुहोस्।", "Relayed by Gati, not an official warning. Check the original source.")}</p>
      </div>
      <div class="rail">
        <button type="button" data-act="share" data-k="${k}"><span aria-hidden="true">↗</span>${T("सेयर", "Share")}</button>
        <a href="${esc(i.web)}" target="_blank" rel="noopener"><span aria-hidden="true">🏛</span>${T("स्रोत", "Source")}</a>
        <button type="button" data-act="qr" data-k="${k}"><span aria-hidden="true">▦</span>QR</button>
        <button type="button" data-act="details" data-k="${k}"><span aria-hidden="true">≡</span>${T("विवरण", "Details")}</button>
      </div>`;
  }
  function endCard(nAct) {
    return `<div class="fmain fend"><h2>${nAct ? T("सबै हेरिसक्नुभयो", "You're all caught up") : T("अहिले गतिमा कुनै चालु सूचना छैन", "No active alert in Gati right now")}</h2>
      <p>${T("यसको अर्थ खतरा छैन भन्ने होइन। आफ्नो क्षेत्रको आधिकारिक सूचना र मौसम हेरिरहनुहोस्।", "This is not an all clear and implies no absence of risk. Keep checking official notices and the weather for your area.")}</p>
      <p><a href="${R}alerts/">${T("सबै सूचनाको अभिलेख", "Archive of all alerts")}</a> · <a href="${R}?view=dashboard">${T("ड्यासबोर्ड", "Dashboard")}</a> · <a href="${R}patro/">${T("पात्रो", "Patro")}</a></p>
      <p class="fdisc">${T("आपत्कालमा १००, १०१, १०२ वा ११४९ मा फोन गर्नुहोस्।", "In an emergency call 100, 101, 102 or 1149.")}</p></div>`;
  }
  function openSheet(html, label) { sb.innerHTML = html; sheet.hidden = false; sheet.setAttribute("aria-label", label); document.getElementById("sheetx").focus(); }
  const closeSheet = () => { sheet.hidden = true; };
  document.getElementById("sheetx").onclick = closeSheet;
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  function shareSheet(a) {
    const i = a.info[G.lang] || a.info.ne, u = encodeURIComponent(url(a)), tx = encodeURIComponent(i.params["gati:summary160"] || i.headline);
    const L = [["Viber", `viber://forward?text=${tx}%20${u}`], ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`], ["X", `https://x.com/intent/post?text=${tx}&url=${u}`],
      ["WhatsApp", `https://wa.me/?text=${tx}%20${u}`], ["Telegram", `https://t.me/share/url?url=${u}&text=${tx}`]];
    openSheet(`<h3>${T("सेयर गर्नुहोस्", "Share")}</h3><div class="share">${L.map(([n, h]) => `<a class="sbtn" href="${h}" target="_blank" rel="noopener">${n}</a>`).join("")}
      <button class="sbtn" type="button" id="fcopy">${T("लिङ्क कपी गर्नुहोस्", "Copy link")}</button>${navigator.share ? `<button class="sbtn" type="button" id="fnative">${T("अन्य", "More")}</button>` : ""}</div>
      <p class="meta">${T("सेयर गर्दा मूल स्रोत पनि उल्लेख गर्नुहोस्। गतिले सूचना जारी गर्दैन, फैलाउने मात्र गर्छ।", "When sharing, mention the original source. Gati relays notices; it does not issue them.")}</p>`, "Share");
    document.getElementById("fcopy").onclick = (e) => navigator.clipboard && navigator.clipboard.writeText(url(a)).then(() => (e.target.textContent = T("कपी भयो", "Copied")));
    const n = document.getElementById("fnative"); if (n) n.onclick = () => navigator.share({ title: i.headline, url: url(a) }).catch(() => {});
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
  G.json("data/alerts.json").then((d) => {
    by = Object.fromEntries(d.alerts.map((a) => [a.identifier, a]));
    const cut = Date.now() - 30 * 864e5;
    const act = d.alerts.filter(isActive).sort((x, y) => SR[x.severity] - SR[y.severity] || (y.sent > x.sent ? 1 : -1));
    const old = d.alerts.filter((a) => !isActive(a) && Date.parse(a.sent) >= cut).sort((x, y) => (y.sent > x.sent ? 1 : -1));
    items = act.concat(old); draw();
  }).catch(() => { items = []; draw(); });
  G.onLang(draw);
  draw();
})();
