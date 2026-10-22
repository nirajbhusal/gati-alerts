/* Gati /sources/ health table. Reads data/sources.json and data/source-health.json. */
(function () {
  const G = window.Gati;
  const ST = { ok: ["ठीक", "OK"], stale: ["पुरानो", "Stale"], down: ["पहुँच भएन", "Down"], planned: ["योजनामा", "Planned"] };
  const HZ = { flood: ["बाढी", "flood"], "river-level": ["नदीको सतह", "river level"], rainfall: ["वर्षा", "rainfall"], weather: ["मौसम", "weather"],
    "heavy-rain": ["भारी वर्षा", "heavy rain"], "cold-wave": ["शीतलहर", "cold wave"], road: ["सडक", "road"], incident: ["घटना", "incident"],
    "multi-hazard": ["बहुविपद्", "multi-hazard"], "press-note": ["प्रेस विज्ञप्ति", "press note"], loss: ["क्षति", "loss"], earthquake: ["भूकम्प", "earthquake"],
    "air-quality": ["वायु गुणस्तर", "air quality"], "disease-outbreak": ["रोगको प्रकोप", "disease outbreak"], epidemic: ["महामारी", "epidemic"], lightning: ["चट्याङ", "lightning"],
    "forest-fire": ["वन डढेलो", "forest fire"], avalanche: ["हिमपहिरो", "avalanche"], glof: ["हिमताल विस्फोट", "GLOF"] };
  let S = [], H = {};
  const t = (a) => (G.lang === "ne" ? a[0] : a[1]);
  const poll = (m) => (m % 60 === 0 ? (G.lang === "ne" ? `हरेक ${G.num(m / 60)} घण्टा` : `every ${m / 60} h`) : (G.lang === "ne" ? `हरेक ${G.num(m)} मिनेट` : `every ${m} min`));
  function draw() {
    const el = document.getElementById("srcHealth"); if (!el) return;
    el.innerHTML = `<table class="srct"><thead><tr><th>${G.lang === "ne" ? "स्रोत" : "Source"}</th><th>${G.lang === "ne" ? "अवस्था" : "Status"}</th><th>${G.lang === "ne" ? "अन्तिम सफल" : "Last success"}</th><th>${G.lang === "ne" ? "जाँच" : "Poll"}</th><th>${G.lang === "ne" ? "विपद्" : "Hazards"}</th></tr></thead><tbody>` +
      S.map((s) => {
        const h = H[s.id] || {}, st = G.srcStatus(s, h);
        const name = G.esc(G.lang === "ne" ? s.agency.ne : s.agency.en);
        const link = s.url ? `<a href="${G.esc(s.url)}" rel="noopener">${name}</a><br><span class="muted small">${G.esc(s.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</span>` : name;
        const last = h.lastSuccess ? G.npt(h.lastSuccess) : (st === "planned" ? "" : (G.lang === "ne" ? "अहिलेसम्म छैन" : "none yet"));
        const chk = h.lastChecked && st !== "planned" ? `<br><span class="muted small">${G.lang === "ne" ? "अन्तिम जाँच" : "last checked"} ${G.npt(h.lastChecked)}</span>` : "";
        return `<tr><td>${link}</td><td><span class="sst sst-${st}">${t(ST[st])}</span></td><td>${last}${chk}</td><td>${st === "planned" ? "" : poll(s.pollMinutes)}</td><td>${s.hazards.map((z) => G.esc(t(HZ[z] || [z, z]))).join(", ")}</td></tr>`;
      }).join("") + "</tbody></table>";
    const n = document.getElementById("srcNote");
    if (n) n.innerHTML = G.lang === "ne"
      ? `जाँच नेपालबाहिरको स्वचालित सर्भरबाट गरिएको हो। केही .gov.np साइट त्यस्ता सर्भरका लागि बन्द हुन सक्छन्, तर नेपालबाट हजुरले खोल्दा खुल्न सक्छन्। गतिले सूचना जारी गर्दैन, सरकारी निकायको सूचना मात्र फैलाउँछ।`
      : `Checks run from an automated server outside Nepal. Some .gov.np sites block or time out for such servers yet open fine from Nepal. Gati relays official notices and never issues its own.`;
  }
  Promise.all([G.json("data/sources.json"), G.json("data/source-health.json").catch(() => ({}))]).then(([s, h]) => {
    S = s; H = (h && h.sources) || {}; draw(); if (G.onLang) G.onLang(draw);
  });
})();
