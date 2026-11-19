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

  /* Three buttons: share the picture, download it, share the same facts as text. */
  const PK = "gati-trip-plan";
  const plan = () => { try { return JSON.parse(localStorage.getItem(PK) || "{}"); } catch (e) { return {}; } };
  function actions(el, o) { if (!el) return; const pl = plan();
    el.innerHTML = (o.plan ? `<details class="tcplan"${pl.time || pl.note ? " open" : ""}><summary>${T("मेरो योजना थप्नुहोस् (ऐच्छिक)", "Add my plan (optional)")}</summary><div class="tcplanf"><label><span>${T("प्रस्थान समय", "Leaving at")}</span><input type="time" id="tctime" value="${G.esc(pl.time || "")}"></label><label class="tcwide"><span>${T("मेरो टिप्पणी: सवारी, विश्राम, चार्जिङ", "My note: vehicle, breaks, charging")}</span><input type="text" id="tcnote" maxlength="120" autocomplete="off" value="${G.esc(pl.note || "")}"></label></div><p class="meta">${T("यो हजुरको आफ्नै योजना हो; कार्डमा \"मेरो योजना\" भनेर छुट्टै देखिन्छ र यही उपकरणमा मात्र रहन्छ।", "This is your own plan. It is shown apart on the card as \"My plan\" and stays on this device.")}</p></details>` : "") + `<div class="tcacts" role="group" aria-label="${T("यात्रा कार्ड", "Travel card")}"><button type="button" class="tcbtn tcmain" data-a="card">${T("कार्ड सेयर गर्नुहोस्", "Share card")}</button><button type="button" class="tcbtn" data-a="save">${T("तस्बिर डाउनलोड", "Download picture")}</button><button type="button" class="tcbtn" data-a="text">${T("पाठ सेयर गर्नुहोस्", "Share as text")}</button></div><p class="meta tcnote">${T("कार्डमा आधिकारिक स्रोतको अवस्था, स्रोत र समय मात्र हुन्छ। समय अनुमान हो।", "The card carries only the official status, with source and time. Times are estimates.")}</p>`;
    el.querySelectorAll("#tctime,#tcnote").forEach((i) => (i.oninput = () => { try { localStorage.setItem(PK, JSON.stringify({ time: el.querySelector("#tctime").value, note: el.querySelector("#tcnote").value.slice(0, 120) })); } catch (e) {} }));
    el.querySelectorAll(".tcbtn").forEach((b) => (b.onclick = async () => { const a = b.dataset.a, text = o.text(), url = o.url ? o.url() : location.href;
      if (a === "text") { try { if (navigator.share) { await navigator.share({ text, url }); return; } await navigator.clipboard.writeText(text + " " + url); flash(b, T("कपी भयो", "Copied")); } catch (e) {} return; }
      b.disabled = true; let blob = null; try { blob = await make(o.spec()); } catch (e) {} b.disabled = false;
      if (!blob) { flash(b, T("बनाउन सकिएन", "Could not make it")); return; }
      const file = new File([blob], o.name(), { type: "image/png" });
      if (a === "card") { try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); if (G.pulse) G.pulse.track("share"); return; } } catch (e) { if (e && e.name === "AbortError") return; } }
      save(blob, o.name()); flash(b, T("डाउनलोड भयो", "Downloaded")); if (G.pulse) G.pulse.track("share"); }));
  }
  G.travelCard = { make, actions, plan };
})();
