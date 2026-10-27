/* "My district" picker: a searchable bottom sheet. Nepali, English and romanised input ("rasuwa", "kavre"),
   grouped by the 7 provinces, "use my location" (browser geolocation + point-in-polygon on
   data/districts.geojson, computed on this device only), and recent picks. Saved in this browser only. */
(function () {
  const G = window.Gati, R = G.root, KEY = "gati-district", RKEY = "gati-district-recent";
  const PROV = [["koshi", "कोशी प्रदेश", "Koshi Province"], ["madhesh", "मधेश प्रदेश", "Madhesh Province"], ["bagmati", "बागमती प्रदेश", "Bagmati Province"],
    ["gandaki", "गण्डकी प्रदेश", "Gandaki Province"], ["lumbini", "लुम्बिनी प्रदेश", "Lumbini Province"], ["karnali", "कर्णाली प्रदेश", "Karnali Province"],
    ["sudurpaschim", "सुदूरपश्चिम प्रदेश", "Sudurpashchim Province"]];
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z\u0900-\u097f]/g, "")
    .replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u").replace(/w/g, "v").replace(/sh/g, "s").replace(/ph/g, "f").replace(/chh/g, "ch").replace(/th/g, "t").replace(/dh/g, "d").replace(/bh/g, "b").replace(/kh/g, "k").replace(/gh/g, "g");
  let D = null, geo = null;
  const load = () => D ? Promise.resolve(D) : G.json("data/districts.json").then((d) => (D = d));
  const recent = () => { try { return JSON.parse(localStorage.getItem(RKEY) || "[]"); } catch (e) { return []; } };
  function inRing(pt, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; }
  function locate(lon, lat) {
    for (const f of geo.features) { const g = f.geometry, parts = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
      for (const p of parts) if (inRing([lon, lat], p[0]) && !p.slice(1).some((h) => inRing([lon, lat], h))) return f.id; }
    return null;
  }
  let sheet;
  function build() {
    sheet = document.createElement("div");
    sheet.className = "dsheet"; sheet.hidden = true;
    sheet.innerHTML = `<div class="dback"></div><div class="dpanel" role="dialog" aria-modal="true"><div class="grab" aria-hidden="true"></div>
      <div class="dhead"><h3 id="dtitle"></h3><button type="button" class="pclose" aria-label="Close">✕</button></div>
      <input type="search" class="dq" autocomplete="off" spellcheck="false">
      <div class="dacts"><button type="button" class="sbtn dloc"></button><button type="button" class="sbtn dclear"></button></div>
      <div class="drad"></div><p class="meta dmsg" role="status"></p><div class="dlist"></div></div>`;
    document.body.append(sheet);
    sheet.querySelector(".dback").onclick = close; sheet.querySelector(".pclose").onclick = close;
    sheet.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    sheet.querySelector(".dq").oninput = list;
    sheet.querySelector(".dclear").onclick = () => pick("");
    sheet.querySelector(".dloc").onclick = () => {
      const msg = sheet.querySelector(".dmsg");
      if (!navigator.geolocation) { msg.textContent = T("यो ब्राउजरमा स्थान पत्ता लगाउन मिल्दैन।", "Location is not available in this browser."); return; }
      msg.textContent = T("स्थान खोज्दै…", "Finding your location…");
      navigator.geolocation.getCurrentPosition(async (p) => {
        geo = geo || (await G.json("data/districts.geojson"));
        const code = locate(p.coords.longitude, p.coords.latitude);
        if (code) { msg.textContent = ""; pick(code); } else msg.textContent = T("हजुरको स्थान नेपालको कुनै जिल्लाभित्र भेटिएन।", "Your location is not inside a Nepal district.");
      }, () => { msg.textContent = T("स्थान अनुमति दिइएन वा भेटिएन।", "Location permission denied or unavailable."); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    };
  }
  let onPick = null;
  function row(d, cur) { return `<button type="button" class="drow${d.code === cur ? " on" : ""}" data-c="${d.code}"><span>${G.esc(G.lang === "ne" ? d.ne : d.en)}</span><small>${G.esc(G.lang === "ne" ? d.en : d.ne)}</small></button>`; }
  function list() {
    const q = sheet.querySelector(".dq").value.trim(), nq = norm(q), cur = localStorage.getItem(KEY) || "";
    const hit = (d) => !q || d.ne.includes(q) || d.en.toLowerCase().includes(q.toLowerCase()) || norm(d.en).includes(nq) || norm(d.id).includes(nq) || norm(d.ne).includes(nq);
    const rc = recent().map((c) => D.find((d) => d.code === c)).filter(Boolean);
    let h = "";
    if (!q && rc.length) h += `<p class="dgrp">${T("हालै छानेका", "Recent")}</p><div class="dgrid">${rc.map((d) => row(d, cur)).join("")}</div>`;
    for (const [id, pne, pen] of PROV) {
      const ds = D.filter((d) => d.province === id && hit(d)).sort((a, b) => (G.lang === "ne" ? a.ne.localeCompare(b.ne, "ne") : a.en.localeCompare(b.en)));
      if (ds.length) h += `<p class="dgrp">${T(pne, pen)} <small>${T(pen, pne)}</small></p><div class="dgrid">${ds.map((d) => row(d, cur)).join("")}</div>`;
    }
    const L = sheet.querySelector(".dlist");
    L.innerHTML = h || `<p class="meta">${T("कुनै जिल्ला भेटिएन।", "No district found.")}</p>`;
    L.querySelectorAll(".drow").forEach((b) => (b.onclick = () => pick(b.dataset.c)));
  }
  function pick(code) {
    try { if (code) { localStorage.setItem(KEY, code); localStorage.setItem(RKEY, JSON.stringify([code, ...recent().filter((c) => c !== code)].slice(0, 4))); } else localStorage.removeItem(KEY); } catch (e) {}
    close(); onPick && onPick(code);
    try { dispatchEvent(new CustomEvent("gati:district", { detail: code })); } catch (e) {}
  }
  function close() { if (sheet) { sheet.hidden = true; document.body.classList.remove("sheet-open"); } }
  G.district = {
    get: () => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    name: (code) => load().then((d) => { const x = d.find((v) => v.code === code); return x ? (G.lang === "ne" ? x.ne : x.en) : ""; }),
    open: (cb) => Promise.all([load(), G.affect ? 0 : new Promise((ok) => { const s = document.createElement("script"); s.src = R + "assets/js/affectcore.js"; s.onload = s.onerror = ok; document.body.appendChild(s); })]).then(() => {
      if (!sheet) build(); onPick = cb;
      sheet.querySelector("#dtitle").textContent = T("मेरो जिल्ला छान्नुहोस्", "Choose my district");
      const q = sheet.querySelector(".dq"); q.value = ""; q.placeholder = T("खोज्नुहोस्: रसुवा, Rasuwa, rasuwa…", "Search: Rasuwa, रसुवा, kavre…");
      sheet.querySelector(".dloc").textContent = "📍 " + T("मेरो स्थान प्रयोग गर्नुहोस्", "Use my location");
      sheet.querySelector(".dclear").textContent = T("हटाउनुहोस्", "Clear");
      sheet.querySelector(".dmsg").textContent = T("स्थान यही उपकरणमा मात्र जाँचिन्छ, कतै पठाइँदैन।", "Your location is checked on this device only and never sent anywhere.");
      const dr = sheet.querySelector(".drad"); if (G.affect) { dr.innerHTML = G.affect.radiusUI(G.affect.getR()) + `<p class="meta">${T("के म प्रभावित छु? मा प्रयोग हुन्छ।", "Used by Am I affected?")}</p>`; G.affect.bindRadius(dr, () => dispatchEvent(new Event("gati:radius"))); } else dr.innerHTML = "";
      list(); sheet.hidden = false; document.body.classList.add("sheet-open"); setTimeout(() => q.focus(), 50);
    }),
  };
})();
