/* Sources page: stale-source banner that names the agency. "Rivers: DHM last answered 4 days ago" per data product,
   then the agencies Gati cannot reach right now, by name. No summed counts. Links to /sources/. */
(function () {
  const G = window.Gati;
  const el = document.getElementById("srcflag"); if (!el) return;
  const ago = (iso) => { const h = (Date.now() - Date.parse(iso)) / 36e5, d = Math.floor(h / 24);
    return d >= 1 ? (G.lang === "ne" ? `${G.num(String(d))} दिनअघि` : `${d} day${d > 1 ? "s" : ""} ago`) : (G.lang === "ne" ? `${G.num(String(Math.max(1, Math.round(h))))} घण्टाअघि` : `${Math.max(1, Math.round(h))} h ago`); };
  const short = (s) => { const m = /\(([^)]+)\)/.exec(s.agency.en); return m ? m[1] : (G.lang === "ne" ? s.agency.ne : s.agency.en).split(",")[0].trim(); };
  Promise.all([G.json("data/sources.json"), G.json("data/source-health.json"), G.json("data/rivers.json").catch(() => null), G.json("data/roads.json").catch(() => null), G.json("data/weather.json").catch(() => null)]).then(([S, h, RV, RD, WX]) => {
    const H = (h && h.sources) || {};
    const draw = () => {
      const T = (ne, en) => (G.lang === "ne" ? ne : en), R = document.body.dataset.root || "";
      const prods = [[T("नदी", "Rivers"), "DHM", RV && RV.as_of && RV.as_of + (RV.as_of.length === 10 ? "T12:00:00" + G.tzIso : ""), "rivers/"],
        [T("सडक", "Roads"), T("नेपाल प्रहरी", "Nepal Police"), RD && RD.as_of, "roads/"],
        [T("मौसम", "Weather"), "DHM", WX && WX.bulletin5 && WX.bulletin5.issued, "weather/"]].filter((p) => p[2] && G.isStale(p[2]));
      const down = [...new Set(S.filter((s) => G.srcStatus(s, H[s.id]) === "down").map(short))];
      if (!prods.length && !down.length) { el.hidden = true; return; }
      const lines = prods.map(([k, ag, t, href]) => `<li><a href="${R}${href}">${k}: ${T(`${ag} ले अन्तिम पटक ${ago(t)} जवाफ दियो`, `${ag} last answered ${ago(t)}`)}</a> <span class="meta">(${k === T("नदी", "Rivers") && RV.as_of.length === 10 ? G.esc(T(RV.as_of_ne, RV.as_of_en)) : G.npt(t)})</span></li>`);
      if (down.length) lines.push(`<li>${T("अहिले पहुँच नभएका स्रोत", "Not reachable right now")}: ${down.map((x) => `<b>${G.esc(x)}</b>`).join(", ")}</li>`);
      el.innerHTML = `<span class="sfh"><span aria-hidden="true">⚠</span> ${T("पुराना स्रोत", "Stale sources")}</span><ul>${lines.join("")}</ul><a class="sfall" href="${R}sources/#health">${T("स्रोतको अवस्था हेर्नुहोस्", "See source health")} →</a>`;
      el.hidden = false;
    };
    draw(); G.onLang(draw);
  }).catch(() => {});
})();
