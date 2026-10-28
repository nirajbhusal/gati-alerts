/* Ask pop-up: floating chat button + panel. Answers come only from Gati's own published data (no LLM).
   Every answer cites identifier, agency, source link and trust label. Hidden on /stories/; /ask/ shows the panel full-page. */
(function () {
  const G = window.Gati; if (!G) return;
  const PAGE = document.body.dataset.page, R = G.root, esc = G.esc, T = (ne, en) => (G.lang === "ne" ? ne : en);
  if (PAGE === "stories" || PAGE === "feed") return;
  const FULL = PAGE === "ask";
  const ICON = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>`;
  const INT = [
    ["district", "के मेरो जिल्ला प्रभावित छ?", "Is my district affected?", /district|जिल्ला|affect|प्रभावित|my area|near|नजिक/i],
    ["road", "सडकको अवस्था", "Road status", /road|सडक|बाटो|highway|route|राजमार्ग|blocked|अवरुद्ध/i],
    ["river", "नदीको सतह", "River levels", /river|नदी|खोला|flood|बाढी|gauge|water level|सतह/i],
    ["weather", "मौसम", "Weather", /weather|मौसम|rain|वर्षा|पानी पर्|forecast|पूर्वानुमान|snow|हिमपात/i],
    ["numbers", "आपतकालीन नम्बर", "Emergency numbers", /number|नम्बर|call|फोन|helpline|हेल्पलाइन|police|प्रहरी|ambulance|एम्बुलेन्स|fire|दमकल|emergency|आपतकाल/i],
    ["holiday", "आउँदा बिदा", "Upcoming holidays", /holiday|बिदा|छुट्टी|festival|चाड|पर्व|patro|पात्रो|calendar/i],
  ];
  const cache = {}; const J = (p) => (cache[p] = cache[p] || G.json(p).catch(() => null));
  const link = (u, n) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`;
  const cite = (a) => { const i = a.info[G.lang] || a.info.en; return `<div class="aqcite">${G.trustChip(a.trust)}<span>${esc((i.senderName || "").split(" — ")[0])}</span>${link(i.web, T("स्रोत", "Source"))}<code>${esc(a.identifier)}</code></div>`; };
  const live = (a) => Date.parse(a.expires) > Date.now() && !a.supersededBy && (a.info.en.params || {})["gati:demo"] !== "true";
  async function answer(k) {
    const al = await J("data/alerts.json"), A = al ? al.alerts : [];
    if (k === "district") {
      const my = G.district && G.district.get();
      if (!my) return `<p>${T("पहिले \"मेरो जिल्ला\" छान्नुहोस्, वा नजिकका सूचना हेर्नुहोस्।", "Choose \"My district\" first, or check what is near you.")}</p><div class="aqacts"><button type="button" class="aqbtn" data-do="pick">📍 ${T("जिल्ला छान्नुहोस्", "Choose district")}</button><a class="aqbtn" href="${R}#nearbyslot">${T("के म प्रभावित छु?", "Am I affected?")}</a></div>`;
      const n = await G.district.name(my), L = A.filter(live), mine = L.filter((a) => a.districts.includes(my)), nat = L.filter((a) => !a.districts.length && !a.areas.some((x) => x.circles.length));
      return `<p><b>📍 ${esc(n)}</b>: ${mine.length ? T(`${G.num(mine.length)} चालु सूचना यो जिल्लामा।`, `${mine.length} active alert(s) name this district.`) : T("यो जिल्लाको नाम लिएको चालु सूचना गतिमा छैन। यसको अर्थ खतरा छैन भन्ने होइन।", "No active alert in Gati names this district. That does not mean there is no risk.")}</p>` +
        mine.concat(nat).slice(0, 4).map((a) => `<div class="aqitem">${G.sevChip(a.severity)} <a href="${R}alerts/${esc(a.identifier)}/">${esc(a.info[G.lang].headline)}</a>${a.districts.length ? "" : ` <span class="meta">(${T("देशभर", "nationwide")})</span>`}${cite(a)}</div>`).join("") +
        `<div class="aqacts"><button type="button" class="aqbtn" data-do="pick">${T("जिल्ला बदल्नुहोस्", "Change district")}</button></div>`;
    }
    if (k === "road") {
      const r = await J("data/roads.json"); if (!r) return na();
      const S = { open: ["खुला", "Open"], blocked: ["अवरुद्ध", "Blocked"], oneway: ["एकतर्फी", "One-way"], none: ["पुष्टि छैन", "Not confirmed"] };
      const c = {}; r.routes.forEach((x) => (c[x.status] = (c[x.status] || 0) + 1));
      const bad = r.routes.filter((x) => x.status !== "open");
      return `<p>${Object.entries(c).map(([s, n]) => `<b>${G.num(n)}</b> ${T(...(S[s] || S.none))}`).join(" · ")} <span class="meta">(${T("मुख्य करिडोर", "main corridors")})</span></p>` +
        bad.map((x) => `<div class="aqitem"><span class="tag rs-${esc(x.status)}">${T(...(S[x.status] || S.none))}</span> ${esc(T(x.name_ne, x.name_en))}</div>`).join("") +
        `<div class="aqcite">${Object.values(r.sources).map((s) => link(s.u, T(s.ne, s.en))).join(" ")}<span class="meta">${esc(T(r.as_of_ne, r.as_of_en))}</span></div><div class="aqacts"><a class="aqbtn" href="${R}roads/">${T("सडक पृष्ठ", "Roads page")}</a><a class="aqbtn" href="${R}route/">${T("मार्ग जाँच", "Route check")}</a></div>`;
    }
    if (k === "river") {
      const v = await J("data/rivers.json"); if (!v) return na();
      const g = v.gauges.slice().sort((a, b) => b.level / b.warning - a.level / a.warning).slice(0, 5);
      return `<p>${T("चेतावनी तहको नजिक रहेका केन्द्र:", "Gauges closest to their warning level:")}</p>` + g.map((x) => { const st = x.level >= x.danger ? ["खतरा", "Danger", "sev-Extreme"] : x.level >= x.warning ? ["चेतावनी", "Warning", "sev-Severe"] : ["सामान्य", "Normal", ""];
        return `<div class="aqitem aqrow"><span>💧 ${esc(T(x.ne, x.en))}</span><span class="meta">${G.num(x.level)} / ${G.num(x.warning)} ${T("मि.", "m")}</span>${st[2] ? `<span class="tag ${st[2]}">${T(st[0], st[1])}</span>` : `<span class="meta">${T(st[0], st[1])}</span>`}</div>`; }).join("") +
        `<div class="aqcite"><span class="trust t-Official">${T("आधिकारिक", "Official")}</span>${link(v.url, T(v.source_ne, v.source_en))}<span class="meta">${esc(T(v.as_of_ne, v.as_of_en))}</span></div><div class="aqacts"><a class="aqbtn" href="${R}rivers/">${T("नदी पृष्ठ", "Rivers page")}</a></div>`;
    }
    if (k === "weather") {
      const w = A.filter((a) => a.hazard === "weather").sort((a, b) => b.sent.localeCompare(a.sent))[0]; if (!w) return na();
      return `<div class="aqitem"><b>${esc(w.info[G.lang].headline)}</b>${live(w) ? "" : ` <span class="tag exp">${T("म्याद सकियो", "Expired")}</span>`}<p>${esc((w.info[G.lang].description || "").slice(0, 280))}…</p>${cite(w)}</div><div class="aqacts"><a class="aqbtn" href="${R}weather/">${T("मौसम पृष्ठ", "Weather page")}</a></div>`;
    }
    if (k === "numbers") {
      const c = await J("data/contacts.json"); if (!c) return na();
      return `<div class="aqnums">${c.national.slice(0, 6).map((x) => `<a class="aqcall" href="tel:${x.num}"><b>${G.num(x.num)}</b><span>${esc(T(x.ne, x.en))}</span></a>`).join("")}</div>
        <div class="aqcite"><span class="trust t-Official">${T("आधिकारिक", "Official")}</span>${link(c.national[0].src, "NTA")}${link(c.national[3].src, "NDRRMA (1234)")}</div><div class="aqacts"><a class="aqbtn" href="${R}contacts/">${T("सबै नम्बर", "All numbers")}</a></div>`;
    }
    if (k === "holiday") {
      const c = await J("data/calendar.json"); if (!c) return na();
      const today = new Date(Date.now() + 5.75 * 36e5).toISOString().slice(0, 10);
      const L = c.entries.filter((e) => e.type === "holiday" && e.date_ad >= today).sort((a, b) => a.date_ad.localeCompare(b.date_ad)).slice(0, 5);
      if (!L.length) return `<p>${T("आउँदा बिदा गतिको पात्रोमा छैनन्।", "No upcoming holidays in Gati's Patro.")}</p>`;
      return L.map((e) => `<div class="aqitem aqrow"><span>🗓 ${esc(T(e.title_ne, e.title_en))}</span><span class="meta">${G.npt ? G.npt(e.date_ad + "T00:00:00+05:45").split(" · ")[0] : e.date_ad}</span></div>`).join("") +
        `<div class="aqcite">${G.trustChip(L[0].trust)}<span>${esc(L[0].source)}</span>${link(L[0].sourceUrl, T("स्रोत", "Source"))}</div><div class="aqacts"><a class="aqbtn" href="${R}patro/">${T("पात्रो", "Patro")}</a></div>`;
    }
    return "";
  }
  const na = () => `<p class="meta">${T("उपलब्ध छैन।", "Not available.")}</p>`;
  const soon = () => `<p>${T("यो प्रश्नको उत्तर अहिले दिन सकिँदैन। पूर्ण \"गतिलाई सोध्नुहोस्\" छिट्टै आउँदैछ। तलका विषय छान्नुहोस्:", "I can't answer that yet. Full Ask Gati is coming soon. Try one of these topics:")}</p>`;

  let panel, log, btn, lastFocus, tab = "ask" /* fixed: overlay is chat only */;
  const TABS = [["ask", "💬", "सोध्नुहोस्", "Ask"], ["wx", "⛅", "मौसम र हावा", "Weather & air"], ["call", "☎", "सम्पर्क", "Contacts"], ["mine", "📍", "मेरो जिल्ला", "My district"]];
  function setTab(k) { tab = k; render(); }
  async function pane() {
    const el = panel.querySelector(".aqpane"); el.setAttribute("aria-labelledby", "aqt-" + tab); el.innerHTML = `<p class="meta">…</p>`;
    if (tab === "call") { el.innerHTML = await answer("numbers"); return; }
    if (tab === "mine") {
      let w = { d: [], r: [] }; try { w = Object.assign(w, JSON.parse(localStorage.getItem("gati-watch") || "{}")); } catch (e) {}
      el.innerHTML = `<div class="aqmsg bot" style="width:100%">${await answer("district")}</div><div class="aqwatch"><b>⭐ ${T("मेरो निगरानी सूची", "My watchlist")}</b><span>${G.num(String((w.d || []).length))} ${T("जिल्ला", "districts")} · ${G.num(String((w.r || []).length))} ${T("नदी", "rivers")}</span><a class="aqbtn" href="${R}#watch">${T("खोल्नुहोस्", "Open")}</a></div>`;
      el.querySelectorAll("[data-do=pick]").forEach((b) => (b.onclick = () => G.district && G.district.open(() => pane())));
      return;
    }
    if (tab === "wx") {
      const dhm = await answer("weather");
      el.innerHTML = `<p class="aqsec">🏛 ${T("DHM (आधिकारिक स्रोत पहिले)", "DHM (official source first)")}</p>${dhm}<p class="aqsec">🧮 ${T("मोडेल: Open-Meteo", "Model: Open-Meteo")}</p><div id="aqwxm"><p class="meta">…</p></div>`;
      const q = "latitude=27.7172&longitude=85.324&timezone=Asia%2FKathmandu";
      const [f, a] = await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,weather_code`).then((r) => r.json()).catch(() => null), fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi,pm2_5`).then((r) => r.json()).catch(() => null)]);
      const m = el.querySelector("#aqwxm"); if (!m) return;
      if (!f && !a) { m.innerHTML = `<p class="meta">${T("उपलब्ध छैन।", "Not available.")}</p>`; return; }
      const v = a ? a.current.us_aqi : null, col = v == null ? "#999" : v <= 50 ? "#00a651" : v <= 100 ? "#d4b000" : v <= 150 ? "#f7941d" : v <= 200 ? "#e2231a" : "#8f3f97";
      m.innerHTML = `<div class="aqtiles">${f ? `<div class="aqtile"><b>${G.num(String(Math.round(f.current.temperature_2m)))}°C</b><span>${T("काठमाडौँ अहिले", "Kathmandu now")}</span></div>` : ""}${a ? `<div class="aqtile" style="--c:${col}"><b style="color:${col}">${G.num(String(v))}</b><span>US AQI · PM2.5 ${G.num(String(a.current.pm2_5))}</span></div>` : ""}</div>
        <div class="aqcite"><span class="trust t-Model">🧮 ${T("मोडेल", "Model")}</span><a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo ↗</a><span>${f ? G.npt(f.current.time + ":00+05:45") : ""}</span></div><div class="aqacts"><a class="aqbtn" href="${R}weather/">${T("मौसम र हावा पृष्ठ", "Weather and air page")}</a></div>`;
    }
  }
  function chips() { return INT.map(([k, ne, en]) => `<button type="button" class="aqchip" data-k="${k}">${T(ne, en)}</button>`).join(""); }
  function build(host) {
    panel = document.createElement("div");
    panel.className = "aqpanel" + (FULL ? " full" : ""); panel.id = "askpanel";
    if (!FULL) { panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.hidden = true; }
    panel.setAttribute("aria-labelledby", "aqtitle");
    host.appendChild(panel); render();
  }
  function render() {
    const keep = log && log.querySelector(".aqmsg:not(.aqhello)") ? log.innerHTML : "";
    panel.innerHTML = `<div class="aqhead"><img src="${R}assets/img/brand/mark-192.png" alt="" width="36" height="36"><div><h2 id="aqtitle">${T("गतिलाई सोध्नुहोस्", "Ask Gati")}</h2><small>${T("गतिकै तथ्याङ्कबाट उत्तर, स्रोतसहित", "Answers from Gati's own data, with sources")}</small></div>${FULL ? "" : `<button type="button" class="aqx" aria-label="${T("बन्द गर्नुहोस्", "Close")}">✕</button>`}</div>
      <!-- Item 11: no tab row; the floating button opens straight into chat -->
      <div class="aqpane" id="aqp-x" role="tabpanel" ${tab === "ask" ? "hidden" : ""}></div>
      <div class="aqbody" id="aqp-ask" role="tabpanel" ${tab === "ask" ? "" : "hidden"}><p class="aqdisc"><a class="relaylink" href="${R}about/">${T("गतिले आधिकारिक स्रोत मात्र प्रसारण गर्छ", "Gati relays official sources")}</a></p>
      <div class="aqhelp"><a href="tel:100" class="aqcall sm"><b>${G.num("100")}</b><span>${T("प्रहरी", "Police")}</span></a><a href="tel:1234" class="aqcall sm red"><b>${G.num("1234")}</b><span>${T("विपद् (NDRRMA)", "Disaster (NDRRMA)")}</span></a></div>
      <div class="aqlog" aria-live="polite">${keep || `<div class="aqmsg bot aqhello">${T("हजुर के जान्न चाहनुहुन्छ?", "What would you like to know?")}</div>`}</div>
      <div class="aqchips" role="group" aria-label="${T("छिटो प्रश्न", "Quick questions")}">${chips()}</div></div>
      <form class="aqform" ${tab === "ask" ? "" : "hidden"}><label class="sr-only" for="aqin">${T("प्रश्न लेख्नुहोस्", "Type a question")}</label><input id="aqin" type="text" autocomplete="off" placeholder="${T("जस्तै: सडक, नदी, बिदा…", "e.g. road, river, holiday…")}"><button type="submit" aria-label="${T("पठाउनुहोस्", "Send")}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>`;
    log = panel.querySelector(".aqlog");
    panel.querySelectorAll(".aqchip").forEach((c) => (c.onclick = () => ask(c.dataset.k, c.textContent, true)));
    panel.querySelector(".aqform").onsubmit = (e) => { e.preventDefault(); const i = panel.querySelector("#aqin"), q = i.value.trim(); if (!q) return; i.value = ""; const m = INT.find((x) => x[3].test(q)); ask(m ? m[0] : null, q); };
    const x = panel.querySelector(".aqx"); if (x) x.onclick = close;
    panel.querySelectorAll(".aqtabs [role=tab]").forEach((b, n, all) => { b.onclick = () => setTab(b.dataset.t);
      b.onkeydown = (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const j = (n + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length; setTab(all[j].dataset.t); panel.querySelector(`#aqt-${all[j].dataset.t}`).focus(); } }; });
    if (tab !== "ask") pane();
    log.onclick = (e) => { const b = e.target.closest("[data-do=pick]"); if (b && G.district) G.district.open(() => ask("district", T("के मेरो जिल्ला प्रभावित छ?", "Is my district affected?"))); };
  }
  /* Ask Gati with Claude, through Gati's Cloudflare Worker (data/ask-config.json "worker"). The key lives only in the Worker.
     Any failure (not configured, offline, rate limited, timeout) returns null and the local answers above are used. */
  async function claude(q) {
    const cf = await J("data/ask-config.json"); if (!cf || !cf.worker) return null;
    try {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 20000);
      const r = await fetch(cf.worker, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q, lang: G.lang }), signal: ac.signal }); clearTimeout(to);
      if (!r.ok) return null; const j = await r.json(); if (!j || typeof j.answer !== "string") return null;
      const cards = (j.citations || []).map((c) => `<div class="aqcard">${G.trustChip(c.trust || "Official")}<b>${esc(G.lang === "ne" && c.title_ne ? c.title_ne : c.title)}</b><span class="meta">${esc(c.agency || "")}${c.time ? " · " + G.npt(c.time) : ""}</span>${c.url ? link(c.url, T("स्रोत", "Source")) : ""}</div>`).join("");
      return `<p class="aqai">${esc(G.num(j.answer))}</p>${cards ? `<div class="aqcards">${cards}</div>` : `<p class="meta">${T("आधिकारिक स्रोत भेटिएन।", "No official source cited.")}</p>`}<p class="meta aqaim">${T("Claude ले गतिको आधिकारिक सूचनाबाट मात्र तयार गरेको उत्तर; स्रोत हेर्नुहोस्।", "Written by Claude from Gati's official items only; check the sources.")}</p>`;
    } catch (e) { return null; }
  }
  async function ask(k, q, chip) {
    log.insertAdjacentHTML("beforeend", `<div class="aqmsg me">${esc(q)}</div><div class="aqmsg bot aqwait">…</div>`);
    const w = log.lastElementChild; log.scrollTop = log.scrollHeight;
    const ai = !chip ? await claude(q) : null;
    w.innerHTML = ai || (k ? await answer(k) : soon()); w.classList.remove("aqwait");
    w.scrollIntoView({ block: "nearest" });
  }
  function open() { lastFocus = document.activeElement; panel.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.hidden = true; document.body.classList.add("aq-open"); setTimeout(() => panel.querySelector("#aqin").focus(), 30); }
  function close() { panel.hidden = true; btn.hidden = false; btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("aq-open"); (lastFocus && lastFocus.focus ? lastFocus : btn).focus(); }
  function init() {
    if (FULL) { const host = document.getElementById("askfull") || document.getElementById("main"); build(host); G.onLang(render); return; }
    btn = document.createElement("button"); btn.type = "button"; btn.className = "aqfab"; btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-controls", "askpanel"); btn.setAttribute("aria-expanded", "false");
    const lab = () => btn.setAttribute("aria-label", T("गतिलाई सोध्नुहोस्", "Ask Gati")); btn.innerHTML = ICON; lab();
    document.body.appendChild(btn); build(document.body);
    btn.onclick = open;
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = [...panel.querySelectorAll("a[href],button:not([disabled]),input")].filter((x) => x.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    G.onLang(() => { lab(); render(); });
  }
  if (!G.district) { const d = document.createElement("script"); d.src = R + "assets/js/district.js"; document.body.appendChild(d); }
  init();
})();
