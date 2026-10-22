/* /stories/: one full-screen 9:16 card per active alert. 7 s auto-advance, swipe, tap, keys.
   Everything shown comes from data/alerts.json (the CAP messages). Nothing is invented. */
(function () {
  const G = window.Gati, b = G.b, esc = G.esc, R = G.root;
  const DUR = 7000;
  const stage = document.getElementById("stage"), slides = document.getElementById("slides"), bars = document.getElementById("sbars");
  const pauseBtn = document.getElementById("stpause"), dash = document.getElementById("stdash");
  let items = [], idx = 0, t0 = 0, paused = false, held = false, raf = 0, elapsed = 0;
  try { localStorage.setItem("gati-view", "stories"); } catch (e) {}
  dash.onclick = () => { try { localStorage.setItem("gati-view", "dashboard"); } catch (e) {} };
  const active = (a) => new Date(a.expires) > Date.now() && !a.supersededBy && a.msgType !== "Cancel";
  const SR = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
  const agency = (i) => (i.senderName || "").split(" — ")[0].split(" · ")[0];

  function card(a) {
    const L = G.lang, i = a.info[L] || a.info.ne, sev = G.SEV[a.severity] ? a.severity : "Unknown";
    const src = i.params["gati:sourceTime"] || a.sent;
    const areas = a.areas.map((x) => x[L] || x.en).filter(Boolean).join(" · ");
    const url = `${R}alerts/${a.identifier}/`;
    return `<article class="story s-${sev}" style="--sc:${G.SEVCOLOR[sev]}">
      <div class="shead"><span class="sbrand">${b("गति", "Gati")}</span><span class="ssev">${G.sevChip(sev)}</span></div>
      <div class="sbody">
        <div class="chips">${G.trustChip(a.trust)}${a.state ? G.trustChip(a.state) : ""}<span class="tag">${esc(i.event)}</span></div>
        <h1>${esc(i.headline)}</h1>
        ${areas ? `<p class="sarea">📍 ${esc(areas)}</p>` : ""}
        ${i.instruction ? `<p class="sinstr"><strong>${b("के गर्ने", "What to do")}:</strong> ${esc(i.instruction)}</p>` : ""}
      </div>
      <div class="sfoot">
        <div><div class="slab">${b("स्रोत", "Source")}</div><strong>${esc(agency(i))}</strong>
          <div class="slab">${b("स्रोतको समय", "Source time")}</div><div>${G.npt(src)}</div>
          <p><a href="${esc(i.web)}" target="_blank" rel="noopener">${b("मूल सूचना", "Original notice")} ↗</a> · <a href="${url}">${b("पूरा सूचना", "Full notice")}</a></p></div>
        <a class="sqr" href="${url}" aria-label="QR"><img src="${R}stories/qr/${a.identifier}.svg" alt="QR: ${esc(url)}" width="120" height="120"></a>
      </div>
      <p class="sdisc">${b("गतिले आधिकारिक चेतावनी जारी गर्दैन; मूल स्रोत हेर्नुहोस्। आपत्कालमा १०० वा ११४९।", "Relayed by Gati, not an official warning. Check the original source. Emergency: 100 or 1149.")}</p>
    </article>`;
  }
  function clear() {
    return `<article class="story s-clear" style="--sc:#0F7C86">
      <div class="shead"><span class="sbrand">${b("गति", "Gati")}</span></div>
      <div class="sbody"><h1>${b("अहिले गतिमा कुनै चालु सूचना छैन", "No active alert in Gati right now")}</h1>
      <p class="sinstr">${b("यसको अर्थ खतरा छैन भन्ने होइन। आफ्नो क्षेत्रको आधिकारिक सूचना र मौसम हेरिरहनुहोस्।",
        "This is not an all clear and implies no absence of risk. Keep checking official notices and the weather for your area.")}</p>
      <p><a href="${R}alerts/">${b("पुराना सूचनाको अभिलेख", "Archive of past alerts")}</a> · <a href="${R}">${b("ड्यासबोर्ड", "Dashboard")}</a></p></div>
      <p class="sdisc">${b("आपत्कालमा १००, १०१, १०२ वा ११४९ मा फोन गर्नुहोस्।", "In an emergency call 100, 101, 102 or 1149.")}</p></article>`;
  }
  function draw() {
    const html = items.length ? items.map(card) : [clear()];
    slides.innerHTML = html.map((h, k) => `<div class="slide${k === idx ? " on" : ""}" role="group" aria-roledescription="slide" aria-label="${k + 1} / ${html.length}">${h}</div>`).join("");
    bars.innerHTML = html.map(() => `<span><i></i></span>`).join("");
    pauseBtn.textContent = paused ? (G.lang === "ne" ? "▶ चलाउनुहोस्" : "▶ Play") : (G.lang === "ne" ? "❚❚ रोक्नुहोस्" : "❚❚ Pause");
    pauseBtn.setAttribute("aria-pressed", paused);
    dash.textContent = G.lang === "ne" ? "ड्यासबोर्ड" : "Dashboard";
    document.getElementById("stprev").setAttribute("aria-label", G.lang === "ne" ? "अघिल्लो" : "Previous");
    document.getElementById("stnext").setAttribute("aria-label", G.lang === "ne" ? "अर्को" : "Next");
    show(idx, true);
  }
  const n = () => Math.max(items.length, 1);
  function show(k, keep) {
    idx = (k + n()) % n();
    [...slides.children].forEach((s, j) => s.classList.toggle("on", j === idx));
    [...bars.children].forEach((s, j) => (s.firstChild.style.width = j < idx ? "100%" : "0"));
    if (!keep) elapsed = 0;
    t0 = performance.now() - elapsed;
  }
  function tick(now) {
    if (!paused && !held && n() > 1) {
      elapsed = now - t0;
      const bar = bars.children[idx]; if (bar) bar.firstChild.style.width = Math.min(100, (elapsed / DUR) * 100) + "%";
      if (elapsed >= DUR) show(idx + 1);
    } else t0 = now - elapsed;
    raf = requestAnimationFrame(tick);
  }
  document.getElementById("stprev").onclick = () => show(idx - 1);
  document.getElementById("stnext").onclick = () => show(idx + 1);
  pauseBtn.onclick = () => { paused = !paused; draw(); };
  addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(idx + 1); else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === " " && e.target === document.body) { e.preventDefault(); paused = !paused; draw(); }
  });
  let sx = null, sy = 0;
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest("a,button")) return; sx = e.clientX; sy = e.clientY; held = true; });
  addEventListener("pointerup", (e) => {
    held = false; if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("visibilitychange", () => { held = document.hidden; });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) paused = true;
  G.stories = { set(list) { items = list; idx = 0; elapsed = 0; draw(); }, redraw: draw };
  G.json("data/alerts.json").then((d) => {
    const list = d.alerts.filter(active).sort((x, y) => SR[x.severity] - SR[y.severity] || (y.sent > x.sent ? 1 : -1));
    if (!G.demoActive) G.stories.set(list);
  }).catch(() => G.stories.set([]));
  G.onLang(draw);
  draw();
  raf = requestAnimationFrame(tick);
})();
