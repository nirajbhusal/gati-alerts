/* Weather + AQI model data, fetched live in the browser (Open-Meteo, CORS-enabled, no key).
   Order of trust on this page: DHM official first (above), then these models, each labelled "Model". */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc;
  const geo = await G.json("data/districts.geojson").catch(() => null);
  function place() {
    const c = G.district.get(), f = geo && c && geo.features.find((x) => x.id === c);
    if (!f) return { lat: 27.7172, lon: 85.324, ne: "काठमाडौँ", en: "Kathmandu", fallback: true };
    let x0 = 999, x1 = -999, y0 = 999, y1 = -999; const P = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    P.forEach((p) => p[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
    return { lat: +((y0 + y1) / 2).toFixed(3), lon: +((x0 + x1) / 2).toFixed(3), ne: f.properties.ne, en: f.properties.en };
  }
  const WMO = (c) => c === 0 ? ["☀️", "सफा", "Clear"] : c <= 2 ? ["🌤️", "आंशिक बदली", "Partly cloudy"] : c === 3 ? ["☁️", "बदली", "Overcast"] : c <= 48 ? ["🌫️", "कुहिरो", "Fog"] : c <= 57 ? ["🌦️", "सिमसिम पानी", "Drizzle"] : c <= 67 ? ["🌧️", "वर्षा", "Rain"] : c <= 77 ? ["🌨️", "हिमपात", "Snow"] : c <= 82 ? ["🌧️", "झरी", "Showers"] : c <= 86 ? ["🌨️", "हिम झरी", "Snow showers"] : ["⛈️", "चट्याङसहित वर्षा", "Thunderstorm"];
  const BAND = [[50, "#00a651", "राम्रो", "Good"], [100, "#f3d000", "मध्यम", "Moderate"], [150, "#f7941d", "संवेदनशीलका लागि अस्वस्थ", "Unhealthy for sensitive groups"], [200, "#e2231a", "अस्वस्थ", "Unhealthy"], [300, "#8f3f97", "धेरै अस्वस्थ", "Very unhealthy"], [1e9, "#7e0023", "खतरनाक", "Hazardous"]];
  const model = `<span class="trust t-Model">🧮 ${T("मोडेल", "Model")}</span>`;
  let fc = null, aq = null, at = null;
  async function load() {
    const p = place(); at = p;
    const q = `latitude=${p.lat}&longitude=${p.lon}&timezone=Asia%2FKathmandu`;
    [fc, aq] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=3`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2`).then((r) => r.ok ? r.json() : null).catch(() => null)]);
    draw();
  }
  const tstr = (s) => G.npt(s + ":00+05:45");
  function draw() {
    const p = at, nm = esc(T(p.ne, p.en)) + (p.fallback ? ` <span class="meta">(${T("जिल्ला छानिएको छैन", "no district chosen")})</span>` : "");
    const m = document.getElementById("wxmodel");
    if (!fc) m.innerHTML = `<h2>${T("मोडेल पूर्वानुमान", "Model forecast")}</h2><div class="na"><strong>${T("उपलब्ध छैन", "Not available")}</strong>. ${T("Open-Meteo सँग जोडिन सकिएन।", "Could not reach Open-Meteo.")} ${T("अन्तिम प्रयास", "Last tried")}: ${G.npt(new Date().toISOString())}</div>`;
    else {
      const d = fc.daily, c = fc.current, w = WMO(c.weather_code), lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
      m.innerHTML = `<div class="wxmh"><h2>${T("मोडेल पूर्वानुमान", "Model forecast")} · 📍 ${nm}</h2>${model}</div>
        <div class="wxnow"><span class="wxbig">${w[0]}</span><div><b class="wxt">${G.num(String(Math.round(c.temperature_2m)))}°</b><span>${T(w[1], w[2])}</span></div>
          <div class="wxkv"><span>💧 ${G.num(String(c.relative_humidity_2m))}%</span><span>🌬 ${G.num(String(Math.round(c.wind_speed_10m)))} km/h</span></div></div>
        <div class="wxdays">${d.time.map((t, k) => { const ww = WMO(d.weather_code[k]), a = ((d.temperature_2m_min[k] - lo) / (hi - lo || 1)) * 100, b = ((d.temperature_2m_max[k] - lo) / (hi - lo || 1)) * 100;
          const dt = new Date(t + "T00:00:00Z"); return `<div class="wxday"><b>${k === 0 ? T("आज", "Today") : T(BS.WN[dt.getUTCDay()], BS.WE[dt.getUTCDay()])}</b><span class="wxic">${ww[0]}</span><span class="meta">${T(ww[1], ww[2])}</span>
          <div class="wxbar"><i style="left:${a}%;right:${100 - b}%"></i></div><span class="wxrng">${G.num(String(Math.round(d.temperature_2m_min[k])))}° / <b>${G.num(String(Math.round(d.temperature_2m_max[k])))}°</b></span>
          <span class="wxrain">☔ ${G.num(String(d.precipitation_sum[k]))} mm${d.precipitation_probability_max ? ` · ${G.num(String(d.precipitation_probability_max[k]))}%` : ""}</span></div>`; }).join("")}</div>
        <p class="meta">${T("स्रोत", "Source")}: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (ECMWF IFS, NOAA GFS ${T("आदि मोडेलको उत्कृष्ट मिश्रण", "and other models, best match")}) · ${T("मोडेल समय", "Model time")}: ${tstr(c.time)} · ${T("यो आधिकारिक पूर्वानुमान होइन; DHM को पूर्वानुमान माथि छ।", "Not an official forecast; DHM's is above.")} · CC BY 4.0</p>`;
    }
    const A = document.getElementById("air");
    const extra = `<ul class="aqsrc"><li><b>${T("वातावरण विभाग (pollution.gov.np)", "Department of Environment (pollution.gov.np)")}</b>: ${T("आधिकारिक, तर गतिको सर्भरबाट खुलेन", "official, but unreachable from Gati's server")}</li>
      <li><b>${T("अमेरिकी दूतावास काठमाडौँ मनिटर (OpenAQ)", "US Embassy Kathmandu monitor (via OpenAQ)")}</b>: ${T("OpenAQ v3 लाई API कुञ्जी चाहिन्छ; अहिले जोडिएको छैन", "OpenAQ v3 needs an API key; not connected yet")}</li></ul>`;
    if (!aq) { A.innerHTML = `<h2>${T("हावाको गुणस्तर", "Air quality")}</h2><div class="na"><strong>${T("उपलब्ध छैन", "Not available")}</strong></div>${extra}`; return; }
    const v = aq.current.us_aqi, bd = BAND.find((b) => v <= b[0]), hrs = aq.hourly.us_aqi.slice(0, 36), mx = Math.max(...hrs.filter((x) => x != null), 50);
    A.innerHTML = `<div class="wxmh"><h2>${T("हावाको गुणस्तर", "Air quality")} · 📍 ${nm}</h2>${model}</div>
      <div class="aqnow"><div class="aqgauge" style="--v:${Math.min(v, 300) / 300};--c:${bd[1]}"><b>${G.num(String(v))}</b><span>US AQI</span></div>
        <div><p class="aqcat" style="color:${bd[1]}">${T(bd[2], bd[3])}</p><p class="kv"><span>PM2.5 <b>${G.num(String(aq.current.pm2_5))}</b> µg/m³</span><span>PM10 <b>${G.num(String(aq.current.pm10))}</b> µg/m³</span></p></div></div>
      <div class="aqspark" aria-label="${T("आगामी ३६ घण्टाको AQI", "AQI next 36 hours")}">${hrs.map((x, k) => { const b2 = BAND.find((b) => (x || 0) <= b[0]); return `<i style="height:${((x || 0) / mx) * 100}%;background:${b2[1]}" title="${k} h: ${x}"></i>`; }).join("")}</div><p class="meta">${T("आगामी ३६ घण्टा (मोडेल)", "Next 36 hours (model)")}</p>
      <p class="meta">${T("स्रोत", "Source")}: <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">Open-Meteo Air Quality</a> (Copernicus CAMS ${T("मोडेल, करिब ११ कि.मि. ग्रिड", "model, about 11 km grid")}) · ${T("मोडेल समय", "Model time")}: ${tstr(aq.current.time)} · ${T("मापन केन्द्रको पढाइ होइन।", "Not a station reading.")}</p>${extra}`;
  }
  await load(); G.onLang(draw);
  const md = document.getElementById("mydist"); if (md) md.addEventListener("click", () => setTimeout(() => { const o = G.district.get(); const iv = setInterval(() => { if (G.district.get() !== o) { clearInterval(iv); load(); } }, 500); setTimeout(() => clearInterval(iv), 60000); }, 0));
})();
