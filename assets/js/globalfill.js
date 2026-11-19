/* When a Nepali source is not reachable or has gone stale, show what a global source says in the meantime,
   instead of leaving the gap empty. Supplementary only: models and global feeds, read in the reader's browser.
   Nothing here becomes a Gati alert, enters a count or replaces the agency's own figure.
   Home: every gap. Rivers page (body[data-page=rivers]): the river gap only. */
(function () {
  const G = window.Gati; if (!G) return;
  const page = document.body.dataset.page, anchor = page === "home" ? document.getElementById("srcflag") : page === "rivers" ? document.getElementById("gauges") : null; if (!anchor) return;
  const box = document.createElement("section"); box.id = "gmean"; box.className = "card gmean"; box.hidden = true;
  if (page === "home") anchor.after(box); else anchor.before(box);
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v));
  const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
  const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
  const CITIES = [["काठमाडौँ", "Kathmandu", 27.7172, 85.324], ["पोखरा", "Pokhara", 28.2096, 83.9856], ["विराटनगर", "Biratnagar", 26.4525, 87.2718], ["नेपालगन्ज", "Nepalgunj", 28.05, 81.6167]];
  const AQ = [[50, "राम्रो", "Good"], [100, "मध्यम", "Moderate"], [150, "संवेदनशीलका लागि अस्वस्थ", "Unhealthy for sensitive groups"], [200, "अस्वस्थ", "Unhealthy"], [300, "धेरै अस्वस्थ", "Very unhealthy"], [9999, "खतरनाक", "Hazardous"]];
  const GD = { EQ: ["भूकम्प", "Earthquake"], FL: ["बाढी", "Flood"], TC: ["चक्रवात", "Cyclone"], DR: ["खडेरी", "Drought"], WF: ["डढेलो", "Wildfire"] };

  /* each gap: what is missing, who fills it, and how to read their answer into short lines */
  const FILL = {
    rivers: { miss: () => T("नदी: DHM को नाप पुरानो छ", "Rivers: DHM's readings are old"), by: "Copernicus GloFAS", via: T("Open-Meteo Flood API मार्फत", "through the Open-Meteo Flood API"), href: "https://global-flood.emergency.copernicus.eu/", trust: "Model",
      load: (C) => get(`https://flood-api.open-meteo.com/v1/flood?latitude=${C.gauges.map((g) => g.ll[0]).join(",")}&longitude=${C.gauges.map((g) => g.ll[1]).join(",")}&daily=river_discharge&past_days=1&forecast_days=5`).then((d) => {
        const arr = Array.isArray(d) ? d : [d];
        return arr.map((x, i) => { const g = C.gauges[i], t = (x.daily && x.daily.time) || [], q = (x.daily && x.daily.river_discharge) || []; let k = t.indexOf(day(0)); if (k < 0) k = Math.min(1, q.length - 1);
          const now = q[k], peak = Math.max(...q.slice(k + 1).filter((v) => v != null), -1); if (now == null || !g) return null;
          const tr = peak > now * 1.15 ? T("बढ्दो ↑", "rising ↑") : peak >= 0 && peak < now * 0.85 ? T("घट्दो ↓", "falling ↓") : T("स्थिर →", "steady →");
          return `<b>${E(T(g.ne, g.en))}</b>: ${T("करिब ", "about ")}${N(Math.round(now).toLocaleString("en-US"))} m³/s · ${T("आगामी ५ दिन ", "next 5 days ")}${tr}`; }).filter(Boolean); }),
      note: () => T("यो नदीको बहावको मोडेल अनुमान हो, नाप होइन। DHM को चेतावनी र खतरा तहसँग दाँज्न मिल्दैन।", "This is a model estimate of river flow, not a gauge reading. It cannot be compared with DHM's warning and danger levels.") },
    air: { miss: () => T("हावाको गुणस्तर: वातावरण विभागको पोर्टलमा पहुँच छैन", "Air quality: the Department of Environment portal is not reachable"), by: "Copernicus CAMS", via: T("Open-Meteo मार्फत", "through Open-Meteo"), href: "https://open-meteo.com/en/docs/air-quality-api", trust: "Model",
      load: () => get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${CITIES.map((c) => c[2]).join(",")}&longitude=${CITIES.map((c) => c[3]).join(",")}&current=us_aqi`).then((d) => (Array.isArray(d) ? d : [d]).map((x, i) => { const v = x.current && x.current.us_aqi, c = CITIES[i]; if (v == null || !c) return null; const b = AQ.find((a) => v <= a[0]);
        return `<b>${E(T(c[0], c[1]))}</b>: US AQI ${N(Math.round(v))} · ${E(T(b[1], b[2]))}`; }).filter(Boolean)),
      note: () => T("मोडेलको अनुमान हो, स्टेसनको मापन होइन।", "A model estimate, not a station measurement.") },
    incidents: { miss: () => T("घटना: NEOC को पोर्टलमा पहुँच छैन", "Incidents: the NEOC portal is not reachable"), by: "GDACS", via: T("संयुक्त राष्ट्र र युरोपेली आयोग", "United Nations and European Commission"), href: "https://www.gdacs.org/", trust: "Global",
      load: () => get(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?country=Nepal&fromDate=${day(-30)}&toDate=${day(1)}&alertlevel=Green;Orange;Red`).then((d) => { const f = (d.features || []).map((x) => x.properties).sort((a, b) => (a.fromdate < b.fromdate ? 1 : -1)).slice(0, 3);
        return f.length ? f.map((p) => { const k = GD[p.eventtype]; return `<b>${E(p.alertlevel || "")}</b> ${k ? E(T(k[0], k[1])) + ": " : ""}${p.url && p.url.report ? `<a href="${E(p.url.report)}" target="_blank" rel="noopener">${E(p.name || p.description || "")}</a>` : E(p.name || p.description || "")} <small>${E(G.npt(p.fromdate + "Z"))}</small>`; })
          : [T("पछिल्ला ३० दिनमा नेपालका लागि GDACS मा कुनै घटना सूचीकृत छैन।", "GDACS lists no event for Nepal in the last 30 days.")]; }),
      note: () => T("GDACS ले ठूला घटना मात्र समेट्छ; स्थानीय घटना यहाँ आउँदैनन्।", "GDACS covers large events only; local incidents do not appear here.") },
    quake: { miss: () => T("भूकम्प: राष्ट्रिय भूकम्प मापन केन्द्रको साइट पुरानो वा पहुँच बाहिर छ", "Earthquakes: the National Earthquake Monitoring Centre site is stale or not reachable"), by: "EMSC", via: T("युरोपेली-भूमध्यसागरीय भूकम्प केन्द्र", "European-Mediterranean Seismological Centre"), href: "https://www.emsc-csem.org/", trust: "Global",
      load: () => get("https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minlat=26&maxlat=31&minlon=79.5&maxlon=88.6&minmag=4&limit=3&orderby=time").then((d) => { const f = (d.features || []).map((x) => x.properties);
        return f.length ? f.map((p) => `<b>M${N(Number(p.mag).toFixed(1))}</b> <a href="https://www.seismicportal.eu/eventdetails.html?unid=${encodeURIComponent(p.unid)}" target="_blank" rel="noopener">${E(String(p.flynn_region || "").toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()))}</a> · ${T("गहिराइ ", "depth ")}${N(Math.round(Math.abs(p.depth)))}${T(" कि.मि.", " km")} <small>${E(G.npt(p.time))}</small>`) : [T("नेपाल वरपर हालै M४ वा माथिको भूकम्प सूचीकृत छैन।", "No recent M4+ earthquake listed around Nepal.")]; }),
      note: () => T("नेपालको आधिकारिक परिमाण राष्ट्रिय भूकम्प मापन केन्द्रले दिन्छ; यहाँको सङ्ख्या फरक पर्न सक्छ।", "Nepal's official magnitude comes from the National Earthquake Monitoring Centre; the figure here can differ.") },
    health: { miss: () => T("स्वास्थ्य: EDCD को साइटमा पहुँच छैन", "Health: the EDCD site is not reachable"), by: "WHO", via: T("विश्व स्वास्थ्य सङ्गठन", "World Health Organization"), href: "https://www.who.int/emergencies/disease-outbreak-news", trust: "Global",
      load: () => Promise.resolve([T(`खुला फिड छैन। <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noopener">WHO को रोग प्रकोप समाचार ↗</a> र <a href="https://www.who.int/nepal" target="_blank" rel="noopener">WHO नेपाल ↗</a> हेर्नुहोस्।`, `No open feed. See <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noopener">WHO Disease Outbreak News ↗</a> and <a href="https://www.who.int/nepal" target="_blank" rel="noopener">WHO Nepal ↗</a>.`)]),
      note: () => "" },
  };
  const ST = {}; let need = [], C = {};
  function draw() {
    if (!need.length) { box.hidden = true; return; }
    const open = (box.querySelector("details") || {}).open;
    box.innerHTML = `<details${open ? " open" : ""}><summary><span class="gfh">${T("यसबीच, विश्व स्रोतबाट", "Meanwhile, from global sources")}</span><span class="gfn">${N(need.length)}</span></summary><p class="meta gfp">${T("नेपाली स्रोत उपलब्ध नभएको ठाउँमा विश्व स्रोतले अहिले के भन्छ। पूरक मात्र: नेपालको आधिकारिक सूचना वा चेतावनी होइन। हजुरको ब्राउजरले अहिले सोझै ल्याएको।", "What global sources say right now where a Nepali source is not available. Supplementary only: not Nepal's official figures or warnings. Fetched by your browser just now.")}</p><div class="gfgrid">` +
      need.map((k) => { const f = FILL[k], s = ST[k];
        const body = !s ? `<p class="meta">${T("लोड हुँदै…", "Loading…")}</p>` : s.err ? `<p class="meta">${T("अहिले ल्याउन सकिएन।", "Could not load right now.")} <a href="${f.href}" target="_blank" rel="noopener">${E(f.by)} ↗</a></p>` : `<ul class="gfl">${s.rows.map((r) => `<li>${r}</li>`).join("")}</ul>${f.note() ? `<p class="meta">${E(f.note())}</p>` : ""}`;
        return `<div class="gfrow"><p class="gfm">${E(f.miss())}</p><p class="gfby">${G.trustChip(f.trust) || `<span class="trust gfg">${T("विश्व स्रोत", "Global source")}</span>`} <a href="${f.href}" target="_blank" rel="noopener"><b>${E(f.by)}</b> ↗</a> <span class="meta">${E(f.via)}</span></p>${body}</div>`; }).join("") + `</div></details>`;
    box.hidden = false;
  }
  Promise.all([G.json("data/sources.json"), G.json("data/source-health.json"), G.json("data/rivers.json").catch(() => null)]).then(([S, h, RV]) => {
    const H = (h && h.sources) || {}, st = (id) => { const s = S.find((x) => x.id === id); return s ? G.srcStatus(s, H[id]) : "ok"; };
    const rvAt = RV && RV.as_of && RV.as_of + (RV.as_of.length === 10 ? "T12:00:00" + G.tzIso : "");
    C = { gauges: ((RV && RV.gauges) || []).filter((g) => Array.isArray(g.ll)) };
    if (C.gauges.length && (!rvAt || G.isStale(rvAt) || st("dhm-hydrology") === "down")) need.push("rivers");
    if (page === "home") { if (st("doe-air") === "down") need.push("air"); if (st("neoc") === "down") need.push("incidents"); if (["down", "stale"].includes(st("nsc"))) need.push("quake"); if (st("edcd") === "down") need.push("health"); }
    if (!need.length) return;
    /* the lines are written in the reader's language, so a language change reads the sources again */
    const run = () => { draw(); need.forEach((k) => FILL[k].load(C).then((rows) => { ST[k] = { rows }; }).catch(() => { ST[k] = { err: true }; }).then(draw)); };
    run(); G.onLang(run);
  }).catch(() => {});
})();
