/* Gati chart kit: the small set of graphics every page shares, so the site reads as one system.
   Each function returns an HTML string. No chart library; plain HTML and CSS so it stays light on a weak phone.
   Rules (see docs/DESIGN.md): source and time under every chart; a word or number in every mark, never colour alone;
   official data is solid, model and satellite data use the dashed "est" style; each agency stays on its own row. */
(function () {
  const G = window.Gati; if (!G) return;
  const E = G.esc, T = (ne, en) => (G.lang === "ne" ? ne : en), N = (v) => G.num(String(v));
  const V = {};
  /* DHM warning colours with the word that always goes with them */
  V.LEVEL = { green: ["#2E8B57", "चेतावनी छैन", "No warning"], yellow: ["#F5D90A", "अद्यावधिक रहनुहोस्", "Be updated"], orange: ["#F28C1E", "सतर्क रहनुहोस्", "Be prepared"], red: ["#D93025", "कारबाही गर्नुहोस्", "Take action"] };
  const darkText = (hex) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150; };

  /* card frame: title, optional link, the graphic, a one-line reading of it, then source and time */
  V.card = ({ title, href, more, body, say, source, url, time, est, cls = "" }) => `<section class="vz ${cls}"><div class="vzh"><h3>${title}</h3>${href ? `<a href="${E(href)}">${more || T("थप", "More")} →</a>` : ""}</div>
    ${say ? `<p class="vzsay">${say}</p>` : ""}${body}
    <p class="vzf">${est ? `<span class="vzest">${T("अनुमान", "Estimate")}</span> ` : ""}${T("स्रोत", "Source")}: ${url ? `<a href="${E(url)}" target="_blank" rel="noopener">${source}</a>` : source}${time ? ` · ${time}` : ""}</p></section>`;

  /* segmented bar: parts = [{ n, label, color }]. Zero parts are left out of the bar but kept in the key. */
  V.segbar = (parts, { unit = "" } = {}) => { const tot = parts.reduce((s, p) => s + p.n, 0) || 1;
    return `<div class="vzseg" role="img" aria-label="${E(parts.map((p) => p.label + " " + p.n).join(", "))}">${parts.filter((p) => p.n).map((p) => `<i style="flex:${p.n};background:${p.color};color:${darkText(p.color) ? "#14202B" : "#fff"}">${p.n / tot > 0.08 ? N(p.n) : ""}</i>`).join("")}</div>
    <ul class="vzkey">${parts.map((p) => `<li><i style="background:${p.color}"></i><b>${N(p.n)}</b> ${E(p.label)}${unit}</li>`).join("")}</ul>`; };

  /* day strip: days = [{ top, sub, level }] with level one of V.LEVEL */
  V.daystrip = (days) => `<ol class="vzdays">${days.map((d) => { const L = V.LEVEL[d.level] || V.LEVEL.green;
    return `<li${d.today ? ' class="on"' : ""} style="--c:${L[0]}"><b>${E(d.top)}</b><span>${E(d.sub)}</span><em>${T(L[1], L[2])}</em></li>`; }).join("")}</ol>`;

  /* level gauge: where a reading sits against its warning and danger marks */
  V.gauge = ({ name, level, warning, danger, unit = "m" }) => { const max = danger * 1.15, pc = (v) => Math.max(0, Math.min(100, (v / max) * 100)).toFixed(1);
    const st = level >= danger ? ["#D93025", T("खतरा तहमाथि", "Above danger")] : level >= warning ? ["#F28C1E", T("चेतावनी तहमाथि", "Above warning")] : ["#2F6FED", T("सामान्य", "Normal")];
    return `<div class="vzg"><div class="vzgh"><b>${E(name)}</b><span>${N(level.toFixed(2))} ${unit} · <em class="vzs-${level >= danger ? "d" : level >= warning ? "w" : "n"}">${st[1]}</em></span></div>
      <div class="vzgt" role="img" aria-label="${E(name)}: ${level} ${unit}, ${T("चेतावनी", "warning")} ${warning}, ${T("खतरा", "danger")} ${danger}"><i style="width:${pc(level)}%;background:${st[0]}"></i><u style="left:${pc(warning)}%" title="${T("चेतावनी", "Warning")} ${warning}"></u><u class="d" style="left:${pc(danger)}%" title="${T("खतरा", "Danger")} ${danger}"></u></div></div>`; };
  V.gaugeKey = () => `<p class="vzgk"><span><u></u>${T("चेतावनी तह", "Warning level")}</span><span><u class="d"></u>${T("खतरा तह", "Danger level")}</span></p>`;

  /* heat grid: rows = [{ name, cells: [{ n, sev }] }], cols = [{ top, sub, today }]. One row per agency; rows are never added together. */
  V.heat = (rows, cols) => `<div class="vzheatw"><table class="vzheat"><thead><tr><th></th>${cols.map((c) => `<th${c.today ? ' class="on"' : ""}><b>${E(c.top)}</b><span>${E(c.sub)}</span></th>`).join("")}</tr></thead><tbody>
    ${rows.map((r) => `<tr><th scope="row">${E(r.name)}</th>${r.cells.map((c) => { const col = c.n ? G.SEVCOLOR[c.sev] || G.SEVCOLOR.Unknown : null, s = c.n && G.SEV[c.sev];
      return `<td>${c.n ? `<i style="background:${col};color:${darkText(col) ? "#14202B" : "#fff"}" title="${E((s ? T(s[0], s[1]) : T("सूचना", "Info")) + ": " + c.n)}">${N(c.n)}</i>` : `<i class="z"><span class="sr-only">0</span></i>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <ul class="vzkey">${["Extreme", "Severe", "Moderate", "Minor"].map((k) => `<li><i style="background:${G.SEVCOLOR[k]}"></i>${T(G.SEV[k][0], G.SEV[k][1])}</li>`).join("")}<li><i style="background:${G.SEVCOLOR.Unknown}"></i>${T("सूचना", "Info")}</li></ul>`;

  /* small trend line from a list of numbers */
  V.spark = (vals, { w = 120, h = 28, color = "currentColor" } = {}) => { const v = vals.filter((x) => x != null); if (v.length < 2) return ""; const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1;
    const pts = v.map((x, k) => `${((k / (v.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((x - lo) / sp) * (h - 6)).toFixed(1)}`);
    return `<svg class="vzsp" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}" r="2.6" fill="${color}"/></svg>`; };

  /* the answer strip that opens a page: a status word, one sentence, then source and time */
  V.answer = ({ tone = "calm", word, say, sub, source, url, time }) => `<div class="vza vza-${tone}"><span class="vzaw">${word}</span><div class="vzab"><p class="vzas">${say}</p>${sub ? `<p class="vzau">${sub}</p>` : ""}
    <p class="vzf">${T("स्रोत", "Source")}: ${url ? `<a href="${E(url)}" target="_blank" rel="noopener">${source}</a>` : source}${time ? ` · ${time}` : ""}</p></div></div>`;

  /* horizontal bars: rows = [{ name, v }], all on one scale, value written at the end of each bar */
  V.bars = (rows, { unit = "", color = "#2F6FED", max } = {}) => { const mx = max || Math.max(...rows.map((r) => r.v), 1);
    return `<div class="vzbars">${rows.map((r) => `<div class="vzbr"><b>${E(r.name)}</b><div class="vzbt"><i style="width:${Math.max(1.5, (r.v / mx) * 100).toFixed(1)}%;background:${r.color || color}"></i></div><span>${N(r.v)}${unit}</span></div>`).join("")}</div>`; };

  /* ---- picture-like graphics: each one looks like the thing it measures ---- */
  let uid = 0;
  /* river tanks: a column of water against its warning (dashed) and danger (solid) marks */
  V.tanks = (gs) => `<div class="vztanks">${gs.map((g) => { const max = g.danger * 1.15, y = (v) => (96 - Math.max(0, Math.min(1, v / max)) * 88).toFixed(1), id = "vzt" + (++uid);
    const col = g.level >= g.danger ? "#D93025" : g.level >= g.warning ? "#F28C1E" : "#2F8FD8", word = g.level >= g.danger ? T("खतरा", "Danger") : g.level >= g.warning ? T("चेतावनी", "Warning") : T("सामान्य", "Normal"), ly = Number(y(g.level));
    return `<figure class="vztank"><svg viewBox="0 0 64 104" role="img" aria-label="${E(g.name)}: ${g.level} m, ${T("चेतावनी", "warning")} ${g.warning} m, ${T("खतरा", "danger")} ${g.danger} m">
      <defs><clipPath id="${id}"><rect x="14" y="8" width="36" height="88" rx="9"/></clipPath></defs>
      <rect x="14" y="8" width="36" height="88" rx="9" class="vztk"/>
      <g clip-path="url(#${id})"><path d="M14 ${ly} q4.500 -3.500 9 0 t9 0 t9 0 t9 0 V96 H14Z" fill="${col}"/><path d="M14 ${ly + 5} q4.500 -3 9 0 t9 0 t9 0 t9 0" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/></g>
      <path d="M8 ${y(g.warning)} H56" class="vzwl"/><path d="M8 ${y(g.danger)} H56" class="vzdl"/>
      <rect x="14" y="8" width="36" height="88" rx="9" fill="none" class="vztko"/></svg>
      <figcaption><b>${E(g.name)}</b><span>${N(g.level.toFixed(2))} m</span><em class="vzs-${g.level >= g.danger ? "d" : g.level >= g.warning ? "w" : "n"}">${word}</em></figcaption></figure>`; }).join("")}</div>
    <p class="vzgk"><span><u></u>${T("चेतावनी तह", "Warning level")}</span><span><u class="d"></u>${T("खतरा तह", "Danger level")}</span></p>`;

  /* rain gauges: a tube per station, filled to the amount that fell */
  V.raintubes = (rows, unit) => { const mx = Math.max(...rows.map((r) => r.v), 1);
    return `<div class="vztubes">${rows.map((r) => `<figure class="vztube"><span class="vztv">${N(r.v)}${unit}</span><div class="vztb" role="img" aria-label="${E(r.name)} ${r.v}${unit}"><i style="height:${Math.max(4, (r.v / mx) * 100).toFixed(1)}%"></i></div><figcaption>${E(r.name)}</figcaption></figure>`).join("")}</div>`; };

  /* road strip: the segbar drawn as tarmac with a centre line */
  V.road = (parts) => V.segbar(parts).replace('class="vzseg"', 'class="vzseg vzroad"');

  /* quake timeline: a circle per quake, sized by magnitude, placed on its day */
  V.quakes = (qs, days = 30) => { const W = 300, x = (ms) => 14 + (1 - Math.min(1, (Date.now() - ms) / (days * 864e5))) * (W - 28);
    return `<svg class="vzq" viewBox="0 0 ${W} 96" role="img" aria-label="${E(qs.map((q) => q.agency + " M" + q.m).join(", "))}"><path d="M10 74 H${W - 10}" class="vzax"/>
      ${[days, Math.round(days * 2 / 3), Math.round(days / 3), 0].map((d) => `<path d="M${x(Date.now() - d * 864e5).toFixed(1)} 70 v8" class="vzax"/><text x="${x(Date.now() - d * 864e5).toFixed(1)}" y="90" class="vzqt" text-anchor="${d === days ? "start" : d ? "middle" : "end"}">${d ? T(N(d) + " दिन अघि", d + " d ago") : T("आज", "Today")}</text>`).join("")}
      ${qs.map((q) => { const r = Math.max(7, 5 + (q.m - 3) * 6), cx = x(q.t).toFixed(1), col = q.m >= 5 ? "#D93025" : q.m >= 4 ? "#F28C1E" : "#8F9BB3";
        return `<circle cx="${cx}" cy="${(72 - r).toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" fill-opacity=".85" stroke="#fff" stroke-width="1.5"><title>${E(q.title)}</title></circle><text x="${cx}" y="${(72 - r + 3.5).toFixed(1)}" class="vzqm">${N(q.m.toFixed(1))}</text>`; }).join("")}</svg>`; };

  /* air dial: a half-circle scale with a needle at the reading */
  V.dial = (v, bands, { max = 300, label = "" } = {}) => { const A = (t) => Math.PI * (1 - Math.min(1, t / max)), P = (t, r) => [(100 + r * Math.cos(A(t))).toFixed(1), (96 - r * Math.sin(A(t))).toFixed(1)];
    let from = 0; const arcs = bands.map((b) => { const to = Math.min(b[0], max); if (to <= from) return ""; const [x1, y1] = P(from, 80), [x2, y2] = P(to, 80); const d = `<path d="M${x1} ${y1} A80 80 0 0 1 ${x2} ${y2}" stroke="${b[1]}" class="vzda"/>`; from = to; return d; }).join("");
    const [nx, ny] = P(v, 62), band = bands.find((b) => v <= b[0]) || bands[bands.length - 1];
    return `<svg class="vzdial" viewBox="0 0 200 112" role="img" aria-label="${E(label)} ${Math.round(v)}">${arcs}<path d="M100 96 L${nx} ${ny}" class="vzdn2"/><circle cx="100" cy="96" r="6" class="vzdh"/>
      <text x="100" y="72" class="vzdv" fill="${band[1]}">${N(Math.round(v))}</text><text x="100" y="110" class="vzdl2">${E(label)}</text></svg>`; };

  /* small line icons used inside tiles */
  V.icon = (k) => `<svg class="vzic" viewBox="0 0 24 24" aria-hidden="true">${{
    sun: '<circle cx="12" cy="12" r="4.200"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>',
    moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500Z"/>',
    alert: '<path d="M12 4 3 20h18z"/><path d="M12 10v4.500M12 17.200v.1"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8 5.500 5.500 0 0 1 10.600 1.300A3.400 3.400 0 0 1 17 18Z"/>',
    drop: '<path d="M12 3.500s6 6.300 6 10.500a6 6 0 0 1-12 0c0-4.200 6-10.500 6-10.500Z"/>',
    wave: '<path d="M3 9q3-3 6 0t6 0 6 0M3 15q3-3 6 0t6 0 6 0"/>' }[k] || ""}</svg>`;

  G.viz = V;
})();
