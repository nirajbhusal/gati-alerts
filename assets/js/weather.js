/* /weather/: DHM forecast and warnings. Uses only weather items in data/alerts.json (each with source and time)
   and data/weather.json (reachability, last checked). Nothing is invented: if a source is unreachable we say so. */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root;
  const [al, wx, D, geo] = await Promise.all(["data/alerts.json", "data/weather.json", "data/districts.json", "data/districts.geojson"].map((p) => G.json(p).catch(() => null)));
  const now = Date.now();
  const items = (al ? al.alerts : []).filter((a) => a.hazard === "weather").sort((a, b) => b.sent.localeCompare(a.sent));
  const act = items.filter((a) => Date.parse(a.expires) > now && !a.supersededBy);
  const warn = items.filter((a) => a.trust === "Official" && /weather-warning/.test(a.info.en.web || ""));
  const src = (a) => { const i = a.info[G.lang]; return `<p class="meta">${T("स्रोत", "Source")}: <a href="${esc(i.web)}" target="_blank" rel="noopener">${esc(i.senderName.split(" — ")[0])}</a>${i.params["gati:sourceUrl2"] ? ` · <a href="${esc(i.params["gati:sourceUrl2"])}" target="_blank" rel="noopener">${T("दोस्रो स्रोत", "Second source")}</a>` : ""} · ${T("स्रोतको समय", "Source time")}: ${G.npt(i.params["gati:sourceTime"] || a.sent)} · ${G.trustChip(a.trust)}</p>`; };
  let map, layer;
  function draw() {
    const fc = act[0] || items[0];
    document.getElementById("wxfc").innerHTML = `<h2 style="margin-top:0">${T("पूर्वानुमान", "Forecast")}</h2>` + (fc ? `
      <div class="ahead">${G.sevChip(fc.severity)}${Date.parse(fc.expires) > now ? `<span class="tag live">${T("चालु", "Active")}</span>` : `<span class="tag exp">${T("म्याद सकियो", "Expired")}</span>`}</div>
      <p class="bigmsg">${esc(fc.info[G.lang].headline)}</p><p>${esc(fc.info[G.lang].description)}</p>${src(fc)}`
      : `<div class="na"><strong>${T("उपलब्ध छैन", "Not available")}</strong></div>`);
    const my = G.district.get(), dn = my && D ? (D.find((d) => d.code === my) || {}) : null;
    const mine = act.filter((a) => !a.districts.length || a.districts.includes(my));
    document.getElementById("wxmine").innerHTML = `<h2 style="margin-top:0">${T("मेरो जिल्लाको ३ दिने अनुमान", "3-day outlook for my district")}</h2>` + (!my
      ? `<div class="na">${T("माथि \"मेरो जिल्ला\" छान्नुहोस्।", "Choose \"My district\" above.")}</div>`
      : mine.length ? `<p class="bigmsg">📍 ${esc(T(dn.ne, dn.en))}</p>` + mine.map((a) => `<p>${esc(a.info[G.lang].headline)}</p>${a.districts.length ? "" : `<p class="meta">${T("यो पूर्वानुमान देशभरका लागि हो; जिल्लाअनुसार छुट्टै छैन।", "This forecast is national; DHM text does not break it down by district.")}</p>`}${src(a)}`).join("")
      : `<div class="na"><strong>${esc(T(dn.ne, dn.en))}</strong>: ${T("यो जिल्लाका लागि गतिमा चालु पूर्वानुमान छैन। खतरा छैन भन्ने होइन।", "No active forecast in Gati for this district. That does not mean there is no risk.")}</div>`);
    // warning map: latest official DHM warning item, colour districts only if it names them
    const w = warn[0];
    if (!map && window.L && geo) {
      map = L.map("wxmap", { zoomSnap: 0.1, scrollWheelZoom: false, attributionControl: true });
      map.attributionControl.setPrefix("").addAttribution("COD-AB, Survey Department / OCHA HDX");
      map.fitBounds([[26.35, 80.06], [30.45, 88.2]]);
    }
    if (map) {
      if (layer) map.removeLayer(layer);
      const live = w && Date.parse(w.expires) > now;
      layer = L.geoJSON(geo, { style: (f) => ({ color: "#c9d3dd", weight: 0.8, fillOpacity: 1, fillColor: live && w.districts.includes(f.id) ? G.SEVCOLOR[w.severity] : live ? "#DDF3EA" : "#eef2f6" }), interactive: false }).addTo(map);
      document.getElementById("wxmapnote").innerHTML = w ? (live ? T("DHM को चेतावनी नक्सा अनुसार रङ।", "Coloured from DHM's warning map.") : T(`DHM को पछिल्लो चेतावनी नक्सा (${G.npt(w.info.ne.params["gati:sourceTime"] || w.sent)}) को म्याद सकिएको छ; त्यसपछिको नक्सा जाँच्न सकिएन, त्यसैले जिल्लामा रङ छैन।`, `DHM's latest warning map in Gati (${G.npt(w.info.en.params["gati:sourceTime"] || w.sent)}) has expired; a newer one could not be checked, so no district is coloured.`))
        + ` <a href="${esc(wx.official.warningUrl)}" target="_blank" rel="noopener">${T("DHM चेतावनी नक्सा", "DHM warning map")} ↗</a> · <a href="${R}alerts/${esc(w.identifier)}/">${esc(w.info[G.lang].headline)}</a>` : T("चेतावनी नक्सा उपलब्ध छैन।", "Warning map not available.");
    }
    document.getElementById("wxrain").innerHTML = `<h2 style="margin-top:0">${T("२४ घण्टाको वर्षा", "24 h rainfall")}</h2>` + (wx && wx.rainfall ? "" :
      `<div class="na"><strong>${T("उपलब्ध छैन", "Not available")}</strong>. ${esc(T(wx.rainfall_note_ne, wx.rainfall_note_en))} ${T("अन्तिम जाँच", "Last checked")}: ${G.npt(wx.checked)} · <a href="${esc(wx.rainfallUrl)}" target="_blank" rel="noopener">DHM ↗</a></div>`);
    document.getElementById("wxnote").innerHTML = wx ? `${esc(T(wx.note_ne, wx.note_en))} <a href="${esc(wx.official.url)}" target="_blank" rel="noopener">mfd.gov.np ↗</a>` : "";
    const box = document.getElementById("mydist");
    G.district.name(my).then((n) => { box.innerHTML = `<button type="button" class="dpick" id="myd">📍 ${T("मेरो जिल्ला", "My district")}: <b>${n ? esc(n) : T("छान्नुहोस्", "Choose")}</b> ▾</button>`; document.getElementById("myd").onclick = () => G.district.open(draw); });
  }
  draw(); G.onLang(draw);
})();
