/* Fuel page: NOC petrol/diesel prices (official, relayed as published) and a trip fuel cost estimate.
   Distances come from Gati's OpenStreetMap corridor lengths (data/geo/roads.geojson) or manual entry. */
(function () {
  const G = window.Gati; if (!G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const pbox = document.getElementById("fprice"), cbox = document.getElementById("fcalc");
  const VEH = [["bike", "मोटरसाइकल", "Motorbike", 40, "petrol"], ["car", "कार", "Car", 14, "petrol"], ["jeep", "जीप", "Jeep", 9, "diesel"]];
  const FT = { petrol: ["पेट्रोल", "Petrol"], diesel: ["डिजेल", "Diesel"] };
  let F = null, RD = null, KM = {}, st = { route: "", km: "", veh: "bike", kmpl: 40, ft: "petrol", grp: 0, rt: false };
  const money = (v) => N(v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
  const dec = (v, d) => N(v.toFixed(d));
  Promise.all(["data/fuel.json", "data/roads.json", "data/geo/roads.geojson"].map((p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([f, rd, rg]) => {
    F = f; RD = rd; if (rg) rg.features.forEach((x) => { if (x.properties.km) KM[x.properties.id] = x.properties.km; });
    const q = new URLSearchParams(location.search); if (q.get("km")) st.km = q.get("km"); if (q.get("r") && KM[q.get("r")]) { st.route = q.get("r"); st.km = String(KM[st.route]); }
    draw(); G.onLang(draw);
  });
  function prices() {
    if (!F) return `<p class="meta">${T("इन्धन मूल्य लोड भएन।", "Fuel prices could not load.")}</p>`;
    const eff = F.effective, src = `<a href="${E(F.url)}" target="_blank" rel="noopener">${E(T(F.source_ne, F.source_en))}</a>`;
    return `<h2>${T("पेट्रोल र डिजेल मूल्य", "Petrol and diesel prices")}</h2>
      <p>${G.trustChip("Official")} <span class="meta">${T("स्रोत", "Source")}: ${src} · ${T("लागू मिति", "Effective")} ${G.npt(eff + "T00:00:00" + G.tzIso).split(" · ")[0]} · ${T("गतिले लिएको", "fetched")} ${G.npt(F.fetched)}</span></p>
      ${F.reachable ? "" : `<p class="hmnone">${T(`NOC को साइट ${G.npt(F.checked)} मा खुलेन। माथि पछिल्लो आधिकारिक मूल्य देखाइएको छ।`, `NOC's site could not be reached at ${G.npt(F.checked)}. The last official prices are shown.`)}</p>`}
      <div class="ftbl" role="table"><div class="ftr fth" role="row"><span role="columnheader">${T("डिपो", "Depot")}</span><span role="columnheader">${T("पेट्रोल", "Petrol")}</span><span role="columnheader">${T("डिजेल", "Diesel")}</span></div>
      ${F.groups.map((g) => `<div class="ftr" role="row"><span role="cell"><b>${E(T(g.name_ne, g.name_en))}</b><br><span class="meta">${g.depots.map((d) => E(T(d.ne, d.en))).join(", ")}</span></span><span role="cell">${T("रु.", "Rs")} ${dec(g.price.petrol, 2)}</span><span role="cell">${T("रु.", "Rs")} ${dec(g.price.diesel, 2)}</span></div>`).join("")}</div>
      <p class="meta">${T("प्रति लिटर, NOC ले प्रकाशित गरेअनुसार। पम्पमा थोरै फरक पर्न सक्छ।", "Per litre, as published by NOC. The pump price may differ slightly.")}</p>`;
  }
  function calc() {
    const routes = RD ? RD.routes.filter((r) => KM[r.id]) : [];
    const g = F && F.groups[st.grp], price = g ? g.price[st.ft] : null, km = parseFloat(st.km), kmpl = parseFloat(st.kmpl);
    const dist = km > 0 ? km * (st.rt ? 2 : 1) : 0, L = dist && kmpl > 0 ? dist / kmpl : 0;
    const sel = (id, opts) => `<select id="${id}">${opts}</select>`;
    return `<h2>${T("यात्राको इन्धन खर्च", "Trip fuel cost")}</h2>
      <div class="fform">
      <label><span>${T("सडक खण्ड (ऐच्छिक)", "Road corridor (optional)")}</span>${sel("fr", `<option value="">${T("आफैँ दूरी लेख्नुहोस्", "Enter distance yourself")}</option>${routes.map((r) => `<option value="${E(r.id)}"${r.id === st.route ? " selected" : ""}>${E(T(r.name_ne, r.name_en))} (${N(KM[r.id])} km)</option>`).join("")}`)}</label>
      <label><span>${T("दूरी (कि.मि.)", "Distance (km)")}</span><input id="fkm" type="number" inputmode="decimal" min="0" step="1" value="${E(st.km)}"></label>
      <label class="fchk"><input id="frt" type="checkbox"${st.rt ? " checked" : ""}> ${T("आउजाउ (दोब्बर दूरी)", "Round trip (double distance)")}</label>
      <label><span>${T("सवारी", "Vehicle")}</span>${sel("fv", VEH.map((v) => `<option value="${v[0]}"${v[0] === st.veh ? " selected" : ""}>${E(T(v[1], v[2]))}</option>`).join(""))}</label>
      <label><span>${T("कि.मि. प्रति लिटर", "km per litre")}</span><input id="fkl" type="number" inputmode="decimal" min="1" step="0.5" value="${E(String(st.kmpl))}"></label>
      <label><span>${T("इन्धन", "Fuel")}</span>${sel("fft", Object.keys(FT).map((k) => `<option value="${k}"${k === st.ft ? " selected" : ""}>${E(T(...FT[k]))}</option>`).join(""))}</label>
      ${F ? `<label><span>${T("मूल्य क्षेत्र", "Price area")}</span>${sel("fg", F.groups.map((x, i) => `<option value="${i}"${i === st.grp ? " selected" : ""}>${E(T(x.name_ne, x.name_en))}: ${x.depots.slice(0, 3).map((d) => E(T(d.ne, d.en))).join(", ")}</option>`).join(""))}</label>` : ""}
      </div>
      <p class="meta">${T("सवारीका कि.मि. प्रति लिटर उदाहरण मात्र हुन् (मोटरसाइकल ४०, कार १४, जीप ९)। हजुरको सवारीको वास्तविक खपत लेख्नुहोस्।", "Vehicle km per litre values are examples only (motorbike 40, car 14, jeep 9). Enter your own vehicle's real figure.")}${routes.length ? " " + T("सडक खण्डको लम्बाइ OpenStreetMap को सरलीकृत रेखाबाट, लगभग मात्र।", "Corridor lengths come from simplified OpenStreetMap lines and are approximate.") : ""}</p>
      <div class="fout" aria-live="polite">${L && price ? `<p class="fbig">${T("अनुमानित", "Estimated")} ${dec(L, 1)} ${T("लिटर", "litres")} · ${T("रु.", "Rs")} ${money(L * price)}</p>
        <p class="meta">${T("अनुमान मात्र", "Estimate only")}: ${N(Math.round(dist))} km ÷ ${dec(kmpl, 1)} km/L × ${T("रु.", "Rs")} ${dec(price, 2)} (${E(T(FT[st.ft][0], FT[st.ft][1]))}, NOC). ${T("उकालो, ट्राफिक र भारले खपत बढ्न सक्छ।", "Climbs, traffic and load can raise consumption.")}</p>` : `<p class="meta">${T("दूरी र कि.मि. प्रति लिटर लेख्नुहोस्।", "Enter distance and km per litre.")}</p>`}</div>`;
  }
  function draw() {
    if (pbox) pbox.innerHTML = prices(); if (!cbox) return;
    const a = document.activeElement && document.activeElement.id, pos = a && document.activeElement.selectionStart;
    cbox.innerHTML = calc(); bind();
    if (a) { const el = document.getElementById(a); if (el) { el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  function bind() {
    const $ = (id) => document.getElementById(id);
    $("fr").onchange = (e) => { st.route = e.target.value; if (st.route) st.km = String(KM[st.route]); draw(); };
    $("fkm").oninput = (e) => { st.km = e.target.value; st.route = ""; draw(); };
    $("frt").onchange = (e) => { st.rt = e.target.checked; draw(); };
    $("fv").onchange = (e) => { st.veh = e.target.value; const v = VEH.find((x) => x[0] === st.veh); st.kmpl = v[3]; st.ft = v[4]; draw(); };
    $("fkl").oninput = (e) => { st.kmpl = e.target.value; draw(); };
    $("fft").onchange = (e) => { st.ft = e.target.value; draw(); };
    if ($("fg")) $("fg").onchange = (e) => { st.grp = +e.target.value; draw(); };
  }
})();
