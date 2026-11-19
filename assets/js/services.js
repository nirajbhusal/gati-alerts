/* Home services grid and quick strip (Hamro Patro style tiles). Links only; no data invented. */
(function () {
  const G = window.Gati, R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en);
  const box = document.getElementById("services"); if (!box) return;
  const I = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const S = [
    ["affected/", "के म प्रभावित छु?", "Am I affected?", "#0B1424", I('<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>'), "affected near me location verdict"],
    ["route/", "मार्ग जाँच", "Route check", "#16a34a", I('<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>'), "route travel journey bato marga yatra"],
    ["alerts/", "सूचना", "Alerts", "#0B1424", I('<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>'), "alert notice warning"],
    ["contacts/", "आपतकालीन नम्बर", "Emergency numbers", "#b91c1c", I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'), "phone call police ambulance emergency number"],
    ["map/", "नक्सा", "Map", "#0B1424", I('<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>'), "map"],
    ["weather/", "मौसम र हावा", "Weather & air", "#0284c7", I('<path d="M7 18a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 12 3 3 0 0 1 18 18z"/><path d="M8 21l1-2M12 21l1-2M16 21l1-2"/>'), "weather rain aqi air"],
    ["roads/", "सडक", "Roads", "#ea580c", I('<path d="M8 3 4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3"/>'), "road highway"],
    ["health/", "अस्पताल बेड र रक्त सञ्चार", "Hospital beds & blood", "#be123c", I('<path d="M3 12h7V5h4v7h7v4h-7v7h-4v-7H3z"/><path d="M19 17.2c0 1.6-1.3 2.8-1.3 2.8S16.4 18.8 16.4 17.2a1.3 1.3 0 0 1 2.6 0z"/>'), "hospital bed blood bank rakta aspatal health"],
    ["flights/", "उडान र विमानस्थल", "Flights & airports", "#0369a1", I('<path d="M2.5 13.5l19-7-5 14-3.5-6z"/><path d="M13 14.5l8.5-8"/>'), "flight udan airport bimansthal plane pokhara metar visibility fog delay"],
    ["fuel/", "इन्धन मूल्य", "Fuel prices", "#c2410c", I('<path d="M6 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M6 21h10M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h0M9 8h3"/>'), "fuel petrol diesel indhan tel price noc"],
    ["notifications/", "सूचना र नोटिफिकेसन", "Alerts & notifications", "#0B1424", I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>'), "notification bell suchana alert watch"],
    ["trek/", "पदमार्ग", "Trekking", "#15803d", I('<path d="M3 19 9.5 8l4 5.5 2.2-3L21 19z"/><path d="M14 8.5 15.2 6"/>'), "trek trail padmarga hike walk route"],
    ["report/", "रिपोर्ट गर्नुहोस्", "Report", "#0F7C86", I('<path d="M5 20h4L19 10l-4-4L5 16z"/><path d="m13 8 4 4"/>'), "report citizen tip report garnus"],
    ["rivers/", "नदी", "Rivers", "#0891b2", I('<path d="M3 8c2 0 2-1.5 4.5-1.5S10 8 12 8s2.5-1.5 4.5-1.5S19 8 21 8M3 13c2 0 2-1.5 4.5-1.5S10 13 12 13s2.5-1.5 4.5-1.5S19 13 21 13M3 18c2 0 2-1.5 4.5-1.5S10 18 12 18s2.5-1.5 4.5-1.5S19 18 21 18"/>'), "river flood"],
    ["earthquakes/", "भूकम्प", "Earthquakes", "#7c3aed", I('<path d="M2 12h4l2-6 3 12 3-9 2 3h6"/>'), "earthquake quake"],
    ["patro/", "पात्रो", "Patro", "#be123c", I('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'), "calendar holiday"],
    ["safety/", "के गर्ने", "What to do", "#ca8a04", I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'), "safety guide"],
    ["feed/", "सूचना फिड", "Feed", "#db2777", I('<rect x="5" y="6" width="14" height="14.5" rx="2.5"/><path d="m10.5 10.5 4 2.75-4 2.75z"/>'), "feed stories"],
    ["sources/", "स्रोत", "Sources", "#475569", I('<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>'), "source agency"],
    ["about/", "बारेमा", "About", "#64748b", I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'), "about"],
  ];
  /* one line per feature, shown on wide screens where each feature is a card */
  const DESC = { "affected/": ["मेरो जिल्लामा के लागू छ", "What applies to my district"], "route/": ["बाटो खुला छ कि छैन, सेयर कार्डसहित", "Is the road open, with a card to share"], "alerts/": ["मेरो नजिकका र सबै सक्रिय सूचना", "Alerts near me and every active alert"], "contacts/": ["प्रहरी, एम्बुलेन्स, दमकल, जिल्ला कार्यालय", "Police, ambulance, fire, district offices"],
    "map/": ["सूचना, सडक, नदी, भूकम्प एउटै नक्सामा", "Alerts, roads, rivers, earthquakes on one map"], "weather/": ["DHM चेतावनी, पूर्वानुमान, वर्षा, हावा", "DHM warning, forecast, rain and air"], "roads/": ["राजमार्गको आधिकारिक स्थिति", "Official status of the highways"], "health/": ["अस्पतालका बेड र रक्त सञ्चार", "Hospital beds and blood banks"],
    "flights/": ["विमानस्थलको मौसम, उडान स्थिति होइन", "Airport weather, not flight status"], "fuel/": ["नेपाल आयल निगमको मूल्य", "Nepal Oil Corporation prices"], "notifications/": ["मेरो जिल्लाका सूचना छान्नुहोस्", "Choose alerts for my district"], "trek/": ["पदमार्ग, अनुमति र सम्पर्क", "Trails, permits and contacts"],
    "report/": ["देखेको जोखिम पठाउनुहोस्", "Send a hazard you have seen"], "rivers/": ["DHM का नदी मापन केन्द्र", "DHM river gauges"], "earthquakes/": ["हालका भूकम्प", "Recent earthquakes"], "patro/": ["बिदा, सूर्योदय र मौसमी जोखिम", "Holidays, sunrise and seasonal risks"],
    "safety/": ["विपद् अघि, बेला र पछि", "Before, during and after a hazard"], "feed/": ["सूचना स्वाइप गरेर हेर्नुहोस्", "Swipe through the alerts"], "sources/": ["कुन निकायबाट, कहिले", "Which agency, and when"], "about/": ["गति के हो र के होइन", "What Gati is and is not"] };
  const MQ = matchMedia("(min-width:900px)");
  let all = false;
  function draw() {
    const q = (box.querySelector("#svq") || {}).value || "";
    const L = S.filter((s) => !q || (s[1] + s[2] + s[5]).toLowerCase().includes(q.toLowerCase()));
    const big = MQ.matches, shown = q || all || big ? L : L.slice(0, 8);
    const now = new Date(Date.now() + G.tzMs), h = now.getUTCHours(), t = window.BS ? BS.todayNP() : null, b = t ? BS.toBS(t.y, t.m, t.d) : null;
    // greeting removed in minimal design
    const _g = h < 12 ? T("शुभ प्रभात, हजुर", "Good morning") : h < 17 ? T("नमस्ते, हजुर", "Good afternoon") : T("शुभ सन्ध्या, हजुर", "Good evening");
    const bsTxt = b ? (G.lang === "ne" ? `${BS.MN[b.m - 1]} ${G.num(String(b.d))}, ${G.num(String(b.y))}` : `${b.d} ${BS.ME[b.m - 1]} ${b.y} BS`) : "";
    const ht = document.getElementById("htop"); if (ht) ht.innerHTML = ""; // tagline lives in the header
    box.innerHTML = `<section class="svcard"><div class="svhead"><h2>${T("सुविधाहरू", "Features")}</h2></div>
      <div class="svgrid">${shown.map(([h, ne, en, c, ic]) => `<a class="svt" href="${R}${h}"><span class="svi">${ic.replace("<svg ", `<svg class="mic mic-${h.replace("/", "")}" `)}</span><span class="svx"><span class="svl">${T(ne, en)}</span>${DESC[h] ? `<span class="svd">${T(DESC[h][0], DESC[h][1])}</span>` : ""}</span></a>`).join("") || `<p class="meta">${T("मिल्ने सुविधा भेटिएन।", "No matching feature.")}</p>`}</div>
      ${q || big || L.length <= 8 ? "" : `<button type="button" class="svmore" aria-expanded="${all}">${all ? T("कम देखाउनुहोस्", "Show less") : T("थप हेर्नुहोस्", "See more")} ${all ? "▴" : "▾"}</button>`}</section>`;
    const m = box.querySelector(".svmore"); if (m) m.onclick = () => { all = !all; draw(); };
    box.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { if (b.dataset.q === "near" && G.nearby) G.nearby.open(); if (b.dataset.q === "dist" && G.district) G.district.open(() => location.reload()); }));
  }
  draw(); G.onLang(draw); MQ.addEventListener("change", draw);
})();
