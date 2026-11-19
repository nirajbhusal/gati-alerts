/* Flights page: weather at Nepal's airports, as it bears on flying, and where to check a flight.
   Kathmandu: the airport's own weather report (METAR), fetched every half hour by .github/workflows/flights.yml.
   Other airports: no open official report, so a weather model's estimate at the airport, labelled as a model.
   Gati does not know whether a flight is delayed or cancelled: the airport's board cannot be read by a program. */
(function () {
  const G = window.Gati; if (!G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const top = document.getElementById("flnow"), grid = document.getElementById("flgrid"), links = document.getElementById("fllinks");
  const page = !!(top && grid), subs = [];
  const LIVE = "https://raw.githubusercontent.com/nirajbhusal/gati-alerts/bot/live/airport-weather.json";
  /* Domestic flights in Nepal are flown by sight. About 5 km of visibility is the usual working minimum; below about 1.5 km
     almost nothing moves. These bands describe the weather, not any airline's or the tower's decision. */
  const CAT = { good: ["उडान योग्य मौसम", "Good flying weather", "#1e8e3e"], marg: ["सीमान्त", "Marginal", "#B26A00"], poor: ["कमजोर दृश्यता वा खराब मौसम", "Poor visibility or bad weather", "#C5221F"], na: ["जानकारी छैन", "No data", "#6b7280"] };
  const WXW = { BR: ["तुवाँलो", "mist"], FG: ["बाक्लो कुहिरो", "fog"], HZ: ["धुम्म", "haze"], FU: ["धुवाँ", "smoke"], RA: ["वर्षा", "rain"], DZ: ["सिमसिम", "drizzle"], SN: ["हिमपात", "snow"], TS: ["मेघगर्जन", "thunderstorm"], SH: ["झरी", "showers"], GR: ["असिना", "hail"], DU: ["धुलो", "dust"] };
  const WMO = (c) => (c >= 95 ? ["मेघगर्जन", "Thunderstorm"] : c >= 85 ? ["हिमपात", "Snow showers"] : c >= 80 ? ["झरी", "Rain showers"] : c >= 71 ? ["हिमपात", "Snow"] : c >= 61 ? ["वर्षा", "Rain"] : c >= 51 ? ["सिमसिम", "Drizzle"] : c >= 45 ? ["कुहिरो", "Fog"] : c >= 3 ? ["बादल", "Overcast"] : c >= 1 ? ["आंशिक बादल", "Partly cloudy"] : ["सफा", "Clear"]);
  const km = (m) => (m >= 10000 ? T("१० कि.मि. वा बढी", "10 km or more") : N((m / 1000).toFixed(m < 3000 ? 1 : 0)) + T(" कि.मि.", " km"));
  const catOf = (o) => { if (o.vis == null) return "na";
    if (o.vis < 1500 || o.ts || (o.ceil != null && o.ceil < 500)) return "poor";
    if (o.vis < 5000 || (o.ceil != null && o.ceil < 1500) || (o.low != null && o.low >= 80) || (o.gust != null && o.gust >= 45)) return "marg";
    return "good"; };
  let AP = [], MET = null, MOD = null, modAt = null, err = false;

  const official = (a) => { const s = MET && MET.stations && MET.stations[a.icao]; if (!s) return null;
    const age = (Date.now() - Date.parse(s.time)) / 60000; if (age > 150) return null;   /* an old report is not "now" */
    const wx = (s.wx || []).map((w) => { const k = Object.keys(WXW).filter((x) => w.indexOf(x) >= 0); return k.map((x) => T(WXW[x][0], WXW[x][1])).join(" "); }).filter(Boolean);
    return { kind: "official", vis: s.vis_m, ceil: s.ceiling_ft, ts: (s.wx || []).some((w) => w.indexOf("TS") >= 0), gust: s.gust_kt ? s.gust_kt * 1.852 : null, wind: s.wind_kt != null ? s.wind_kt * 1.852 : null,
      wx: wx.join(", ") || (s.cavok ? T("सफा", "clear") : ""), temp: s.temp_c, time: s.time, raw: s.raw, url: s.url,
      cloud: s.ceiling_ft != null ? T("बादलको तल्लो सतह ", "cloud base ") + N(s.ceiling_ft) + T(" फिट", " ft") : (s.clouds && s.clouds.length ? T("छरिएका बादल", "scattered cloud") : T("बादल छैन", "no cloud")) }; };
  const model = (a, i) => { const m = MOD && MOD[i]; if (!m || !m.current) return null; const c = m.current, w = WMO(c.weather_code);
    const h = m.hourly || {}, later = h.visibility ? { vis: Math.min(...h.visibility.slice(1, 4)), low: Math.max(...(h.cloud_cover_low || [0]).slice(1, 4)), ts: (h.weather_code || []).slice(1, 4).some((x) => x >= 95), gust: Math.max(...(h.wind_gusts_10m || [0]).slice(1, 4)) } : null;
    return { kind: "model", vis: c.visibility, low: c.cloud_cover_low, ts: c.weather_code >= 95, gust: c.wind_gusts_10m, wind: c.wind_speed_10m, wx: T(w[0], w[1]), temp: Math.round(c.temperature_2m), time: c.time + G.tzIso,
      cloud: T("तल्लो बादल ", "low cloud ") + N(c.cloud_cover_low) + "%", later }; };

  const card = (a, i) => { const o = official(a) || model(a, i), c = o ? catOf(o) : "na", k = CAT[c], lat = o && o.later ? catOf(o.later) : null;
    const src = !o ? "" : o.kind === "official"
      ? `${G.trustChip("Official")} <a href="${E(o.url)}" target="_blank" rel="noopener">${T("विमानस्थलको मौसम प्रतिवेदन (METAR)", "Airport weather report (METAR)")} ↗</a> · ${G.npt(o.time)}`
      : `${G.trustChip("Model")} <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo ↗</a> · ${T("अनुमान, मापन होइन", "an estimate, not a measurement")} · ${G.npt(o.time)}`;
    return `<article class="flc" style="--c:${k[2]}"><header><h3>${E(T(a.ne, a.en))} <small>${E(a.iata)}</small></h3><span class="flchip">${T(k[0], k[1])}</span></header>
      ${o ? `<dl class="fld"><div><dt>${T("दृश्यता", "Visibility")}</dt><dd>${km(o.vis)}</dd></div><div><dt>${T("बादल", "Cloud")}</dt><dd>${E(o.cloud)}</dd></div><div><dt>${T("हावा", "Wind")}</dt><dd>${o.wind != null ? N(Math.round(o.wind)) + T(" कि.मि./घ", " km/h") : "–"}${o.gust && o.gust >= 30 ? " · " + T("झोक्का ", "gusts ") + N(Math.round(o.gust)) : ""}</dd></div><div><dt>${T("मौसम", "Weather")}</dt><dd>${E(o.wx || "–")}${o.temp != null ? " · " + N(o.temp) + "°C" : ""}</dd></div></dl>
      ${lat && lat !== c ? `<p class="fllater">${T("आगामी ३ घण्टा (मोडेल)", "Next 3 hours (model)")}: <b>${T(CAT[lat][0], CAT[lat][1])}</b></p>` : ""}
      ${a.mountain && o.kind === "model" ? `<p class="fllater">${T("हिमाली विमानस्थल: मोडेलले उपत्यकाको हावा र बादल राम्ररी समात्दैन।", "Mountain airstrip: the model does not capture valley wind and cloud well.")}</p>` : ""}
      <p class="flsrc">${src}</p>${o.raw ? `<details class="flraw"><summary>${T("मूल प्रतिवेदन", "Raw report")}</summary><code>${E(o.raw)}</code></details>` : ""}`
      : `<p class="na">${T("अहिले जानकारी ल्याउन सकिएन।", "Could not load data right now.")}</p>`}</article>`; };

  function draw() {
    subs.forEach((f) => { try { f(); } catch (e) {} });
    if (!page) return;
    const kt = AP.find((a) => a.icao === "VNKT"), o = kt && official(kt);
    if (o) { const c = catOf(o), k = CAT[c];
      top.innerHTML = G.viz.answer({ tone: c === "good" ? "calm" : c === "marg" ? "warn" : "bad", word: T(k[0], k[1]),
        say: T("काठमाडौँ विमानस्थल: दृश्यता ", "Kathmandu airport: visibility ") + km(o.vis) + (o.wx ? ", " + E(o.wx) : "") + ".",
        sub: T("यो विमानस्थलकै आधिकारिक मौसम प्रतिवेदन हो। उडान ढिला वा रद्द भएको जानकारी होइन; त्यो एयरलाइन्स र विमानस्थलले मात्र भन्छन्।", "This is the airport's own official weather report. It does not say whether a flight is delayed or cancelled; only the airline and the airport can."),
        source: "METAR VNKT", url: o.url, time: G.npt(o.time) }); }
    else top.innerHTML = `<div class="na">${T("काठमाडौँ विमानस्थलको पछिल्लो आधिकारिक मौसम प्रतिवेदन अहिले उपलब्ध छैन (अढाई घण्टाभन्दा पुरानो वा ल्याउन सकिएन)। तल मोडेलको अनुमान देखाइएको छ।", "Kathmandu airport's latest official weather report is not available right now (older than two and a half hours, or could not be fetched). The model estimate is shown below.")}</div>`;
    grid.innerHTML = (err && !MOD ? `<p class="na">${T("मोडेलको डेटा ल्याउन सकिएन। इन्टरनेट जाँचेर फेरि खोल्नुहोस्।", "Could not load the model data. Check your connection and reopen the page.")}</p>` : "") + AP.map(card).join("");
    /* travel card: airport weather for flying, as a picture or as text */
    const fc = document.getElementById("flcard");
    if (fc && G.travelCard && !fc.dataset.on) { fc.dataset.on = "1";
      const rowsNow = () => AP.map((a, i) => { const ob = official(a) || model(a, i), c = ob ? catOf(ob) : "na"; return { a, ob, c }; });
      const kline = (x) => (x.ob ? T("दृश्यता ", "Visibility ") + km(x.ob.vis) + " · " + (x.ob.kind === "official" ? T("आधिकारिक प्रतिवेदन ", "official report ") + G.npt(x.ob.time).split(" · ").pop() : T("मोडेलको अनुमान", "model estimate")) : T("जानकारी छैन", "no data"));
      const spec = () => { const L = rowsNow(), k0 = L.find((x) => x.a.icao === "VNKT"), kc = k0 ? CAT[k0.c] : CAT.na;
        return { kicker: T("उडानको मौसम जाँच", "FLYING WEATHER CHECK"), date: G.npt(new Date().toISOString()).split(" · ")[0], title: T("विमानस्थलको मौसम", "Airport weather"), sub: T("अहिले उडान योग्य मौसम छ कि छैन: नेपालका १५ विमानस्थल", "Is the weather fit for flying right now: 15 airports in Nepal"),
          banner: { label: T("काठमाडौँ (त्रिभुवन)", "KATHMANDU (TRIBHUVAN)"), value: T(kc[0], kc[1]) + (k0 && k0.ob ? " · " + km(k0.ob.vis) : ""), color: kc[2] },
          rows: L.map((x, i) => ({ time: x.a.iata, name: T(x.a.ne, x.a.en), tag: { text: T(CAT[x.c][0], CAT[x.c][1]), color: CAT[x.c][2] }, note: kline(x), color: CAT[x.c][2], solid: i === L.length - 1 })),
          foot: [{ h: T("उडानको अवस्था", "Flight status"), v: T("गतिसँग छैन। एयरलाइन्स वा विमानस्थलसँग बुझ्नुहोस्।", "Not in Gati. Check with the airline or the airport.") }, { h: T("तहको अर्थ", "What the levels mean"), v: T("मौसमको वर्णन मात्र; एयरलाइन्स वा टावरको निर्णय होइन।", "A description of the weather, not the airline's or the tower's decision.") }, { h: T("आपतकाल", "Emergency"), v: T("प्रहरी १०० · एम्बुलेन्स १०२", "Police 100 · Ambulance 102") }],
          fine: [k0 && k0.ob && k0.ob.kind === "official" ? T("स्रोत: काठमाडौँको आधिकारिक विमानस्थल मौसम प्रतिवेदन (METAR)। अन्य विमानस्थल: Open-Meteo मोडेलको अनुमान, मापन होइन।", "Sources: Kathmandu's official airport weather report (METAR). Other airports: an Open-Meteo model estimate, not a measurement.") : T("काठमाडौँको आधिकारिक प्रतिवेदन अहिले उपलब्ध छैन। सबै विमानस्थल: Open-Meteo मोडेलको अनुमान, मापन होइन।", "Kathmandu's official report is not available right now. All airports: an Open-Meteo model estimate, not a measurement."), T("गतिले आधिकारिक सूचना मात्र फैलाउँछ; आफैँ चेतावनी जारी गर्दैन।", "Gati relays official notices. It does not issue warnings.")] }; };
      const text = () => T("विमानस्थलको मौसम", "Airport weather") + " (" + G.npt(new Date().toISOString()) + "):\n" + rowsNow().map((x) => `• ${T(x.a.ne, x.a.en)}: ${T(CAT[x.c][0], CAT[x.c][1])}, ${kline(x)}`).join("\n") + "\n" + T("उडानको अवस्था एयरलाइन्ससँग बुझ्नुहोस्। काठमाडौँ बाहेक मोडेलको अनुमान हो।", "Check flight status with the airline. Outside Kathmandu these are model estimates.");
      G.travelCard.actions(fc, { spec, text, name: () => "gati-airport-weather.png" }); }
    if (links) links.innerHTML = `<h2 style="margin-top:0">${T("मेरो उडान ढिला वा रद्द छ?", "Is my flight delayed or cancelled?")}</h2>
      <p>${T("गतिले उडानको अवस्था देखाउन सक्दैन: त्रिभुवन विमानस्थलको उडान बोर्ड स्वचालित रूपमा पढ्न मिल्दैन र खुला आधिकारिक फिड छैन। तलका आधिकारिक पृष्ठमा सोझै हेर्नुहोस् वा एयरलाइन्सलाई फोन गर्नुहोस्।", "Gati cannot show flight status: Tribhuvan Airport's flight board cannot be read by a program and there is no open official feed. Check these official pages directly, or call your airline.")}</p>
      <ul class="fll">${[["https://www.tiairport.com.np/", T("त्रिभुवन अन्तर्राष्ट्रिय विमानस्थल: उडान जानकारी", "Tribhuvan International Airport: flight information")], ["https://caanepal.gov.np/", T("नेपाल नागरिक उड्डयन प्राधिकरण (CAAN)", "Civil Aviation Authority of Nepal (CAAN)")], ["https://www.buddhaair.com/", "Buddha Air"], ["https://www.yetiairlines.com/", "Yeti Airlines"], ["https://www.shreeairlines.com/", "Shree Airlines"]].map((l) => `<li><a href="${l[0]}" target="_blank" rel="noopener">${E(l[1])} ↗</a></li>`).join("")}</ul>
      <p class="meta">${T("विमानस्थल वा एयरलाइन्सले खुला फिड दिएपछि गतिले उडानको अवस्था यहीँ देखाउनेछ।", "If the airport or an airline publishes an open feed, Gati will show flight status here.")}</p>`;
  }

  let started = false;
  const load = () => { if (started) return; started = true;
    G.json("data/airports.json").then((d) => { AP = d.airports; draw();
      fetch(LIVE, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => G.json("data/airport-weather.json")).then((m) => { MET = m; draw(); }).catch(() => {});
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${AP.map((a) => a.ll[0]).join(",")}&longitude=${AP.map((a) => a.ll[1]).join(",")}&current=visibility,cloud_cover_low,wind_speed_10m,wind_gusts_10m,weather_code,temperature_2m&hourly=visibility,cloud_cover_low,weather_code,wind_gusts_10m&forecast_hours=4&timezone=Asia%2FKathmandu`)
        .then((r) => (r.ok ? r.json() : Promise.reject())).then((x) => { MOD = Array.isArray(x) ? x : [x]; modAt = Date.now(); draw(); }).catch(() => { err = true; draw(); });
    });
  };
  /* shared with the home page card and the Map's airport layer */
  G.airwx = { CAT, km, load, on: (f) => subs.push(f), all: () => AP.map((a, i) => { const o = official(a) || model(a, i); return { a, o, cat: o ? catOf(o) : "na" }; }) };
  if (page) load();
  if (G.onLang) G.onLang(draw);
})();
