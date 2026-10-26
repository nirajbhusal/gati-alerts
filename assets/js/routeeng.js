/* Route engine shared by Route check and Map: corridor graph from data/roads.json, segment km from
   data/geo/roads.geojson (corridor length split by straight-line share), ETA ranges from typical speeds per
   road class, and up to 2 distinct alternatives. Estimates for normal conditions only; never live traffic. */
(function () {
  const G = window.Gati; if (!G) return;
  const hav = (a, b) => { const r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  /* km/h ranges: Terai plains, hill highways, mountain or earthen roads */
  const SPEED = { terai: [40, 55], hill: [25, 35], mountain: [12, 20] };
  const TERAI = ["narayanghat-butwal", "butwal-nepalgunj", "nepalgunj-dhangadhi", "pathlaiya-bardibas", "bardibas-itahari", "itahari-kakarbhitta", "attariya-mahendranagar", "koshi-south", "butwal-lumbini", "pathlaiya-birgunj", "dhalkebar-janakpur", "hetauda-pathlaiya", "narayanghat-hetauda",
    "hq-bhadrapur", "hq-inaruwa", "hq-rajbiraj", "hq-siraha", "hq-jaleshwar", "hq-malangwa", "hq-gaur", "hq-kalaiya", "hq-parasi", "hq-taulihawa", "hq-gulariya", "hq-kawasoti"];
  const MOUNTAIN = ["beni-jomsom", "jomsom-muktinath", "hq-chame", "hq-simikot", "hq-gamgadhi", "hq-salleri", "hq-chainpur", "hq-martadi", "hq-dunai", "hq-khandbari", "hq-rukumkot", "hq-musikot", "hq-okhaldhunga", "hq-diktel", "karnali", "pasang-lhamu"];
  const klass = (id) => (TERAI.includes(id) ? "terai" : MOUNTAIN.includes(id) ? "mountain" : "hill");
  G.routeEngine = (RD, RG) => {
    const N = RD.nodes, kmOf = {};
    (RG ? RG.features : []).forEach((f) => (kmOf[f.properties.id] = f.properties.km));
    const adj = {};
    RD.routes.forEach((rt) => { const hs = rt.segs.map(([a, b]) => hav(N[a].ll, N[b].ll)), tot = hs.reduce((x, y) => x + y, 0) || 1, K = kmOf[rt.id] || tot * 1.3;
      rt.segs.forEach(([a, b], i) => { const km = (K * hs[i]) / tot; (adj[a] = adj[a] || []).push([b, km, rt]); (adj[b] = adj[b] || []).push([a, km, rt]); }); });
    const dijk = (s, t, wf) => { const d = { [s]: 0 }, prev = {}, done = new Set(), Q = [[0, s]];
      while (Q.length) { Q.sort((x, y) => x[0] - y[0]); const [du, u] = Q.shift(); if (done.has(u)) continue; done.add(u); if (u === t) break;
        (adj[u] || []).forEach(([v, km, rt]) => { const w = wf(km, rt); if (w === Infinity) return; if (du + w < (d[v] ?? Infinity)) { d[v] = du + w; prev[v] = [u, rt, km]; Q.push([d[v], v]); } }); }
      if (d[t] === undefined) return null; const out = []; let c = t; while (c !== s) { const [p, rt, km] = prev[c]; out.unshift([p, c, rt, km]); c = p; } return out; };
    const summarize = (P) => { const groups = []; P.forEach(([a, b, rt, km]) => { const g = groups[groups.length - 1]; if (g && g.rt === rt) { g.to = b; g.km += km; } else groups.push({ rt, from: a, to: b, km }); });
      groups.forEach((g) => { const s = SPEED[klass(g.rt.id)]; g.cls = klass(g.rt.id); g.h = [g.km / s[1], g.km / s[0]]; });
      const km = groups.reduce((x, g) => x + g.km, 0), h = [groups.reduce((x, g) => x + g.h[0], 0), groups.reduce((x, g) => x + g.h[1], 0)];
      const st = groups.some((g) => g.rt.status === "blocked") ? "bad" : groups.some((g) => g.rt.status === "oneway") ? "unk" : groups.some((g) => g.rt.status === "none") ? "nc" : "ok";
      return { P, groups, km, h, st, blocked: groups.some((g) => g.rt.status === "blocked"), ids: [...new Set(groups.map((g) => g.rt.id))] }; };
    function routes(s, t) {
      const prim = dijk(s, t, (km) => km); if (!prim) return [];
      const out = [summarize(prim)], used = new Set(out[0].ids);
      for (let k = 0; k < 4 && out.length < 3; k++) {
        const P = dijk(s, t, (km, rt) => km * (rt.status === "blocked" ? 50 : 1) * (used.has(rt.id) ? 3 + k : 1)); if (!P) break;
        const R2 = summarize(P), sig = R2.ids.join(",");
        const distinct = out.every((o) => { const a = new Set(o.ids), inter = R2.ids.filter((i) => a.has(i)).length; return o.ids.join(",") !== sig && inter / new Set([...o.ids, ...R2.ids]).size < 0.75; });
        R2.ids.forEach((i) => used.add(i));
        if (distinct && R2.km <= 1.8 * out[0].km + 40) out.push(R2);
      }
      /* prefer alternatives without blocked corridors */
      const alts = out.slice(1).sort((a, b) => (a.blocked - b.blocked) || a.km - b.km);
      return [out[0], ...alts];
    }
    const fmtH = (h) => { const m = Math.round((h * 60) / 10) * 10, H = Math.floor(m / 60), M = m % 60;
      return G.lang === "ne" ? G.num(H ? `${H} घण्टा${M ? ` ${M} मिनेट` : ""}` : `${M} मिनेट`) : H ? `${H} h${M ? ` ${M} min` : ""}` : `${M} min`; };
    const eta = (h) => `${fmtH(h[0])}–${fmtH(h[1])}`;
    const fmtKm = (km) => G.num(String(Math.round(km))) + (G.lang === "ne" ? " कि.मि." : " km");
    return { routes, eta, fmtKm, adj, SPEED, klass };
  };
})();
