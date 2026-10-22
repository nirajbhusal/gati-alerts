(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const RD = await G.json("data/roads.json"), N = RD.nodes;
  const hav = (a, b) => { const r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const adj = {};
  RD.routes.forEach((rt) => rt.segs.forEach(([a, b]) => { const w = hav(N[a].ll, N[b].ll); (adj[a] = adj[a] || []).push([b, w, rt]); (adj[b] = adj[b] || []).push([a, w, rt]); }));
  function path(s, t) {
    const d = { [s]: 0 }, prev = {}, Q = new Set(Object.keys(adj));
    while (Q.size) { let u = null; Q.forEach((q) => { if (d[q] !== undefined && (u === null || d[q] < d[u])) u = q; }); if (u === null || u === t) break; Q.delete(u);
      adj[u].forEach(([v, w, rt]) => { if (d[u] + w < (d[v] ?? Infinity)) { d[v] = d[u] + w; prev[v] = [u, rt]; } }); }
    if (d[t] === undefined) return null; const out = []; let c = t; while (c !== s) { const [p, rt] = prev[c]; out.unshift([p, c, rt]); c = p; } return out;
  }
  const RS = { open: ["खुला", "Open", "ok"], blocked: ["अवरुद्ध", "Blocked", "bad"], oneway: ["एकतर्फी", "One-way", "warn"], none: ["पुष्टि छैन", "Not confirmed", "unk"] };
  const f = document.getElementById("rfrom"), t = document.getElementById("rto");
  const ids = Object.keys(N).filter((k) => adj[k]);
  function opts() {
    const keep = [f.value || localStorage.getItem("gati-rfrom") || "ktm", t.value || localStorage.getItem("gati-rto") || "pokhara"];
    const o = ids.slice().sort((a, b) => T(N[a].ne, N[a].en).localeCompare(T(N[b].ne, N[b].en))).map((k) => `<option value="${k}">${esc(T(N[k].ne, N[k].en))}</option>`).join("");
    f.innerHTML = o; t.innerHTML = o; f.value = keep[0]; t.value = keep[1];
  }
  function draw() {
    try { localStorage.setItem("gati-rfrom", f.value); localStorage.setItem("gati-rto", t.value); } catch (e) {}
    const out = document.getElementById("rout");
    if (f.value === t.value) { out.innerHTML = `<div class="na">${T("फरक ठाउँ छान्नुहोस्।", "Choose two different places.")}</div>`; return; }
    const P = path(f.value, t.value);
    if (!P) { out.innerHTML = `<div class="na">${T("गतिको सडक तथ्याङ्कमा यी दुई ठाउँ जोड्ने बाटो छैन।", "Gati's road data has no path between these places.")}</div>`; return; }
    const groups = []; P.forEach(([a, b, rt]) => { const g = groups[groups.length - 1]; if (g && g.rt === rt) g.to = b; else groups.push({ rt, from: a, to: b }); });
    const worst = groups.some((g) => g.rt.status === "blocked") ? "bad" : groups.some((g) => g.rt.status === "none" || g.rt.status === "oneway") ? "unk" : "ok";
    const head = { ok: T("बाटोका सबै खण्ड खुला देखिन्छन्।", "Every corridor on the way shows open."), unk: T("केही खण्डको अवस्था पुष्टि छैन वा एकतर्फी छ।", "Some corridors are not confirmed or one-way."), bad: T("बाटोमा अवरुद्ध खण्ड छ।", "A corridor on the way is blocked.") }[worst];
    out.innerHTML = `<section class="card rsum r-${worst}"><p class="bigmsg">${head}</p><p class="meta">${esc(T(RD.as_of_ne, RD.as_of_en))}</p></section>
      <ol class="rsteps">${groups.map((g) => { const s = RS[g.rt.status] || RS.none; return `<li class="rstep r-${s[2]}"><div class="rdot" aria-hidden="true"></div><div><div class="rtop"><b>${esc(T(N[g.from].ne, N[g.from].en))} → ${esc(T(N[g.to].ne, N[g.to].en))}</b><span class="tag rs-${esc(g.rt.status)}">${T(s[0], s[1])}</span></div>
        <p class="meta">${esc(T(g.rt.name_ne, g.rt.name_en))}</p><p>${esc(T(g.rt.note_ne, g.rt.note_en))}</p></div></li>`; }).join("")}</ol>
      <p><a class="btn" href="${R}roads/">${T("सबै सडक र स्रोत हेर्नुहोस् →", "See all roads and sources →")}</a></p>`;
    document.getElementById("rnote").textContent = T("गतिको सडक तथ्याङ्कमा भएका मुख्य करिडोर मात्र। स्थानीय सडक समावेश छैन।", "Only the main corridors in Gati's road data. Local roads are not included.");
  }
  f.onchange = t.onchange = draw; document.getElementById("rswap").onclick = () => { [f.value, t.value] = [t.value, f.value]; draw(); };
  opts(); draw(); G.onLang(() => { opts(); draw(); });
})();
