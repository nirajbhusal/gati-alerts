(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const [al, geo] = await Promise.all([G.json("data/alerts.json"), G.json("data/districts.geojson").catch(() => null)]);
  const Q = al.alerts.filter((a) => a.hazard === "earthquake").map((a) => {
    const p = a.info.en.params, c = (a.areas.find((x) => x.circles.length) || { circles: ["0,0 0"] }).circles[0].split(" ")[0].split(",").map(Number);
    const dm = (a.info.en.description || "").match(/depth[^0-9]*([0-9.]+)\s*km/i);
    return { a, m: parseFloat(String(p["gati:magnitude"]).replace(/^M/, "")), ms: p["gati:magnitude"], ll: c, t: Date.parse(p["gati:sourceTime"] || a.sent), depth: dm ? +dm[1] : null, src: /usgs/i.test(a.info.en.web) ? "USGS" : "NSC" };
  }).sort((x, y) => y.t - x.t);
  const F = [[7, "७ दिन", "7 days"], [30, "३० दिन", "30 days"], [90, "९० दिन", "90 days"], [0, "सबै", "All"]];
  let days = +(localStorage.getItem("gati-qdays") || 90), map, lay;
  function draw() {
    document.getElementById("qfilt").innerHTML = F.map(([d, n, e]) => `<button type="button" class="chipbtn" aria-pressed="${d === days}" data-d="${d}">${T(n, e)}</button>`).join("");
    document.querySelectorAll("#qfilt button").forEach((b) => (b.onclick = () => { days = +b.dataset.d; try { localStorage.setItem("gati-qdays", days); } catch (e) {} draw(); }));
    const now = Date.now(), list = Q.filter((q) => !days || now - q.t <= days * 864e5);
    document.getElementById("qlist").innerHTML = `<h2 style="margin-top:0">${T("भूकम्पहरू", "Quakes")} <span class="count">${G.num(list.length)}</span></h2>` + (list.length ? `<ul class="qlist">${list.map((q) => `<li>
      <span class="qmag" style="--m:${q.m}">${G.num(String(q.m.toFixed(1)))}</span><div><a href="${R}alerts/${esc(q.a.identifier)}/">${esc(q.a.info[G.lang].headline)}</a>
      <div class="kv"><span>${T("म्याग्निच्युड", "Magnitude")}: <b>${esc(G.num(q.ms))}</b></span><span>${T("गहिराइ", "Depth")}: <b>${q.depth != null ? G.num(q.depth) + " km" : T("स्रोत रेकर्डमा छैन", "not in source record")}</b></span><span>${G.npt(new Date(q.t).toISOString())}</span><span><a href="${esc(q.a.info.en.web)}" target="_blank" rel="noopener">${q.src} ↗</a></span></div></div></li>`).join("")}</ul>`
      : `<div class="na">${T("यो अवधिमा गतिमा भूकम्प रेकर्ड छैन।", "No quakes recorded in Gati in this period.")}</div>`);
    if (!map && window.L) {
      map = window.L.map("qmap", { zoomSnap: 0.1, scrollWheelZoom: false }); map.attributionControl.setPrefix("").addAttribution("COD-AB / OCHA HDX · NSC · USGS");
      map.fitBounds([[26.35, 80.06], [30.48, 88.2]]);
      if (geo) window.L.geoJSON(geo, { style: { color: "#c9d3dd", weight: 0.7, fillColor: "#f4f7fa", fillOpacity: 1 }, interactive: false }).addTo(map);
    }
    if (map) { if (lay) map.removeLayer(lay); lay = window.L.layerGroup().addTo(map);
      Lq(list).forEach((m) => m.addTo(lay)); }
  }
  function Lq(list) { return list.map((q) => window.L.circleMarker(q.ll, { radius: 3 + (q.m - 3) * 4, color: q.src === "USGS" ? "#5b3fa0" : "#B3261E", weight: 1.5, fillOpacity: 0.35 }).bindPopup(`<b>${esc(G.num(q.ms))}</b> ${esc(q.a.info[G.lang].headline)}<br>${G.npt(new Date(q.t).toISOString())} · <a href="${esc(q.a.info.en.web)}" target="_blank" rel="noopener">${q.src}</a>`)); }
  draw(); G.onLang(draw);
})();
