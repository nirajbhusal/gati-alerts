/* Extra layers for /map/: provinces, district labels, highway names, earthquake epicentres, hospitals and
   health posts, helipads and aerodromes, my district highlight; plus locate me, a scale bar and
   collision-aware labels. Every layer is toggleable and cited in the legend. Point data is OSM via HOT/HDX. */
(function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en);
  const wait = () => new Promise((r) => { const t = setInterval(() => { if (window.__gmap) { clearInterval(t); r(window.__gmap); } }, 100); });
  wait().then(async (map) => {
    map.scrollWheelZoom.enable();
    const [prov, dist, al, health, avia, roadGeo, roads] = await Promise.all(["data/geo/provinces.geojson", "data/districts.geojson", "data/alerts.json",
      "data/geo/health.json", "data/geo/aviation.json", "data/geo/roads.geojson", "data/roads.json"].map((p) => G.json(p).catch(() => null)));
    const on = { provinces: true, dlabels: true, hwy: true, quakes: true, health: false, heli: false, mine: true };
    const L_ = {}; Object.keys(on).forEach((k) => (L_[k] = L.layerGroup()));
    const lab = (ll, html, cls, pri) => L.marker(ll, { icon: L.divIcon({ className: "mlab " + cls, html: `<span data-pri="${pri}">${html}</span>`, iconSize: null }), interactive: false, keyboard: false });
    function build() {
      Object.values(L_).forEach((g) => g.clearLayers());
      if (prov) prov.features.forEach((f) => {
        L.geoJSON(f, { style: { color: "#0B1424", weight: 1.6, opacity: 0.55, fill: false, dashArray: "6 4" }, interactive: false }).addTo(L_.provinces);
        lab(f.properties.label, G.esc(T(f.properties.ne, f.properties.en)), "prov", 1).addTo(L_.provinces);
      });
      if (dist) dist.features.forEach((f) => {
        const g = L.geoJSON(f).getBounds().getCenter();
        lab([g.lat, g.lng], G.esc(T(f.properties.ne, f.properties.en)), "dist", 3).addTo(L_.dlabels);
      });
      if (roadGeo && roads) roadGeo.features.forEach((f) => {
        const r = roads.routes.find((x) => x.id === f.properties.id); if (!r) return;
        const cs = f.geometry.type === "MultiLineString" ? f.geometry.coordinates.flat() : f.geometry.coordinates, m = cs[Math.floor(cs.length / 2)];
        const nm = (T(r.name_ne, r.name_en).match(/\(([^)]+)\)/) || [])[1]; if (!nm) return;
        lab([m[1], m[0]], "🛣 " + G.esc(nm), "hwy", 2).addTo(L_.hwy);
      });
      if (al) al.alerts.filter((a) => a.hazard === "earthquake").forEach((a) => {
        const i = a.info[G.lang]; (i.areas || []).forEach((ar) => ar.circles.forEach((c) => {
          const [ll] = c.split(" "), [la, lo] = ll.split(",").map(Number), mag = parseFloat(a.info.en.params["gati:magnitude"]) || 4.5;
          L.circleMarker([la, lo], { radius: Math.min(16, 5 + Math.max(0, mag - 4) * 5), color: "#8E1B14", weight: 1.5, fillColor: "#D93025", fillOpacity: 0.35 })
            .bindPopup(`<b>${G.esc(i.headline)}</b><br>${G.trustChip(a.trust)} ${G.npt(i.params["gati:sourceTime"] || a.sent)}<br><a href="${G.esc(i.web)}" target="_blank" rel="noopener">${T("स्रोत", "Source")} ↗</a> · <a href="${G.root}alerts/${G.esc(a.identifier)}/">${T("पूरा", "More")}</a>`).addTo(L_.quakes);
        }));
      });
      const dot = (ll, c, r, tip) => L.circleMarker([ll[0], ll[1]], { radius: r, color: "#fff", weight: 1, fillColor: c, fillOpacity: 0.95 }).bindTooltip(G.esc(ll[2] || tip));
      if (health) { health.hospitals.forEach((p) => dot(p, "#D93025", 3.6, T("अस्पताल", "Hospital")).addTo(L_.health)); health.healthPosts.forEach((p) => dot(p, "#F28C1E", 2.6, T("स्वास्थ्य चौकी", "Health post")).addTo(L_.health)); }
      if (avia) { avia.helipads.forEach((p) => dot(p, "#2F6FED", 3.2, "Helipad").addTo(L_.heli)); avia.aerodromes.forEach((p) => dot(p, "#0B1424", 4.5, T("विमानस्थल", "Aerodrome")).addTo(L_.heli)); }
      const my = G.district && G.district.get();
      if (my && dist) { const f = dist.features.find((x) => x.id === my); if (f) L.geoJSON(f, { style: { color: "#0F7C86", weight: 3.5, fill: true, fillColor: "#7FD1D8", fillOpacity: 0.18 }, interactive: false }).addTo(L_.mine); }
      apply();
    }
    function apply() { Object.entries(on).forEach(([k, v]) => (v ? L_[k].addTo(map) : map.removeLayer(L_[k]))); chips(); setTimeout(declutter, 30); }
    /* Collision-aware labels: higher priority first; hide any label whose box overlaps one already shown. */
    function declutter() {
      const z = map.getZoom(), els = [...map.getContainer().querySelectorAll(".mlab span, .townlab, .rivlab")];
      els.forEach((e) => (e.style.visibility = ""));
      els.forEach((e) => { if (e.closest(".dist") && z < 7.6) e.style.visibility = "hidden"; if (e.closest(".prov") && z >= 8.6) e.style.visibility = "hidden"; });
      const pri = (e) => (e.classList.contains("townlab") ? (e.classList.contains("cap") ? 0 : 1.5) : e.classList.contains("rivlab") ? 2.5 : +e.dataset.pri);
      const kept = [];
      els.filter((e) => e.style.visibility !== "hidden").sort((a, b) => pri(a) - pri(b)).forEach((e) => {
        const r = e.getBoundingClientRect(); if (!r.width) return;
        if (kept.some((k) => !(r.right + 4 < k.left || r.left - 4 > k.right || r.bottom + 2 < k.top || r.top - 2 > k.bottom))) e.style.visibility = "hidden"; else kept.push(r);
      });
    }
    map.on("zoomend moveend", () => setTimeout(declutter, 20));
    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);
    /* Locate me */
    const Loc = L.Control.extend({ options: { position: "topleft" }, onAdd() {
      const b = L.DomUtil.create("button", "leaflet-bar locbtn"); b.type = "button"; b.innerHTML = "⌖"; b.title = T("मेरो स्थान", "Locate me"); b.setAttribute("aria-label", b.title);
      L.DomEvent.disableClickPropagation(b);
      b.onclick = () => navigator.geolocation && navigator.geolocation.getCurrentPosition((p) => {
        const ll = [p.coords.latitude, p.coords.longitude];
        if (window.__gloc) map.removeLayer(window.__gloc);
        window.__gloc = L.layerGroup([L.circle(ll, { radius: p.coords.accuracy, color: "#2F6FED", weight: 1, fillOpacity: 0.1 }), L.circleMarker(ll, { radius: 7, color: "#fff", weight: 3, fillColor: "#2F6FED", fillOpacity: 1 })]).addTo(map);
        map.setView(ll, Math.max(map.getZoom(), 9));
      }, () => alert(T("स्थान अनुमति दिइएन वा भेटिएन।", "Location permission denied or unavailable.")), { timeout: 10000, maximumAge: 600000 });
      return b; } });
    new Loc().addTo(map);
    /* Toggle chips + citations */
    const bar = document.querySelector(".chipbar");
    const DEF = [["provinces", "🗺", "प्रदेश", "Provinces"], ["dlabels", "🏷", "जिल्लाका नाम", "District names"], ["hwy", "🛣", "राजमार्गका नाम", "Highway names"],
      ["quakes", "〰", "भूकम्पको केन्द्रबिन्दु", "Earthquake epicentres"], ["health", "🏥", "अस्पताल र स्वास्थ्य चौकी", "Hospitals and health posts"],
      ["heli", "🚁", "हेलिप्याड र विमानस्थल", "Helipads and aerodromes"], ["mine", "📍", "मेरो जिल्ला", "My district"]];
    function chips() {
      bar.querySelectorAll(".xchip").forEach((x) => x.remove());
      DEF.forEach(([k, ic, ne, en]) => { const b = document.createElement("button"); b.type = "button"; b.className = "lchip xchip"; b.setAttribute("aria-pressed", on[k]);
        b.innerHTML = `<span aria-hidden="true">${ic}</span> ${T(ne, en)}`; b.onclick = () => { on[k] = !on[k]; apply(); }; bar.append(b); });
      let c = document.getElementById("mapcite");
      if (!c) { c = document.createElement("div"); c.id = "mapcite"; c.className = "card mapcite"; document.querySelector(".mapsec").append(c); }
      c.innerHTML = `<h3>${T("नक्साका तह र स्रोत", "Map layers and sources")}</h3><ul class="plist">
        <li>${T("जिल्ला र प्रदेशको सीमा", "District and province boundaries")}: COD-AB, ${T("नापी विभाग", "Survey Department of Nepal")} / OCHA HDX (CC BY-IGO). ${T("प्रदेश सीमा जिल्लाबाट जोडेर बनाइएको।", "Provinces are dissolved from the districts.")}</li>
        <li>${T("सडक र नदी रेखा", "Road and river lines")}: © OpenStreetMap ${T("योगदानकर्ता", "contributors")} (ODbL). ${T("राजमार्ग नम्बर स्रोतमा नभएकाले देखाइएको छैन।", "Highway numbers are not shown: they are not in our cited road data.")}</li>
        <li>${T("भूकम्प", "Earthquakes")}: NSC / USGS (${T("गतिका भूकम्प सूचना", "Gati earthquake items")}).</li>
        ${health ? `<li>${T("अस्पताल र स्वास्थ्य चौकी", "Hospitals and health posts")}: <a href="${health.sourceUrl}" target="_blank" rel="noopener">${G.esc(health.source)}</a>, ${health.as_of}. ${G.esc(health.note)}</li>` : ""}
        ${avia ? `<li>${T("हेलिप्याड र विमानस्थल", "Helipads and aerodromes")}: <a href="${avia.sourceUrl}" target="_blank" rel="noopener">${G.esc(avia.source)}</a>, ${avia.as_of}. ${G.esc(avia.note)}</li>` : ""}
        <li>${T("खुला ठाउँ र सुरक्षित स्थल: भरपर्दो खुला राष्ट्रिय डेटा नभेटिएकाले राखिएको छैन।", "Evacuation and open spaces: not added; no reliable open national dataset was found.")}</li></ul>`;
    }
    build(); G.onLang(build);
  });
})();
