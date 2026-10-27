/* Cyclone Arnab: DHM special advisory map. Gati relays, never issues. Static SVG, no services. */
(function () {
  const box = document.getElementById("arnab"); const G = window.Gati; if (!box || !G) return;
  const R = document.body.dataset.root || "./";
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const LV = { normal: ["info", "सामान्य", "Normal", "var(--info)"], low: ["Minor", "न्युन जोखिम", "Low risk", "var(--minor)"], moderate: ["Moderate", "मध्यम जोखिम", "Moderate risk", "var(--moderate)"], high: ["Severe", "उच्च जोखिम", "High risk", "var(--severe)"] };
  const BAS = { narayani: ["नारायणी", "Narayani"], koshi: ["कोशी", "Koshi"], bagmati: ["बागमती", "Bagmati"], kamala: ["कमला", "Kamala"] };
  /* Bagmati and Kamala lines are schematic (not in data/geo/rivers.geojson) */
  const SCHEM = { bagmati: [[85.43, 27.77], [85.31, 27.7], [85.29, 27.64], [85.33, 27.45], [85.48, 27.13], [85.43, 26.95], [85.27, 26.77], [85.3, 26.62]], kamala: [[86.05, 27.12], [86.2, 27.0], [86.38, 26.92], [86.4, 26.75], [86.33, 26.55]] };
  const AD = (iso) => { const d = new Date(iso + "T12:00:00+05:45"); return G.lang === "ne" ? N(d.getDate()) + " " + ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"][d.getMonth()] : d.getDate() + " " + d.toLocaleString("en", { month: "short" }); };
  const b0 = [80.0, 26.3, 88.25, 30.5], W = 820, K = W / (b0[2] - b0[0]), H = Math.round((b0[3] - b0[1]) * K);
  const X = (x) => ((x - b0[0]) * K).toFixed(1), Y = (y) => ((b0[3] - y) * K).toFixed(1);
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const pth = (g) => polys(g).map((p) => p.map((r) => "M" + r.map(([x, y]) => X(x) + " " + Y(y)).join("L") + "Z").join("")).join("");
  const line = (cs) => cs.map(([x, y]) => X(x) + "," + Y(y)).join(" ");
  let A, DG, RG, RV, day = 1, sel = null;
  Promise.all(["data/arnab-advisory.json", "data/districts.geojson", "data/geo/rivers.geojson", "data/rivers.json"].map((p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([a, d, r, v]) => {
    A = a; DG = d; RG = r; RV = v; if (!A) { box.innerHTML = `<p class="meta">${T("सूचना लोड भएन।", "Could not load the advisory.")}</p>`; return; }
    const h = new URLSearchParams(location.hash.slice(1)); const k = +h.get("k"); if (k >= 11 && k <= 15) day = k - 11;
    draw(); G.onLang(draw);
  });
  function basinLines() {
    const out = {};
    if (RG) RG.features.forEach((f) => { const n = f.properties.en.toLowerCase(); const id = n.startsWith("narayani") ? "narayani" : n.startsWith("koshi") ? "koshi" : null; if (id) (out[id] = out[id] || []).push(...(f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates)); });
    Object.keys(SCHEM).forEach((k) => (out[k] = [SCHEM[k]]));
    return out;
  }
  function svg(D) {
    const ff = {}; if (D.ff) Object.entries(D.ff).forEach(([lv, ds]) => ds.forEach((s) => (ff[s] = lv)));
    const BL = basinLines();
    const dist = DG ? DG.features.map((f) => { const lv = ff[f.properties.slug]; const nm = T(f.properties.ne, f.properties.en);
      return `<path class="anD${sel && sel.t === "d" && sel.id === f.properties.slug ? " on" : ""}" data-t="d" data-id="${f.properties.slug}" d="${pth(f.geometry)}" fill="${lv ? LV[lv][3] : "var(--surface2)"}" fill-opacity="${lv ? 0.7 : 1}" tabindex="0" role="button" aria-label="${E(nm)}: ${E(lv ? T(LV[lv][1], LV[lv][2]) : D.ff ? T(LV.low[1], LV.low[2]) : T("जिल्ला नक्सा छैन", "no district map"))}"><title>${E(nm)}</title></path>`; }).join("") : "";
    const rivers = Object.entries(BL).map(([id, ls]) => { const lv = D.basins[id]; const c = lv ? LV[lv][3] : "var(--info)";
      return `<g class="anB${sel && sel.t === "b" && sel.id === id ? " on" : ""}" data-t="b" data-id="${id}" tabindex="0" role="button" aria-label="${E(T(BAS[id][0], BAS[id][1]))}: ${E(lv ? T(LV[lv][1], LV[lv][2]) : T("यस दिन उल्लेख छैन", "not named this day"))}">${ls.map((l) => `<polyline points="${line(l)}" class="halo" stroke="${c}"${SCHEM[id] ? ' stroke-dasharray="2 10"' : ""}/><polyline points="${line(l)}" class="core"/>`).join("")}</g>`; }).join("");
    const lab = Object.entries(BL).map(([id, ls]) => { const l = ls[0], p = id === "narayani" ? [84.2, 27.55] : id === "koshi" ? [87.05, 26.75] : l[Math.floor(l.length / 2)]; return `<text x="${X(p[0])}" y="${Y(p[1])}" class="anL">${E(T(BAS[id][0], BAS[id][1]))}</text>`; }).join("");
    const gs = RV ? RV.gauges.filter((g) => /narayani|koshi|bagmati|kamala/i.test(g.en)) : [];
    const gauges = gs.map((g, i) => `<circle class="anG" data-t="g" data-id="${i}" cx="${X(g.ll[1])}" cy="${Y(g.ll[0])}" r="8" tabindex="0" role="button" aria-label="${E(T(g.ne, g.en))}"/>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(T("नदी जलाधार र जिल्लागत आकस्मिक बाढी जोखिम नक्सा", "River basin and district flash flood risk map"))}">${dist}${rivers}${lab}${gauges}</svg>`;
  }
  function detail(D) {
    const src = `<p class="meta">${T("स्रोत", "Source")}: <a href="${E(A.source.url)}" target="_blank" rel="noopener">${E(T(A.source.ne, A.source.en))}</a> · <time datetime="${A.source.sent}">${E(T(A.source.sent_ne, A.source.sent_en))}</time> ${G.trustChip(A.trust)}</p>`;
    if (!sel) return `<p class="anHint">${T("नक्सामा जलाधार (नदी), जिल्ला वा मापन केन्द्र छुनुहोस्।", "Tap or hover a basin (river), district or gauge on the map.")}</p>`;
    if (sel.t === "b") { const lv = D.basins[sel.id];
      return `<h3>${E(T(BAS[sel.id][0] + " जलाधार", BAS[sel.id][1] + " basin"))}</h3><p>${lv ? `<span class="sev sev-${LV[lv][0]}">${T(LV[lv][1], LV[lv][2])}</span>` : `<span class="sev sev-Unknown">${T("यस दिन नाम उल्लेख छैन", "Not named this day")}</span>`}</p><p>${E(T(D.ne, D.en))}</p><p class="meta">${E(T(A.stations_note_ne, A.stations_note_en))}${SCHEM[sel.id] ? " " + T("यो नदीको रेखा अनुमानित (schematic) हो।", "This river line is schematic.") : ""}</p>${src}`; }
    if (sel.t === "d") { const f = DG.features.find((x) => x.properties.slug === sel.id); let lv = null; if (D.ff) Object.entries(D.ff).forEach(([l, ds]) => { if (ds.includes(sel.id)) lv = l; }); if (D.ff && !lv) lv = "low";
      return `<h3>${E(T(f.properties.ne, f.properties.en))}</h3><p>${T("आकस्मिक बाढी", "Flash flood")}: ${lv ? `<span class="sev sev-${LV[lv][0]}">${T(LV[lv][1], LV[lv][2])}</span>` : T("यस दिनको जिल्ला नक्सा छैन", "no district map for this day")}</p><p class="meta">${E(T(A.ff_note_ne, A.ff_note_en))}</p>${src}`; }
    const g = RV.gauges.filter((x) => /narayani|koshi|bagmati|kamala/i.test(x.en))[+sel.id];
    return `<h3>${E(T(g.ne, g.en))}</h3><p>${T("पछिल्लो पढाइ", "Last reading")}: ${N(g.level)} m · ${T("चेतावनी", "Warning")} ${N(g.warning)} m · ${T("खतरा", "Danger")} ${N(g.danger)} m</p><p class="meta">${T("यो पढाइ यस विशेष सूचनाको भाग होइन।", "This reading is not part of the special advisory.")} ${T("स्रोत", "Source")}: <a href="${E(RV.url)}" target="_blank" rel="noopener">${E(T(RV.source_ne, RV.source_en))}</a> · ${E(T(RV.as_of_ne, RV.as_of_en))}</p>`;
  }
  function draw() {
    const D = A.days[day];
    box.innerHTML = `<div class="sechead" style="margin-top:0"><h2>${E(T("चक्रवात 'अर्नब': बाढी पूर्वसूचना नक्सा", "Cyclone 'Arnab': flood advisory map"))}</h2>${G.trustChip(A.trust)}</div>
      <div class="anSum"><p><b>${E(T("विशेष सूचना", "Special advisory"))}:</b> ${E(T("कात्तिक ११ देखि १५ सम्म नारायणी, बागमती, कमला र कोशी जलाधारमा उल्लेख्य वर्षा र जलसतह बढ्न सक्ने। सबैभन्दा बढी: कात्तिक १३ र १४ (मध्यम जोखिम)। प्रमुख नदी खतरा तह पार गर्ने सम्भावना न्युन।", "Kartik 11 to 15: significant rain and rising rivers possible in the Narayani, Bagmati, Kamala and Koshi basins. Peak: Kartik 13 and 14 (moderate risk). Major rivers unlikely to cross the danger level."))}</p>
      <p class="meta">${E(T(A.hotline_ne, A.hotline_en))} <a href="tel:1155">☎ ${N(1155)}</a></p></div>
      <div class="anDays" role="group" aria-label="${T("दिन", "Day")}">${A.days.map((d, i) => `<button type="button" class="anDay" aria-pressed="${i === day}" data-i="${i}"><b>${T("कात्तिक " + N(d.bs), "Kartik " + d.bs)}</b><span>${E(T(d.wd_ne, d.wd_en.slice(0, 3)))} ${AD(d.ad)}</span><i style="background:${LV[d.level][3]}"></i></button>`).join("")}</div>
      <label class="anSl"><span class="sr-only">${T("दिन छान्नुहोस्", "Choose day")}</span><input type="range" min="0" max="4" step="1" value="${day}" id="anrng" aria-valuetext="${E(T("कात्तिक " + N(D.bs), "Kartik " + D.bs + ", " + AD(D.ad)))}"></label>
      <div class="anGrid"><div class="anMap">${svg(D)}</div><div class="anSide"><p class="anDayT"><b>${T("कात्तिक " + N(D.bs) + " (" + D.wd_ne + ")", "Kartik " + D.bs + " (" + D.wd_en + ", " + AD(D.ad) + ")")}</b> <span class="sev sev-${LV[D.level][0] === "info" ? "Unknown" : LV[D.level][0]}">${T(LV[D.level][1], LV[D.level][2])}</span></p><p>${E(T(D.ne, D.en))}</p><div class="anDet" id="andet" aria-live="polite">${detail(D)}</div></div></div>
      <div class="anLeg"><span><i style="background:var(--info)"></i>${T("सामान्य", "Normal")}</span><span><i style="background:var(--minor)"></i>${T("न्युन जोखिम", "Low risk")}</span><span><i style="background:var(--moderate)"></i>${T("मध्यम जोखिम", "Moderate risk")}</span><span><i style="background:var(--severe)"></i>${T("उच्च जोखिम", "High risk")}</span><span><i class="ln"></i>${T("नदी/जलाधार (छुनुहोस्)", "River / basin (tap)")}</span><span><i class="gg"></i>${T("नदी मापन", "River gauge")}</span></div>
      <p class="meta">${E(T("जिल्ला रङ: DHM आकस्मिक बहाव (Flash Flood) नक्सा, बिहान ८ बजेदेखि २४ घण्टा। कात्तिक ११ र १५ का लागि जिल्ला नक्सा छैन। DHM को हरियो (न्युन) यहाँ खैरो देखाइएको छ।", "District colours: DHM flash flood maps, 24 hours from 8 AM. No district map for Kartik 11 or 15. DHM green (low) is shown as plain grey here."))} ${E(T(A.stations_note_ne, A.stations_note_en))}</p>
      <details class="anMore"><summary>${T("थप: जोखिम र अनुरोध", "More: risks and request")}</summary><ul>${A.risks.map((r) => `<li>${E(T(r[0], r[1]))}</li>`).join("")}</ul><p><b>${T("अनुरोध", "Request")}:</b> ${E(T(A.ask_ne, A.ask_en))}</p><p class="meta">${A.source.images.map((u, i) => `<a href="${u}" target="_blank" rel="noopener">${T("पाना", "Page")} ${N(i + 1)}</a>`).join(" · ")}</p></details>
      <p class="meta">${T("स्रोत", "Source")}: <a href="${E(A.source.url)}" target="_blank" rel="noopener">${E(T(A.source.ne, A.source.en))}</a> · <time datetime="${A.source.sent}">${E(T(A.source.sent_ne, A.source.sent_en))}</time>. ${T("गतिले सूचना जारी गर्दैन, आधिकारिक सूचना मात्र पुनः प्रसारण गर्छ।", "Gati relays official notices; it does not issue them.")}</p>`;
    const set = (i) => { day = i; history.replaceState(null, "", "#k=" + (11 + i)); draw(); };
    box.querySelectorAll(".anDay").forEach((b) => (b.onclick = () => set(+b.dataset.i)));
    box.querySelector("#anrng").oninput = (e) => set(+e.target.value);
    const pick = (el) => { sel = { t: el.dataset.t, id: el.dataset.id }; box.querySelectorAll(".anB.on,.anD.on").forEach((x) => x.classList.remove("on")); if (sel.t !== "g") el.classList.add("on"); box.querySelector("#andet").innerHTML = detail(A.days[day]); };
    box.querySelectorAll("[data-t]").forEach((el) => { el.addEventListener("click", () => pick(el)); el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(el); } }); if (matchMedia("(hover:hover)").matches) el.addEventListener("mouseenter", () => pick(el)); });
  }
})();
