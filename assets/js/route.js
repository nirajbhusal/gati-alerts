(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const RD = await G.json("data/roads.json"), N = RD.nodes;
  let AL = null, DS = null, WX = null, EVCH = null;   /* alerts, districts, weather and reported chargers arrive after the first draw */
  const [RG, DG] = await Promise.all([G.json("data/geo/roads.geojson").catch(() => null), G.json("data/districts.geojson").catch(() => null)]);
  const COL = { open: "#16a34a", oneway: "#f59e0b", blocked: "#dc2626", none: "#86D8A0" };
  let map, lay;
  function drawMap(P, alt) {
    if (!window.L || !RG) return;
    if (!map) {
      map = L.map("rmap", { zoomSnap: 0.25, scrollWheelZoom: false, tap: true }); map.attributionControl.setPrefix("").addAttribution("© OpenStreetMap contributors (ODbL) · COD-AB / OCHA HDX · Open Knowledge Nepal");
      if (DG) L.geoJSON(DG, { style: { color: "#c3ccd6", weight: 0.7, fillColor: "#f3f6f9", fillOpacity: 1 }, interactive: false }).addTo(map);
      L.geoJSON(RG, { style: { color: "#cfd6de", weight: 3 }, interactive: false }).addTo(map);
    }
    if (lay) map.removeLayer(lay); lay = L.layerGroup().addTo(map);
    const ids = [...new Set(P.map((x) => x[2].id))], feats = RG.features.filter((f) => ids.includes(f.properties.id));
    (alt || []).forEach((A, k) => { const aids = [...new Set(A.map((x) => x[2].id))].filter((x) => !ids.includes(x)); if (!aids.length) return;
      L.geoJSON({ type: "FeatureCollection", features: RG.features.filter((f) => aids.includes(f.properties.id)) }, { style: (f) => { const r = RD.routes.find((x) => x.id === f.properties.id); return { color: COL[r.status] || COL.none, weight: 4, dashArray: "6 8", opacity: .85 }; } })
        .bindTooltip(T(`वैकल्पिक मार्ग ${G.num(k + 1)}`, `Alternative ${k + 1}`)).addTo(lay); });
    const g = L.geoJSON({ type: "FeatureCollection", features: feats }, { style: (f) => { const r = RD.routes.find((x) => x.id === f.properties.id); return { color: COL[r.status] || COL.none, weight: 7, opacity: .95, lineCap: "round", dashArray: r.status === "none" ? "2 10" : null }; },
      onEachFeature: (f, l) => { const r = RD.routes.find((x) => x.id === f.properties.id); l.bindPopup(`<b>${esc(T(r.name_ne, r.name_en))}</b><br>${esc(T(r.note_ne, r.note_en))}`); } }).addTo(lay);
    // casing under the coloured lines
    L.geoJSON({ type: "FeatureCollection", features: feats }, { style: { color: "#fff", weight: 11, opacity: .9 }, interactive: false }).addTo(lay).bringToBack();
    // pins on corridors that are not open
    feats.forEach((f) => { const r = RD.routes.find((x) => x.id === f.properties.id); if (r.status === "open") return;
      const cs = f.geometry.type === "LineString" ? f.geometry.coordinates : f.geometry.coordinates.flat(), mid = cs[Math.floor(cs.length / 2)];
      const src = (r.sources || []).map((k) => RD.sources[k]).filter(Boolean).map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(T(s.ne, s.en))} ↗</a>`).join("<br>");
      L.marker([mid[1], mid[0]], { icon: L.divIcon({ className: "rpin rp-" + r.status, html: r.status === "blocked" ? "⛔" : r.status === "oneway" ? "⚠" : "?", iconSize: [30, 30] }), keyboard: true, title: T(r.name_ne, r.name_en) })
        .bindPopup(`<b>${esc(T(r.name_ne, r.name_en))}</b><br>${esc(T(r.note_ne, r.note_en))}<br><small>${src}<br>${esc(T(RD.as_of_ne, RD.as_of_en))}</small>`).addTo(lay); });
    const s = N[P[0][0]], e = N[P[P.length - 1][1]];
    L.marker(s.ll, { icon: L.divIcon({ className: "rend rs", html: "A", iconSize: [28, 28] }) }).bindTooltip(esc(T(s.ne, s.en)), { permanent: true, direction: "top", offset: [0, -14], className: "rtip" }).addTo(lay);
    L.marker(e.ll, { icon: L.divIcon({ className: "rend re", html: "B", iconSize: [28, 28] }) }).bindTooltip(esc(T(e.ne, e.en)), { permanent: true, direction: "top", offset: [0, -14], className: "rtip" }).addTo(lay);
    // district labels for districts the route passes through
    if (DG) { const pts = feats.flatMap((f) => (f.geometry.type === "LineString" ? f.geometry.coordinates : f.geometry.coordinates.flat())).filter((_, k) => k % 6 === 0);
      const inR = (x, y, r) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [a, b] = r[i], [c, d] = r[j]; if ((b > y) !== (d > y) && x < ((c - a) * (y - b)) / (d - b) + a) o = !o; } return o; };
      DG.features.forEach((f) => { const P2 = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates; if (!pts.some(([x, y]) => P2.some((p) => inR(x, y, p[0])))) return;
        let x0 = 999, x1 = -999, y0 = 999, y1 = -999; P2.forEach((p) => p[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
        L.marker([(y0 + y1) / 2, (x0 + x1) / 2], { icon: L.divIcon({ className: "rdl", html: esc(T(f.properties.ne, f.properties.en)), iconSize: [90, 16] }), interactive: false }).addTo(lay); }); }
    map.fitBounds(g.getBounds().pad(0.15));
  }
  const hav = (a, b) => { const r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const EN = G.routeEngine(RD, RG), adj = EN.adj;
  const groups0 = (P) => P.some(([, , rt]) => rt.status !== "open" && rt.status !== "oneway");
  const RS = { open: ["खुला", "Open", "ok"], blocked: ["अवरुद्ध", "Blocked", "bad"], oneway: ["एकतर्फी", "One-way", "warn"], none: ["पुष्टि छैन", "Not confirmed", "nc"] };
  const f = document.getElementById("rfrom"), t = document.getElementById("rto");
  const ids = Object.keys(N).filter((k) => adj[k] || N[k].noroad);
  const POP = [["ktm", "pokhara"], ["ktm", "narayanghat"], ["ktm", "ghorahi"], ["ktm", "birgunj"], ["ktm", "biratnagar"], ["ktm", "gorkha"], ["pokhara", "jomsom"], ["ktm", "kodari"], ["nepalgunj", "surkhet"], ["butwal", "pokhara"], ["dhangadhi", "mahendranagar"]].filter(([a, b]) => N[a] && N[b] && adj[a] && adj[b]);
  const QP = new URLSearchParams(location.search), qf = QP.get("from"), qt = QP.get("to");
  function pops() { const el = document.getElementById("rpop"); if (!el) return;
    el.innerHTML = `<span class="rpopl">${T("धेरै हेरिने मार्ग", "Popular routes")}</span>` + POP.map(([a, b]) => `<button type="button" class="aqchip rpopb${f.value === a && t.value === b ? " on" : ""}" data-a="${a}" data-b="${b}" aria-pressed="${f.value === a && t.value === b}">${esc(T(N[a].ne, N[a].en))} → ${esc(T(N[b].ne, N[b].en))}</button>`).join("");
    el.querySelectorAll(".rpopb").forEach((x) => (x.onclick = () => { f.value = x.dataset.a; t.value = x.dataset.b; go(); })); }
  function opts() {
    const keep = [f.value || (N[qf] ? qf : "") || localStorage.getItem("gati-rfrom") || "ktm", t.value || (N[qt] ? qt : "") || localStorage.getItem("gati-rto") || "pokhara"];
    const o = ids.slice().sort((a, b) => T(N[a].ne, N[a].en).localeCompare(T(N[b].ne, N[b].en))).map((k) => `<option value="${k}">${esc(T(N[k].ne, N[k].en))}</option>`).join("");
    f.innerHTML = o; t.innerHTML = o; f.value = keep[0]; t.value = keep[1];
  }
  function draw() {
    try { localStorage.setItem("gati-rfrom", f.value); localStorage.setItem("gati-rto", t.value); } catch (e) {}
    const out = document.getElementById("rout");
    if (f.value === t.value) { out.innerHTML = `<div class="na">${T("फरक ठाउँ छान्नुहोस्।", "Choose two different places.")}</div>`; return; }
    const nr = [f.value, t.value].filter((k) => N[k].noroad);
    if (nr.length) { out.innerHTML = `<div class="na">${nr.map((k) => esc(T(N[k].ne, N[k].en))).join(", ")}: ${T("गतिको सडक तथ्याङ्कमा सडक जोडिएको छैन (OpenStreetMap मा सदरमुकामसम्म सडक पुगेको देखिँदैन)। हवाई वा पैदल मार्ग मात्र हुन सक्छ; पुष्टि भएको छैन।", "No road link in Gati's road data (OpenStreetMap shows no road reaching the HQ). It may be air or trail only; not confirmed.")}</div>`; return; }
    const RTS = EN.routes(f.value, t.value), P = RTS.length ? RTS[0].P : null;
    if (!P) { out.innerHTML = `<div class="na">${T("गतिको सडक तथ्याङ्कमा यी दुई ठाउँ जोड्ने बाटो छैन।", "Gati's road data has no path between these places.")}</div>`; return; }
    const VK = { bad: "alert", unk: "caution", ok: "clear", nc: "no_info" };
    const srcLine = (rt) => { const ss = (rt.sources || ["pol"]).map((k) => RD.sources[k]).filter(Boolean); return `<p class="rsrc">${G.trustChip("Official")} ${ss.map((x) => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(T(x.ne, x.en))} ↗</a>`).join(" · ")} <span class="meta">· ${esc(T(RD.as_of_ne, RD.as_of_en))}</span></p>`; };
    const CL = { terai: ["तराई", "Terai"], hill: ["पहाडी", "Hill"], mountain: ["हिमाली/कच्ची", "Mountain/earthen"] };
    const head = (r) => ({ ok: T("बाटोका सबै खण्ड खुला देखिन्छन्।", "Every corridor on the way shows open."), unk: T("केही खण्ड एकतर्फी छन्।", "Some corridors are one-way."), nc: T("केही खण्डको आधिकारिक स्थिति आएको छैन (हल्का हरियो): सामान्यतया खुला, तर पुष्टि नभएको।", "Some corridors have no official status (light green): usually open, not confirmed."), bad: T("बाटोमा अवरुद्ध खण्ड छ।", "A corridor on the way is blocked.") }[r.st]);
    const etaLine = (r) => `<p class="reta"><b>${EN.fmtKm(r.km)}</b> · <b>${EN.eta(r.h)}</b> <span class="retal">${T("अनुमानित, सामान्य अवस्थामा", "Estimate, normal conditions")}</span></p>${r.blocked ? `<p class="rblk">⛔ ${T("अवरुद्ध खण्ड छ; यो समय लागू हुँदैन।", "Includes a blocked corridor; this time does not apply.")}</p>` : ""}`;
    const steps = (r) => `<ol class="rsteps">${r.groups.map((g) => { const s = RS[g.rt.status] || RS.none; return `<li class="rstep r-${s[2]}"><div class="rdot" aria-hidden="true"></div><div><div class="rtop"><b>${esc(T(N[g.from].ne, N[g.from].en))} → ${esc(T(N[g.to].ne, N[g.to].en))}</b><span class="tag rs-${esc(g.rt.status)}">${T(s[0], s[1])}</span></div>
        <p class="meta">${esc(T(g.rt.name_ne, g.rt.name_en))} · ${EN.fmtKm(g.km)} · ${EN.eta(g.h)} · ${T(CL[g.cls][0], CL[g.cls][1])}</p><p>${esc(T(g.rt.note_ne, g.rt.note_en))}</p>${srcLine(g.rt)}</div></li>`; }).join("")}</ol>`;
    const via = (r) => r.P.map(([a]) => esc(T(N[a].ne, N[a].en))).concat(esc(T(N[t.value].ne, N[t.value].en))).join(" → ");
    const alts = RTS.slice(1), better = RTS[0].st === "bad" ? alts.findIndex((r) => r.st !== "bad") : -1;
    const cnt = {}; RTS[0].groups.forEach((g) => (cnt[g.rt.status] = (cnt[g.rt.status] || 0) + 1));
    const tally = ["blocked", "oneway", "none", "open"].filter((k) => cnt[k]).map((k) => `<span class="tag rs-${k}">${G.num(String(cnt[k]))} ${T(...(G.ROADST[k] || G.ROADST.none))}</span>`).join(" ");
    out.innerHTML = `<section class="card rsum r-${RTS[0].st}"><div class="rverd">${G.verdictBadge(VK[RTS[0].st])}</div>
      <p class="rod"><b>${esc(T(N[f.value].ne, N[f.value].en))}</b> → <b>${esc(T(N[t.value].ne, N[t.value].en))}</b></p><p class="bigmsg">${head(RTS[0])}</p><p class="rtally">${tally}</p>
      ${better >= 0 ? `<p class="rbetter">${T(`विकल्प ${G.num(better + 1)} मा अवरुद्ध खण्ड छैन; तल हेर्नुहोस्।`, `Option ${better + 1} has no blocked corridor; see below.`)}</p>` : ""}${etaLine(RTS[0])}<p class="meta">${esc(T(RD.as_of_ne, RD.as_of_en))} · ${T("मानिएको गति: तराई ४०–५५, पहाडी २५–३५, हिमाली/कच्ची १२–२० कि.मि./घण्टा मानेर; प्रत्यक्ष ट्राफिक होइन।", "Speeds assumed: Terai 40–55, hill 25–35, mountain/earthen 12–20 km/h; not live traffic.")}</p>
      <aside class="rcheck" id="rcheck"></aside>
      <div id="rcard"></div><div id="revbox" hidden></div>
      <p><a class="more" href="${R}map/?route=${encodeURIComponent(f.value + "," + t.value)}">${T("नक्सामा हेर्नुहोस् →", "View on map →")}</a></p></section>
      ${steps(RTS[0])}
      <section class="card ralts"><h2>${T("वैकल्पिक मार्ग", "Alternative routes")}</h2>${alts.length ? alts.map((r, k) => `<details class="ralt r-${r.st}"><summary><b>${T(`विकल्प ${G.num(k + 1)}`, `Option ${k + 1}`)}</b>: ${via(r)}<br>${etaLine(r)}<span class="tag rs-${r.st === "ok" ? "open" : r.st === "bad" ? "blocked" : r.st === "unk" ? "oneway" : "none"}">${head(r)}</span></summary>${steps(r)}</details>`).join("")
        : `<p class="meta">${T("गतिको सडक तथ्याङ्कमा फरक वैकल्पिक मार्ग छैन।", "No distinct alternative route in Gati's road data.")}</p>`}</section>
      <p><a class="btn" href="${R}roads/">${T("सबै सडक र स्रोत हेर्नुहोस् →", "See all roads and sources →")}</a></p>`;
    drawMap(P, alts.map((r) => r.P));
    try { const u = new URL(location.href); u.searchParams.set("from", f.value); u.searchParams.set("to", t.value); history.replaceState(null, "", u); } catch (e) {}
    pops();
    /* travel card: the same answer as a picture or as text, with nothing added */
    if (G.travelCard) { const r0 = RTS[0], nm = (k) => T(N[k].ne, N[k].en), day = G.npt(new Date().toISOString()).split(" · ")[0];
      const TAG = { open: "#1e8e3e", oneway: "#F28C1E", blocked: "#D93025", none: "#5f6b7a" }, BAN = { ok: ["#1e8e3e", T("सबै खण्ड खुला देखिन्छन्", "Every section shows open")], unk: ["#F28C1E", T("केही खण्ड एकतर्फी", "Some sections are one-way")], nc: ["#5f6b7a", T("केही खण्डको आधिकारिक स्थिति छैन", "Some sections have no official status")], bad: ["#D93025", T("बाटोमा अवरुद्ध खण्ड छ", "A section on the way is blocked")] }[r0.st];
      const now = Date.now(), b5 = WX && WX.bulletin5, d0 = b5 && b5.days.find((d) => d.ad === new Date(now + G.tzMs).toISOString().slice(0, 10));
      const wxLine = () => { const pd = G.travelCard.planDate(), dn = pd ? G.travelCard.dayName(pd) : "", dx = pd ? b5 && b5.days.find((d) => d.ad === pd) : d0;
        if (pd && !dx) return T(`DHM को ५ दिने बुलेटिन ${dn} सम्म पुगेको छैन; यात्रा अघि फेरि हेर्नुहोस्।`, `DHM's 5-day bulletin does not reach ${dn} yet; check again before you travel.`);
        if (!dx) return T("आजको DHM बुलेटिन गतिमा छैन; DHM मा हेर्नुहोस्।", "DHM's bulletin for today is not in Gati; check DHM.");
        if (dx.level === "green") return pd ? T(`DHM: ${dn} का लागि देशभर मौसम चेतावनी छैन।`, `DHM: no weather warning anywhere for ${dn}.`) : T("DHM: आज देशभर मौसम चेतावनी छैन।", "DHM: no weather warning anywhere today.");
        return pd ? T(`DHM को ${dn} का लागि मौसम चेतावनी छ; मौसम पृष्ठ हेर्नुहोस्।`, `DHM has a weather warning for ${dn}; see the Weather page.`) : T("DHM को आज मौसम चेतावनी छ; मौसम पृष्ठ हेर्नुहोस्।", "DHM has a weather warning today; see the Weather page."); };
      const nNot = AL ? AL.alerts.filter((a) => a.hazard === "road" && a.trust === "Official" && !a.supersededBy && Date.parse(a.expires) > now).length : null;
      /* with a leaving time, each stop shows an estimated clock time; without one, hours from the start */
      const clock = (min) => { const m = ((Math.round(min / 15) * 15) % 1440 + 1440) % 1440, h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0"); return G.lang === "ne" ? G.num(`${h}:${mm}`) : `${h % 12 || 12}:${mm} ${h < 12 ? "AM" : "PM"}`; };
      const start = () => { const p = G.travelCard.plan(), m = /^(\d\d):(\d\d)$/.exec(p.time || ""); return { t0: m ? +m[1] * 60 + +m[2] : null, date: G.travelCard.planDate(), veh: G.travelCard.vehName(p.veh), note: (p.note || "").trim() }; };
      /* Electric car: distance arithmetic on the person's own range, and links out to find chargers. Gati names no stations. */
      const evPlan = () => { const p = G.travelCard.plan(), R0 = Math.round(+p.range); if (p.veh !== "ev" || !(R0 >= 50 && R0 <= 1000)) return null;
        const stops = [], long = []; let since = 0;
        r0.groups.forEach((g) => { if (g.km > R0) long.push(g); if (since + g.km > R0 && since > 0) { stops.push({ at: g.from, km: since }); since = 0; } since += g.km; });
        return { R0, stops, long }; };
      const evLine = () => { const e = evPlan(); if (!e) return ""; const km = (n) => EN.fmtKm(n);
        return T(`रेन्ज ${km(e.R0)} (मैले भनेको): `, `Range ${km(e.R0)} (my figure): `) + (e.long.length ? T(`${e.long.map((g) => nm(g.from) + "–" + nm(g.to)).join(", ")} खण्ड रेन्जभन्दा लामो; बीचमा चार्ज चाहिन्छ`, `${e.long.map((g) => nm(g.from) + "–" + nm(g.to)).join(", ")} is longer than the range; a charge is needed on the way`) : e.stops.length ? T(`दूरीका आधारमा ${e.stops.map((x) => nm(x.at)).join(", ")} सम्ममा चार्ज`, `on distance alone, charge by ${e.stops.map((x) => nm(x.at)).join(", ")}`) : T("दूरीका आधारमा एकै चार्जमा पुगिन्छ", "on distance alone, one charge covers it")); };

      const evNear = (k) => (EVCH && EVCH.stations || []).filter((s) => (s.near || []).includes(k));
      const evAll = () => { const ids = [f.value].concat(r0.groups.map((g) => g.to)); const seen = new Set(); const out = [];
        ids.forEach((k) => evNear(k).forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); out.push({ ...s, at: k }); } })); return out; };
      const evNote = (k) => { const list = evNear(k); if (!list.length) return "";
        return T("सार्वजनिक सूचीमा (अनौपचारिक, आज जाँचिएको छैन): ", "On public listings (unofficial, not checked today): ") + list.map((s) => T(s.ne, s.en)).join("; "); };

      const slopeIds = new Set(["prithvi"]);
      const rowNote = (g) => {
        if (slopeIds.has(g.rt.id)) return T("घोप्टे भिर कात्तिक २४ (१० नोभेम्बर) बिहान ७:४५ मा दुवै दिशामा सुचारु (चितवन जिल्ला प्रहरी)। उही भीर कात्तिक २३ मा दुई पटक खसेकाले यात्रा अघि १०० मा बुझ्नुहोस्।", "Ghopte Bhir reopened both ways at 7:45 AM on 10 Nov (Chitwan District Police). The same slope failed twice on 9 Nov; check 100 before travelling.") + " · " + EN.fmtKm(g.km);
        if (g.rt.id === "rapti") return T("आधिकारिक स्थिति पुष्टि भएको छैन; यात्रा अघि प्रहरी वा सडक विभाग NAVIGATE मा बुझ्नुहोस्।", "Official status not confirmed; check police or DoR NAVIGATE before travelling.") + " · " + EN.fmtKm(g.km);
        return T(g.rt.name_ne, g.rt.name_en) + " · " + EN.fmtKm(g.km);
      };

      const fillCheck = () => { const el = document.getElementById("rcheck"); if (!el) return;
        const hasSlope = r0.groups.some((g) => slopeIds.has(g.rt.id));
        el.innerHTML = `<h3>${T("यात्रा अघि जाँच्नुहोस्", "Check before you travel")}</h3>
          <p>${T("आधिकारिक करिडोर स्थिति: ", "Official corridor status: ")}<time datetime="${esc(RD.as_of || "")}">${esc(T(RD.as_of_ne, RD.as_of_en))}</time>${T("। जानुअघि फेरि बुझ्नुहोस्।", ". Check again before you go.")}</p>
          <ul>
            <li>${T("ट्राफिक प्रहरी ", "Traffic police ")}<a href="tel:103">103</a> · ${T("प्रहरी ", "Police ")}<a href="tel:100">100</a></li>
            <li><a href="https://navigate.dor.gov.np/app/road-closure-history" target="_blank" rel="noopener">${T("सडक विभाग NAVIGATE, सडक बन्द इतिहास", "DoR NAVIGATE, road-closure history")} ↗</a></li>
          </ul>
          ${hasSlope ? `<p>${T("घोप्टे भिर (पृथ्वी राजमार्ग, इच्छाकामना–४, आधिकारिक): कात्तिक २४ (१० नोभेम्बर) बिहान ७:४५ मा दुवै दिशामा सुचारु — चितवन जिल्ला प्रहरी, कात्तिक २३ रातिको पहिरो हटाएपछि। उही भीर त्यस दिन दुई पटक खसेकाले स्थानीय प्रहरी (१००) सँग बुझ्नुहोस्। १९ नोभेम्बरको देशभरको प्रहरी अवरोध सूचीमा यो खण्ड छैन।", "Ghopte Bhir (Prithvi Highway, Ichchhakamana-4, official): reopened both ways at 7:45 AM on 10 Nov — Chitwan District Police, after the landslide on the night of 9 Nov was cleared. The same slope failed twice that day, so check with local police (100). The stretch is not on Nepal Police's nationwide blockage notice of 19 Nov.")}</p>
          <p class="rcheck-rep">${G.trustChip("Reported")} ${T("१२ नोभेम्बर (कात्तिक २६) का समाचार: सुक्खा पहिरो जारी रहेको, साना सवारी दुवै दिशामा र ठूला एकतर्फी चलेको, राति बन्द हुन सक्ने उल्लेख। यो आधिकारिक सूचना होइन, र १९ नोभेम्बरको प्रहरी सूचीमा छैन; जानुअघि १०३ र NAVIGATE मा बुझ्नुहोस्।", "News on 12 Nov (Kartik 26) described continued dry landslides, small vehicles both ways and large vehicles one-way, and possible night closures. This is not an official notice, and it is not on the 19 Nov police list; check 103 and NAVIGATE before you go.")}
            <a href="https://english.ratopati.com/story/86362/continuous-landslides-in-ghoptebhir-controlled-by-digging-trenches" target="_blank" rel="noopener">Ratopati ↗</a>
            · <a href="https://www.bbc.com/nepali/articles/cw1m4m97dxr0o" target="_blank" rel="noopener">BBC Nepali ↗</a></p>` : ""}`;
      };
      fillCheck();

      const evBox = (p, redraw) => { const bx = document.getElementById("revbox"); if (!bx) return; if (p.veh !== "ev") { bx.hidden = true; bx.innerHTML = ""; return; }
        const e = evPlan(), near = (k) => `https://www.google.com/maps/search/${encodeURIComponent("EV charging station near " + N[k].en + ", Nepal")}`, pts = [f.value].concat(r0.groups.map((g) => g.to));
        const res = !e ? "" : `<ul class="evres">${e.long.map((g) => `<li class="evbad">${T(`${esc(nm(g.from))} → ${esc(nm(g.to))} खण्ड (${EN.fmtKm(g.km)}) हजुरको रेन्जभन्दा लामो छ। बीचमा चार्जर खोज्नुहोस्।`, `${esc(nm(g.from))} → ${esc(nm(g.to))} (${EN.fmtKm(g.km)}) is longer than your range. Find a charger on the way.`)}</li>`).join("")}${e.stops.map((x) => `<li>${T(`<b>${esc(nm(x.at))}</b> सम्ममा चार्ज गर्नुहोस् (अघिल्लो चार्जदेखि ${EN.fmtKm(x.km)})।`, `Charge by <b>${esc(nm(x.at))}</b> (${EN.fmtKm(x.km)} since the last charge).`)}</li>`).join("")}${!e.long.length && !e.stops.length ? `<li>${T(`दूरीका आधारमा ${EN.fmtKm(r0.km)} एकै चार्जमा पुगिन्छ।`, `On distance alone, one charge covers the ${EN.fmtKm(r0.km)}.`)}</li>` : ""}</ul><p class="meta">${T("यो दूरीको हिसाब मात्र हो। उकालो, भार, गति र एसीले बढी ब्याट्री खान्छ; केही जगेडा राख्नुहोस्।", "This is distance arithmetic only. Climbs, load, speed and air conditioning use more battery; keep a reserve.")}</p>`;
        if (!bx.querySelector("#evrange") || bx.dataset.k !== f.value + t.value + G.lang) { bx.dataset.k = f.value + t.value + G.lang;
          bx.innerHTML = `<div class="tcplan evbox"><p class="tcph"><b>${T("यो बाटोमा चार्जिङ", "Charging on this route")}</b></p><label class="tcq"><span class="tcql">${T("पूरा चार्जमा मेरो गाडीको रेन्ज (किमी)", "My car's range on a full charge (km)")}</span><input type="number" id="evrange" inputmode="numeric" min="50" max="1000" step="10" placeholder="${T("जस्तै: ३००", "e.g. 300")}" value="${esc(String(p.range || ""))}"></label><div id="evres"></div>
            <div class="tcq"><span class="tcql">${T("बाटोका ठाउँ नजिक चार्जर खोज्नुहोस् (नक्सामा खुल्छ)", "Find chargers near each stop (opens a map)")}</span><div class="tcchips">${pts.map((k) => `<a class="tcchip evbtn" href="${near(k)}" target="_blank" rel="noopener">${esc(nm(k))} ↗</a>`).join("")}</div></div>
            <div id="evlisted"></div>
            <p class="meta tcpm" id="evdisc">${T("गतिसँग चार्जिङ स्टेसनको आधिकारिक सूची अझै छैन। तल सार्वजनिक वेबसूचीमा देखिएका स्थान हुन्, सुझाव होइनन्। चालु छ कि छैन, जानुअघि सञ्चालकसँग बुझ्नुहोस्।", "Gati has no official list of charging stations yet. The places below appear on public web listings; they are not recommendations. Check with the operator that a charger is working before you rely on it.")}</p></div>`;
          bx.querySelector("#evrange").oninput = (ev) => { G.travelCard.setPlan({ range: ev.target.value }); evBox(G.travelCard.plan(), redraw); if (redraw) redraw(); }; }
        bx.querySelector("#evres").innerHTML = res;
        const listed = evAll(), box = bx.querySelector("#evlisted");
        if (box) box.innerHTML = listed.length ? `<div class="tcq"><span class="tcql">${T("यस मार्गका सार्वजनिक सूचीका चार्जर (अनौपचारिक)", "Publicly listed chargers on this route (unofficial)")}</span><ul class="evlisted">${listed.map((s) => `<li><b>${esc(T(s.ne, s.en))}</b> · ${esc(T(s.detail_ne, s.detail_en))} · ${T("नजिक", "near")} ${esc(nm(s.at))}<br><span class="meta">${(s.sources || []).map((src) => `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.label)} ↗</a>`).join(" · ")}</span></li>`).join("")}</ul><p class="meta">${EVCH ? T(EVCH.note_ne, EVCH.note_en) + " " + T("जाँचेको", "Checked") + ": " + T(EVCH.checked_ne, EVCH.checked_en) + "." : ""}</p></div>` : "";
        const disc = bx.querySelector("#evdisc"); if (disc) disc.hidden = listed.length > 0;
        bx.hidden = false; };
      const mine = (pl) => [[pl.date ? G.travelCard.dayName(pl.date) : "", pl.t0 == null ? "" : T("प्रस्थान ", "Leaving at ") + clock(pl.t0), pl.veh].filter(Boolean).join(" · "), evLine(), pl.note];
      const tripH = r0.groups.reduce((h, g) => h + (g.h[0] + g.h[1]) / 2, 0);
      const arrive = (t0) => T(`${clock(t0)} मा हिँड्दा ${nm(t.value)} करिब ${clock(t0 + tripH * 60)} तिर (अनुमान)`, `Leave ${clock(t0)}, reach ${nm(t.value)} around ${clock(t0 + tripH * 60)} (estimate)`);
      const spec = () => { let lo = 0, hi = 0; const pl = start(); const evOn = G.travelCard.plan().veh === "ev";
        const evTag = { text: T("चार्जर (सूची)", "CHARGER (LISTED)"), color: "#19c37d", ink: "#04281a" };
        const slopeTag = { text: T("भिर सतर्कता", "SLOPE WATCH"), color: "#ffcc33", ink: "#3a2a00" };
        const startNote = evOn ? evNote(f.value) : "";
        const rows = [{ time: pl.t0 == null ? T("सुरु", "Start") : clock(pl.t0), name: nm(f.value), note: startNote, solid: false, tags: evOn && evNear(f.value).length ? [evTag] : [] }].concat(r0.groups.map((g, i) => { lo += g.h[0]; hi += g.h[1]; const s = RS[g.rt.status] || RS.none, mid = (lo + hi) / 2;
          const tags = [{ text: T(s[0], s[1]), color: TAG[g.rt.status] || TAG.none, ink: g.rt.status === "oneway" ? "#14202B" : "#fff" }];
          if (slopeIds.has(g.rt.id)) tags.push(slopeTag);
          if (evOn && evNear(g.to).length) tags.push(evTag);
          const extra = evOn ? evNote(g.to) : "";
          return { time: pl.t0 == null ? "≈" + G.num(String(Math.round(mid * 2) / 2)) + T(" घ", " h") : "≈" + clock(pl.t0 + mid * 60), name: nm(g.to), tags, note: rowNote(g) + (extra ? " · " + extra : ""), color: TAG[g.rt.status] || TAG.none, solid: i === r0.groups.length - 1 }; }));
        const dateStr = pl.date ? G.travelCard.dayName(pl.date) : day;
        const depart = pl.t0 == null ? null : { label: T("मेरो प्रस्थान (मैले लेखेको)", "MY DEPARTURE (written by me)"), value: clock(pl.t0) };
        const evFine = evOn && evAll().length ? T("सूचीका चार्जर अनौपचारिक सार्वजनिक वेबसूचीबाट; आज जाँचिएको छैन।", "Listed chargers are from unofficial public web listings; not checked today.") : "";
        return { kicker: T("सडक यात्रा जाँच", "ROAD TRAVEL CHECK"), date: dateStr, title: nm(f.value) + " → " + nm(t.value), sub: EN.fmtKm(r0.km) + " · " + EN.eta(r0.h) + " " + T("(अनुमान, सामान्य अवस्थामा)", "(estimate, normal conditions)"),
          mineLabel: T("मेरो योजना (मैले लेखेको)", "MY PLAN (written by me)"), mine: mine(pl), depart,
          banner: { label: T("आधिकारिक स्थिति", "OFFICIAL STATUS"), value: BAN[1], color: BAN[0] }, rows,
          foot: [{ h: T("मौसम", "Weather"), v: wxLine() }, { h: T("सडक सूचना", "Road notices"), v: nNot == null ? T("सडक पृष्ठ हेर्नुहोस्।", "See the Roads page.") : T(`अहिले ${G.num(String(nNot))} आधिकारिक सूचना लागू।`, `${nNot} official notice${nNot === 1 ? "" : "s"} in force now.`) + " " + T("यात्रा अघि NAVIGATE र १०३ मा बुझ्नुहोस्।", "Check NAVIGATE and 103 before you travel.") }, { h: T("आपतकाल", "Emergency"), v: T("ट्राफिक १०३ · प्रहरी १०० · एम्बुलेन्स १०२", "Traffic 103 · Police 100 · Ambulance 102") }],
          fine: [T("यात्रा अघि फेरि जाँच्नुहोस्।", "Check again before you travel."), T("स्रोत: नेपाल प्रहरी, सडक विभाग, DHM", "Sources: Nepal Police, Department of Roads, DHM") + " · " + T(RD.as_of_ne, RD.as_of_en), evFine, T("समय मानिएको गतिमा आधारित अनुमान हो, प्रत्यक्ष ट्राफिक होइन। मुख्य करिडोर मात्र।", "Times are estimates at assumed speeds, not live traffic. Main corridors only."), T("गतिले आधिकारिक सूचना मात्र फैलाउँछ; आफैँ चेतावनी जारी गर्दैन।", "Gati relays official notices. It does not issue warnings.")].filter(Boolean) }; };
      const text = () => { const pl = start(); const m = mine(pl).filter(Boolean); return (m.length ? T("मेरो योजना: ", "My plan: ") + m.join(" · ") + "\n" : "") + body(); };
      const body = () => `${nm(f.value)} → ${nm(t.value)}: ${BAN[1]}. ${EN.fmtKm(r0.km)}, ${EN.eta(r0.h)} ${T("(अनुमान)", "(estimate)")}.\n` + r0.groups.map((g) => { const s = RS[g.rt.status] || RS.none; return `• ${nm(g.from)} → ${nm(g.to)}: ${T(s[0], s[1])}`; }).join("\n") + `\n${wxLine()}\n${T("स्रोत: नेपाल प्रहरी, सडक विभाग, DHM", "Sources: Nepal Police, Department of Roads, DHM")} · ${T(RD.as_of_ne, RD.as_of_en)}. ${T("यात्रा अघि १०३, १०० र सडक विभाग NAVIGATE मा बुझ्नुहोस्।", "Check 103, 100 and DoR NAVIGATE before you travel.")} ${T("गतिले आधिकारिक सूचना मात्र फैलाउँछ।", "Gati relays official notices only.")}`;
      G.travelCard.actions(document.getElementById("rcard"), { plan: true, arrive, onPlan: evBox, spec, text, name: () => `gati-${f.value}-${t.value}.png` }); }
    const sb = document.getElementById("rshare"); if (sb) sb.onclick = () => { const txt = `${T(N[f.value].ne, N[f.value].en)} → ${T(N[t.value].ne, N[t.value].en)}: ${(sb.closest(".rsum").querySelector(".vbadge") || {}).textContent || ""}. ${head(RTS[0])} ${T(RD.as_of_ne, RD.as_of_en)}. ${T("गतिले आधिकारिक स्रोत मात्र प्रसारण गर्छ", "Gati relays official sources")}`;
      const done = () => { sb.textContent = T("लिङ्क कपी भयो", "Link copied"); setTimeout(() => (sb.textContent = T("मार्ग सेयर गर्नुहोस्", "Share route")), 2000); };
      if (navigator.share) navigator.share({ title: T("मार्ग जाँच", "Route check"), text: txt, url: location.href }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(txt + " " + location.href).then(done, () => {}); };
    document.getElementById("rnote").textContent = T("गतिको सडक तथ्याङ्कमा भएका मुख्य करिडोर मात्र। स्थानीय सडक समावेश छैन।", "Only the main corridors in Gati's road data. Local roads are not included.");
  }
  f.onchange = t.onchange = draw;
  const go = () => { draw(); const o = document.getElementById("rout"), h = o.querySelector(".rsum,.na");
    o.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }; document.getElementById("rgo").onclick = go; document.getElementById("rswap").onclick = () => { [f.value, t.value] = [t.value, f.value]; draw(); };
  /* Road notices in force right now, from the alerts themselves: the route answer above covers main corridors only,
     so a police notice about any other road is still shown here, with its source and time. */
  function notices() { const el = document.getElementById("rnotices"); if (!el || !AL) return;
    const now = Date.now(), dn = (c) => { const d = DS && DS.find((x) => x.code === c); return d ? T(d.ne, d.en) : c; };
    const road = AL.alerts.filter((a) => a.hazard === "road" && a.trust === "Official" && !a.supersededBy), list = road.filter((a) => Date.parse(a.expires) > now);
    const past = road.filter((a) => Date.parse(a.expires) <= now && now - Date.parse(a.expires) < 864e5);
    el.innerHTML = `<section class="card rnot"><h2>${T("अहिले लागू सडक सूचना", "Road notices in force now")} <span class="count">${G.num(String(list.length))}</span></h2>` + (list.length
      ? `<ul class="rnotl">${list.map((a) => { const i = a.info[G.lang] || a.info.ne; return `<li><a class="rnotbtn" href="${R}alerts/${esc(a.identifier)}/"><b>${esc(i.headline)}</b><small>${esc(a.districts.map(dn).join(", "))} · ${esc(i.senderName.split(" — ")[0].split(" · ")[0])} · ${G.npt(i.params["gati:sourceTime"] || a.sent)}</small></a></li>`; }).join("")}</ul>`
      : `<p class="meta">${T("अहिले कुनै सक्रिय आधिकारिक सडक सूचना छैन।", "No official road notice is in force right now.")}</p>`)
      + (past.length ? `<h3 class="rnoth">${T("पछिल्लो २४ घण्टामा म्याद सकिएका, नयाँ सूचना नआएका", "Ended in the last 24 hours, with no newer notice yet")}</h3><ul class="rnotl">${past.map((a) => { const i = a.info[G.lang] || a.info.ne; return `<li><a class="rnotbtn ended" href="${R}alerts/${esc(a.identifier)}/"><span class="rnottag">${T("म्याद सकियो", "Ended")} ${G.npt(a.expires)}</span><b>${esc(i.headline)}</b><small>${esc(a.districts.map(dn).join(", "))} · ${esc(i.senderName.split(" — ")[0].split(" · ")[0])} · ${T("अवस्था उस्तै हुन सक्छ; यात्रा अघि स्थानीय प्रहरी (१००) सँग बुझ्नुहोस्।", "The road may still be affected; check with local police (100) before travelling.")}</small></a></li>`; }).join("")}</ul>` : "")
      + `<p class="rnotmore"><a class="more" href="${R}roads/">${T("सबै सडकको अवस्था →", "All road status →")}</a> <a class="more" href="${R}affected/">${T("के म प्रभावित छु? →", "Am I affected? →")}</a></p></section>`; }
  opts(); draw(); G.onLang(() => { opts(); draw(); notices(); });
  [AL, DS, WX, EVCH] = await Promise.all(["data/alerts.json", "data/districts.json", "data/weather.json", "data/ev-chargers-reported.json"].map((x) => G.json(x).catch(() => null))); notices(); draw();
})();
