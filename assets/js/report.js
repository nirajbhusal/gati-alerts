/* Citizen report. Default: a prefilled GitHub issue form (no backend, no secrets).
   When data/report-config.json names a Worker, people can also send without an account (worker/src/report.js). */
(async function () {
  const G = window.Gati, $ = (id) => document.getElementById(id);
  const REPO = "https://github.com/" + G.country.repository;
  // Option values must match .github/ISSUE_TEMPLATE/report.yml exactly.
  const HAZ = ["बाढी / Flood", "पहिरो / Landslide", "सडक अवरोध / Road blocked", "पुल क्षति / Bridge damage", "भारी वर्षा / Heavy rain",
    "हिमताल/हिमपहिरो / Glacial lake or avalanche", "भूकम्प / Earthquake", "आगलागी / Fire", "बिजुली/सञ्चार अवरोध / Power or telecom outage", "अन्य / Other"];
  const districts = await G.json("data/districts.json");
  function fill() {
    const hv = $("hazard").value, dv = $("district").value;
    const pick = (s) => (G.lang === "ne" ? s.split(" / ")[0] : s.split(" / ")[1]);
    $("hazard").innerHTML = `<option value="">—</option>` + HAZ.map((h) => `<option value="${h}">${pick(h)}</option>`).join("");
    const nm = (d) => (G.lang === "ne" ? d.ne : d.en);
    $("district").innerHTML = `<option value="">—</option>` + [...districts].sort((a, b) => nm(a).localeCompare(nm(b), G.lang))
      .map((d) => `<option value="${d.id}">${G.esc(nm(d))}</option>`).join("");
    $("hazard").value = hv; $("district").value = dv;
  }
  fill(); G.onLang(fill);
  const pad = (n) => String(n).padStart(2, "0"), n = new Date();
  $("when").value = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;

  let marker, map;
  const setPin = (la, lo, fly) => {
    la = +la.toFixed(4); lo = +lo.toFixed(4);
    $("latlon").value = `${la}, ${lo}`;
    if (!map) return;
    if (!marker) { marker = L.marker([la, lo], { draggable: true }).addTo(map);
      marker.on("dragend", () => { const p = marker.getLatLng(); setPin(p.lat, p.lng); }); }
    else marker.setLatLng([la, lo]);
    if (fly) map.setView([la, lo], 14);
  };
  if (window.L) {
    map = L.map("pickmap").setView(G.country.map.center, G.country.map.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    map.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));
  }
  $("latlon").addEventListener("change", () => { const m = $("latlon").value.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/); if (m) setPin(+m[1], +m[3], true); });
  $("gps").onclick = () => {
    if (!navigator.geolocation) return;
    $("gps").disabled = true;
    navigator.geolocation.getCurrentPosition((p) => { setPin(p.coords.latitude, p.coords.longitude, true); $("gps").disabled = false; },
      () => { $("gps").disabled = false; alert(G.lang === "ne" ? "GPS भेटिएन। नक्सामै थिचेर ठाउँ छान्नुहोस्।" : "Could not get GPS. Tap the map instead."); },
      { enableHighAccuracy: true, timeout: 15000 });
  };
  $("photo").onchange = () => { const f = $("photo").files[0]; const im = $("preview");
    if (f) { im.src = URL.createObjectURL(f); im.style.display = "block"; } else im.style.display = "none"; };

  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const check = () => {
    const miss = [];
    if (!$("hazard").value) miss.push(G.lang === "ne" ? "खतराको किसिम" : "hazard type");
    if (!$("district").value) miss.push(G.lang === "ne" ? "जिल्ला" : "district");
    if (!$("desc").value.trim()) miss.push(G.lang === "ne" ? "विवरण" : "description");
    if (!$("consent").checked) miss.push(G.lang === "ne" ? "सहमति" : "consent");
    if (miss.length) { $("err").hidden = false; $("err").textContent = (G.lang === "ne" ? "यति भर्न बाँकी छ: " : "Please complete: ") + miss.join(", "); return false; }
    $("err").hidden = true; return true;
  };
  $("rf").onsubmit = (e) => {
    e.preventDefault();
    if (!check()) return;
    const d = districts.find((x) => x.id === $("district").value);
    const haz = $("hazard").value, when = $("when").value;
    const title = `[Report] ${haz.split(" / ")[1]} — ${d.en}${$("municipality").value ? ", " + $("municipality").value : ""}`;
    const q = new URLSearchParams({
      template: "report.yml", title, labels: "reported,citizen-report",
      hazard: haz, district: `${d.ne} / ${d.en}`, municipality: $("municipality").value.trim(), ward: $("ward").value.trim(),
      place: $("place").value.trim(), gps: $("latlon").value.trim(), observed: when ? when.replace("T", " ") + " NPT" : "",
      description: $("desc").value.trim(),
    });
    const url = `${REPO}/issues/new?${q}`;
    window.open(url, "_blank", "noopener");
    $("done").hidden = false;
    $("done").innerHTML = G.lang === "ne"
      ? `<p><strong>GitHub नयाँ ट्याबमा खुल्यो।</strong> त्यहाँ विवरण एकपटक हेरेर "Create" थिच्नुहोस्। ${$("photo").files[0] ? "तस्विर विवरणको ठाउँमा तानेर राख्न नबिर्सनुहोस्।" : ""} खुलेन भने <a href="${G.esc(url)}" target="_blank" rel="noopener">यहाँ थिच्नुहोस्</a>।</p>`
      : `<p><strong>GitHub opened in a new tab.</strong> Check the details there and press "Create". ${$("photo").files[0] ? "Remember to drag your photo into the description box." : ""} If nothing opened, <a href="${G.esc(url)}" target="_blank" rel="noopener">click here</a>.</p>`;
    $("done").scrollIntoView({ behavior: "smooth" });
  };

  /* ---- Send without an account (only when a Worker is configured) ---- */
  let cfg = null; try { cfg = await G.json("data/report-config.json"); } catch (e) {}
  if (!cfg || !/^https:\/\/.+\/report$/.test(cfg.worker || "")) return;
  const t0 = Date.now(), ghBtn = $("rf").querySelector("button[type=submit]");
  const anon = document.createElement("button"); anon.type = "button"; anon.className = "btn"; anon.id = "anon"; anon.style.marginRight = "8px";
  const hp = document.createElement("div"); hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;left:-9999px;height:0;overflow:hidden";
  hp.innerHTML = '<label>Website<input id="website" tabindex="-1" autocomplete="off"></label>';
  ghBtn.before(hp, anon); ghBtn.classList.add("alt");
  const info = document.createElement("p"); info.className = "meta"; $("rf").before(info);
  const label = () => {
    anon.textContent = "➤ " + T("खाता बिना पठाउनुहोस्", "Send without an account");
    info.textContent = T("अब GitHub खाता बिना पनि पठाउन मिल्छ। रिपोर्ट सार्वजनिक हुन्छ; हजुरको नाम वा सम्पर्क लिइँदैन।", "You can now send without a GitHub account. The report is public; no name or contact is taken.");
    const ph = $("photohint"); if (ph) ph.textContent = T("खाता बिना पठाउँदा तस्विरबाट स्थान लगायत लुकेका विवरण हटाइन्छ र तस्विर मोडेरेटरले मात्र हेर्छन्; सार्वजनिक हुँदैन। अनुहार, घर नम्बर वा पीडितको तस्विर नराख्नुहोस्।",
      "When sent without an account, hidden details such as location are removed from the photo and only moderators see it; it is not published. Avoid faces, house numbers and images of victims.");
  };
  label(); G.onLang(label);
  /* Re-draw the photo on a canvas: smaller upload, and the phone's EXIF/GPS never leaves the device. */
  const photoData = (file) => new Promise((res) => {
    if (!file) return res(null);
    const im = new Image(), u = URL.createObjectURL(file);
    im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      let q = 0.8, d = c.toDataURL("image/jpeg", q); while (d.length > 780000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
      res(d.length > 780000 ? null : d); };
    im.onerror = () => { URL.revokeObjectURL(u); res(null); }; im.src = u;
  });
  let ts = null;
  if (cfg.turnstileSiteKey) { const box = document.createElement("div"); box.id = "tsbox"; anon.before(box);
    const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true;
    s.onload = () => window.turnstile && window.turnstile.ready(() => { window.turnstile.render("#tsbox", { sitekey: cfg.turnstileSiteKey, callback: (tok) => (ts = tok) }); });
    document.head.appendChild(s); }
  const ERR = { rate_limited: ["धेरै रिपोर्ट आए। केही बेरपछि फेरि पठाउनुहोस्।", "Too many reports. Please try again later."], daily_cap: ["आजको सीमा पुग्यो। GitHub बाट पठाउनुहोस्।", "Today's limit is reached. Please use GitHub."],
    too_fast: ["अलि बिस्तारै: फारम एकपटक हेरेर फेरि थिच्नुहोस्।", "Please check the form once and press again."], photo: ["तस्विर लिन सकिएन। तस्विर बिना पठाउनुहोस्।", "The photo could not be used. Send without it."],
    challenge_failed: ["जाँच पूरा भएन। फेरि प्रयास गर्नुहोस्।", "The check did not pass. Please try again."] };
  anon.onclick = async () => {
    if (!check()) return;
    const d = districts.find((x) => x.id === $("district").value);
    anon.disabled = true; $("err").hidden = true;
    const fail = (code) => { const m = ERR[code] || ["पठाउन सकिएन। GitHub बाट पठाउनुहोस्, वा पछि फेरि प्रयास गर्नुहोस्।", "Could not send. Use GitHub, or try again later."];
      $("err").hidden = false; $("err").textContent = T(m[0], m[1]); anon.disabled = false; };
    try {
      const body = { hazard: $("hazard").value, district: `${d.ne} / ${d.en}`, municipality: $("municipality").value.trim(), ward: $("ward").value.trim(), place: $("place").value.trim(),
        gps: $("latlon").value.trim(), observed: $("when").value, description: $("desc").value.trim(), consent: true, lang: G.lang, website: $("website").value, elapsed: Date.now() - t0,
        photo: await photoData($("photo").files[0]) || undefined, turnstile: ts || undefined };
      const r = await fetch(cfg.worker, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) return fail(j.error);
      $("rf").hidden = true; $("done").hidden = false;
      $("done").innerHTML = `<p><strong>${T("रिपोर्ट पठाइयो। धन्यवाद।", "Report sent. Thank you.")}</strong> ${T("रिपोर्ट नं.", "Report no.")} #${G.esc(String(j.number))}. ${T("मोडेरेटरले जाँचेपछि मात्र गतिको रिपोर्ट पेजमा देखिन्छ।", "It appears on Gati's reports page only after a moderator has checked it.")} ${T("ज्यान जोखिममा छ भने १०० वा १२३४ मा फोन गर्नुहोस्।", "If life is at risk, call 100 or 1234.")}</p>`;
      $("done").scrollIntoView({ behavior: "smooth" });
    } catch (e) { fail(); }
  };
})();
