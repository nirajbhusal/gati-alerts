/* "Am I affected?" core: a verdict worded per official sources, never as Gati's own judgement.
   Levels: 0 no active official alert, 1 be updated, 2 be prepared, 3 take action (colours from the severity scale). */
(function () {
  const G = window.Gati; if (!G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const LV = [
    { ne: "चालु आधिकारिक चेतावनी छैन", en: "No active official alert", c: "#5f6670" },
    { ne: "अद्यावधिक रहनुहोस्", en: "Be updated", c: G.SEVCOLOR.Minor },
    { ne: "तयार रहनुहोस्", en: "Be prepared", c: G.SEVCOLOR.Moderate },
    { ne: "तुरुन्तै कदम चाल्नुहोस्", en: "Take action", c: G.SEVCOLOR.Severe }];
  const SV = { Unknown: 1, Minor: 1, Moderate: 2, Severe: 3, Extreme: 3 }, WL = { green: 0, yellow: 1, orange: 2, red: 3 };
  let cache = null;
  const load = () => cache || (cache = Promise.all(["data/alerts.json", "data/weather.json"].map((p) => G.json(p).catch(() => null))).then(([AL, WX]) => ({ AL, WX })));
  const isAct = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > Date.now();
  /* codes: district codes (NP0330); returns the verdict and the official alerts behind it */
  function verdict(codes, d) {
    const prov = [...new Set(codes.map((c) => c.slice(0, 4)))];
    const alerts = (d.AL ? d.AL.alerts : []).filter((a) => a.trust === "Official" && isAct(a) && (a.districts.length ? a.districts.some((x) => codes.includes(x)) : true) && a.hazard !== "earthquake");
    let lv = 0, why = [];
    alerts.forEach((a) => { const l = SV[a.severity] || 1; if (l > lv) lv = l; why.push(a); });
    const b5 = d.WX && d.WX.bulletin5, wxd = b5 ? b5.days.filter((x) => x.level !== "green" && (!x.provinces || x.provinces.some((p) => prov.includes(p)))) : [];
    wxd.forEach((x) => { const l = WL[x.level] || 1; if (l > lv) lv = l; });
    return { lv, ...LV[lv], label: T(LV[lv].ne, LV[lv].en), alerts: why, wx: wxd, b5 };
  }
  const phrase = (v) => T("आधिकारिक स्रोतअनुसार: ", "Per official sources: ") + v.label;
  G.affect = { load, verdict, phrase, LV, isAct };
})();
