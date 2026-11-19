/* Home, under Nepal Now: three share cards, one subject each, made on the device from the same data the page shows.
   1 Weather and rain (DHM's warning for five days, rain measured at stations)   2 Roads (highway status, police notices)
   3 Airports (weather for flying). Pick one, see it, then share the picture, download it, or share it as text.
   Each card names its agency and time. Nothing is added to what the agencies published. */
(async function () {
  const G = window.Gati, box = document.getElementById("nowcards"); if (!G || !box || !G.travelCard) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), N = (x) => G.num(String(x));
  const [AL, WX, RD] = await Promise.all(["data/alerts.json", "data/weather.json", "data/roads.json"].map((p) => G.json(p).catch(() => null)));
  const GOOD = "#1e8e3e", WARN = "#F28C1E", BAD = "#D93025", GREY = "#5f6b7a";
  const day = () => G.npt(new Date().toISOString()).split(" · ")[0];
  const EMER = () => ({ h: T("आपतकाल", "Emergency"), v: T("प्रहरी १०० · एम्बुलेन्स १०२", "Police 100 · Ambulance 102") });
  const RELAY = () => T("गतिले आधिकारिक सूचना मात्र फैलाउँछ; आफैँ चेतावनी जारी गर्दैन।", "Gati relays official notices. It does not issue warnings.");
  const WD = [["आइत", "Sun"], ["सोम", "Mon"], ["मङ्गल", "Tue"], ["बुध", "Wed"], ["बिही", "Thu"], ["शुक्र", "Fri"], ["शनि", "Sat"]];
  const LV = { green: ["चेतावनी छैन", "No warning", GOOD, "#fff"], yellow: ["अद्यावधिक रहनुहोस्", "Be updated", "#F2C94C", "#14202B"], orange: ["सतर्क रहनुहोस्", "Be prepared", WARN, "#14202B"], red: ["कारबाही गर्नुहोस्", "Take action", BAD, "#fff"] };

  const SPEC = {
    wx() { const b5 = WX && WX.bulletin5, ob = WX && WX.station_obs, today = new Date(Date.now() + G.tzMs).toISOString().slice(0, 10), d0 = b5 && b5.days.find((d) => d.ad === today), L0 = LV[(d0 || {}).level] || LV.green;
      const rows = (b5 ? b5.days : []).map((d, i) => { const L = LV[d.level] || LV.green, dt = new Date(d.ad + "T00:00:00Z"); return { time: T(...WD[dt.getUTCDay()]) + " " + N(dt.getUTCDate()), name: T(L[0], L[1]), note: T(d.ne, d.en), color: L[2], solid: i === b5.days.length - 1 }; });
      const st = ob && ob.stations ? ob.stations : [], wet = st.filter((s) => (s.rain_mm || 0) > 0).sort((a, b) => b.rain_mm - a.rain_mm);
      const hot = st.filter((s) => s.tmax_c != null).sort((a, b) => b.tmax_c - a.tmax_c)[0], cold = st.filter((s) => s.tmin_c != null).sort((a, b) => a.tmin_c - b.tmin_c)[0];
      return { kicker: T("नेपाल अहिले · मौसम र वर्षा", "NEPAL NOW · WEATHER AND RAIN"), date: day(), title: T("मौसम र वर्षा", "Weather and rain"), sub: T("DHM को ५ दिने मौसम चेतावनी र केन्द्रमा नापिएको वर्षा", "DHM's 5-day weather warning and rain measured at stations"),
        banner: { label: T("आजको DHM चेतावनी", "DHM WARNING TODAY"), value: d0 ? T(L0[0], L0[1]) : T("आजको बुलेटिन गतिमा छैन", "Today's bulletin is not in Gati"), color: d0 ? L0[2] : GREY, ink: d0 ? L0[3] : "#fff" }, rows,
        foot: [{ h: T("नापिएको वर्षा", "Rain measured"), v: !st.length ? T("जानकारी छैन", "No data") : wet.length ? wet.slice(0, 3).map((s) => `${T(s.ne, s.en)} ${N(s.rain_mm)} ${T("मि.मि.", "mm")}`).join(", ") + T(` (${N(wet.length)}/${N(st.length)} केन्द्र)`, ` (${wet.length} of ${st.length} stations)`) : T(`${N(st.length)} केन्द्रमध्ये कतै वर्षा नापिएन।`, `None of the ${st.length} stations recorded rain.`) },
          { h: T("तापक्रम", "Temperature"), v: hot && cold ? T(`सबैभन्दा तातो ${hot.ne} ${N(hot.tmax_c)}°C · चिसो ${cold.ne} ${N(cold.tmin_c)}°C`, `Warmest ${hot.en} ${hot.tmax_c}°C · coldest ${cold.en} ${cold.tmin_c}°C`) : T("जानकारी छैन", "No data") },
          { h: T("मौसम जानकारी", "Weather phone"), v: T("DHM: ११५५", "DHM: 1155") }],
        fine: [T("स्रोत: जल तथा मौसम विज्ञान विभाग (DHM)", "Source: Department of Hydrology and Meteorology (DHM)") + (b5 ? " · " + T("चेतावनी जारी ", "warning issued ") + G.npt(b5.issued) : "") + (ob ? " · " + T("मापन ", "observation ") + G.npt(ob.issued) : ""), T("वर्षा र तापक्रम नापिएका हुन्, पूर्वानुमान होइनन्।", "Rain and temperature are measured, not forecast."), RELAY()] }; },
    wxText() { const s = SPEC.wx(); return `${s.title} (${s.date}): ${s.banner.label.toLowerCase()}: ${s.banner.value}.\n` + s.rows.map((r) => `• ${r.time}: ${r.name}`).join("\n") + `\n${s.foot[0].h}: ${s.foot[0].v}\n${s.foot[1].h}: ${s.foot[1].v}\n${s.fine[0]}`; },

    road() { const rs = RD && RD.routes ? RD.routes : [], c = (k) => rs.filter((r) => r.status === k).length, now = Date.now();
      const bad = rs.filter((r) => r.status === "blocked"), one = rs.filter((r) => r.status === "oneway");
      const nots = (AL ? AL.alerts : []).filter((a) => a.hazard === "road" && a.trust === "Official" && !a.supersededBy && Date.parse(a.expires) > now);
      const rows = bad.map((r) => ({ name: T(r.name_ne, r.name_en), tag: { text: T("अवरुद्ध", "Blocked"), color: BAD }, note: "", color: BAD }))
        .concat(one.map((r) => ({ name: T(r.name_ne, r.name_en), tag: { text: T("एकतर्फी / आंशिक", "One-way / partly open"), color: WARN, ink: "#14202B" }, note: "", color: WARN })))
        .concat(nots.map((a) => { const i = a.info[G.lang] || a.info.ne; return { name: T("प्रहरीको सूचना", "Police notice"), note: i.headline + " · " + G.npt(i.params["gati:sourceTime"] || a.sent), color: BAD }; }));
      if (!rows.length) rows.push({ name: T("मुख्य राजमार्गमा अवरोधको आधिकारिक सूचना छैन", "No official report of a blocked main highway"), note: "", color: GOOD });
      rows.forEach((r, i) => { r.solid = i === rows.length - 1; });
      return { kicker: T("नेपाल अहिले · सडक", "NEPAL NOW · ROADS"), date: day(), title: T("सडकको अवस्था", "Road status"), sub: T("मुख्य राजमार्ग र प्रहरीका सडक सूचना", "Main highways and police road notices"),
        banner: { label: T("मुख्य राजमार्ग", "MAIN HIGHWAYS"), value: T(`${N(c("blocked"))} अवरुद्ध · ${N(c("oneway"))} एकतर्फी`, `${c("blocked")} blocked · ${c("oneway")} one-way`), color: c("blocked") ? BAD : c("oneway") ? WARN : GOOD, ink: !c("blocked") && c("oneway") ? "#14202B" : "#fff" }, rows,
        foot: [{ h: T("खण्डको गन्ती", "Sections"), v: T(`${N(c("open"))} खुला · ${N(c("none"))} को आधिकारिक स्थिति छैन`, `${c("open")} open · ${c("none")} with no official status`) }, { h: T("प्रहरीका सूचना", "Police notices"), v: T(`अहिले ${N(nots.length)} लागू`, `${nots.length} in force now`) }, EMER()],
        fine: [T("स्रोत: नेपाल प्रहरी, सडक विभाग", "Sources: Nepal Police, Department of Roads") + (RD ? " · " + T(RD.as_of_ne, RD.as_of_en) : ""), T("\"आधिकारिक स्थिति छैन\" भनेको सामान्यतया खुला, तर पुष्टि नभएको। यात्रा अघि स्थानीय प्रहरीसँग बुझ्नुहोस्।", "\"No official status\" usually means open, but not confirmed. Check with local police before travelling."), RELAY()] }; },
    roadText() { const s = SPEC.road(); return `${s.title} (${s.date}): ${s.banner.value}.\n` + s.rows.map((r) => `• ${r.name}${r.tag ? ": " + r.tag.text : ""}${r.note ? " — " + r.note : ""}`).join("\n") + `\n${s.foot[0].v}. ${s.fine[0]}`; },

    air() { const A = G.airwx ? G.airwx.all() : [], CAT = G.airwx ? G.airwx.CAT : {}, k0 = A.find((x) => x.a.icao === "VNKT"), kc = k0 ? CAT[k0.cat] : null;
      const line = (x) => (x.o ? T("दृश्यता ", "Visibility ") + G.airwx.km(x.o.vis) + " · " + (x.o.kind === "official" ? T("आधिकारिक प्रतिवेदन ", "official report ") + G.npt(x.o.time).split(" · ").pop() : T("मोडेलको अनुमान", "model estimate")) : T("जानकारी छैन", "no data"));
      return { kicker: T("नेपाल अहिले · विमानस्थल", "NEPAL NOW · AIRPORTS"), date: day(), title: T("विमानस्थलको मौसम", "Airport weather"), sub: T("अहिले उडान योग्य मौसम छ कि छैन: नेपालका विमानस्थल", "Is the weather fit for flying right now: Nepal's airports"),
        banner: { label: T("काठमाडौँ (त्रिभुवन)", "KATHMANDU (TRIBHUVAN)"), value: kc ? T(kc[0], kc[1]) + (k0.o ? " · " + G.airwx.km(k0.o.vis) : "") : T("जानकारी छैन", "No data"), color: kc ? kc[2] : GREY },
        rows: A.map((x, i) => ({ time: x.a.iata, name: T(x.a.ne, x.a.en), tag: { text: T(CAT[x.cat][0], CAT[x.cat][1]), color: CAT[x.cat][2] }, note: line(x), color: CAT[x.cat][2], solid: i === A.length - 1 })),
        foot: [{ h: T("उडानको अवस्था", "Flight status"), v: T("गतिसँग छैन। एयरलाइन्स वा विमानस्थलसँग बुझ्नुहोस्।", "Not in Gati. Check with the airline or the airport.") }, { h: T("तहको अर्थ", "What the levels mean"), v: T("मौसमको वर्णन मात्र; एयरलाइन्स वा टावरको निर्णय होइन।", "A description of the weather, not the airline's or the tower's decision.") }, EMER()],
        fine: [k0 && k0.o && k0.o.kind === "official" ? T("स्रोत: काठमाडौँको आधिकारिक विमानस्थल मौसम प्रतिवेदन (METAR)। अन्य विमानस्थल: Open-Meteo मोडेलको अनुमान, मापन होइन।", "Sources: Kathmandu's official airport weather report (METAR). Other airports: an Open-Meteo model estimate, not a measurement.") : T("काठमाडौँको आधिकारिक प्रतिवेदन अहिले उपलब्ध छैन। सबै विमानस्थल: Open-Meteo मोडेलको अनुमान, मापन होइन।", "Kathmandu's official report is not available right now. All airports: an Open-Meteo model estimate, not a measurement."), RELAY()] }; },
    airText() { const s = SPEC.air(); return `${s.title} (${s.date}):\n` + s.rows.map((r) => `• ${r.name}: ${r.tag.text}, ${r.note}`).join("\n") + `\n${s.foot[0].v}`; },
  };
  const TABS = [["wx", "मौसम र वर्षा", "Weather and rain"], ["road", "सडक", "Roads"], ["air", "विमानस्थल", "Airports"], ["map", "आजको नक्सा", "Today's map"]];
  const MAP = G.root + "share/today.png";
  let cur = "wx", seen = false, url = "";
  async function preview() { const im = box.querySelector(".ncimg"); if (!im || !seen) return; const k = cur;
    if (k === "map") { im.src = MAP; im.hidden = false; return; }
    let blob = null; try { blob = await G.travelCard.make(SPEC[k]()); } catch (e) {}
    if (k !== cur || !blob) return; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); im.src = url; im.hidden = false; }
  function draw() {
    box.innerHTML = `<h2 class="nch">${T("आजका कार्ड: सेयर गर्नुहोस्", "Today's cards to share")}</h2><div class="nctabs" role="tablist">${TABS.map(([k, ne, en], i) => `<button type="button" role="tab" class="nctab" data-k="${k}" aria-selected="${k === cur}">${N(i + 1)} ${T(ne, en)}</button>`).join("")}</div>
      <div class="ncbody${cur === "map" ? " ncwide" : ""}"><div class="ncview"><img class="ncimg" alt="${cur === "map" ? T("आजको नेपाल कार्ड: नक्सा, DHM चेतावनी, नदी, सडक र नापिएको वर्षा", "Today's Nepal card: map, DHM warning, rivers, roads and measured rain") : T("छानिएको कार्डको पूर्वावलोकन", "Preview of the chosen card")}" hidden></div><div class="ncact"></div></div>`;
    box.querySelectorAll(".nctab").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
    G.travelCard.actions(box.querySelector(".ncact"), { spec: () => SPEC[cur](), image: cur === "map" ? () => fetch(MAP).then((r) => r.blob()) : null, text: () => (cur === "map" ? SPEC.wxText() + "\n" + SPEC.roadText() : SPEC[cur + "Text"]()), url: () => G.country.site, name: () => (cur === "map" ? "gati-nepal-today.png" : `gati-nepal-now-${cur}.png`) });
    preview();
  }
  draw(); G.onLang(draw);
  /* Plan my trip: from, to and the day, then on to Route check with the same plan */
  const hp = document.getElementById("hplan");
  if (hp && RD && RD.nodes) { const ND = RD.nodes, ls = (k, d) => { try { const v = localStorage.getItem(k); return ND[v] ? v : d; } catch (e) { return d; } };
    const plan = () => { const keep = [(hp.querySelector("#hpf") || {}).value || ls("gati-rfrom", "ktm"), (hp.querySelector("#hpt") || {}).value || ls("gati-rto", "pokhara")];
      const o = Object.keys(ND).sort((a, b) => T(ND[a].ne, ND[a].en).localeCompare(T(ND[b].ne, ND[b].en))).map((k) => `<option value="${k}">${G.esc(T(ND[k].ne, ND[k].en))}</option>`).join("");
      hp.innerHTML = `<h2 class="nch">${T("मेरो यात्रा योजना", "Plan my trip")}</h2><div class="rpick hpick"><label><span>${T("कहाँबाट", "From")}</span><select id="hpf">${o}</select></label><label><span>${T("कहाँसम्म", "To")}</span><select id="hpt">${o}</select></label></div>
        <div class="tcq"><span class="tcql" id="hpl">${T("कुन दिन जाने?", "Which day?")}</span><div class="tcchips" role="group" aria-labelledby="hpl">${G.travelCard.dayChips()}</div></div>
        <button type="button" class="tcbtn tcmain" id="hpgo">${T("बाटो जाँच गर्नुहोस् →", "Check my route →")}</button><p class="meta hpm">${T("नेपाल प्रहरी र सडक विभागको आधिकारिक सडक स्थिति, अनुमानित समय र सेयर गर्न मिल्ने कार्ड।", "Official road status from Nepal Police and the Department of Roads, estimated times and a card you can share.")}</p>`;
      const f = hp.querySelector("#hpf"), t = hp.querySelector("#hpt"); f.value = keep[0]; t.value = keep[1]; G.travelCard.dayWire(hp);
      hp.querySelector("#hpgo").onclick = () => { if (G.pulse) G.pulse.track("route_check"); location.href = G.root + "route/?from=" + encodeURIComponent(f.value) + "&to=" + encodeURIComponent(t.value); }; };
    plan(); G.onLang(plan); hp.hidden = false; }
  if (G.airwx) { G.airwx.on(() => { if (cur === "air") preview(); }); G.airwx.load(); }
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); seen = true; preview(); } }, { rootMargin: "200px" }); io.observe(box); } else { seen = true; preview(); }
})();
