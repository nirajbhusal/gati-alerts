/* Home: compact Cyclone Arnab trekking map card below Nepal Now. Static SVG, links to trek/. Gati relays, never issues. */
(function () {
  const card = document.getElementById("arnabcard"), G = window.Gati; if (!card || !G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const LV = { low: ["Minor", "न्युन जोखिम", "Low risk", "var(--minor)", 1], moderate: ["Moderate", "मध्यम जोखिम", "Moderate risk", "var(--moderate)", 2], high: ["Severe", "उच्च जोखिम", "High risk", "var(--severe)", 3] };
  const b0 = [83.0, 26.75, 88.3, 29.55], W = 300, K = W / (b0[2] - b0[0]), H = Math.round((b0[3] - b0[1]) * K * 1.12);
  const X = (x) => ((x - b0[0]) * K).toFixed(1), Y = (y) => ((b0[3] - y) * K * 1.12).toFixed(1);
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const pth = (g) => polys(g).map((p) => p.map((r) => "M" + r.map(([x, y]) => X(x) + " " + Y(y)).join("L") + "Z").join("")).join("");
  const lns = (g) => (g.type === "LineString" ? [g.coordinates] : g.coordinates).map((l) => "M" + l.map(([x, y]) => X(x) + " " + Y(y)).join("L")).join("");
  const today = new Date(Date.now() + 345 * 60000).toISOString().slice(0, 10);
  let A, DG, TK;
  Promise.all(["data/arnab-advisory.json", "data/districts.geojson", "data/geo/treks.geojson"].map((p) => fetch(G.root + p).then((r) => (r.ok ? r.json() : null)).catch(() => null))).then(([a, d, t]) => {
    A = a; DG = d; TK = t; if (!A || !DG || !TK) return;
    if (today > A.days[A.days.length - 1].ad) { card.hidden = true; return; }
    draw(); G.onLang(draw);
  });
  function draw() {
    /* show today's day, or the next day that has a DHM district map */
    let i = A.days.findIndex((d) => d.ad >= today); if (i < 0) i = 0;
    const j = A.days.findIndex((d, k) => k >= i && d.ff); const D = A.days[j >= 0 ? j : i];
    const ff = {}; if (D.ff) Object.entries(D.ff).forEach(([l, ds]) => ds.forEach((s) => (ff[s] = l)));
    const rl = (f) => f.properties.districts.map((s) => ff[s] || "low").reduce((m, l) => (LV[l][4] > LV[m][4] ? l : m), "low");
    const dist = DG.features.map((f) => `<path d="${pth(f.geometry)}" fill="${ff[f.properties.slug] ? LV[ff[f.properties.slug]][3] : "var(--surface2)"}" fill-opacity="${ff[f.properties.slug] ? 0.35 : 1}" stroke="var(--line)" stroke-width=".4"/>`).join("");
    const tr = TK.features.map((f) => `<path d="${lns(f.geometry)}" fill="none" stroke="#222" stroke-opacity=".7" stroke-width="3.2" stroke-linejoin="round"/><path d="${lns(f.geometry)}" fill="none" stroke="${LV[rl(f)][3]}" stroke-width="1.8" stroke-linejoin="round"/>`).join("");
    card.querySelector(".tkcm").innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${dist}${tr}</svg>`;
    const hi = TK.features.filter((f) => rl(f) === "high").length, mo = TK.features.filter((f) => rl(f) === "moderate").length;
    card.querySelector("#tkcd").innerHTML = `${T("कात्तिक " + N(D.bs), "Kartik " + D.bs)} <span class="sev sev-${(LV[D.level] || LV.low)[0]}">${T((LV[D.level] || ["", "सामान्य"])[1], (LV[D.level] || ["", "", "Normal"])[2])}</span> · ${E(T(`DHM: ${N(TK.features.length)} मध्ये ${N(hi)} पदमार्ग उच्च, ${N(mo)} मध्यम जोखिमका जिल्लामा`, `DHM: of ${TK.features.length} routes, ${hi} in high and ${mo} in moderate risk districts`))}`;
  }
})();
