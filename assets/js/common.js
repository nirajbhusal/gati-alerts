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
  G.theme = pref("gati-theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = G.theme;

  const NAV = [
    ["home", "", "गृहपृष्ठ", "Home"],
    ["nepal-now", "#nepal-now", "नेपाल अहिले", "Nepal Now"],
    ["stories", "stories/", "कथा", "Stories"],
    ["report", "report/", "रिपोर्ट गर्नुहोस्", "Report"],
    ["reports", "reports/", "नागरिक रिपोर्ट", "Reports"],
    ["sources", "sources/", "स्रोत", "Sources"],
    ["about", "about/", "बारेमा", "About"],
    ["contact", "contact/", "सम्पर्क", "Contact"],
  ];
  const b = (ne, en) => `<span class="ne-only">${ne}</span><span class="en-only">${en}</span>`;
  G.b = b;
  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `<a class="skip" href="#main">${b("मुख्य भागमा जानुहोस्", "Skip to content")}</a>
  <div class="bar">
    <a class="brand" href="${ROOT}"><img src="${ROOT}assets/img/gati-concept-A-ga-signal-icon.svg" alt="" width="40" height="40">
      <span><b>${b("गति", "Gati")}</b><small>${b("सही सूचना, समयमै।", "The right alert, right on time.")}</small></span></a>
    <div class="prefs" role="group" aria-label="Display / देखाउने तरिका">
      <button class="pbtn" type="button" id="numbtn" title="Numerals / अङ्क"></button>
      <button class="pbtn" type="button" id="calbtn" title="BS / AD"></button>
      <button class="pbtn" type="button" id="thmbtn" title="Dark mode / अँध्यारो"></button></div>
    <button class="langbtn" type="button" id="langbtn" aria-label="Switch language / भाषा बदल्नुहोस्">${b("English", "नेपाली")}</button>
    <button class="menubtn" type="button" aria-expanded="false" aria-controls="mainnav" aria-label="Menu">☰</button>
  </div>
  <nav class="main" id="mainnav" aria-label="Main">${NAV.map(([id, href, ne, en]) =>
    `<a href="${ROOT}${href}"${id === PAGE ? ' aria-current="page"' : ""}>${b(ne, en)}</a>`).join("")}</nav>`;
  const disc = document.createElement("div");
  disc.className = "disclaimer";
  disc.innerHTML = `<div class="wrap">${b(
    "<strong>गति आफैँ कुनै आधिकारिक चेतावनी जारी गर्दैन।</strong> यसले जिम्मेवार सरकारी निकायकै सूचना, स्रोतसहित, फैलाउने र जाँच्ने काम मात्र गर्छ (विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन ऐन, २०७४)। आपत्कालमा १००, १०१, १०२ वा ११४९ मा फोन गर्नुहोस्।",
    "<strong>Gati does not issue official warnings.</strong> It only relays and verifies notices from the mandated government agencies, always with the source (Disaster Risk Reduction and Management Act 2074). In an emergency call 100, 101, 102 or 1149.")}</div>`;
  const footer = document.createElement("footer");
  footer.innerHTML = `<div class="wrap">
    <div class="helplines" aria-label="Emergency helplines">
      <a href="tel:100">${b("प्रहरी १००", "Police 100")}</a><a href="tel:101">${b("दमकल १०१", "Fire 101")}</a>
      <a href="tel:102">${b("एम्बुलेन्स १०२", "Ambulance 102")}</a><a href="tel:1149">${b("विपद् ११४९", "Disaster 1149")}</a></div>
    <div>${b("गति एउटा स्वतन्त्र नागरिक परियोजना हो, कुनै सरकारी निकायको आधिकारिक प्रणाली होइन। सम्पादक: नीरज भुसाल।",
             "Gati is an independent citizen project, not an official system of any government agency. Maintainer: Niraj Bhusal.")}
      · <a href="https://nirajbhusal.github.io/rasuwa-flood-bulletin/">${b("रसुवा–भोटेकोशी बुलेटिन", "Rasuwa–Bhotekoshi bulletin")}</a>
      · <a href="${ROOT}atom.xml">CAP Atom feed</a> · <a href="${ROOT}data/alerts.json">JSON</a>
      · <a href="https://github.com/nirajbhusal/gati-alerts">GitHub</a></div></div>`;
  document.body.prepend(disc);
  document.body.prepend(header);
  document.body.append(footer);

  const mb = header.querySelector(".menubtn"), nav = header.querySelector("nav");
  mb.onclick = () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); };
  header.querySelector("#langbtn").onclick = () => G.setLang(G.lang === "ne" ? "en" : "ne");
  G.setLang = (l) => { G.lang = l; localStorage.setItem("gati-lang", l); document.documentElement.lang = l; G.listeners.forEach((f) => f(l)); };
  const save = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };
  const prefBtns = () => {
    const nb = header.querySelector("#numbtn"), cb = header.querySelector("#calbtn"), tb = header.querySelector("#thmbtn");
    nb.textContent = G.devNum() ? "१२३" : "123"; nb.setAttribute("aria-label", G.lang === "ne" ? "अङ्क: नेपाली वा अङ्ग्रेजी" : "Numerals: Nepali or Latin");
    cb.textContent = G.cal === "bs" ? (G.lang === "ne" ? "वि.सं." : "BS") : (G.lang === "ne" ? "ई.सं." : "AD");
    cb.setAttribute("aria-label", G.lang === "ne" ? "मिति: विक्रम संवत् वा ईस्वी संवत्" : "Dates: Bikram Sambat or Gregorian");
    tb.textContent = G.theme === "dark" ? "☀" : "☾"; tb.setAttribute("aria-pressed", G.theme === "dark");
    tb.setAttribute("aria-label", G.lang === "ne" ? "अँध्यारो रूप" : "Dark mode");
  };
  header.querySelector("#numbtn").onclick = () => { G.numPref = G.devNum() ? "en" : "ne"; if (G.numPref === G.lang) G.numPref = ""; save("gati-num", G.numPref); G.listeners.forEach((f) => f(G.lang)); };
  header.querySelector("#calbtn").onclick = () => { G.cal = G.cal === "bs" ? "ad" : "bs"; save("gati-cal", G.cal === "bs" ? "bs" : ""); G.listeners.forEach((f) => f(G.lang)); };
  header.querySelector("#thmbtn").onclick = () => { G.theme = G.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = G.theme; save("gati-theme", G.theme); prefBtns(); };
  G.listeners.push(prefBtns);
  G.onLang = (f) => G.listeners.push(f);

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
  disc.after(off);
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
