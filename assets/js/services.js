/* Home services grid and quick strip (Hamro Patro style tiles). Links only; no data invented. */
(function () {
  const G = window.Gati, R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en);
  const box = document.getElementById("services"); if (!box) return;
  const I = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const S = [
    ["alerts/", "सूचना", "Alerts", "#DC143C", I('<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>'), "alert notice warning"],
    ["map/", "नक्सा", "Map", "#003893", I('<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>'), "map"],
    ["weather/", "मौसम र हावा", "Weather & air", "#0284c7", I('<path d="M7 18a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 12 3 3 0 0 1 18 18z"/><path d="M8 21l1-2M12 21l1-2M16 21l1-2"/>'), "weather rain aqi air"],
    ["rivers/", "नदी", "Rivers", "#0891b2", I('<path d="M3 8c2 0 2-1.5 4.5-1.5S10 8 12 8s2.5-1.5 4.5-1.5S19 8 21 8M3 13c2 0 2-1.5 4.5-1.5S10 13 12 13s2.5-1.5 4.5-1.5S19 13 21 13M3 18c2 0 2-1.5 4.5-1.5S10 18 12 18s2.5-1.5 4.5-1.5S19 18 21 18"/>'), "river flood"],
    ["roads/", "सडक", "Roads", "#ea580c", I('<path d="M8 3 4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3"/>'), "road highway"],
    ["route/", "मार्ग जाँच", "Route check", "#16a34a", I('<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>'), "route travel"],
    ["earthquakes/", "भूकम्प", "Earthquakes", "#7c3aed", I('<path d="M2 12h4l2-6 3 12 3-9 2 3h6"/>'), "earthquake quake"],
    ["patro/", "पात्रो", "Patro", "#be123c", I('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'), "calendar holiday"],
    ["contacts/", "आपतकालीन नम्बर", "Emergency numbers", "#b91c1c", I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'), "phone call police ambulance"],
    ["safety/", "के गर्ने", "What to do", "#ca8a04", I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'), "safety guide"],
    ["stories/", "सूचना फिड", "Feed", "#db2777", I('<rect x="5" y="6" width="14" height="14.5" rx="2.5"/><path d="m10.5 10.5 4 2.75-4 2.75z"/>'), "feed stories"],
    ["sources/", "स्रोत", "Sources", "#475569", I('<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>'), "source agency"],
    ["about/", "बारेमा", "About", "#64748b", I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'), "about"],
  ];
  let all = false;
  function draw() {
    const q = (box.querySelector("#svq") || {}).value || "";
    const L = S.filter((s) => !q || (s[1] + s[2] + s[5]).toLowerCase().includes(q.toLowerCase()));
    const shown = q || all ? L : L.slice(0, 8);
    const now = new Date(Date.now() + 345 * 60000), h = now.getUTCHours(), t = window.BS ? BS.todayNP() : null, b = t ? BS.toBS(t.y, t.m, t.d) : null;
    // greeting removed in minimal design
    const _g = h < 12 ? T("शुभ प्रभात, हजुर", "Good morning") : h < 17 ? T("नमस्ते, हजुर", "Good afternoon") : T("शुभ सन्ध्या, हजुर", "Good evening");
    const bsTxt = b ? (G.lang === "ne" ? `${BS.MN[b.m - 1]} ${G.num(String(b.d))}, ${G.num(String(b.y))}` : `${b.d} ${BS.ME[b.m - 1]} ${b.y} BS`) : "";
    box.innerHTML = `<p class="htag">${T("सही सूचना, समयमै।", "The right alert, right on time.")}</p><p class="hdate">${bsTxt} · ${T(BS.WN[now.getUTCDay()], BS.WE[now.getUTCDay()])}</p>
      <div class="qstrip" role="list">
        <button type="button" role="listitem" class="qs" data-q="near"><span>◎</span>${T("के म प्रभावित छु?", "Am I affected?")}</button>
        <a role="listitem" class="qs" href="tel:1234"><span>☎</span>${T("१२३४ विपद्", "1234 Disaster")}</a>
        <button type="button" role="listitem" class="qs" data-q="dist"><span>⌂</span>${T("मेरो जिल्ला", "My district")}</button>
        <a role="listitem" class="qs" href="${R}weather/"><span>☁</span>${T("आजको मौसम", "Today's weather")}</a>
        <a role="listitem" class="qs" href="${R}route/"><span>⇄</span>${T("मार्ग जाँच", "Route check")}</a>
        <a role="listitem" class="qs" href="${R}patro/"><span>▦</span>${T("आजको पात्रो", "Today's Patro")}</a></div>
      <section class="svcard"><div class="svhead"><h2>${T("सेवाहरू", "Services")}</h2><label class="svsearch"><span class="sr-only">${T("सेवा खोज्नुहोस्", "Search services")}</span><input id="svq" type="search" value="${G.esc(q)}" placeholder="${T("सेवा खोज्नुहोस्", "Search services")}"></label></div>
      <div class="svgrid">${shown.map(([h, ne, en, c, ic]) => `<a class="svt" href="${R}${h}"><span class="svi">${ic}</span><span class="svl">${T(ne, en)}</span></a>`).join("") || `<p class="meta">${T("मिल्ने सेवा भेटिएन।", "No matching service.")}</p>`}</div>
      ${q || L.length <= 8 ? "" : `<button type="button" class="svmore" aria-expanded="${all}">${all ? T("कम देखाउनुहोस्", "Show less") : T("थप हेर्नुहोस्", "See more")} ${all ? "▴" : "▾"}</button>`}</section>`;
    const i = box.querySelector("#svq"); i.oninput = () => { const p = i.selectionStart; draw(); const j = box.querySelector("#svq"); j.focus(); j.setSelectionRange(p, p); };
    const m = box.querySelector(".svmore"); if (m) m.onclick = () => { all = !all; draw(); };
    box.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { if (b.dataset.q === "near" && G.nearby) G.nearby.open(); if (b.dataset.q === "dist" && G.district) G.district.open(() => location.reload()); }));
  }
  draw(); G.onLang(draw);
})();
