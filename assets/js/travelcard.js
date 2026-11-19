/* Travel card: a picture of a road trip or of airport weather that a person can share, download or send as text.
   Everything on it comes from what the page already shows: official status, source and time. Nothing is advised or
   invented: no departure time, no stops, no forecast of Gati's own. Times are labelled as estimates.
   G.travelCard.actions(el, { spec, text, name }) draws the three buttons; spec() returns what to draw. */
(function () {
  const G = window.Gati; if (!G || G.travelCard) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const img = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const W = 1080, P = 64, NAVY = "#0B1424", SOFT = "#C9D3DF", DIM = "#9FB0C6", AMBER = "#FFB347";

  async function make(s) {
    const c = document.createElement("canvas"), x = c.getContext("2d"), FF = getComputedStyle(document.body).fontFamily || "sans-serif";
    const font = (px, w = 400) => { x.font = `${w} ${px}px ${FF}`; };
    const wrap = (txt, px, w, max, lines = 6) => { font(px, w); const out = []; let line = ""; for (const word of String(txt || "").split(/\s+/).filter(Boolean)) { const t = line ? line + " " + word : word; if (x.measureText(t).width > max && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out.slice(0, lines); };
    try { await document.fonts.ready; } catch (e) {}
    const logo = await img(G.root + "assets/img/brand/logo-h-white.png");
    /* measure first, so the picture is exactly as tall as its content */
    const title = wrap(s.title, 78, 700, W - P * 2, 3), sub = wrap(s.sub, 32, 400, W - P * 2, 3);
    const TX = 214, TW = W - TX - P;
    const rows = (s.rows || []).map((r) => { font(36, 700); const nameW = x.measureText(r.name).width; font(22, 700); const tagW = r.tag ? x.measureText(r.tag.text).width + 28 : 0; const below = r.tag && nameW + 16 + tagW > TW;
      const note = wrap(r.note, 26, 400, TW, 3); return { ...r, note, tagW, nameW, below, h: 48 + (below ? 40 : 0) + note.length * 34 + 30 }; });
    const cols = (s.foot || []).map((f) => ({ ...f, lines: wrap(f.v, 26, 400, (W - P * 2 - 48) / Math.max(1, (s.foot || []).length), 4) }));
    const fine = (s.fine || []).flatMap((l) => wrap(l, 22, 400, W - P * 2, 3));
    const bannerLines = wrap(s.banner.value, 44, 700, W - P * 2 - 72, 2);
    const mine = (s.mine || []).filter(Boolean).flatMap((l) => wrap(l, 28, 400, W - P * 2 - 56, 3)), mineH = mine.length ? 54 + mine.length * 38 + 26 : 0;
    const yTitle = 176, yAfterTitle = yTitle + title.length * 88, ySub = yAfterTitle + 8, yMine = ySub + sub.length * 42 + 22, yBanner = yMine + mineH, bannerH = 62 + bannerLines.length * 54;
    const yRows = yBanner + bannerH + 52, rowsH = rows.reduce((h, r) => h + r.h, 0);
    const yFoot = yRows + rowsH + 16, footH = 44 + 40 + Math.max(1, ...cols.map((f) => f.lines.length)) * 34 + 28;
    const H = yFoot + footH + 30 + fine.length * 30 + 84;
    c.width = W; c.height = H;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#081220"); g.addColorStop(0.55, "#0c2444"); g.addColorStop(1, "#0f3050"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.textBaseline = "alphabetic";
    if (logo) x.drawImage(logo, P - 6, 44, 96 * logo.width / logo.height, 96);
    /* date pill, right */
    font(26, 600); const dw = x.measureText(s.date).width + 48; x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 2; x.fillStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.roundRect(W - P - dw, 64, dw, 54, 27); x.fill(); x.stroke();
    x.fillStyle = "#E8EDF4"; x.fillText(s.date, W - P - dw + 24, 100);
    font(24, 700); x.fillStyle = AMBER; x.fillText(s.kicker, P + (logo ? 96 * logo.width / logo.height + 14 : 0), 132);
    x.fillStyle = "#fff"; title.forEach((l, i) => { font(78, 700); x.fillText(l, P, yTitle + 62 + i * 88); });
    x.fillStyle = SOFT; sub.forEach((l, i) => { font(32); x.fillText(l, P, ySub + 34 + i * 42); });
    /* the person's own plan, in their words, kept apart from what the agencies say */
    if (mine.length) { x.strokeStyle = "rgba(255,179,71,.6)"; x.lineWidth = 2; x.setLineDash([8, 8]); x.beginPath(); x.roundRect(P, yMine, W - P * 2, mineH - 22, 20); x.stroke(); x.setLineDash([]);
      font(22, 700); x.fillStyle = AMBER; x.fillText(s.mineLabel || "", P + 28, yMine + 38); x.fillStyle = "#fff"; mine.forEach((l, i) => { font(28); x.fillText(l, P + 28, yMine + 78 + i * 38); }); }
    /* banner: the official status in one line */
    x.fillStyle = s.banner.color; x.beginPath(); x.roundRect(P, yBanner, W - P * 2, bannerH, 26); x.fill();
    x.fillStyle = s.banner.ink || "#fff"; font(24, 700); x.fillText(s.banner.label, P + 36, yBanner + 46);
    bannerLines.forEach((l, i) => { font(44, 700); x.fillText(l, P + 36, yBanner + 98 + i * 54); });
    /* the way, stop by stop */
    let y = yRows; const LX = 182;
    rows.forEach((r, i) => { const cy = y + 22;
      if (i < rows.length - 1) { x.strokeStyle = "rgba(255,179,71,.75)"; x.lineWidth = 5; x.setLineDash([3, 13]); x.lineCap = "round"; x.beginPath(); x.moveTo(LX, cy + 22); x.lineTo(LX, cy + r.h - 14); x.stroke(); x.setLineDash([]); }
      x.beginPath(); x.arc(LX, cy, 15, 0, Math.PI * 2); if (r.solid) { x.fillStyle = r.color || AMBER; x.fill(); } else { x.fillStyle = NAVY; x.fill(); x.strokeStyle = r.color || AMBER; x.lineWidth = 6; x.stroke(); }
      if (r.time) { font(26, 700); x.fillStyle = AMBER; x.textAlign = "right"; wrap(r.time, 26, 700, 96, 2).forEach((l, k) => x.fillText(l, LX - 26, cy + 9 + k * 30)); x.textAlign = "left"; }
      font(36, 700); x.fillStyle = "#fff"; x.fillText(r.name, TX, cy + 13);
      let ty = cy + 13;
      if (r.tag) { const tx = r.below ? TX : TX + r.nameW + 16, tyy = r.below ? ty + 14 : cy - 14; x.fillStyle = r.tag.color; x.beginPath(); x.roundRect(tx, tyy, r.tagW, 34, 17); x.fill(); font(22, 700); x.fillStyle = r.tag.ink || "#fff"; x.fillText(r.tag.text, tx + 14, tyy + 25); if (r.below) ty += 40; }
      x.fillStyle = SOFT; r.note.forEach((l) => { ty += 34; font(26); x.fillText(l, TX, ty); });
      y += r.h; });
    /* three facts at the foot */
    x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, yFoot, W, footH);
    const cw = (W - P * 2 - 48) / Math.max(1, cols.length);
    cols.forEach((f, i) => { const fx = P + i * (cw + 24); font(28, 700); x.fillStyle = "#fff"; x.fillText(f.h, fx, yFoot + 58); x.fillStyle = SOFT; f.lines.forEach((l, k) => { font(26); x.fillText(l, fx, yFoot + 100 + k * 34); }); });
    let fy = yFoot + footH + 42; x.fillStyle = DIM; fine.forEach((l) => { font(22); x.fillText(l, P, fy); fy += 30; });
    font(34, 700); x.fillStyle = "#fff"; x.fillText("gatialerts.com", P, H - 40);
    return new Promise((res) => c.toBlob(res, "image/png"));
  }
  const save = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const flash = (b, msg) => { const old = b.textContent; b.textContent = msg; setTimeout(() => { b.textContent = old; }, 2200); };

  /* Three buttons: share the picture, download it, share the same facts as text.
     With o.plan, a short "my trip" form sits above them: leaving time and vehicle by one tap, an optional note,
     and a live preview of the card. The plan is the person's own, stays on this device, and is drawn apart on the card. */
  const PK = "gati-trip-plan";
  const plan = () => { try { return JSON.parse(localStorage.getItem(PK) || "{}") || {}; } catch (e) { return {}; } };
  const VEH = { car: ["कार / जिप", "Car / jeep"], ev: ["विद्युतीय गाडी", "Electric car"], bike: ["मोटरसाइकल", "Motorbike"], bus: ["बस / माइक्रो", "Bus / micro"] };
  const vehName = (k) => (VEH[k] ? T(VEH[k][0], VEH[k][1]) : "");
  const clock = (v) => { const [h, mm] = v.split(":"); return G.lang === "ne" ? G.num(`${+h}:${mm}`) : `${+h % 12 || 12}:${mm} ${+h < 12 ? "AM" : "PM"}`; };
  const today = () => new Date(Date.now() + G.tzMs).toISOString().slice(0, 10);
  const addDay = (ad, n) => new Date(Date.parse(ad + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const WD = [["आइत", "Sun"], ["सोम", "Mon"], ["मङ्गल", "Tue"], ["बुध", "Wed"], ["बिही", "Thu"], ["शुक्र", "Fri"], ["शनि", "Sat"]], MO = [["जनवरी", "Jan"], ["फेब्रुअरी", "Feb"], ["मार्च", "Mar"], ["अप्रिल", "Apr"], ["मे", "May"], ["जुन", "Jun"], ["जुलाई", "Jul"], ["अगस्ट", "Aug"], ["सेप्टेम्बर", "Sep"], ["अक्टोबर", "Oct"], ["नोभेम्बर", "Nov"], ["डिसेम्बर", "Dec"]];
  const dayName = (ad) => { const d = new Date(ad + "T00:00:00Z"); if (isNaN(d)) return ad; const w = WD[d.getUTCDay()], m = MO[d.getUTCMonth()]; return T(`${w[0]}, ${m[0]} ${G.num(String(d.getUTCDate()))}`, `${w[1]} ${d.getUTCDate()} ${m[1]}`); };
  /* the travel day, only while it is today or later */
  const planDate = () => { const d = plan().date || ""; return /^\d{4}-\d\d-\d\d$/.test(d) && d >= today() ? d : ""; };
  const setPlan = (patch) => { try { localStorage.setItem(PK, JSON.stringify({ ...plan(), ...patch })); } catch (e) {} };
  const dayChips = () => `<button type="button" class="tcchip" data-d="0" aria-pressed="false">${T("आज", "Today")}</button><button type="button" class="tcchip" data-d="1" aria-pressed="false">${T("भोलि", "Tomorrow")}</button><label class="tcother"><span>${T("अर्को दिन", "Other day")}</span><input type="date" class="tcdate" min="${today()}"></label>`;
  /* wires the day chips and date box inside el; returns a function that repaints them */
  const dayWire = (el, changed) => { const inp = el.querySelector(".tcdate"), paint = (typing) => { const d = planDate(); el.querySelectorAll("[data-d]").forEach((b) => b.setAttribute("aria-pressed", String(d === addDay(today(), +b.dataset.d)))); if (!typing) inp.value = d; };
    el.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => { const v = addDay(today(), +b.dataset.d); setPlan({ date: planDate() === v ? "" : v }); paint(); if (changed) changed(); }));
    inp.oninput = () => { setPlan({ date: inp.value }); paint(true); if (changed) changed(true); }; paint(); return paint; };
  const nowNpt = () => { const d = new Date(Date.now() + G.tzMs), m = (Math.ceil((d.getUTCHours() * 60 + d.getUTCMinutes()) / 15) * 15) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  function actions(el, o) { if (!el) return;
    const acts = `<div class="tcacts" role="group" aria-label="${T("यात्रा कार्ड", "Travel card")}"><button type="button" class="tcbtn tcmain" data-a="card">${T("कार्ड सेयर गर्नुहोस्", "Share card")}</button><button type="button" class="tcbtn" data-a="save">${T("तस्बिर डाउनलोड", "Download picture")}</button><button type="button" class="tcbtn" data-a="text">${T("पाठ सेयर गर्नुहोस्", "Share as text")}</button></div><p class="meta tcnote">${T("कार्डमा आधिकारिक स्रोतको अवस्था, स्रोत र समय मात्र हुन्छ। समय अनुमान हो।", "The card carries only the official status, with source and time. Times are estimates.")}</p>`;
    if (!o.plan) el.innerHTML = acts;
    else el.innerHTML = `<div class="tcbox"><div class="tcform"><div class="tcplan"><p class="tcph"><b>${T("आफ्नो यात्रा थप्नुहोस्", "Make it your trip")}</b><span>${T("ऐच्छिक", "optional")}</span></p>
      <div class="tcq"><span class="tcql" id="tcl0">${T("कुन दिन जाने?", "Which day?")}</span><div class="tcchips" role="group" aria-labelledby="tcl0">${dayChips()}</div></div>
      <div class="tcq"><span class="tcql" id="tcl1">${T("कति बजे हिँड्ने?", "When are you leaving?")}</span><div class="tcchips" role="group" aria-labelledby="tcl1"><button type="button" class="tcchip" data-t="now">${T("अहिले", "Now")}</button>${["05:00", "06:00", "07:00", "08:00"].map((v) => `<button type="button" class="tcchip" data-t="${v}" aria-pressed="false">${clock(v)}</button>`).join("")}<label class="tcother"><span>${T("अर्को समय", "Other time")}</span><input type="time" id="tctime" step="900"></label></div><p class="tcarr" id="tcarr" aria-live="polite" hidden></p></div>
      <div class="tcq"><span class="tcql" id="tcl2">${T("केमा जाने?", "Travelling by")}</span><div class="tcchips" role="group" aria-labelledby="tcl2">${Object.keys(VEH).map((k) => `<button type="button" class="tcchip" data-v="${k}" aria-pressed="false">${vehName(k)}</button>`).join("")}</div></div>
      <label class="tcq"><span class="tcql">${T("टिप्पणी", "Note")}</span><input type="text" id="tcnote" maxlength="120" autocomplete="off" enterkeyhint="done" placeholder="${T("जस्तै: मुग्लिनमा चिया, दुई जना", "e.g. tea stop at Mugling, two of us")}"></label>
      <p class="meta tcpm">${T("कार्डमा \"मेरो योजना\" भनेर आधिकारिक स्थितिभन्दा छुट्टै देखिन्छ। यही उपकरणमा मात्र रहन्छ।", "Shown on the card as \"My plan\", apart from the official status. It stays on this device.")} <button type="button" class="tcclear" hidden>${T("मेरो योजना हटाउनुहोस्", "Clear my plan")}</button></p>
      <div class="tcgenrow"><button type="button" class="tcbtn tcgen">${T("मेरो कार्ड बनाउनुहोस्", "Generate my card")} ↻</button><span class="tcstat" id="tcstat" role="status"></span></div></div>${acts}</div>
      <figure class="tcprev" id="tcprev"><figcaption>${T("हजुरले सेयर गर्ने कार्ड", "The card you will share")}</figcaption><img id="tcimg" alt="${T("सेयर हुने कार्डको पूर्वावलोकन", "Preview of the card you will share")}"></figure></div>`;
    if (o.plan) { const q = (s) => el.querySelector(s); let timer = 0;
      const stat = (msg) => { const e = q("#tcstat"); if (e) e.textContent = msg; };
      const preview = (wait) => new Promise((done) => { clearTimeout(timer); const fig = q("#tcprev"); if (fig) fig.classList.add("tcbusy"); stat(T("कार्ड बन्दै छ…", "Updating the card…"));
        timer = setTimeout(async () => { const im = q("#tcimg"); if (!im) return done(false); let b = null; try { b = await make(o.spec()); } catch (e) {} if (!im.isConnected) return done(false);
          if (fig) fig.classList.remove("tcbusy"); if (!b) { stat(T("कार्ड बनाउन सकिएन।", "Could not make the card.")); return done(false); }
          const old = im.src; im.src = URL.createObjectURL(b); try { await im.decode(); } catch (e) {} if (old.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(old), 1000);
          const p = plan(), bits = [planDate() ? dayName(planDate()) : "", /^\d\d:\d\d$/.test(p.time || "") ? clock(p.time) : "", vehName(p.veh)].filter(Boolean);
          stat(T("कार्ड अद्यावधिक भयो", "Card updated") + (bits.length ? ": " + bits.join(" · ") : "") + " ✓"); done(true); }, wait); });
      let paintDay = () => {};
      const sync = (typing) => { paintDay(typing); const p = plan(), ok = /^\d\d:\d\d$/.test(p.time || "");
        el.querySelectorAll("[data-t]").forEach((b) => { if (b.dataset.t !== "now") b.setAttribute("aria-pressed", String(b.dataset.t === p.time)); });
        el.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === p.veh)));
        if (!typing) { q("#tctime").value = ok ? p.time : ""; q("#tcnote").value = p.note || ""; }
        const arr = q("#tcarr"), line = ok && o.arrive ? o.arrive(+p.time.slice(0, 2) * 60 + +p.time.slice(3)) : ""; arr.textContent = line; arr.hidden = !line;
        q(".tcclear").hidden = !(ok || p.veh || p.note || planDate()); preview(typing ? 450 : 60); };
      const set = (patch, typing) => { setPlan(patch); sync(typing); };
      paintDay = dayWire(el, (typing) => sync(typing));
      el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const v = b.dataset.t === "now" ? nowNpt() : b.dataset.t; set({ time: plan().time === v && b.dataset.t !== "now" ? "" : v }); }));
      el.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => set({ veh: plan().veh === b.dataset.v ? "" : b.dataset.v })));
      q("#tctime").oninput = (e) => set({ time: e.target.value }, true);
      q("#tcnote").oninput = (e) => set({ note: e.target.value.slice(0, 120) }, true);
      q(".tcgen").onclick = async () => { const ok = await preview(0); const fig = q("#tcprev"); if (ok && fig) { const r = fig.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * 0.6) window.scrollTo({ top: r.top + window.scrollY - 90, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } };
      q(".tcclear").onclick = () => set({ date: "", time: "", veh: "", note: "" });
      sync(); }
    el.querySelectorAll(".tcbtn[data-a]").forEach((b) => (b.onclick = async () => { const a = b.dataset.a, text = o.text(), url = o.url ? o.url() : location.href;
      if (a === "text") { try { if (navigator.share) { await navigator.share({ text, url }); return; } await navigator.clipboard.writeText(text + " " + url); flash(b, T("कपी भयो", "Copied")); } catch (e) {} return; }
      b.disabled = true; let blob = null; try { blob = o.image ? await o.image() : await make(o.spec()); } catch (e) {} b.disabled = false;
      if (!blob) { flash(b, T("बनाउन सकिएन", "Could not make it")); return; }
      const file = new File([blob], o.name(), { type: "image/png" });
      if (a === "card") { try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); if (G.pulse) G.pulse.track("share"); return; } } catch (e) { if (e && e.name === "AbortError") return; } }
      save(blob, o.name()); flash(b, T("डाउनलोड भयो", "Downloaded")); if (G.pulse) G.pulse.track("share"); }));
  }
  G.travelCard = { make, actions, plan, vehName, planDate, setPlan, dayName, dayChips, dayWire };
})();
