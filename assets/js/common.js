/* Gati shared shell: header, nav, disclaimer, footer, language toggle, helpers. */
(function () {
  const ROOT = document.body.dataset.root || "./";
  const PAGE = document.body.dataset.page;
  const saved = localStorage.getItem("gati-lang");
  const G = (window.Gati = { root: ROOT, lang: saved === "en" ? "en" : "ne", listeners: [] });
  document.documentElement.lang = G.lang;
  /* Display preferences, kept in this browser only. */
  const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  G.numPref = pref("gati-num", "");            // "" follows language; "ne" or "en" forces numerals
  G.cal = pref("gati-cal", "ad");              // "ad" or "bs"
  /* Themes: system, light, paper, dark, crimson. "system" follows the device. */
  G.THEMES = [["system", "प्रणाली", "System"], ["light", "उज्यालो", "Light"], ["paper", "कागज", "Paper"], ["dark", "अँध्यारो", "Dark"], ["crimson", "सिम्रिक", "Crimson"]];
  G.themePref = pref("gati-theme-pref", pref("gati-theme", "system"));
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => { G.theme = G.themePref === "system" ? (mq.matches ? "dark" : "light") : G.themePref; document.documentElement.dataset.theme = G.theme; };
  applyTheme(); mq.addEventListener && mq.addEventListener("change", () => G.themePref === "system" && applyTheme());

  /* Item 18: desktop nav; Map, Rivers and Roads are sections of the dashboard. */
  const NAV = [
    ["alerts", "alerts/", "सूचना", "Alerts"],
    ["map", "map/", "नक्सा", "Map"],
    ["rivers", "rivers/", "नदी", "Rivers"],
    ["roads", "roads/", "सडक", "Roads"],
    ["stories", "stories/", "सूचना फिड", "Feed"],
    ["patro", "patro/", "पात्रो", "Patro"],
    ["ask", "ask/", "सोध्नुहोस्", "Ask"],
    ["sources", "sources/", "स्रोत", "Sources"],
    ["about", "about/", "बारेमा", "About"],
  ];
  /* "More" menu (desktop) and extra links in the mobile menu */
  const MORE = [
    ["weather", "weather/", "मौसम र हावा", "Weather & air"],
    ["contacts", "contacts/", "आपतकालीन नम्बर", "Emergency numbers"],
    ["safety", "safety/", "के गर्ने", "What to do"],
    ["route", "route/", "मार्ग जाँच", "Route check"],
    ["earthquakes", "earthquakes/", "भूकम्प", "Earthquakes"],
  ];
  /* Mobile bottom bar */
  /* Mobile bottom bar: line icons (24px, 1.8 stroke). Home opens the real home page (?home skips the Feed redirect). */
  const ICON = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
  const TABS = [
    ["home", "?home=1", ICON('<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5.5h4v5.5"/>'), "गृहपृष्ठ", "Home"],
    ["alerts", "alerts/", ICON('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'), "सूचना", "Alerts"],
    ["stories", "stories/", ICON('<rect x="5" y="6" width="14" height="14.5" rx="2.5"/><path d="M8 3.5h8"/><path d="m10.5 10.5 4 2.75-4 2.75z"/>'), "सूचना फिड", "Feed"],
    ["map", "map/", ICON('<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>'), "नक्सा", "Map"],
    ["patro", "patro/", ICON('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 16.5h1M11.5 16.5h1"/>'), "पात्रो", "Patro"],
  ];
  const b = (ne, en) => `<span class="ne-only">${ne}</span><span class="en-only">${en}</span>`;
  G.b = b;
  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `<a class="skip" href="#main">${b("मुख्य भागमा जानुहोस्", "Skip to content")}</a>
  <div class="bar">
    <a class="brand" href="${ROOT}?home=1" aria-label="गति Gati"><img class="logo logo-l" src="${ROOT}assets/img/brand/logo-h.png" alt="" width="88" height="40"><img class="logo logo-d" src="${ROOT}assets/img/brand/logo-h-white.png" alt="" width="88" height="40"><small class="tagline">${b("सही सूचना, समयमै।", "The right alert, right on time.")}</small></a>
    <div class="prefs" role="group" aria-label="Display / देखाउने तरिका">
      <button class="pbtn" type="button" id="numbtn" title="Numerals / अङ्क"></button>
      <button class="pbtn" type="button" id="calbtn" title="BS / AD"></button>
      <button class="pbtn" type="button" id="thmbtn" title="Theme / रूप" aria-haspopup="true" aria-expanded="false"></button>
      <span class="tsize" id="txtbtn" role="group" aria-label="Text size / अक्षरको आकार"><button type="button" data-ts="-1" aria-label="Smaller text / सानो अक्षर">A−</button><button type="button" data-ts="0" aria-label="Default text size / सामान्य अक्षर">A</button><button type="button" data-ts="1" aria-label="Larger text / ठूलो अक्षर">A+</button></span></div>
    <button class="langbtn" type="button" id="langbtn" aria-label="Switch language / भाषा बदल्नुहोस्">${b("English", "नेपाली")}</button>
    <button class="mebtn" type="button" id="mebtn" aria-haspopup="dialog" aria-controls="medrawer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg></button>
    <button class="menubtn" type="button" aria-expanded="false" aria-controls="mainnav" aria-label="Menu">☰</button>
  </div>
  <nav class="main" id="mainnav" aria-label="Main"><a class="navhome" href="${ROOT}?home=1" aria-label="गृहपृष्ठ / Home" title="गृहपृष्ठ / Home"${PAGE === "home" ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>${NAV.map(([id, href, ne, en]) =>
    `<a href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}>${b(ne, en)}</a>`).join("")}
    <div class="more"><button type="button" class="morebtn" aria-expanded="false" aria-haspopup="true"${MORE.some((m) => m[0] === PAGE) ? ' aria-current="page"' : ""}>${b("थप", "More")} ▾</button>
      <div class="moremenu" role="menu" hidden>${MORE.map(([id, href, ne, en]) => `<a role="menuitem" href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}>${b(ne, en)}</a>`).join("")}</div></div></nav>`;
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
  G.breaking = () => G.json("data/alerts.json").then((d) => { const now = Date.now(), SV = ["Moderate", "Severe", "Extreme"];
    return d.alerts.filter((a) => a.trust === "Official" && !a.expired && !a.supersededBy && Date.parse(a.expires) > now && now - Date.parse(a.sent) < 864e5 && SV.includes(a.severity))
      .sort((a, b) => SV.indexOf(b.severity) - SV.indexOf(a.severity) || b.sent.localeCompare(a.sent)); });
  const BAG = { "hydrology.gov.np": "DHM", "dhm.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "neoc.moha.gov.np": "NEOC", "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "bipadportal.gov.np": "BIPAD", "seismonepal.gov.np": "NSC", "earthquake.usgs.gov": "USGS" };
  G.agencyOf = (a) => { const v = BAG[a.sender] || a.sender; return Array.isArray(v) ? (G.lang === "ne" ? v[0] : v[1]) : v; };
  const dismissed = () => { try { return JSON.parse(localStorage.getItem("gati-brk-dismissed") || "[]"); } catch (e) { return []; } };
  const brkItem = (a, x) => { const i = a.info[G.lang] || a.info.ne, c = G.SEVCOLOR[a.severity];
    return `<li style="--sc:${c}"><span class="brktag">${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking"}</span>${G.sevChip(a.severity)}<a class="brkh" href="${ROOT}alerts/${a.identifier}/">${G.esc(i.headline)}</a><span class="brkm">${G.esc(G.agencyOf(a))} · ${G.npt(a.sent)}</span>${x ? `<button type="button" class="brkx" data-id="${G.esc(a.identifier)}" aria-label="${G.lang === "ne" ? "यो सूचना लुकाउनुहोस्" : "Dismiss this alert"}">×</button>` : ""}</li>`; };
  const drawBreaking = () => G.breaking().then((L) => {
    const dis = dismissed(), show = L.filter((a) => !dis.includes(a.identifier));
    brk.hidden = !show.length; brk.innerHTML = show.length ? `<ul class="wrap" aria-label="${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking alerts"}">${show.map((a) => brkItem(a, true)).join("")}</ul>` : "";
    brk.querySelectorAll(".brkx").forEach((x) => (x.onclick = () => { try { localStorage.setItem("gati-brk-dismissed", JSON.stringify([...dismissed(), x.dataset.id].slice(-100))); } catch (e) {} drawBreaking(); }));
    const list = document.getElementById("breakinglist"); if (list) list.innerHTML = `<h2>${G.lang === "ne" ? "ताजा चेतावनी" : "Breaking"}</h2>` + (L.length ? `<ul class="brklist">${L.map((a) => brkItem(a, false)).join("")}</ul>` : `<p class="meta">${G.lang === "ne" ? "पछिल्लो २४ घण्टामा मध्यम वा सोभन्दा माथिको चालु आधिकारिक चेतावनी छैन।" : "No active official alert of Moderate or higher severity issued in the last 24 hours."}</p>`);
  }).catch(() => { brk.hidden = true; });
  if (document.body.dataset.page !== "embed") setTimeout(() => { drawBreaking(); G.onLang(drawBreaking); }, 0);
  document.body.append(footer);

  const mb = header.querySelector(".menubtn"), nav = header.querySelector("nav");
  const morebtn = header.querySelector(".morebtn"), moremenu = header.querySelector(".moremenu");
  morebtn.onclick = (e) => { e.stopPropagation(); const o = moremenu.hidden; moremenu.hidden = !o; morebtn.setAttribute("aria-expanded", o); };
  document.addEventListener("click", () => { moremenu.hidden = true; morebtn.setAttribute("aria-expanded", false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !moremenu.hidden) { moremenu.hidden = true; morebtn.focus(); } });
  mb.onclick = () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); };
  header.querySelector("#langbtn").onclick = () => G.setLang(G.lang === "ne" ? "en" : "ne");
  G.setLang = (l) => { G.lang = l; localStorage.setItem("gati-lang", l); document.documentElement.lang = l; G.listeners.forEach((f) => f(l)); };
  const save = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };
  const prefBtns = () => {
    const nb = header.querySelector("#numbtn"), cb = header.querySelector("#calbtn"), tb = header.querySelector("#thmbtn");
    nb.textContent = G.devNum() ? "१२३" : "123"; nb.setAttribute("aria-label", G.lang === "ne" ? "अङ्क: नेपाली वा अङ्ग्रेजी" : "Numerals: Nepali or Latin");
    cb.textContent = G.cal === "bs" ? (G.lang === "ne" ? "वि.सं." : "BS") : (G.lang === "ne" ? "ई.सं." : "AD");
    cb.setAttribute("aria-label", G.lang === "ne" ? "मिति: विक्रम संवत् वा ईस्वी संवत्" : "Dates: Bikram Sambat or Gregorian");
    tb.innerHTML = `<i class="thdot th-${G.theme}" aria-hidden="true"></i>`;
    tb.setAttribute("aria-label", G.lang === "ne" ? "रूप छान्नुहोस्" : "Choose theme");
  };
  header.querySelector("#numbtn").onclick = () => { G.numPref = G.devNum() ? "en" : "ne"; if (G.numPref === G.lang) G.numPref = ""; save("gati-num", G.numPref); G.listeners.forEach((f) => f(G.lang)); };
  header.querySelector("#calbtn").onclick = () => { G.cal = G.cal === "bs" ? "ad" : "bs"; save("gati-cal", G.cal === "bs" ? "bs" : ""); G.listeners.forEach((f) => f(G.lang)); };
  G.setTheme = (t) => { G.themePref = t; save("gati-theme-pref", t); save("gati-theme", ""); applyTheme(); G.listeners.forEach((f) => f(G.lang)); };
  /* Visual swatch picker, reused by the My Gati drawer */
  G.themePicker = () => `<div class="thgrid" role="radiogroup" aria-label="${G.lang === "ne" ? "रूप" : "Theme"}">${G.THEMES.map(([k, ne, en]) => `<button type="button" role="radio" class="thsw" data-th="${k}" aria-checked="${G.themePref === k}"><span class="thprev tp-${k}"><i></i><i></i><i></i></span><span>${G.lang === "ne" ? ne : en}</span></button>`).join("")}</div>`;
  G.bindThemePicker = (el) => el.querySelectorAll(".thsw").forEach((b) => (b.onclick = () => { G.setTheme(b.dataset.th); el.querySelectorAll(".thsw").forEach((x) => x.setAttribute("aria-checked", x.dataset.th === G.themePref)); }));
  const thpop = document.createElement("div"); thpop.className = "thpop"; thpop.hidden = true; header.querySelector(".prefs").appendChild(thpop);
  header.querySelector("#thmbtn").onclick = (e) => { e.stopPropagation(); const o = thpop.hidden; thpop.hidden = !o; header.querySelector("#thmbtn").setAttribute("aria-expanded", o); if (o) { thpop.innerHTML = G.themePicker(); G.bindThemePicker(thpop); thpop.querySelector("[aria-checked=true]").focus(); } };
  thpop.onclick = (e) => e.stopPropagation();
  document.addEventListener("click", () => { thpop.hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !thpop.hidden) { thpop.hidden = true; header.querySelector("#thmbtn").focus(); } });
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
  G.listeners.push(prefBtns);
  G.onLang = (f) => G.listeners.push(f);
  /* Tagline in the tab title follows the language */
  const TAG = ["सही सूचना, समयमै।", "The right alert, right on time."];
  const tagTitle = (l) => { const t = document.title; document.title = l === "en" ? t.replace(TAG[0], TAG[1]) : t.replace(TAG[1], TAG[0]); };
  G.listeners.push(tagTitle); tagTitle(G.lang);

  const DEV = "०१२३४५६७८९";
  G.devNum = () => (G.numPref || G.lang) === "ne";
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
  G.SEVCOLOR = { Extreme: "#7A0019", Severe: "#C81E1E", Moderate: "#E8770E", Minor: "#F5C518", Unknown: "#2B6CB0" };
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
  G.json = (p) => fetch(ROOT + p, { cache: "no-cache" }).then((r) => {
    if (p === "data/alerts.json" && navigator.onLine) try { localStorage.setItem("gati-last-sync", new Date().toISOString()); } catch (e) {}
    return r.json();
  });

  /* Demo mode (?demo=1): load the client-side scenario before page scripts run. */
  if (/[?&]demo=/.test(location.search) || sessionStorage.getItem("gati-demo-start")) {
    const x = new XMLHttpRequest(); x.open("GET", ROOT + "assets/js/demo.js", false);
    try { x.send(); if (x.status === 200) (0, eval)(x.responseText); } catch (e) {}
  }
  /* PWA: manifest, service worker, offline banner with the last-known state. */
  const mf = document.createElement("link"); mf.rel = "manifest"; mf.href = ROOT + "manifest.webmanifest"; document.head.append(mf);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(ROOT + "sw.js", { scope: ROOT }).catch(() => {});
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
  prefBtns();
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
    const clone = el.cloneNode(true); clone.querySelectorAll(".tts,.rail,button,.fbg,script").forEach((n) => n.remove());
    const text = clone.innerText.replace(/\s+/g, " ").trim().slice(0, 1500);
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
    if (el.classList.contains("rail")) el.prepend(b); else el.appendChild(b);
  }
  function scan() { document.querySelectorAll("article.alert").forEach((a) => mk(a, "ttsa")); document.querySelectorAll(".rail").forEach((r) => mk(r, "ttsr")); }
  new MutationObserver(() => { clearTimeout(scan.t); scan.t = setTimeout(scan, 150); }).observe(document.body, { childList: true, subtree: true });
  scan(); speechSynthesis.getVoices(); addEventListener("pagehide", stop);
})();
/* Ask pop-up (loaded on every page that uses common.js) */
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
        <div class="mecard-stats"><div><b>${G.num(String(watch()))}</b><span>${T("निगरानी", "Watching")}</span></div><div><b>${G.lang === "ne" ? "ने" : "EN"}</b><span>${T("भाषा", "Language")}</span></div><div><b>${G.devNum() ? "१२३" : "123"}</b><span>${T("अङ्क", "Numerals")}</span></div><div><b><i class="thdot th-${G.theme}"></i></b><span>${T(th[1], th[2])}</span></div></div>
        <div class="mecard-foot">🔔 ${notif}</div></div>
      <h3>${T("रूप", "Theme")}</h3><div class="methemes">${G.themePicker()}</div>
      <h3>${T("भाषा", "Language")}</h3><div class="melang" role="radiogroup"><button type="button" role="radio" aria-checked="${G.lang === "ne"}" data-l="ne"><b>नेपाली</b><small>Nepali</small></button><button type="button" role="radio" aria-checked="${G.lang === "en"}" data-l="en"><b>English</b><small>अङ्ग्रेजी</small></button></div>
      <h3>${T("सेटिङ", "Settings")}</h3><div class="merows">
        ${row("📍", "मेरो जिल्ला", "My district", dn ? esc(dn) : T("छान्नुहोस्", "Choose"), "dist")}
        ${row("⭐", "मेरो निगरानी सूची", "My watchlist", G.num(String(watch())), "watch")}
        ${row("१२", "अङ्क", "Numerals", G.devNum() ? "१२३" : "123", "num")}
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
      else if (a === "num") H.querySelector("#numbtn").click();
      else if (a === "cal") H.querySelector("#calbtn").click();
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

