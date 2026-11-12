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
    return `<div class="vzg"><div class="vzgh"><b>${E(name)}</b><span>${N(level.toFixed(2))} ${unit} · <em style="color:${st[0]}">${st[1]}</em></span></div>
      <div class="vzgt" role="img" aria-label="${E(name)}: ${level} ${unit}, ${T("चेतावनी", "warning")} ${warning}, ${T("खतरा", "danger")} ${danger}"><i style="width:${pc(level)}%;background:${st[0]}"></i><u style="left:${pc(warning)}%" title="${T("चेतावनी", "Warning")} ${warning}"></u><u class="d" style="left:${pc(danger)}%" title="${T("खतरा", "Danger")} ${danger}"></u></div></div>`; };
  V.gaugeKey = () => `<p class="vzgk"><span><u></u>${T("चेतावनी तह", "Warning level")}</span><span><u class="d"></u>${T("खतरा तह", "Danger level")}</span></p>`;

  /* heat grid: rows = [{ name, cells: [{ n, sev }] }], cols = [{ top, sub, today }]. One row per agency; rows are never added together. */
  V.heat = (rows, cols) => `<div class="vzheatw"><table class="vzheat"><thead><tr><th></th>${cols.map((c) => `<th${c.today ? ' class="on"' : ""}><b>${E(c.top)}</b><span>${E(c.sub)}</span></th>`).join("")}</tr></thead><tbody>
    ${rows.map((r) => `<tr><th scope="row">${E(r.name)}</th>${r.cells.map((c) => { const col = c.n ? G.SEVCOLOR[c.sev] || G.SEVCOLOR.Unknown : null, s = c.n && G.SEV[c.sev];
      return `<td>${c.n ? `<i style="background:${col};color:${darkText(col) ? "#14202B" : "#fff"}" title="${E((s ? T(s[0], s[1]) : T("सूचना", "Info")) + ": " + c.n)}">${N(c.n)}</i>` : `<i class="z" aria-label="0"></i>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <ul class="vzkey">${["Extreme", "Severe", "Moderate", "Minor"].map((k) => `<li><i style="background:${G.SEVCOLOR[k]}"></i>${T(G.SEV[k][0], G.SEV[k][1])}</li>`).join("")}<li><i style="background:${G.SEVCOLOR.Unknown}"></i>${T("सूचना", "Info")}</li></ul>`;

  /* small trend line from a list of numbers */
  V.spark = (vals, { w = 120, h = 28, color = "currentColor" } = {}) => { const v = vals.filter((x) => x != null); if (v.length < 2) return ""; const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1;
    const pts = v.map((x, k) => `${((k / (v.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((x - lo) / sp) * (h - 6)).toFixed(1)}`);
    return `<svg class="vzsp" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}" r="2.6" fill="${color}"/></svg>`; };

  G.viz = V;
})();
