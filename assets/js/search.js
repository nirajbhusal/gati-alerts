/* Site-wide data search: client-side index of alerts (active and archived), districts and palikas, roads, rivers, contacts,
   safety cards, Patro holidays and pages. Nepali and English, Romanized district names. Shortcut '/', URL ?q=. Nothing leaves the browser. */
(function () {
  const G = window.Gati; if (!G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, R = G.root;
  /* normalise: lower case, drop marks, fold common Romanization variants (aa->a, w->v, sh->s, ee->i, oo->u, ph->f, double letters) */
  const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\u0900-\u097F ]/gu, " ").replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u").replace(/w/g, "v").replace(/sh/g, "s").replace(/ph/g, "f").replace(/([kgcjtdb])h/g, "$1").replace(/([a-z])\1/g, "$1").replace(/\s+/g, " ").trim();
  let IDX = null, building = null;
  const get = (p) => G.json(p).catch(() => null);
  function build() {
    if (building) return building;
    building = Promise.all(["data/alerts.json", "data/districts.json", "data/localunits.geojson", "data/roads.json", "data/rivers.json", "data/contacts.json", "data/calendar.json"].map(get)).then(async ([AL, DL, LU, RD, RV, CT, CAL]) => {
      const I = [], add = (type, ne, en, href, extra = {}) => I.push({ type, ne, en, href, key: norm([ne, en, extra.alt || ""].join(" ")), ...extra });
      const dn = {}; (DL || []).forEach((d) => { dn[d.code] = d; add("district", d.ne, d.en, `affected/#d=${d.code}`, { alt: d.id + " " + d.province, sub: [T("जिल्ला", "District"), ""] }); });
      (LU ? LU.features : []).forEach((f) => { const d = dn[f.properties.district]; add("palika", f.properties.ne || f.properties.en, f.properties.en, `affected/#d=${f.properties.district}&u=${f.properties.code}`, { alt: d ? d.en + " " + d.ne : "", sub: d ? [d.ne, d.en] : null }); });
      const isAct = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > Date.now();
      (AL ? AL.alerts : []).forEach((a) => { const n = a.info.ne || {}, e = a.info.en || {}; add("alert", n.headline, e.headline, `alerts/${a.identifier}/`, { alt: [n.description, e.description, (a.areas || []).map((x) => x.en + " " + x.ne).join(" "), a.hazard, G.agencyOf(a)].join(" "), trust: a.trust, time: a.sent, sev: a.severity, act: isAct(a) }); });
      (RD ? RD.routes : []).forEach((r) => add("road", r.name_ne, r.name_en, `route/`, { alt: r.id, status: r.status, time: RD.as_of, trust: "Official" }));
      (RV ? RV.gauges : []).forEach((g) => add("river", g.ne, g.en, `rivers/`, { alt: g.district, time: RV.as_of + "T12:00:00+05:45", trust: "Official" }));
      (CT ? Object.values(CT).filter(Array.isArray).flat() : []).forEach((c) => c.num && add("contact", `${c.ne} ${c.num}`, `${c.en} ${c.num}`, `tel:${c.num}`, { alt: c.num, trust: "Official" }));
      (CAL ? CAL.entries : []).filter((e) => e.type === "holiday").forEach((e) => add("holiday", e.title_ne, e.title_en, `patro/`, { alt: e.date_bs + " " + e.date_ad, time: e.date_ad + "T00:00:00+05:45", trust: e.trust, dateOnly: true }));
      (G.PAGES || []).forEach(([id, href, ne, en]) => add("page", ne, en, href, { alt: id }));
      try { const h = await fetch(R + "safety/").then((r) => r.text()); const d = new DOMParser().parseFromString(h, "text/html");
        d.querySelectorAll("article.scard").forEach((c) => add("safety", (c.querySelector("h2 .ne-only") || {}).textContent, (c.querySelector("h2 .en-only") || {}).textContent, `safety/#${c.id}`, { alt: c.id + " " + c.textContent })); } catch (e) {}
      IDX = I; return I; });
    return building;
  }
  const TYPES = [["alert", "सूचना", "Alerts"], ["district", "जिल्ला", "Districts"], ["palika", "पालिका", "Local units"], ["road", "सडक", "Roads"], ["river", "नदी / केन्द्र", "Rivers and stations"], ["contact", "आपतकालीन नम्बर", "Emergency numbers"], ["safety", "के गर्ने", "What to do"], ["holiday", "बिदा (पात्रो)", "Holidays (Patro)"], ["page", "पृष्ठ", "Pages"]];
  function search(q) {
    const n = norm(q); if (!n || !IDX) return [];
    const words = n.split(" ");
    return IDX.map((x) => { const nm = norm(x.ne + " " + x.en); let sc = 0;
      if (!words.every((w) => x.key.includes(w))) return null;
      if (nm.startsWith(n)) sc += 10; if (nm.includes(n)) sc += 5; if (x.act) sc += 3; if (x.time) sc += Date.parse(x.time) / 1e13;
      return { x, sc }; }).filter(Boolean).sort((a, b) => b.sc - a.sc).map((r) => r.x);
  }
  let ov = null;
  function open(q0 = "") {
    if (!ov) {
      ov = document.createElement("div"); ov.className = "gsrch"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Search / खोज्नुहोस्"); ov.hidden = true;
      ov.innerHTML = `<div class="srback"></div><div class="srpanel"><div class="srbar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" id="srq" autocomplete="off" enterkeyhint="search"><button type="button" class="srx">Esc</button></div><div class="srres" aria-live="polite"></div></div>`;
      document.body.appendChild(ov);
      const close = () => { ov.hidden = true; document.documentElement.classList.remove("srlock"); const u = new URL(location.href); if (u.searchParams.has("q")) { u.searchParams.delete("q"); history.replaceState(null, "", u); } };
      ov.querySelector(".srback").onclick = close; ov.querySelector(".srx").onclick = close;
      ov.addEventListener("keydown", (e) => { if (e.key === "Escape") close();
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { const L = [...ov.querySelectorAll(".srres a")]; if (!L.length) return; e.preventDefault(); const i = L.indexOf(document.activeElement); const n = e.key === "ArrowDown" ? (i + 1) % L.length : i <= 0 ? -1 : i - 1; (n < 0 ? ov.querySelector("#srq") : L[n]).focus(); } });
      const inp = ov.querySelector("#srq"); let t; inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { draw(inp.value); const u = new URL(location.href); inp.value ? u.searchParams.set("q", inp.value) : u.searchParams.delete("q"); history.replaceState(null, "", u); }, 120); };
      inp.onkeydown = (e) => { if (e.key === "Enter") { const a = ov.querySelector(".srres a"); if (a) a.click(); } };
    }
    const inp = ov.querySelector("#srq"); inp.placeholder = T("खोज्नुहोस्: जिल्ला, पालिका, नदी, सडक, सूचना… (जस्तै rasuwa, बाढी)", "Search districts, palikas, rivers, roads, alerts… (e.g. rasuwa, flood)");
    ov.querySelector(".srx").setAttribute("aria-label", T("बन्द गर्नुहोस्", "Close"));
    ov.hidden = false; document.documentElement.classList.add("srlock"); inp.value = q0; inp.focus();
    ov.querySelector(".srres").innerHTML = `<p class="srhint">${T("सूची तयार हुँदै…", "Building the index…")}</p>`;
    build().then(() => draw(inp.value));
  }
  function draw(q) {
    const box = ov.querySelector(".srres");
    if (!q.trim()) { box.innerHTML = `<p class="srhint">${T("गतिका सबै सूचना (चालु र पुराना), जिल्ला, पालिका, सडक, नदी, आपतकालीन नम्बर, के गर्ने, बिदा र पृष्ठ खोज्न सकिन्छ। नेपाली वा English (rasuwa, kavre, sindhupalchok)।", "Search every alert (active and archived), district, palika, road, river, emergency number, safety card, holiday and page. Nepali or English, including Romanized names.")} <kbd>/</kbd></p>`; return; }
    const res = search(q);
    if (!res.length) { box.innerHTML = `<p class="srhint">${T("केही भेटिएन।", "Nothing found.")} “${E(q)}”</p>`; return; }
    box.innerHTML = TYPES.map(([k, ne, en]) => { const L = res.filter((r) => r.type === k); if (!L.length) return "";
      return `<section><h3>${T(ne, en)} <span>${G.num(String(L.length))}</span></h3><ul>${L.slice(0, k === "alert" ? 8 : 5).map((r) => `<li><a href="${r.href.startsWith("tel:") ? r.href : R + r.href}"><span class="srt">${r.sev ? `<i class="srsev" style="background:${G.SEVCOLOR[r.sev] || G.SEVCOLOR.Unknown}"></i>` : ""}${E(T(r.ne || r.en, r.en || r.ne))}</span><span class="srm">${r.sub ? E(T(r.sub[0], r.sub[1] || r.sub[0])) : ""}${r.type === "alert" ? (r.act ? T("चालु", "Active") : T("पुरानो", "Archived")) : ""}${r.time ? ` · ${r.dateOnly ? G.npt(r.time).split(" · ")[0] : r.type === "river" ? T("तथ्याङ्क", "data") + " " + G.npt(r.time).split(" · ")[0] : G.npt(r.time)}` : ""} ${r.trust ? G.trustChip(r.trust) : ""}</span></a></li>`).join("")}</ul></section>`; }).join("");
  }
  const btn = document.getElementById("srchbtn"); if (btn) btn.onclick = () => open();
  document.addEventListener("keydown", (e) => { if (e.key === "/" && !e.ctrlKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); open(); } });
  const q = new URLSearchParams(location.search).get("q"); if (q) open(q);
  G.search = { open };
})();
