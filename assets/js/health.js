/* Health page: MoHP Free Health dashboard, relayed as published (Official). Beds are the free-scheme beds
   (10% reserved for targeted groups), not all empty beds. Each hospital/blood bank is shown separately; nothing is added across facilities. */
(function () {
  const G = window.Gati; if (!G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const out = document.getElementById("hout"), q = document.getElementById("hq"), ds = document.getElementById("hd"), gs = document.getElementById("hg"), gw = document.getElementById("hgw");
  const GR = [["a_pos", "A+"], ["a_neg", "A-"], ["b_pos", "B+"], ["b_neg", "B-"], ["o_pos", "O+"], ["o_neg", "O-"], ["ab_pos", "AB+"], ["ab_neg", "AB-"]];
  const nk = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/[\u0901\u0902\u093c\u094d]/g, "").replace(/ण/g, "न").replace(/ड/g, "ड").replace(/[^a-z\u0900-\u097f]/g, "").replace(/chowk$/, "chok"), AL = { dhanusa: "dhanusha", "काठमानडौ": "काठमाडौ" }, nka = (s) => { const k = nk(s); return AL[k] || k; };
  let H = null, D = [], byNe = {}, byEn = {}, st = { t: "beds", q: "", d: "", g: "" };
  Promise.all(["data/health.json", "data/districts.json"].map((p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([h, d]) => {
    H = h; D = d || []; D.forEach((x) => { byNe[nk(x.ne)] = x; byEn[nk(x.en)] = x; });
    const h0 = location.hash.slice(1); if (h0 === "blood") st.t = "blood";
    draw(); G.onLang(draw);
  });
  const dOf = (x, k) => (k === "ne" ? byNe[nka(x)] : byEn[nka(x)]) || { id: "raw:" + x, en: x, ne: x };
  const tel = (n) => { const s = String(n || "").replace(/[^\d+]/g, ""); return s.length >= 6 ? `<a class="hmchip" href="tel:${E(s)}">${T("फोन", "Call")} ${E(N(n))}</a>` : ""; };
  const src = (blk) => `${G.trustChip("Official")} <span class="meta">${T("स्रोत", "Source")}: <a href="${E(blk.url || H.url)}" target="_blank" rel="noopener">${T("स्वास्थ्य मन्त्रालय", "MoHP")}</a> · ${T("गतिले लिएको", "fetched")} ${G.npt(blk.fetched)}</span>`;
  function rows() {
    const blk = H[st.t === "beds" ? "beds" : "blood"], qq = st.q.trim().toLowerCase();
    let xs = blk.items.map((x) => ({ x, d: st.t === "beds" ? dOf(x.district, "en") : dOf(x.district_ne, "ne") }));
    if (st.d) xs = xs.filter((r) => r.d.id === st.d);
    if (qq) xs = xs.filter((r) => [r.x.name, r.x.address, r.x.palika, r.x.municipality_ne, r.d.en, r.d.ne].join(" ").toLowerCase().includes(qq));
    if (st.t === "blood" && st.g) xs = xs.filter((r) => r.x.groups && r.x.groups[st.g] > 0);
    if (st.t === "beds") xs.sort((a, b) => b.x.available - a.x.available || a.x.name.localeCompare(b.x.name));
    else xs.sort((a, b) => (st.g ? (b.x.groups || {})[st.g] - (a.x.groups || {})[st.g] : b.x.total - a.x.total) || a.x.name.localeCompare(b.x.name));
    return { blk, xs };
  }
  function bedCard({ x, d }, blk) {
    return `<li class="hli"><div class="hlh"><b>${E(x.name)}</b><span class="meta">${E(T(d.ne, d.en))}${x.palika ? ", " + E(x.palika) : ""} · ${E(/PUBLIC\)/.test(x.ownership) && !/NON/.test(x.ownership) ? T("सरकारी", "Government") : T("गैरसरकारी", "Non-government"))}</span></div>
      <div class="hln"><span><b class="${x.available ? "" : "h0"}">${N(x.available)}</b> ${T("उपलब्ध नि:शुल्क बेड", "free beds available")}</span><span>${N(x.used)} ${T("प्रयोगमा", "in use")}</span><span>${N(x.free)} ${T("नि:शुल्क बेड (१०%)", "free beds (10%)")}</span><span>${N(x.total)} ${T("कुल बेड", "total beds")}</span></div>
      <p class="hls">${tel(x.contact)} ${src(blk)}</p></li>`;
  }
  function bloodCard({ x, d }, blk) {
    const g = x.groups;
    return `<li class="hli"><div class="hlh"><b>${E(x.name)}</b><span class="meta">${E(T(d.ne, d.en))}${x.address ? ", " + E(x.address) : ""}</span></div>
      ${g ? `<div class="hlg">${GR.map(([k, l]) => `<span class="${g[k] ? "" : "h0"}${st.g === k ? " on" : ""}"><b>${l}</b> ${N(g[k])}</span>`).join("")}</div>` : `<p class="meta">${T("स्टक विवरण उपलब्ध छैन", "Stock detail not available")}</p>`}
      ${x.components && x.components.length ? `<p class="meta">${T("प्रकार", "Components")}: ${x.components.map((c) => `${E(c.c)} ${N(c.n)}`).join(" · ")}</p>` : ""}
      <p class="hls">${tel(x.contact)} ${src(blk)}${x.stock_updated ? ` <span class="meta">· ${T("स्टक अद्यावधिक", "stock updated")} ${G.npt(x.stock_updated)}</span>` : ""}</p></li>`;
  }
  function draw() {
    if (!H) { out.innerHTML = `<p class="meta">${T("तथ्याङ्क लोड भएन।", "Data could not load.")}</p>`; return; }
    document.querySelectorAll(".hltabs button").forEach((b) => { b.setAttribute("aria-selected", b.dataset.t === st.t); b.onclick = () => { st.t = b.dataset.t; st.d = ""; history.replaceState(null, "", st.t === "blood" ? "#blood" : location.pathname); draw(); }; });
    gw.hidden = st.t !== "blood"; q.placeholder = T(st.t === "beds" ? "अस्पतालको नाम वा ठाउँ" : "रक्त सञ्चार केन्द्रको नाम वा ठाउँ", st.t === "beds" ? "Hospital name or place" : "Blood bank name or place");
    const blk = H[st.t === "beds" ? "beds" : "blood"], seen = {};
    blk.items.forEach((x) => { const d = st.t === "beds" ? dOf(x.district, "en") : dOf(x.district_ne, "ne"); seen[d.id] = d; });
    ds.innerHTML = `<option value="">${T("सबै जिल्ला", "All districts")}</option>` + Object.values(seen).sort((a, b) => T(a.ne, a.en).localeCompare(T(b.ne, b.en))).map((d) => `<option value="${E(d.id)}"${d.id === st.d ? " selected" : ""}>${E(T(d.ne, d.en))}</option>`).join("");
    gs.innerHTML = `<option value="">${T("सबै समूह", "All groups")}</option>` + GR.map(([k, l]) => `<option value="${k}"${k === st.g ? " selected" : ""}>${l}</option>`).join("");
    const { xs } = rows();
    const warn = blk.reachable === false ? `<p class="hmnone">${T(`मन्त्रालयको साइट ${G.npt(H.checked)} मा खुलेन। पछिल्लो आधिकारिक तथ्याङ्क देखाइएको छ।`, `The Ministry's site could not be reached at ${G.npt(H.checked)}. The last official figures are shown.`)}</p>` : "";
    const note = st.t === "beds" ? T("यी लक्षित वर्ग नि:शुल्क उपचार कार्यक्रमअन्तर्गत छुट्याइएका बेड (कुल बेडको १०%) हुन्, अस्पतालका सबै खाली बेड होइनन्। मन्त्रालयले अस्पतालअनुसार अद्यावधिक समय दिँदैन; गतिले लिएको समय देखाइएको छ।", "These are beds reserved under the free treatment scheme for targeted groups (10% of beds), not all empty beds in a hospital. The Ministry gives no per-hospital update time; Gati's fetch time is shown.")
      : T("रक्त सञ्चार केन्द्रले मन्त्रालयमा पठाएको स्टक, युनिटमा। रगत चाहिँदा पहिले फोन गर्नुहोस्।", "Stock reported by each blood bank to the Ministry, in units. Please call before going.");
    out.innerHTML = `${warn}<p class="meta">${note}</p><p class="meta">${N(xs.length)} ${T(st.t === "beds" ? "अस्पताल" : "रक्त सञ्चार केन्द्र", st.t === "beds" ? "hospitals" : "blood banks")}</p>
      ${xs.length ? `<ul class="hlist">${xs.slice(0, 150).map((r) => (st.t === "beds" ? bedCard(r, blk) : bloodCard(r, blk))).join("")}</ul>${xs.length > 150 ? `<p class="meta">${T("पहिलो १५० मात्र देखाइएको; खोज वा जिल्ला छान्नुहोस्।", "Showing the first 150; search or pick a district.")}</p>` : ""}` : `<p class="hmnone">${T("मिल्ने नतिजा छैन", "No matching results")}</p>`}`;
  }
  q.oninput = () => { st.q = q.value; draw(); }; ds.onchange = () => { st.d = ds.value; draw(); }; gs.onchange = () => { st.g = gs.value; draw(); };
})();
