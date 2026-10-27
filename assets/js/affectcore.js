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
  const load = () => cache || (cache = Promise.all(["data/alerts.json", "data/weather.json", "data/districts.geojson"].map((p) => G.json(p).catch(() => null))).then(([AL, WX, DG]) => ({ AL, WX, DG })));
  /* Radius: 0 = my district only, or 10 / 25 / 50 km from the district boundary. Saved in this browser. */
  const RKEY = "gati-aff-radius", RADII = [0, 10, 25, 50], RMAX = 50, RSTEP = 5;
  /* any saved value (old 0/10/25/50 segments included) is clamped to 0..50 and snapped to 5 km steps */
  const snap = (v) => Math.max(0, Math.min(RMAX, Math.round((+v || 0) / RSTEP) * RSTEP));
  const getR = () => { try { const raw = localStorage.getItem(RKEY); if (raw == null) return 0; const v = snap(raw); if (String(v) !== raw) { if (v) localStorage.setItem(RKEY, String(v)); else localStorage.removeItem(RKEY); } return v; } catch (e) { return 0; } };
  const setR = (v) => { v = snap(v); try { if (v) localStorage.setItem(RKEY, String(v)); else localStorage.removeItem(RKEY); } catch (e) {} };
  const hav = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const ring = (g) => polys(g).flatMap((p) => p[0]);
  const inRing = (x, y, r) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; };
  const inside = (lon, lat, g) => polys(g).some((p) => inRing(lon, lat, p[0]));
  /* km from a point (lat, lon) to a district boundary; 0 when inside */
  const kmTo = (lat, lon, g) => inside(lon, lat, g) ? 0 : Math.min(...ring(g).filter((_, k) => k % 2 === 0).map(([x, y]) => hav(lat, lon, y, x)));
  /* districts within r km of the chosen ones (nearest boundary points, sampled), or touching neighbours when no geometry */
  function area(codes, r, d) {
    if (!r) return { codes, mode: "district" };
    const DG = d && d.DG; if (!DG) return { codes, mode: "none" };
    const F = Object.fromEntries(DG.features.map((f) => [f.id, f])), base = codes.map((c) => F[c]).filter(Boolean);
    if (!base.length) return { codes, mode: "none" };
    const pts = base.flatMap((f) => ring(f.geometry).filter((_, k) => k % 3 === 0));
    const near = DG.features.filter((f) => codes.includes(f.id) || ring(f.geometry).filter((_, k) => k % 3 === 0).some(([x, y]) => pts.some(([px, py]) => Math.abs(px - x) < r / 80 && Math.abs(py - y) < r / 95 && hav(py, px, y, x) <= r))).map((f) => f.id);
    return { codes: [...new Set([...codes, ...near])], mode: "geom", base };
  }
  const note = (v) => !v.r ? "" : v.mode === "geom" ? T(`दायरा: जिल्लाको सिमानाबाट लगभग ${G.num(String(v.r))} किमी (नक्साको सिमाना अनुमानित)। ${G.num(String(v.area.length - 1))} छिमेकी जिल्ला समेटिए।`, `Radius: about ${v.r} km from the district boundary (map boundaries are approximate). Includes ${v.area.length - 1} nearby district${v.area.length === 2 ? "" : "s"}.`) : T("नक्सा लोड भएन; जिल्ला मात्र जाँचियो।", "Map not loaded; checked the district only.");
  const label = (name, r) => r ? `${name} · ${G.num(String(r))} ${T("किमी", "km")}` : name;
  const rtext = (r, n) => !r ? T("मेरो जिल्ला मात्र", "My district only") : `${G.num(String(r))} ${T("किमी", "km")}` + (n == null ? "" : ` · +${G.num(String(n))} ${T("जिल्ला", n === 1 ? "district" : "districts")}`);
  const radiusUI = (cur) => `<div class="afrad"><div class="afradl">${T("दायरा", "Radius")}<output class="afradv" aria-hidden="true">${rtext(cur)}</output></div>
    <input type="range" class="afrange" min="0" max="${RMAX}" step="${RSTEP}" value="${cur}" aria-label="${T("दायरा", "Radius")}" aria-valuetext="${rtext(cur)}" style="--p:${cur / RMAX * 100}%">
    <div class="afticks" aria-hidden="true">${RADII.map((v) => `<span style="left:${v / RMAX * 100}%">${G.num(String(v))}</span>`).join("")}</div></div>`;
  /* live label while dragging; the check re-runs only on release (change) */
  const bindRadius = (root, cb) => root.querySelectorAll(".afrad").forEach((w) => { const el = w.querySelector(".afrange"), out = w.querySelector(".afradv"); if (!el) return;
    const base = (() => { try { return [new URLSearchParams(location.hash.slice(1)).get("d") || localStorage.getItem("gati-district") || localStorage.getItem("gati-aff-last") || ""].filter(Boolean); } catch (e) { return []; } })();
    const show = (n) => { const r = +el.value, t = rtext(r, r && n != null ? n : null); out.textContent = t; el.setAttribute("aria-valuetext", t); el.style.setProperty("--p", r / RMAX * 100 + "%"); };
    const count = (r) => load().then((d) => (r && base.length ? area(base, r, d).codes.length - base.length : null)).catch(() => null);
    show(null); count(+el.value).then(show);
    el.addEventListener("input", () => { const r = +el.value; show(null); count(r).then((n) => { if (+el.value === r) show(n); }); });
    el.addEventListener("change", () => { const had = document.activeElement === el; setR(+el.value); cb && cb(+el.value); if (had) setTimeout(() => { const n = root.querySelector(".afrange"); if (n && n !== document.activeElement) n.focus({ preventScroll: true }); }, 60); }); });
  const isAct = (a) => !a.expired && !a.supersededBy && Date.parse(a.expires) > Date.now();
  /* codes: district codes (NP0330); returns the verdict and the official alerts behind it */
  function verdict(codes0, d, r) {
    if (r === undefined) r = getR();
    const A = area(codes0, r, d), codes = A.codes;
    const prov = [...new Set(codes.map((c) => c.slice(0, 4)))];
    /* an alert matches when its districts overlap the area, or (with a radius) its circle centre lies within r km of the chosen district */
    const circleHit = (a) => r && A.base && (a.areas || []).some((ar) => (ar.circles || []).some((c) => { const [ll, rad] = c.split(" "); const [la, lo] = ll.split(",").map(Number); return A.base.some((f) => kmTo(la, lo, f.geometry) <= r + (+rad || 0)); }));
    const alerts = (d.AL ? d.AL.alerts : []).filter((a) => a.trust === "Official" && isAct(a) && (a.districts.length ? a.districts.some((x) => codes.includes(x)) || circleHit(a) : true) && a.hazard !== "earthquake");
    let lv = 0, why = [];
    alerts.forEach((a) => { const l = SV[a.severity] || 1; if (l > lv) lv = l; why.push(a); });
    const b5 = d.WX && d.WX.bulletin5, wxd = b5 ? b5.days.filter((x) => x.level !== "green" && (!x.provinces || x.provinces.some((p) => prov.includes(p)))) : [];
    wxd.forEach((x) => { const l = WL[x.level] || 1; if (l > lv) lv = l; });
    return { lv, ...LV[lv], label: T(LV[lv].ne, LV[lv].en), alerts: why, wx: wxd, b5, r, mode: A.mode, area: codes, base: codes0 };
  }
  const phrase = (v) => T("आधिकारिक स्रोतअनुसार: ", "Per official sources: ") + v.label;
  /* Feature 1: one sentence per active official alert ("Yes, ... affects your district") or a single "No active alerts for ..." */
  function sentences(v, place) {
    if (!v.alerts.length) return [{ text: T(`${place}का लागि चालु आधिकारिक सूचना छैन।`, `No active official alerts for ${place}.`), none: true }];
    return v.alerts.map((a) => { const i = a.info[G.lang] || a.info.ne;
      if (v.r && v.base && !a.districts.some((x) => v.base.includes(x))) return { a, text: T(`"${i.headline}" हजुरको जिल्ला ${place}बाट ${G.num(String(v.r))} किमीभित्र छ।`, `"${i.headline}" is within ${v.r} km of your district, ${place}.`), agency: G.agencyOf(a), sent: a.sent, web: i.web, perma: G.root + "alerts/" + a.identifier + "/" };
      return { a, text: (SV[a.severity] || 1) >= 2 ? T(`हो, "${i.headline}" ले हजुरको जिल्ला ${place}लाई असर गर्छ।`, `Yes, "${i.headline}" affects your district, ${place}.`) : T(`हो, "${i.headline}" मा हजुरको जिल्ला ${place} पनि समेटिएको छ।`, `Yes, "${i.headline}" covers your district, ${place}.`), agency: G.agencyOf(a), sent: a.sent, web: i.web, perma: G.root + "alerts/" + a.identifier + "/" }; });
  }
  /* Reset: clear district, last checked district and radius, return to the chooser; an Undo toast restores them for 8 s */
  function reset(after) {
    const K = ["gati-district", "gati-aff-last", RKEY], old = {}; K.forEach((k) => { try { old[k] = localStorage.getItem(k); localStorage.removeItem(k); } catch (e) {} });
    after && after();
    document.querySelectorAll(".aftoast").forEach((x) => x.remove());
    const t = document.createElement("div"); t.className = "aftoast"; t.setAttribute("role", "status");
    t.innerHTML = `<span>${T("रिसेट भयो: जिल्ला र दायरा हटाइयो।", "Reset: district and radius cleared.")}</span><button type="button">${T("पूर्ववत्", "Undo")}</button>`;
    document.body.append(t); const tm = setTimeout(() => t.remove(), 8000);
    t.querySelector("button").onclick = () => { clearTimeout(tm); K.forEach((k) => { try { if (old[k] != null) localStorage.setItem(k, old[k]); } catch (e) {} }); t.remove(); after && after(true); };
  }
  G.affect = { reset, load, verdict, phrase, LV, isAct, sentences, getR, setR, RADII, area, label, note, radiusUI, bindRadius };
})();
