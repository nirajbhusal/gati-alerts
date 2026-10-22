/* Gati shared shell: header, nav, disclaimer, footer, language toggle, helpers. */
(function () {
  const ROOT = document.body.dataset.root || "./";
  const PAGE = document.body.dataset.page;
  const saved = localStorage.getItem("gati-lang");
  const G = (window.Gati = { root: ROOT, lang: saved === "en" ? "en" : "ne", listeners: [] });
  document.documentElement.lang = G.lang;

  const NAV = [
    ["home", "", "गृहपृष्ठ", "Home"],
    ["nepal-now", "#nepal-now", "नेपाल अहिले", "Nepal Now"],
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
      · <a href="${ROOT}feed.xml">CAP Atom feed</a> · <a href="${ROOT}data/alerts.json">JSON</a>
      · <a href="https://github.com/nirajbhusal/gati-alerts">GitHub</a></div></div>`;
  document.body.prepend(disc);
  document.body.prepend(header);
  document.body.append(footer);

  const mb = header.querySelector(".menubtn"), nav = header.querySelector("nav");
  mb.onclick = () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); };
  header.querySelector("#langbtn").onclick = () => G.setLang(G.lang === "ne" ? "en" : "ne");
  G.setLang = (l) => { G.lang = l; localStorage.setItem("gati-lang", l); document.documentElement.lang = l; G.listeners.forEach((f) => f(l)); };
  G.onLang = (f) => G.listeners.push(f);

  const DEV = "०१२३४५६७८९";
  G.num = (s) => (G.lang === "ne" ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  G.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MON_NE = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"];
  const MON_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  /* Format any ISO time in Nepal Time (UTC+5:45). */
  G.npt = (iso) => {
    const d = new Date(new Date(iso).getTime() + 345 * 60000);
    const day = d.getUTCDate(), m = d.getUTCMonth(), y = d.getUTCFullYear();
    let h = d.getUTCHours(); const mi = String(d.getUTCMinutes()).padStart(2, "0");
    if (G.lang === "ne") return G.num(`${MON_NE[m]} ${day}, ${y} · ${h}:${mi}`) + " NPT";
    const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return `${day} ${MON_EN[m]} ${y} · ${h}:${mi} ${ap} NPT`;
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
  G.json = (p) => fetch(ROOT + p, { cache: "no-cache" }).then((r) => r.json());
})();
