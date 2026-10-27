/* Profile & Settings (me/): one page for what used to be the My Gati drawer and the Settings sheet.
   Same storage keys as before: gati-district, gati-district-recent, gati-aff-radius (affectcore), gati-watch,
   gati-push-district, gati-notif-seen, gati-lang, gati-theme-pref, gati-cal, gati-tsize. Nothing leaves this browser. */
(function () {
  const G = window.Gati; if (!G || document.body.dataset.page !== "me") return;
  const R = G.root, E = G.esc, T = (ne, en) => (G.lang === "ne" ? ne : en), $ = (id) => document.getElementById(id);
  const seg = (k, opts, cur, lab) => `<div class="setseg" role="radiogroup" aria-label="${E(lab)}" data-k="${k}">${opts.map(([v, l]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${v === cur}">${l}</button>`).join("")}</div>`;
  const watch = () => { try { const w = JSON.parse(localStorage.getItem("gati-watch") || "{}"); return (w.d || []).length + (w.r || []).length; } catch (e) { return 0; } };
  async function place() {
    const box = $("me-place"), code = G.district.get();
    let dn = ""; try { dn = code ? await G.district.name(code) : ""; } catch (e) {}
    box.innerHTML = `<div class="merow2"><span class="melab">📍 ${T("मेरो जिल्ला", "My district")}</span><b class="meval" id="me-dname">${dn ? E(dn) : T("छानिएको छैन", "Not chosen")}</b>
      <button type="button" class="btn" id="me-pick">${dn ? T("बदल्नुहोस्", "Change") : T("छान्नुहोस्", "Choose")}</button></div>
      <div id="me-rad">${G.affect ? G.affect.radiusUI(G.affect.getR()) : ""}</div>
      <p class="meta">${T("गृहपृष्ठ र 'के म प्रभावित छु?' मा प्रयोग हुन्छ।", "Used on Home and in 'Am I affected?'.")} <a href="${R}affected/${code ? "#d=" + encodeURIComponent(code) : ""}">${T("के म प्रभावित छु?", "Am I affected?")} →</a></p>
      <div class="merow2"><span class="melab">⭐ ${T("मेरो निगरानी सूची", "My watchlist")}</span><b class="meval">${G.num(String(watch()))}</b><a href="${R}?home=1#watch">${T("हेर्नुहोस्", "Open")}</a></div>`;
    $("me-pick").onclick = () => G.district.open(() => place());
    if (G.affect) G.affect.bindRadius($("me-rad"), () => dispatchEvent(new Event("gati:radius")));
  }
  function alerts() {
    const box = $("me-alerts");
    box.innerHTML = `<div id="me-ntpane"></div><p class="meta">🔔 ${T("सूचना पाउने अर्को तरिका", "Another way to get alerts")}: <a href="${R}atom.xml">CAP Atom feed</a> · <a href="${R}feed.xml">RSS</a></p>`;
    const pr = G.drawNotif ? G.drawNotif($("me-ntpane")) : Promise.resolve();
    if (G.markNotifSeen) G.markNotifSeen();
    return pr;
  }
  function display() {
    const box = $("me-display");
    box.innerHTML = `<h3>${T("भाषा", "Language")}</h3>${seg("lang", [["ne", "नेपाली"], ["en", "English"]], G.lang, T("भाषा", "Language"))}
      <h3>${T("रूप", "Theme")}</h3>${seg("theme", G.THEMES.map(([k, ne, en]) => [k, T(ne, en)]), G.themePref, T("रूप", "Theme"))}
      <h3>${T("अङ्क", "Numerals")}</h3><p class="meta">${T("अङ्क भाषासँगै बदलिन्छन्: नेपालीमा ०१२३, अङ्ग्रेजीमा 0123।", "Numerals follow the language: ०१२३ in Nepali, 0123 in English.")}</p>
      <h3>${T("मिति", "Calendar")}</h3>${seg("cal", [["bs", T("वि.सं.", "BS")], ["ad", T("ई.सं.", "AD")]], G.cal === "bs" ? "bs" : "ad", T("मिति", "Calendar"))}
      <h3>${T("अक्षरको आकार", "Text size")}</h3><span class="tsize setseg" role="group" aria-label="${T("अक्षरको आकार", "Text size")}"><button type="button" data-ts="-1" aria-label="${T("सानो अक्षर", "Smaller text")}">A−</button><button type="button" data-ts="0" aria-label="${T("सामान्य अक्षर", "Default text size")}">A</button><button type="button" data-ts="1" aria-label="${T("ठूलो अक्षर", "Larger text")}">A+</button><output>${G.num(String(G.textSize()))}%</output></span>`;
    box.querySelectorAll(".setseg[data-k] button").forEach((b) => (b.onclick = () => { const k = b.parentElement.dataset.k, v = b.dataset.v;
      if (k === "lang") G.setLang(v); else if (k === "cal") { G.setCal(v); alerts(); } else if (k === "theme") G.setTheme(v);
      display(); const nb = box.querySelector(`[data-k="${k}"] [data-v="${v}"]`); if (nb) nb.focus(); }));
    G.bindTsize(box); G.setTextSize(G.textSize());
  }
  let lastLang = G.lang; const all = () => { display(); return Promise.all([place(), alerts()]).catch(() => {}); };
  G.onLang((l) => { if (l !== lastLang) { lastLang = l; all(); } });
  /* CLS: sections stay hidden (space kept by min-height on main) until every async part is filled, then show at once */
  const m = $("main"); m.classList.add("mewait"); const done = () => m.classList.remove("mewait"); setTimeout(done, 1500); all().then(done);
  if (location.hash) { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
})();
