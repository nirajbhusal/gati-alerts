/* Gati shared shell: header, nav, disclaimer, footer, language toggle, helpers. */
(function () {
  const ROOT = document.body.dataset.root || "./";
  const PAGE = document.body.dataset.page;
  const saved = localStorage.getItem("gati-lang");
  const G = (window.Gati = { root: ROOT, lang: saved === "ne" ? "ne" : "en", /* English is the default for first-time visitors; a saved choice wins */ listeners: [] });
  document.documentElement.lang = G.lang;
  /* Agency names, defined first so every page script (Today card included) can use them, even on cached loads */
  const BAG = { "hydrology.gov.np": "DHM", "dhm.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "neoc.moha.gov.np": "NEOC", "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "bipadportal.gov.np": "BIPAD", "seismonepal.gov.np": "NSC", "earthquake.usgs.gov": "USGS" };
  G.agencyOf = (a) => { const v = BAG[a.sender] || a.sender; return Array.isArray(v) ? (G.lang === "ne" ? v[0] : v[1]) : v; };
  /* Display preferences, kept in this browser only. */
  const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  /* Numerals follow the language (Nepali: Devanagari, English: Western). The old gati-num override is dropped. */
  G.numPref = ""; try { localStorage.removeItem("gati-num"); } catch (e) {}
  G.cal = pref("gati-cal", "ad");              // "ad" or "bs"
  /* Themes: paper (default), light, dark, system ("system" follows the device). */
  /* Paper is the default for first-time visitors; a saved choice always wins (retired crimson maps to light). */
  G.THEMES = [["paper", "कागज", "Paper"], ["light", "उज्यालो", "Light"], ["dark", "अँध्यारो", "Dark"], ["system", "स्वतः", "Auto"]];
  G.themePref = pref("gati-theme-pref", pref("gati-theme", "paper"));
  if (!G.THEMES.some((t) => t[0] === G.themePref)) G.themePref = "light";
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => { G.theme = G.themePref === "system" ? (mq.matches ? "dark" : "light") : G.themePref; document.documentElement.dataset.theme = G.theme; };
  applyTheme(); mq.addEventListener && mq.addEventListener("change", () => G.themePref === "system" && applyTheme());

  /* Item 18: desktop nav; Map, Rivers and Roads are sections of the dashboard. */
  const NAV = [
    ["alerts", "alerts/", "सूचना", "Alerts"],
    ["map", "map/", "नक्सा", "Map"],
    ["stories", "feed/", "फिड", "Feed"],
    ["patro", "patro/", "पात्रो", "Patro"],
    ["ask", "ask/", "सोध्नुहोस्", "Ask"],
  ];
  /* "More" menu (desktop) and extra links in the mobile menu */
  const MORE = [
    ["rivers", "rivers/", "नदी", "Rivers"],
    ["roads", "roads/", "सडक", "Roads"],
    ["route", "route/", "मार्ग जाँच", "Route check"],
    ["weather", "weather/", "मौसम र हावा", "Weather & air"],
    ["earthquakes", "earthquakes/", "भूकम्प", "Earthquakes"],
    ["contacts", "contacts/", "आपतकालीन नम्बर", "Emergency numbers"],
    ["safety", "safety/", "के गर्ने", "What to do"],
    ["sources", "sources/", "स्रोत", "Sources"],
    ["log", "log/", "परिवर्तन लग", "Change log"],
    ["about", "about/", "बारेमा", "About"],
  ];
  G.PAGES = [...NAV, ...MORE, ["affected", "affected/", "के म प्रभावित छु?", "Am I affected?"], ["contact", "contact/", "सम्पर्क", "Contact"], ["report", "report/", "रिपोर्ट गर्नुहोस्", "Report"], ["api", "api/", "खुला डेटा (API)", "Open data (API)"], ["lite", "lite/", "गति Lite", "Gati Lite"]];
  /* Mobile bottom bar */
  /* Mobile bottom bar: line icons (24px, 1.8 stroke). Home opens the real home page (?home skips the Feed redirect). */
  const ICON = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
  const TABS = [
    ["home", "?home=1", ICON('<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5.5h4v5.5"/>'), "गृहपृष्ठ", "Home"],
    ["alerts", "alerts/", ICON('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'), "सूचना", "Alerts"],
    ["stories", "feed/", ICON('<rect x="5" y="6" width="14" height="14.5" rx="2.5"/><path d="M8 3.5h8"/><path d="m10.5 10.5 4 2.75-4 2.75z"/>'), "सूचना फिड", "Feed"],
    ["map", "map/", ICON('<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>'), "नक्सा", "Map"],
    ["patro", "patro/", ICON('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 16.5h1M11.5 16.5h1"/>'), "पात्रो", "Patro"],
  ];
  const b = (ne, en) => `<span class="ne-only">${ne}</span><span class="en-only">${en}</span>`;
  G.b = b;
  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `<a class="skip" href="#main">${b("मुख्य भागमा जानुहोस्", "Skip to content")}</a>
  <div class="bar">
    <a class="brand" href="${ROOT}?home=1" aria-label="गति Gati"><img class="logo logo-l" src="${ROOT}assets/img/brand/logo-h.png" alt="" width="88" height="40"><img class="logo logo-d" src="${ROOT}assets/img/brand/logo-h-white.png" alt="" width="88" height="40"><small class="tagline">${b("सही सूचना, सही समयमा ।", "The right alert, right on time.")}</small></a>
    <button class="langbtn" type="button" id="langbtn" aria-label="Switch language / भाषा बदल्नुहोस्">${b("English", "नेपाली")}</button>
    <button class="mebtn srchbtn" type="button" id="srchbtn" aria-haspopup="dialog" aria-label="खोज्नुहोस् / Search (/)" title="खोज्नुहोस् / Search (/)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button>
    <button class="mebtn setbtn bellbtn" type="button" id="setbtn" aria-haspopup="dialog" aria-controls="setsheet" aria-label="सूचना / Notifications" title="सूचना / Notifications"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg><i class="bdot" hidden></i></button>
    <button class="mebtn profbtn" type="button" id="profbtn" aria-haspopup="dialog" aria-controls="medrawer" aria-label="मेरो गति / My Gati" title="मेरो गति / My Gati"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg></button>
    <button class="menubtn" type="button" aria-expanded="false" aria-controls="mainnav" aria-label="मेनु / Menu">☰</button>
  </div>
  <nav class="main" id="mainnav" aria-label="Main"><div class="navtop"><button type="button" class="navtopbtn" data-go="me">👤 ${b("मेरो गति", "My Gati")}</button><button type="button" class="navtopbtn" data-go="notif">🔔 ${b("सूचना", "Notifications")}</button></div><a class="navhome" href="${ROOT}?home=1" aria-label="गृहपृष्ठ / Home" title="गृहपृष्ठ / Home"${PAGE === "home" ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>${NAV.map(([id, href, ne, en]) =>
    `<a href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}>${b(ne, en)}</a>`).join("")}
    <div class="more"><button type="button" class="morebtn" aria-expanded="false" aria-haspopup="true"${MORE.some((m) => m[0] === PAGE) ? ' aria-current="page"' : ""}>${b("थप", "More")} ▾</button>
      <div class="moremenu" role="menu" hidden>${MORE.map(([id, href, ne, en]) => `<a role="menuitem" href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}>${b(ne, en)}</a>`).join("")}</div></div><button class="mebtn navme" aria-label="मेरो गति / My Gati" type="button" id="mebtn" aria-haspopup="dialog" aria-controls="medrawer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg><span>${b("मेरो गति", "My Gati")}</span></button></nav>`;
  const footer = document.createElement("footer");
  footer.innerHTML = `<div class="wrap">
    <p class="fdisclaimer">${b("<strong>गति आफैँ कुनै आधिकारिक चेतावनी जारी गर्दैन।</strong> यसले जिम्मेवार सरकारी निकायकै सूचना, स्रोतसहित, फैलाउने र जाँच्ने काम मात्र गर्छ (विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन ऐन, २०७४)। आपत्कालमा १००, १०१, १०२ वा १२३४ मा फोन गर्नुहोस्।", "<strong>Gati does not issue official warnings.</strong> It only relays and verifies notices from the mandated government agencies, always with the source (Disaster Risk Reduction and Management Act 2074). In an emergency call 100, 101, 102 or 1234.")}</p>
    <div class="helplines" aria-label="Emergency helplines">
      <a href="tel:100">${b("प्रहरी १००", "Police 100")}</a><a href="tel:101">${b("दमकल १०१", "Fire 101")}</a>
      <a href="tel:102">${b("एम्बुलेन्स १०२", "Ambulance 102")}</a><a href="tel:1234">${b("विपद् १२३४", "Disaster 1234")}</a></div>
    <div>${b("गति एउटा स्वतन्त्र नागरिक परियोजना हो, कुनै सरकारी निकायको आधिकारिक प्रणाली होइन। सम्पादक: नीरज भुसाल।",
             "Gati is an independent citizen project, not an official system of any government agency. Maintainer: Niraj Bhusal.")}
      · <a href="https://nirajbhusal.github.io/rasuwa-flood-bulletin/">${b("रसुवा–भोटेकोशी बुलेटिन", "Rasuwa–Bhotekoshi bulletin")}</a>
      · <a href="${ROOT}report/">${b("रिपोर्ट गर्नुहोस्", "Report")}</a> · <a href="${ROOT}reports/">${b("नागरिक रिपोर्ट", "Reports")}</a>
      · <a href="${ROOT}contact/">${b("सम्पर्क", "Contact")}</a> · <a href="${ROOT}lite/">Lite</a> · <a href="${ROOT}alerts/">${b("अभिलेख", "Archive")}</a>
      · <a href="${ROOT}atom.xml">CAP Atom feed</a> · <a href="${ROOT}data/alerts.json">JSON</a>
      · <a href="https://github.com/nirajbhusal/gati-alerts">GitHub</a></div></div>`;
  const tabs = document.createElement("nav");
  tabs.className = "tabbar"; tabs.setAttribute("aria-label", "Quick / छिटो");
  tabs.innerHTML = TABS.map(([id, href, ic, ne, en]) => `<a href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}><span class="tico">${ic}</span><span class="tlab">${b(ne, en)}</span></a>`).join("");
  document.body.classList.add("has-tabbar");
  document.body.append(tabs);
  document.body.prepend(header);
  /* Breaking: official, active, issued in the last 24h, severity Moderate or higher. Dismissible per alert. */
  const brk = document.createElement("div"); brk.className = "breaking"; brk.hidden = true; header.after(brk);
  /* Fix sweep: paint the last Breaking bar from this browser's cache straight away, so content below does not jump when the fresh one arrives */
  const BRK_KEY = "gati-brk-cache";
  try { const c = JSON.parse(localStorage.getItem(BRK_KEY) || "null"); if (c && c.l === G.lang && Date.now() - c.t < 6 * 3600e3 && ["home", "alerts"].includes(document.body.dataset.page || "")) { brk.innerHTML = c.h; brk.hidden = !c.h; const bl = document.getElementById("breakinglist"); if (bl && c.lh && !bl.innerHTML.trim()) bl.innerHTML = c.lh; } } catch (e) {}
  G.breaking = () => G.json("data/alerts.json").then((d) => { const now = Date.now(), SV = ["Moderate", "Severe", "Extreme"];
    return d.alerts.filter((a) => a.trust === "Official" && !a.expired && !a.supersededBy && Date.parse(a.expires) > now && now - Date.parse(a.sent) < 864e5 && SV.includes(a.severity))
      .sort((a, b) => SV.indexOf(b.severity) - SV.indexOf(a.severity) || b.sent.localeCompare(a.sent)); });
  const dismissed = () => { try { return JSON.parse(sessionStorage.getItem("gati-brk-dismissed") || "[]"); } catch (e) { return []; } };
  /* 'Am I affected?' chip: links to /affected/ prefilled with the alert's district(s) */
  /* BS day label for bulletin days: Nepali as given, English as 'Kartik 12 (29 Oct)' */
  G.bsDay = (d) => { if (G.lang === "ne") return d.bs; const [y, m, dd] = d.ad.split("-").map(Number), MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], b = window.BS && BS.toBS(y, m, dd);
    return (b ? `${BS.ME[b.m - 1]} ${b.d}` : "") + ` (${dd} ${MO[m - 1]})`; };
  /* Stale chip: data whose source time is older than 24 h, in the Reported colour */
  G.isStale = (iso, h = 24) => !iso || Date.now() - Date.parse(iso) > h * 36e5;
  G.staleChip = (iso, h = 24) => { if (!G.isStale(iso, h)) return ""; const d = new Date(Date.parse(iso) + 345 * 6e4), MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], MN = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"];
    return `<span class="stalechip">पुरानो · Stale since ${G.lang === "ne" ? MN[d.getUTCMonth()] + " " + G.num(String(d.getUTCDate())) : d.getUTCDate() + " " + MO[d.getUTCMonth()]}</span>`; };
  G.affChip = (codes) => { const c = (codes || []).filter(Boolean); return `<a class="afx" href="${ROOT}affected/${c.length ? "#d=" + encodeURIComponent(c[0]) + (c.length > 1 ? "&ds=" + encodeURIComponent(c.join(",")) : "") : ""}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/></svg>${G.lang === "ne" ? "के म प्रभावित छु?" : "Am I affected?"}</a>`; };
  const brkItem = (a, x) => { const i = a.info[G.lang] || a.info.ne, c = G.SEVCOLOR[a.severity];
    return `<li style="--sc:${c}"><span class="brktag">${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking"}</span>${G.sevChip(a.severity)}<a class="brkh" href="${ROOT}alerts/${a.identifier}/">${G.esc(i.headline)}</a><span class="brkm">${G.esc(G.agencyOf(a))} · ${G.npt(a.sent)}</span>${G.affChip(a.districts)}${x ? `<button type="button" class="brkx" data-id="${G.esc(a.identifier)}" aria-label="${G.lang === "ne" ? "यो सूचना लुकाउनुहोस्" : "Dismiss this alert"}">×</button>` : ""}</li>`; };
  /* Breaking bar only on Home and Alerts; dismissal lasts for this browser session, per alert identifier */
  const BRK_PAGES = ["home", "alerts"];
  const drawBreaking = () => !BRK_PAGES.includes(PAGE) ? Promise.resolve(brk.hidden = true) : G.breaking().then((L) => {
    const dis = dismissed(), show = L.filter((a) => !dis.includes(a.identifier));
    brk.hidden = !show.length; brk.innerHTML = show.length ? `<ul class="wrap" aria-label="${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking alerts"}">${show.map((a) => brkItem(a, true)).join("")}</ul>` : "";
    brk.querySelectorAll(".brkx").forEach((x) => (x.onclick = () => { try { sessionStorage.setItem("gati-brk-dismissed", JSON.stringify([...dismissed(), x.dataset.id].slice(-100))); } catch (e) {} drawBreaking(); }));
    const list = document.getElementById("breakinglist"); if (list) list.innerHTML = `<h2>${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking"}</h2>` + (L.length ? `<ul class="brklist">${L.map((a) => brkItem(a, false)).join("")}</ul>` : `<p class="meta">${G.lang === "ne" ? "पछिल्लो २४ घण्टामा मध्यम वा सोभन्दा माथिको चालु आधिकारिक चेतावनी छैन।" : "No active official alert of Moderate or higher severity issued in the last 24 hours."}</p>`);
    try { const bl = document.getElementById("breakinglist"); localStorage.setItem(BRK_KEY, JSON.stringify({ t: Date.now(), l: G.lang, h: brk.innerHTML, lh: bl ? bl.innerHTML : "" })); } catch (e) {}
  }).catch(() => { brk.hidden = true; });
  if (document.body.dataset.page !== "embed") setTimeout(() => { drawBreaking(); G.onLang(drawBreaking); }, 0);
  document.body.append(footer);

  const mb = header.querySelector(".menubtn"), nav = header.querySelector("nav");
  const morebtn = header.querySelector(".morebtn"), moremenu = header.querySelector(".moremenu");
  morebtn.onclick = (e) => { e.stopPropagation(); const o = moremenu.hidden; moremenu.hidden = !o; morebtn.setAttribute("aria-expanded", o); };
  document.addEventListener("click", () => { moremenu.hidden = true; morebtn.setAttribute("aria-expanded", false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !moremenu.hidden) { moremenu.hidden = true; morebtn.focus(); } });
  mb.onclick = () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); };
  /* Fix sweep 8: the phone menu closes with Escape (focus back on ☰) and when one of its in-page links is used */
  const closeNav = (f) => { if (!nav.classList.contains("open")) return; nav.classList.remove("open"); mb.setAttribute("aria-expanded", false); if (f) mb.focus(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(true); });
  nav.addEventListener("click", (e) => { const a = e.target.closest("a[href]"); if (a && a.hash && a.pathname === location.pathname) closeNav(false); });
  header.querySelector("#langbtn").onclick = () => G.setLang(G.lang === "ne" ? "en" : "ne");
  G.setLang = (l) => { G.lang = l; localStorage.setItem("gati-lang", l); document.documentElement.lang = l; G.listeners.forEach((f) => f(l)); };
  const save = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };
  G.toggleNum = () => {}; /* retired: numerals follow the language */
  G.setNum = () => {}; /* retired */
  G.setCal = (v) => { G.cal = v; save("gati-cal", v === "bs" ? "bs" : ""); G.listeners.forEach((f) => f(G.lang)); };
  G.setTheme = (t) => { G.themePref = t; save("gati-theme-pref", t); save("gati-theme", ""); applyTheme(); G.listeners.forEach((f) => f(G.lang)); };
  /* Visual swatch picker, reused by the My Gati drawer */
  G.themePicker = () => `<div class="setseg" role="radiogroup" aria-label="${G.lang === "ne" ? "रूप" : "Theme"}">${G.THEMES.map(([k, ne, en]) => `<button type="button" role="radio" class="thsw" data-th="${k}" aria-checked="${G.themePref === k}">${G.lang === "ne" ? ne : en}</button>`).join("")}</div>`;
  G.bindThemePicker = (el) => el.querySelectorAll(".thsw").forEach((b) => (b.onclick = () => { G.setTheme(b.dataset.th); el.querySelectorAll(".thsw").forEach((x) => x.setAttribute("aria-checked", x.dataset.th === G.themePref)); }));
  /* Settings sheet: language, numerals, calendar, text size, theme */
  const sheet = document.createElement("div"); sheet.id = "setsheet"; sheet.className = "setsheet"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-labelledby", "seth");
  document.body.append(sheet);
  const seg = (k, opts, cur) => `<div class="setseg" role="radiogroup" data-k="${k}">${opts.map(([v, l]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${v === cur}">${l}</button>`).join("")}</div>`;
  let tabk = "set";
  /* Notifications tab: pushes received (stored by sw.js in the Cache API under gati-pushlog), newest first, plus district subscription */
  const pushLog = () => ("caches" in window ? caches.open("gati-pushlog").then((c) => c.match("pushlog")).then((r) => (r ? r.json() : [])).catch(() => []) : Promise.resolve([]));
  async function drawNotif(box) { const L = (a, b) => (G.lang === "ne" ? a : b), E = G.esc;
    const list = (await pushLog()).sort((x, y) => (y.received || "").localeCompare(x.received || ""));
    let DL = []; try { DL = await G.json("data/districts.json"); } catch (e) {}
    const on = G.push && G.push.on(), mine = (() => { try { return localStorage.getItem("gati-push-district") || ""; } catch (e) { return ""; } })(), cur = mine || (G.district && G.district.get && G.district.get()) || "";
    box.innerHTML = `<section><h3>${L("जिल्लाका सूचना", "District alerts")}</h3>
      <p class="meta">${on ? L("चालु आधिकारिक सूचना आउँदा यो जिल्लाका लागि पुस सूचना पाउनुहोस्।", "Get a push when an official alert covers this district.") : L("पुस सूचना अझै सुरु भएको छैन; कुञ्जी (VAPID) र पठाउने सेवा तयार भएपछि खुल्छ।", "Push is not on yet; it opens once the keys (VAPID) and a sender are set up.")}</p>
      <div class="ntsub"><label class="sr-only" for="ntd">${L("जिल्ला", "District")}</label><select id="ntd" ${on ? "" : "disabled"}>${DL.map((d) => `<option value="${E(d.code)}"${d.code === cur ? " selected" : ""}>${E(L(d.ne, d.en))}</option>`).join("")}</select>
      <button type="button" class="btn" id="ntgo" ${on ? "" : "disabled"}>${mine ? L("बदल्नुहोस्", "Change") : L("सदस्यता लिनुहोस्", "Subscribe")}</button></div>
      ${mine ? `<p class="meta">${L("सदस्यता", "Subscribed")}: ${E(L((DL.find((d) => d.code === mine) || {}).ne || mine, (DL.find((d) => d.code === mine) || {}).en || mine))}</p>` : ""}<p class="meta" id="ntmsg" role="status"></p></section>
      <section><h3>${L("आएका सूचना", "Received")}</h3>${list.length ? `<ul class="ntlist">${list.map((n) => `<li><a href="${E(n.url || G.root)}"><b>${E(n.title || "")}</b>${n.body ? `<span>${E(n.body)}</span>` : ""}<span class="meta">${L("स्रोत", "Source")}: ${E(n.source || "")} · ${G.npt(n.sent || n.received)}</span></a></li>`).join("")}</ul>`
        : `<p class="ntempty">🔔 ${L("अहिलेसम्म कुनै पुस सूचना आएको छैन। सदस्यता लिएपछि यहाँ देखिन्छ, नयाँ माथि।", "No push notifications yet. Once you subscribe they show here, newest first.")}</p>`}</section>`;
    const go = box.querySelector("#ntgo"); if (go && on) go.onclick = async () => { const r = await G.push.subscribe(box.querySelector("#ntd").value); box.querySelector("#ntmsg").textContent = r.msg; };
  }
  const drawSheet = () => { const ne = G.lang === "ne", L = (a, b) => (ne ? a : b);
    sheet.innerHTML = `<div class="setpanel"><div class="seth"><h2 id="seth">${L("सेटिङ", "Settings")}</h2><button type="button" class="setx" aria-label="${L("बन्द गर्नुहोस्", "Close")}">×</button></div>
      <div class="settabs" role="tablist"><button type="button" role="tab" data-tab="set" aria-selected="${tabk === "set"}">⚙ ${L("सेटिङ", "Settings")}</button><button type="button" role="tab" data-tab="notif" aria-selected="${tabk === "notif"}">🔔 ${L("सूचना", "Notifications")}</button></div>
      ${tabk === "notif" ? `<div id="ntpane" role="tabpanel"><p class="meta">…</p></div>` : ""}<div role="tabpanel"${tabk === "notif" ? " hidden" : ""}>
      <section class="setgrp"><h3>भाषा र ढाँचा · Language and format</h3><h4>${L("भाषा", "Language")}</h4>${seg("lang", [["ne", "नेपाली"], ["en", "English"]], G.lang)}
      <h4>${L("मिति", "Calendar")}</h4>${seg("cal", [["bs", L("वि.सं. BS", "BS")], ["ad", L("ई.सं. AD", "AD")]], G.cal === "bs" ? "bs" : "ad")}</section>
      <section><h3>${L("अक्षरको आकार", "Text size")}</h3><span class="tsize setseg" role="group" aria-label="${L("अक्षरको आकार", "Text size")}"><button type="button" data-ts="-1" aria-label="${L("सानो अक्षर", "Smaller text")}">A−</button><button type="button" data-ts="0" aria-label="${L("सामान्य अक्षर", "Default text size")}">A</button><button type="button" data-ts="1" aria-label="${L("ठूलो अक्षर", "Larger text")}">A+</button></span></section>
      <section><h3>${L("रूप", "Theme")}</h3>${seg("theme", [["paper", L("कागज", "Paper")], ["light", L("उज्यालो", "Light")], ["dark", L("अँध्यारो", "Dark")], ["system", L("स्वतः", "Auto")]], G.themePref)}</section></div></div>`;
    sheet.querySelectorAll(".setseg[data-k] button").forEach((b) => (b.onclick = () => { const k = b.parentElement.dataset.k, v = b.dataset.v;
      if (k === "lang") G.setLang(v); else if (k === "num") G.setNum(v); else if (k === "cal") G.setCal(v); else if (k === "theme") G.setTheme(v);
      drawSheet(); const nb = sheet.querySelector(`[data-k="${k}"] [data-v="${v}"]`); if (nb) nb.focus(); }));
    G.bindTsize(sheet); if (G.setTextSize) G.setTextSize(G.textSize());
    sheet.querySelectorAll(".settabs [data-tab]").forEach((b) => (b.onclick = () => { tabk = b.dataset.tab; drawSheet(); const t = sheet.querySelector(`[data-tab="${tabk}"]`); if (t) t.focus(); }));
    const np = sheet.querySelector("#ntpane"); if (np) drawNotif(np);
    sheet.querySelector(".setx").onclick = closeSheet; };
  const setbtn = header.querySelector("#setbtn");
  const closeSheet = () => { sheet.hidden = true; setbtn.setAttribute("aria-expanded", "false"); setbtn.focus(); };
  const NSEEN = "gati-notif-seen";
  const markDot = () => pushLog().then((L) => { const seen = localStorage.getItem(NSEEN) || ""; const unread = L.some((x) => (x.received || "") > seen); const d = setbtn.querySelector(".bdot"); if (d) d.hidden = !unread; setbtn.setAttribute("aria-label", (unread ? "नयाँ सूचना / New notifications" : "सूचना / Notifications")); }).catch(() => {});
  setbtn.onclick = () => { tabk = "notif"; drawSheet(); sheet.hidden = false; setbtn.setAttribute("aria-expanded", "true"); try { localStorage.setItem(NSEEN, new Date().toISOString()); } catch (e) {} markDot(); const t = sheet.querySelector('[data-tab="notif"]') || sheet.querySelector('[aria-checked="true"]'); if (t) t.focus(); };
  markDot();
  header.querySelector("#profbtn").onclick = () => { const m = document.getElementById("mebtn"); if (m) m.click(); };
  header.querySelectorAll(".navtopbtn").forEach((x) => (x.onclick = () => { nav.classList.remove("open"); mb.setAttribute("aria-expanded", false); (x.dataset.go === "me" ? header.querySelector("#profbtn") : setbtn).click(); }));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
  /* Accessibility: text size A- / A / A+ (87.5% to 150%, saved) */
  const TS = [87.5, 100, 112.5, 125, 137.5, 150];
  let ts = parseFloat(pref("gati-tsize", "")); if (!TS.includes(ts)) ts = pref("gati-text", "") === "large" ? 125 : 100;
  G.textSize = () => ts;
  G.setTextSize = (v) => { ts = TS.includes(v) ? v : 100; document.documentElement.style.fontSize = ts === 100 ? "" : ts + "%"; document.documentElement.dataset.text = ts > 100 ? "large" : "";
    save("gati-tsize", ts === 100 ? "" : String(ts)); save("gati-text", ""); G.bigText = ts > 100;
    document.querySelectorAll(".tsize").forEach((g) => { g.querySelector('[data-ts="-1"]').disabled = ts <= TS[0]; g.querySelector('[data-ts="1"]').disabled = ts >= TS[TS.length - 1]; g.querySelector('[data-ts="0"]').setAttribute("aria-pressed", ts === 100); const o = g.querySelector("output"); if (o) o.textContent = G.num(String(ts)) + "%"; }); };
  G.stepText = (d) => G.setTextSize(d === 0 ? 100 : TS[Math.max(0, Math.min(TS.length - 1, TS.indexOf(ts) + d))]);
  G.bindTsize = (root) => root.querySelectorAll(".tsize [data-ts]").forEach((b) => (b.onclick = () => G.stepText(+b.dataset.ts)));
  G.bindTsize(header); G.setTextSize(ts);
  G.listeners.push(() => { if (!sheet.hidden) drawSheet(); });
  G.onLang = (f) => G.listeners.push(f);
  /* Tagline in the tab title follows the language */
  const TAG = ["सही सूचना, सही समयमा ।", "The right alert, right on time."];
  const tagTitle = (l) => { const t = document.title; document.title = l === "en" ? t.replace(TAG[0], TAG[1]) : t.replace(TAG[1], TAG[0]); };
  G.listeners.push(tagTitle); tagTitle(G.lang);

  const DEV = "०१२३४५६७८९";
  G.devNum = () => G.lang === "ne";
  G.num = (s) => (G.devNum() ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  G.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MON_NE = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"];
  const MON_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  /* Format any ISO time in Nepal Time (UTC+5:45). */
  G.npt = (iso) => {
    const d = new Date(new Date(iso).getTime() + 345 * 60000);
    const day = d.getUTCDate(), m = d.getUTCMonth(), y = d.getUTCFullYear();
    let h = d.getUTCHours(); const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const bs = G.cal === "bs" && window.BS ? window.BS.toBS(y, m + 1, day) : null;
    if (G.lang === "ne") return G.num(bs ? `${window.BS.MN[bs.m - 1]} ${bs.d}, ${bs.y} · ${h}:${mi}` : `${MON_NE[m]} ${day}, ${y} · ${h}:${mi}`) + " NPT";
    const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return G.num(bs ? `${bs.d} ${window.BS.ME[bs.m - 1]} ${bs.y} BS · ${h}:${mi} ${ap}` : `${day} ${MON_EN[m]} ${y} · ${h}:${mi} ${ap}`) + " NPT";
  };
  G.ago = (iso) => {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 60) return G.lang === "ne" ? G.num(m) + " मिनेट अघि" : m + " min ago";
    const h = Math.round(m / 60); if (h < 48) return G.lang === "ne" ? G.num(h) + " घण्टा अघि" : h + " h ago";
    const d = Math.round(h / 24); return G.lang === "ne" ? G.num(d) + " दिन अघि" : d + " days ago";
  };
  G.SEV = { Extreme: ["अत्यन्त गम्भीर", "Extreme", "⬢"], Severe: ["गम्भीर", "Severe", "▲"], Moderate: ["मध्यम", "Moderate", "◆"],
            Minor: ["सामान्य", "Minor", "●"], Unknown: ["सूचना", "Info", "ℹ"] };
  G.SEVORDER = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  G.SEVCOLOR = { Extreme: "#8E1B14", Severe: "#D93025", Moderate: "#F28C1E", Minor: "#F2C94C", Unknown: "#8F9BB3" };
  G.TRUST = { Official: ["आधिकारिक", "Official", "🛡"], Verified: ["प्रमाणित", "Verified", "✓"], Reported: ["रिपोर्ट गरिएको", "Reported", "❝"],
              Unverified: ["पुष्टि नभएको", "Unverified", "◌"], Corrected: ["सच्याइएको", "Corrected", "✎"], Retracted: ["फिर्ता लिइएको", "Retracted", "✕"] };
  G.sevChip = (s) => { const v = G.SEV[s] || G.SEV.Unknown; return `<span class="sev sev-${G.SEV[s] ? s : "Unknown"}"><span aria-hidden="true">${v[2]}</span>${G.lang === "ne" ? v[0] : v[1]}</span>`; };
  G.trustChip = (t) => { const v = G.TRUST[t]; return v ? `<span class="trust t-${t}"><span aria-hidden="true">${v[2]}</span>${G.lang === "ne" ? v[0] : v[1]}</span>` : ""; };
  /* Source health: planned | ok | stale | down. Stale = last success older than 3x pollMinutes. */
  G.srcStatus = (src, h) => {
    if (src.status === "planned" || !src.url) return "planned";
    h = h || {};
    if (!h.lastSuccess) return "down";
    const age = (Date.now() - new Date(h.lastSuccess)) / 60000;
    if (age > 3 * src.pollMinutes) return "stale";
    return h.lastChecked && h.lastChecked > h.lastSuccess ? "stale" : "ok";
  };
  const rawJson = (p) => fetch(ROOT + p, { cache: "no-cache" }).then((r) => {
    if (p === "data/alerts.json" && navigator.onLine) try { localStorage.setItem("gati-last-sync", new Date().toISOString()); } catch (e) {}
    return r.json();
  });
  /* DoR NAVIGATE overlay: data/navigate.json "routes" (resolved by scripts/fetch_navigate.py: newer report wins,
     disagreement in the same window = not confirmed with both sources) is applied on top of data/roads.json. */
  G.json = (p) => p !== "data/roads.json" ? rawJson(p) : Promise.all([rawJson(p), rawJson("data/navigate.json").catch(() => null)]).then(([RD, NV]) => {
    if (!RD || !NV) return RD;
    RD.navigate = NV;
    const LB = { open: ["खुला", "open"], oneway: ["आंशिक", "partial"], blocked: ["अवरुद्ध", "blocked"], none: ["पुष्टि नभएको", "not confirmed"] };
    (RD.routes || []).forEach((r) => { const x = NV.routes && NV.routes[r.id]; if (!x || x.winner === "agree" || x.winner === "police") return;
      r.nav = x; r.status = x.status; r.sources = [...new Set([...(r.sources || []), "dor"])];
      const it = (NV.items || []).find((i) => i.id === x.item) || {};
      const ne = x.winner === "conflict" ? `पुष्टि नभएको: नेपाल प्रहरी (${LB[x.police][0]}) र सडक विभाग NAVIGATE (${LB[x.navigate === "partial" ? "oneway" : x.navigate][0]}) उही समयमा फरक भन्छन्; दुवै स्रोत हेर्नुहोस्।` : `सडक विभाग NAVIGATE (${LB[x.status][0]}, ${it.location || ""}) नेपाल प्रहरीको सूचनाभन्दा नयाँ छ।`;
      const en = x.winner === "conflict" ? `Not confirmed: Nepal Police (${LB[x.police][1]}) and DoR NAVIGATE (${LB[x.navigate === "partial" ? "oneway" : x.navigate][1]}) disagree in the same window; see both sources.` : `DoR NAVIGATE (${LB[x.status][1]}, ${it.location || ""}) is newer than the Nepal Police notice.`;
      r.note_ne = ne + " " + (r.note_ne || ""); r.note_en = en + " " + (r.note_en || ""); });
    return RD;
  });

  /* Demo mode (?demo=1): load the client-side scenario before page scripts run. */
  if (/[?&]demo=/.test(location.search) || sessionStorage.getItem("gati-demo-start")) {
    const x = new XMLHttpRequest(); x.open("GET", ROOT + "assets/js/demo.js", false);
    try { x.send(); if (x.status === 200) (0, eval)(x.responseText); } catch (e) {}
  }
  /* PWA: manifest, service worker, offline banner with the last-known state. */
  const mf = document.createElement("link"); mf.rel = "manifest"; mf.href = ROOT + "manifest.webmanifest"; document.head.append(mf);
  if ("serviceWorker" in navigator && location.protocol === "https:") { const hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register(ROOT + "sw.js", { scope: ROOT }).catch(() => {});
    /* New build took over: offer a refresh (only when an older version was controlling this page) */
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!hadCtl || document.querySelector(".swtoast")) return;
      const t = document.createElement("button"); t.type = "button"; t.className = "swtoast"; t.textContent = "नयाँ संस्करण उपलब्ध · New version, tap to refresh"; t.onclick = () => location.reload(); document.body.append(t); }); }
  const off = document.createElement("div"); off.className = "offline"; off.setAttribute("role", "status"); off.hidden = true;
  header.after(off);
  const offDraw = () => {
    const last = localStorage.getItem("gati-last-sync");
    off.innerHTML = `<div class="wrap">${G.lang === "ne"
      ? `हजुर अहिले अफलाइन हुनुहुन्छ। यहाँ पछिल्लो पटक सुरक्षित गरिएको अवस्था देखाइएको छ${last ? " (" + G.npt(last) + ")" : ""}। यो पुरानो हुन सक्छ।`
      : `You are offline. This shows the last saved state${last ? " (" + G.npt(last) + ")" : ""}. It may be out of date.`}</div>`;
    off.hidden = navigator.onLine;
  };
  addEventListener("online", offDraw); addEventListener("offline", offDraw); G.onLang(offDraw); offDraw();

})();
/* Accessibility: read aloud with speechSynthesis on alert cards and Feed cards (ne-NP voice if the device has one, else English) */
(function () {
  const G = window.Gati; if (!G || !("speechSynthesis" in window)) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  let cur = null;
  const voice = () => { const v = speechSynthesis.getVoices(); return v.find((x) => /^ne(-|_|$)/i.test(x.lang)) || null; };
  function stop() { speechSynthesis.cancel(); if (cur) { cur.setAttribute("aria-pressed", "false"); cur = null; } }
  function speak(btn, el) {
    if (cur === btn) { stop(); return; } stop();
    const clone = el.cloneNode(true); clone.querySelectorAll(".tts,.rail,button,.fbg,script,.tdkey,.tdwx,.tdggs,.trust,.stalechip,svg").forEach((n) => n.remove());
    const words = (n) => { if (!n) return ""; const c = n.cloneNode(true); c.querySelectorAll(".tts,button,svg,.trust,.stalechip,.tdwx,.tdtb,.tdsep" + (n.closest(".td-rd") ? ",.tdseg" : "") + (n.closest(".td-rv") ? ",.tdkey" : "")).forEach((x) => x.remove()); c.querySelectorAll("*").forEach((x) => x.append(" ")); return c.textContent.replace(/\s+/g, " ").trim(); };
    const today = el.classList.contains("tdcard") ? [words(el.querySelector(".tdhead")), ...[...el.querySelectorAll(".tdrow")].map((r) => `${words(r.querySelector(".tdk"))}: ${words(r.querySelector(".tdv"))}.`)].join(" ") : "";
    const text = (today || clone.innerText).replace(/\s+/g, " ").trim().slice(0, 1500).replace(/NPT/g, G.lang === "ne" ? "नेपाली समय" : "Nepal time").replace(/°/g, G.lang === "ne" ? " डिग्री" : " degrees");
    const nv = voice(), u = new SpeechSynthesisUtterance(nv || G.lang === "en" ? text : text);
    if (G.lang === "ne" && nv) { u.voice = nv; u.lang = nv.lang; } else if (G.lang === "ne") { u.lang = "ne-NP"; } else u.lang = "en-US";
    if (G.lang === "ne" && !nv) { const en = speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang)); if (!speechSynthesis.getVoices().some((x) => /^(ne|hi)/i.test(x.lang)) && en) { u.voice = en; u.lang = en.lang; } }
    u.onend = u.onerror = () => { if (cur === btn) stop(); };
    cur = btn; btn.setAttribute("aria-pressed", "true"); speechSynthesis.speak(u);
  }
  function mk(el, cls) {
    if (el.dataset.tts) return; el.dataset.tts = "1";
    const b = document.createElement("button"); b.type = "button"; b.className = "tts " + cls; b.setAttribute("aria-pressed", "false");
    const lab = () => { b.innerHTML = `<span aria-hidden="true">🔊</span><span class="ttsl">${T("सुन्नुहोस्", "Listen")}</span>`; b.setAttribute("aria-label", T("ठूलो स्वरमा पढ्नुहोस्", "Read aloud")); };
    lab(); G.onLang && G.onLang(lab);
    b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); speak(b, el.classList.contains("rail") ? el.parentElement : el); };
    if (el.classList.contains("rail")) el.prepend(b); else { const h = el.querySelector(".ahead") || el.querySelector(".tdhead"); if (h) { b.classList.add("ttsi"); h.appendChild(b); } else el.appendChild(b); }
  }
  function scan() { document.querySelectorAll("article.alert").forEach((a) => mk(a, "ttsa")); document.querySelectorAll(".rail").forEach((r) => mk(r, "ttsr")); document.querySelectorAll(".tdcard").forEach((c) => mk(c, "ttsd")); }
  new MutationObserver(() => { clearTimeout(scan.t); scan.t = setTimeout(scan, 150); }).observe(document.body, { childList: true, subtree: true });
  scan(); speechSynthesis.getVoices(); addEventListener("pagehide", stop);
})();
(function () { const G = window.Gati; if (!G || G.push) return; const s = document.createElement("script"); s.src = G.root + "assets/js/push.js"; document.body.appendChild(s); if (!G.motion) { G.motion = 1; const m = document.createElement("script"); m.src = G.root + "assets/js/motion.js"; document.body.appendChild(m); } })();
/* Ask pop-up (loaded on every page that uses common.js) */
(function () { const G = window.Gati; if (!G) return; const q = document.createElement("script"); q.src = G.root + "assets/js/search.js"; q.defer = true; document.body.appendChild(q); })();
(function () { const G = window.Gati; if (!G) return; const s = document.createElement("script"); s.src = G.root + "assets/js/askpop.js"; s.defer = true; document.body.appendChild(s); })();
/* My Gati drawer: no accounts; everything lives in this browser. */
(function () {
  const G = window.Gati; if (!G) return;
  const R = G.root, esc = G.esc, T = (ne, en) => (G.lang === "ne" ? ne : en);
  const btn = document.getElementById("mebtn"); if (!btn) return;
  const dr = document.createElement("div"); dr.id = "medrawer"; dr.className = "medrawer"; dr.hidden = true; dr.setAttribute("role", "dialog"); dr.setAttribute("aria-modal", "true"); dr.setAttribute("aria-labelledby", "metitle");
  document.body.appendChild(dr);
  const watch = () => { try { const w = JSON.parse(localStorage.getItem("gati-watch") || "{}"); return (w.d || []).length + (w.r || []).length; } catch (e) { return 0; } };
  const row = (ic, ne, en, val, act) => `<button type="button" class="merow" data-act="${act}"><span class="meic" aria-hidden="true">${ic}</span><span class="melab">${T(ne, en)}</span><span class="meval">${val}</span><span aria-hidden="true">›</span></button>`;
  async function render() {
    const code = G.district && G.district.get ? G.district.get() : (localStorage.getItem("gati-district") || "");
    let dn = ""; try { dn = code && G.district ? await G.district.name(code) : ""; } catch (e) {}
    const th = G.THEMES.find((x) => x[0] === G.themePref) || G.THEMES[0];
    const notif = T("पुश छैन · RSS/Atom", "No push · RSS/Atom");
    dr.innerHTML = `<div class="meback"></div><aside class="mepanel">
      <div class="mehead"><h2 id="metitle">${T("मेरो गति", "My Gati")}</h2><button type="button" class="mex" aria-label="${T("बन्द गर्नुहोस्", "Close")}">✕</button></div>
      <div class="mecard"><div class="mecard-top"><img src="${R}assets/img/brand/mark-192.png" alt="" width="40" height="40"><div><b>${T("मेरो गति", "My Gati")}</b><small>${T("खाता चाहिँदैन · यही ब्राउजरमा सुरक्षित", "No account · saved in this browser")}</small></div></div>
        <div class="mecard-dist">📍 ${dn ? esc(dn) : T("जिल्ला छानिएको छैन", "No district chosen")}</div>
        <div class="mecard-stats"><div><b>${G.num(String(watch()))}</b><span>${T("निगरानी", "Watching")}</span></div><div><b>${G.lang === "ne" ? "ने" : "EN"}</b><span>${T("भाषा", "Language")}</span></div><div><b><i class="thdot th-${G.theme}"></i></b><span>${T(th[1], th[2])}</span></div></div>
        <div class="mecard-foot">🔔 ${notif}</div></div>
      <h3>${T("रूप", "Theme")}</h3><div class="methemes">${G.themePicker()}</div>
      <h3>${T("भाषा", "Language")}</h3><div class="melang" role="radiogroup"><button type="button" role="radio" aria-checked="${G.lang === "ne"}" data-l="ne"><b>नेपाली</b><small>Nepali</small></button><button type="button" role="radio" aria-checked="${G.lang === "en"}" data-l="en"><b>English</b><small>अङ्ग्रेजी</small></button></div>
      <h3>${T("सेटिङ", "Settings")}</h3><div class="merows">
        ${row("📍", "मेरो जिल्ला", "My district", dn ? esc(dn) : T("छान्नुहोस्", "Choose"), "dist")}
        ${row("⭐", "मेरो निगरानी सूची", "My watchlist", G.num(String(watch())), "watch")}
        ${row("🗓", "मिति", "Dates", G.cal === "bs" ? T("वि.सं.", "BS") : T("ई.सं.", "AD"), "cal")}
        <div class="merow metsize"><span class="meic" aria-hidden="true">अ</span><span class="melab">${T("अक्षरको आकार", "Text size")}</span><span class="tsize" role="group" aria-label="${T("अक्षरको आकार", "Text size")}"><button type="button" data-ts="-1" aria-label="${T("सानो अक्षर", "Smaller text")}">A−</button><button type="button" data-ts="0" aria-label="${T("सामान्य अक्षर", "Default size")}">A</button><button type="button" data-ts="1" aria-label="${T("ठूलो अक्षर", "Larger text")}">A+</button><output>${G.num(String(G.textSize()))}%</output></span></div>
        ${row("🔔", "सूचना पाउने तरिका", "Get notified", "Atom", "feed")}
        ${row("ℹ️", "बारेमा र स्रोत", "About and sources", "", "about")}
      </div><p class="meta">${T("यहाँका सेटिङ यही उपकरणमा मात्र रहन्छन्।", "These settings stay on this device.")} <a class="relaylink" href="${R}about/">${T("गतिले आधिकारिक स्रोत मात्र प्रसारण गर्छ", "Gati relays official sources")}</a></p></aside>`;
    G.bindThemePicker(dr.querySelector(".methemes"));
    dr.querySelector(".meback").onclick = close; dr.querySelector(".mex").onclick = close;
    dr.querySelectorAll(".melang button").forEach((b) => (b.onclick = () => G.setLang(b.dataset.l)));
    G.bindTsize(dr); G.setTextSize(G.textSize());
    dr.querySelectorAll(".merow:not(.metsize)").forEach((b) => (b.onclick = () => {
      const a = b.dataset.act, H = document.querySelector("header.top");
      if (a === "dist" && G.district) G.district.open(render);
      else if (a === "num") G.toggleNum();
      else if (a === "cal") G.setCal(G.cal === "bs" ? "ad" : "bs");
      else if (a === "watch") location.href = R + "?home=1#watch";
      else if (a === "feed") location.href = R + "atom.xml";
      else if (a === "about") location.href = R + "about/";
      if (/num|cal|txt/.test(a)) render();
    }));
  }
  function open() { render().then(() => { dr.hidden = false; document.body.classList.add("me-open"); dr.querySelector(".mex").focus(); }); }
  function close() { dr.hidden = true; document.body.classList.remove("me-open"); btn.focus(); }
  btn.onclick = open; btn.setAttribute("aria-label", T("मेरो गति", "My Gati"));
  dr.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); if (e.key === "Tab") { const f = [...dr.querySelectorAll("button,a[href]")]; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } });
  G.onLang(() => { btn.setAttribute("aria-label", T("मेरो गति", "My Gati")); if (!dr.hidden) render(); });
  G.myGati = { open };
})();

/* Share: native Web Share where available, otherwise a minimal sheet (copy link, Facebook, X, WhatsApp, Viber) with monochrome icons. */
(function () {
  const G = window.Gati; if (!G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const SV = (d, fill) => `<svg viewBox="0 0 24 24" width="22" height="22" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${d}</svg>`;
  const IC = {
    link: SV('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    fb: SV('<path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6H14v-6h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5z"/>'),
    x: SV('<path d="M4 4l16 16M20 4 4 20"/>'),
    wa: SV('<path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.2 2.6 3.6 6 6.2 6.2l.9-1.6-2-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-2z"/>'),
    vb: SV('<path d="M12 3.5c4.7 0 8 2.3 8 7s-3.3 7-8 7c-.8 0-1.5 0-2.2-.2L6.5 20v-3.3C4.9 15.5 4 13.3 4 10.5c0-4.7 3.3-7 8-7z"/><path d="M9.5 8.5c.3 2.6 2.4 4.7 5 5l.8-1.2-1.6-.9-.8.6a3.6 3.6 0 0 1-1.9-1.9l.6-.8-.9-1.6z"/>'),
    share: SV('<circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="m8 11 8-4M8 13l8 4"/>') };
  G.SHAREICON = IC.share;
  let sh = null;
  function sheet(url, text) {
    const u = encodeURIComponent(url), tx = encodeURIComponent(text || document.title);
    if (!sh) { sh = document.createElement("div"); sh.className = "shs"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.hidden = true; document.body.appendChild(sh); }
    sh.innerHTML = `<div class="shback"></div><div class="shpanel"><div class="shhead"><h2>${T("सेयर गर्नुहोस्", "Share")}</h2><button type="button" class="shx" aria-label="${T("बन्द", "Close")}">×</button></div>
      <p class="shurl">${G.esc(url)}</p>
      <div class="shgrid"><button type="button" class="shb" data-copy>${IC.link}<span>${T("लिङ्क कपी", "Copy link")}</span></button>
      <a class="shb" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${u}">${IC.fb}<span>Facebook</span></a>
      <a class="shb" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${tx}&url=${u}">${IC.x}<span>X</span></a>
      <a class="shb" target="_blank" rel="noopener" href="https://wa.me/?text=${tx}%20${u}">${IC.wa}<span>WhatsApp</span></a>
      <a class="shb" href="viber://forward?text=${tx}%20${u}">${IC.vb}<span>Viber</span></a></div>
      <p class="meta">${T("सेयर गर्दा मूल स्रोत पनि उल्लेख गर्नुहोस्।", "When sharing, mention the original source.")}</p></div>`;
    const close = () => (sh.hidden = true);
    sh.querySelector(".shback").onclick = close; sh.querySelector(".shx").onclick = close; sh.onkeydown = (e) => e.key === "Escape" && close();
    sh.querySelector("[data-copy]").onclick = async (e) => { const b = e.currentTarget; try { await navigator.clipboard.writeText(url); } catch (x) { const t = document.createElement("textarea"); t.value = url; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); } b.querySelector("span").textContent = T("कपी भयो", "Copied"); };
    sh.hidden = false; sh.querySelector(".shx").focus();
  }
  G.share = async ({ url = location.href, title = document.title, text = "" } = {}) => {
    if (navigator.share && !G.forceShareSheet) { try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    sheet(url, text || title);
  };
  /* any element with data-share opens it */
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-share]"); if (!b) return; e.preventDefault(); G.share({ url: b.dataset.share || location.href.split("#")[0], title: b.dataset.title || document.title, text: b.dataset.text || "" }); });
  /* page-level share button at the end of every page */
  const main = document.getElementById("main"), page = document.body.dataset.page;
  if (main && !["stories", "embed"].includes(page)) { const p = document.createElement("div"); p.className = "pgshare"; p.innerHTML = `<button type="button" class="shbtn" data-share="">${IC.share}<span>${T("यो पृष्ठ सेयर गर्नुहोस्", "Share this page")}</span></button>`; main.appendChild(p);
    G.onLang(() => (p.querySelector("span").textContent = T("यो पृष्ठ सेयर गर्नुहोस्", "Share this page"))); }
})();

/* Alert permalink pages: 'Am I affected?' chip under the headline, prefilled with the alert's districts */
(function () { const G = window.Gati; if (!G || document.body.dataset.page !== "alert") return;
  const id = decodeURIComponent(location.pathname.replace(/\/$/, "").split("/").pop());
  G.json("data/alerts.json").then((d) => { const a = d && d.alerts.find((x) => x.identifier === id); if (!a || a.hazard === "earthquake") return;
    const put = () => { const old = document.querySelector(".afxrow"); if (old) old.remove(); const h = document.querySelector("main h1"); if (h) h.insertAdjacentHTML("afterend", `<p class="afxrow">${G.affChip(a.districts)}</p>`); };
    put(); G.onLang(put); }).catch(() => {});
})();

/* Fix sweep: one focus trap for every open modal (Settings, search, district, feed QR/Details, Patro day, share).
   Tab and Shift+Tab cycle inside the topmost visible [aria-modal=true] dialog, and focus that has escaped is pulled back in. */
(function () {
  const vis = (e) => { if (e.hidden || e.closest("[hidden]")) return false; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden"; };
  const top = () => { const ds = [...document.querySelectorAll('[aria-modal="true"]')].filter(vis); return ds[ds.length - 1]; };
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return; const d = top(); if (!d) return;
    const f = [...d.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"]),summary')].filter(vis);
    if (!f.length) return; const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (!d.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }, true);
})();

/* Fix sweep: GitHub's unauthenticated search API allows about 10 calls a minute per visitor, so a few page views hit 403.
   G.gh caches each GitHub API answer for 15 minutes and falls back to the last good answer when GitHub refuses. */
(function () { const G = window.Gati; if (!G || G.gh) return;
  G.gh = async (url, opt) => { const k = "gati-gh:" + url; let c = null; try { c = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    if (c && Date.now() - c.t < 15 * 60e3) return c.j;
    try { const r = await fetch(url, opt); if (!r.ok) throw new Error(r.status); const j = await r.json(); try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), j })); } catch (e) {} return j; }
    catch (e) { if (c) return c.j; throw e; } };
})();
