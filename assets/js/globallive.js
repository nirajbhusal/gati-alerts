/* Sources page: the latest items from global sources that publish an open feed, read in the reader's browser.
   Supplementary only. Nothing here becomes a Gati alert, enters a count or is merged with a Nepali agency. */
(function () {
  const G = window.Gati, box = document.getElementById("glive"); if (!G || !box) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v)), R = document.body.dataset.root || "";
  const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
  const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
  const GD = { EQ: ["भूकम्प", "Earthquake"], FL: ["बाढी", "Flood"], TC: ["चक्रवात", "Cyclone"], DR: ["खडेरी", "Drought"], WF: ["डढेलो", "Wildfire"], VO: ["ज्वालामुखी", "Volcano"] };
  const LV = { Green: ["हरियो", "Green", "#1e8e3e"], Orange: ["सुन्तला", "Orange", "#F28C1E"], Red: ["रातो", "Red", "#D93025"] };
  const FEEDS = [
    { id: "gdacs", name: "GDACS", by: T("संयुक्त राष्ट्र र युरोपेली आयोग", "United Nations and European Commission"), page: "https://www.gdacs.org/",
      what: T("नेपालका लागि पछिल्ला ९० दिनका विश्व विपद् सूचना", "Global disaster alerts for Nepal, last 90 days"),
      url: () => `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?country=Nepal&fromDate=${day(-90)}&toDate=${day(1)}&alertlevel=Green;Orange;Red`,
      rows: (d) => (d.features || []).map((f) => f.properties).sort((a, b) => (a.fromdate < b.fromdate ? 1 : -1)).slice(0, 5).map((p) => {
        const lv = LV[p.alertlevel] || LV.Green, k = GD[p.eventtype];
        return { t: p.fromdate + "Z", chip: [T(lv[0], lv[1]), lv[2]], text: (k ? T(k[0], k[1]) + ": " : "") + (p.name || p.description || ""), href: p.url && p.url.report }; }) },
    { id: "emsc", name: "EMSC", by: T("युरोपेली-भूमध्यसागरीय भूकम्प केन्द्र", "European-Mediterranean Seismological Centre"), page: "https://www.emsc-csem.org/",
      what: T("नेपाल र वरपर M४ वा माथिका पछिल्ला भूकम्प", "Latest M4+ earthquakes in and around Nepal"),
      url: () => "https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minlat=26&maxlat=31&minlon=79.5&maxlon=88.6&minmag=4&limit=5&orderby=time",
      rows: (d) => (d.features || []).map((f) => f.properties).map((p) => ({ t: p.time, chip: ["M" + N(Number(p.mag).toFixed(1)), "#5E35B1"],
        text: String(p.flynn_region || "").toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) + " · " + T("गहिराइ ", "depth ") + N(Math.round(Math.abs(p.depth))) + T(" कि.मि.", " km"),
        href: "https://www.seismicportal.eu/eventdetails.html?unid=" + encodeURIComponent(p.unid) })) },
    { id: "ifrc-go", name: "IFRC GO", by: T("रेडक्रस तथा रेडक्रिसेन्ट महासंघ", "International Federation of Red Cross and Red Crescent"), page: "https://go.ifrc.org/countries/123",
      what: T("नेपालमा रेडक्रसका पछिल्ला आपत्कालीन कार्य", "Latest Red Cross emergency operations in Nepal"),
      url: () => "https://goadmin.ifrc.org/api/v2/event/?countries__in=123&ordering=-disaster_start_date&limit=5",
      rows: (d) => (d.results || []).map((e) => ({ t: e.disaster_start_date, dateOnly: true, chip: [(e.dtype && e.dtype.name) || T("घटना", "Event"), "#C62828"], text: String(e.name || "").replace(/^NPL:\s*/, ""), href: "https://go.ifrc.org/emergencies/" + e.id })) },
  ];
  const USED = [
    ["Open-Meteo, ECMWF", T("मोडेल मौसम र हावाको गुणस्तर", "Model weather and air quality"), "weather/#wxmodel", T("मौसम पृष्ठ", "Weather page")],
    ["NASA GPM IMERG", T("भू-उपग्रहबाट वर्षाको अनुमान", "Satellite rainfall estimate"), "map/", T("नक्सा: भू-उपग्रह वर्षा", "Map: Satellite rain")],
    ["NASA FIRMS (VIIRS)", T("भू-उपग्रहले देखेको आगो", "Fires seen by satellite"), "map/", T("नक्सा: भू-उपग्रह आगो", "Map: Satellite fires")],
    ["USGS", T("नेपाल क्षेत्रका M४.५+ भूकम्प", "M4.5+ earthquakes, Nepal area"), "earthquakes/", T("भूकम्प पृष्ठ", "Earthquakes page")],
  ];
  const ST = {}; let at = null;
  const when = (r) => { const d = new Date(r.t); if (isNaN(d)) return ""; return r.dateOnly ? d.toLocaleDateString(G.lang === "ne" ? "ne-NP" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kathmandu" }) : G.npt(d.toISOString()); };
  function draw() {
    box.innerHTML = `<div class="glhead"><h3>${T("विश्व स्रोतबाट अहिले", "Live from global sources")}</h3><span class="sst sst-live">${T("प्रत्यक्ष", "Live")}</span></div>
      <p class="meta">${T("यी सूची हजुरको ब्राउजरले सोझै स्रोतबाट अहिले ल्याएको हो। पूरक मात्र: नेपालको आधिकारिक चेतावनी होइन, गतिको सूचना वा सङ्ख्यामा जोडिँदैन।", "These lists are fetched just now by your browser, straight from each source. Supplementary only: not a Nepali official warning, and never added to Gati's alerts or counts.")}${at ? " " + T("ल्याएको", "Fetched") + " " + G.npt(at) + "." : ""}</p>
      <div class="glgrid">${FEEDS.map((f) => { const s = ST[f.id];
        const body = !s ? `<p class="meta">${T("लोड हुँदै…", "Loading…")}</p>` : s.err ? `<p class="na">${T("अहिले ल्याउन सकिएन। स्रोतमै हेर्नुहोस्।", "Could not load right now. See the source.")}</p>`
          : !s.rows.length ? `<p class="meta">${T("अहिले कुनै वस्तु छैन।", "Nothing listed right now.")}</p>`
          : `<ul class="gll">${s.rows.map((r) => `<li><span class="glc" style="--c:${r.chip[1]}">${E(r.chip[0])}</span><span class="glt">${r.href ? `<a href="${E(r.href)}" target="_blank" rel="noopener">${E(r.text)}</a>` : E(r.text)}<small>${E(when(r))}</small></span></li>`).join("")}</ul>`;
        return `<section class="glcard"><h4><a href="${f.page}" target="_blank" rel="noopener">${f.name} ↗</a></h4><p class="glby">${E(f.by)} · ${E(f.what)}</p>${body}</section>`; }).join("")}</div>
      <p class="glused"><b>${T("गतिका पृष्ठमा प्रत्यक्ष चलिरहेका", "Also live on Gati's pages")}:</b> ${USED.map((u) => `${E(u[0])} (${E(u[1])}) → <a href="${R}${u[2]}">${E(u[3])}</a>`).join(" · ")}</p>`;
  }
  draw(); if (G.onLang) G.onLang(draw);
  FEEDS.forEach((f) => get(f.url()).then((d) => { ST[f.id] = { rows: f.rows(d) }; }).catch(() => { ST[f.id] = { err: true }; }).then(() => { at = new Date().toISOString(); draw(); }));
})();
