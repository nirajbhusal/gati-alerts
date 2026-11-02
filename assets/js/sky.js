/* Ambient sky: a subtle time-of-day look (NPT) in the header and the weather card only, never behind alert text.
   dawn 05:00-07:00, day 07:00-17:00, dusk 17:00-19:00, night 19:00-05:00 (Nepal time, UTC+5:45).
   Preview: ?sky=dawn|day|dusk|night forces the phase. Kept in the code on purpose for previews. */
(function () {
  const G = window.Gati; if (!G || G.sky) return;
  const Q = new URLSearchParams(location.search), H = document.documentElement;
  const nptHour = () => { const t = new Date(Date.now() + 345 * 6e4); return t.getUTCHours() + t.getUTCMinutes() / 60; };
  const phaseOf = (h) => (h >= 5 && h < 7 ? "dawn" : h >= 7 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night");
  const PH = ["dawn", "day", "dusk", "night"];
  const S = { phase: "day", wx: "clear", on: true };
  /* Night: a faint crescent and a few stars, top right only */
  const NIGHT = '<svg class="skyns" viewBox="0 0 160 48" preserveAspectRatio="xMaxYMin meet" aria-hidden="true"><path class="skymoon" d="M146 9a9 9 0 1 0 6 15.6A7.2 7.2 0 0 1 146 9z"/><g class="skystar"><circle cx="20" cy="12" r=".9"/><circle cx="58" cy="30" r=".7"/><circle cx="92" cy="9" r=".8"/><circle cx="118" cy="34" r=".6"/><circle cx="130" cy="16" r=".7"/></g></svg>';
  function host(el) {
    if (!el) return; el.classList.add("skyhost");
    let fx = el.querySelector(":scope > .skyfx");
    if (!S.on) { if (fx) fx.remove(); return; }
    if (!fx) { fx = document.createElement("div"); fx.className = "skyfx"; fx.setAttribute("aria-hidden", "true"); el.prepend(fx); }
    const k = S.phase + "|" + S.wx; if (fx.dataset.k === k) return; fx.dataset.k = k;
    fx.className = `skyfx sky-${S.phase} wx-${S.wx}`;
    fx.innerHTML = (S.phase === "night" ? NIGHT : "") + (S.wx === "rain" ? '<i class="skyrain"></i>' : S.wx === "fog" ? '<i class="skyfog"></i>' : S.wx === "cloudy" ? '<i class="skycloud"></i>' : "");
  }
  /* Caption on the weather card: mood, source and time, e.g. "आकाशको झल्को: बदली · DHM, बिहान ८:००". Gati relays DHM, it issues nothing. */
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  const WXL = { clear: ["सफा", "clear"], cloudy: ["बदली", "cloudy"], rain: ["वर्षा", "rain"], fog: ["हुस्सु, कुहिरो", "mist or fog"] };
  function hm(iso) { const t = new Date(Date.parse(iso) + 345 * 6e4), h = t.getUTCHours(), m = String(t.getUTCMinutes()).padStart(2, "0"), h12 = h % 12 || 12;
    return G.lang === "ne" ? `${h < 4 ? "राति" : h < 12 ? "बिहान" : h < 17 ? "दिउँसो" : h < 20 ? "साँझ" : "राति"} ${G.num(h12 + ":" + m)}` : `${h12}:${m} ${h < 12 ? "AM" : "PM"}`; }
  function caption(el) {
    let c = el.querySelector(":scope > .skycap");
    if (!S.on || el.matches("header.top")) { if (c) c.remove(); return; }
    const w = WXL[S.wx] || WXL.clear, src = S.src;
    const who = !src ? T("DHM बुलेटिन उपलब्ध छैन", "DHM bulletin not available") : src.k === "preview" ? T("पूर्वावलोकन", "Preview") : `DHM${src.k === "observed" ? T(" अवलोकन", " observation") : ""}, ${hm(src.t)}`;
    const dn = S.dist ? T(S.dist.ne, S.dist.en) : "";
    const txt = `${T("आकाशको झल्को", "Sky look")}: ${T(w[0], w[1])}${dn ? " · " + dn : ""} · ${who}`;
    if (!c) { c = document.createElement(el.matches(".tdrow") ? "span" : "p"); c.className = "skycap"; el.appendChild(c); }
    if (c.textContent !== txt) { c.textContent = txt; c.title = T("यो रङ DHM को आधिकारिक मौसम र नेपाल समयअनुसार मात्र हो; सूचना होइन।", "This tint follows DHM's official weather and Nepal time only; it is not an alert."); }
  }
  function hosts() { return [document.querySelector("header.top"), document.querySelector("#today .td-wx"), document.getElementById("wx5")].filter(Boolean); }
  let apply = function () {
    const f = Q.get("sky"); S.phase = PH.includes(f) ? f : phaseOf(nptHour());
    H.dataset.sky = S.on ? S.phase : "off"; H.dataset.skyWx = S.on ? S.wx : "";
    hosts().forEach((e) => { host(e); caption(e); });
  };
  /* Weather mood from the official DHM data in data/weather.json, for my district (gati-district) or Kathmandu.
     Today's 5-day bulletin text is split into clauses; a clause counts if it names the district or its province,
     the district's terrain (Terai, valleys, hills/mountains) or no place at all. Isolated rain ("one or two places")
     that does not name the district gives a cloudy haze. Fog/mist counts only at night and in the morning (before 11).
     The DHM observation (note_en, last 12 h) counts when it names the district. Priority: rain > fog > cloudy > clear.
     Preview: ?wx=clear|cloudy|rain|fog. */
  const WXS = ["clear", "cloudy", "rain", "fog"];
  const TERAI = "jhapa morang sunsari udayapur saptari siraha dhanusha mahottari sarlahi rautahat bara parsa chitwan nawalparasi-west rupandehi kapilbastu dang banke bardiya kailali kanchanpur".split(" ");
  const VALLEY = "kathmandu lalitpur bhaktapur kaski surkhet dang chitwan".split(" ");
  const PROV = { koshi: /koshi/, madhesh: /madhesh/, bagmati: /bagmati/, gandaki: /gandaki/, lumbini: /lumbini/, karnali: /karnali/, sudurpaschim: /sudurpa(s|sh)c?him|far.?west/ };
  function moodOf(WX, D, h) {
    const b5 = WX && WX.bulletin5; if (!b5 || !b5.days || !b5.days.length) return null;
    const ad = new Date(Date.now() + 345 * 6e4).toISOString().slice(0, 10), day = b5.days.find((d) => d.ad === ad);
    if (!day) return null;
    const name = D.en.toLowerCase(), terai = TERAI.includes(D.id), valley = VALLEY.includes(D.id), morn = h < 11 || h >= 19;
    const rank = { clear: 0, cloudy: 1, fog: 2, rain: 3 }; let best = "clear", src = { t: b5.issued, k: "bulletin" };
    const up = (m, s2) => { if (rank[m] > rank[best]) { best = m; if (s2) src = s2; } };
    String(day.en || "").toLowerCase().split(/[;.]/).forEach((c) => {
      if (!c.trim()) return;
      const named = c.includes(name) || (PROV[D.province] && PROV[D.province].test(c));
      const geo = /terai|plain|valley|gorge|hill|mountain|himalaya|province|district/.test(c);
      const mine = named || !geo || (/terai|plain/.test(c) && terai) || (/valley|gorge/.test(c) && valley) || (/hill|mountain|himalaya/.test(c) && !terai);
      if (!mine) return;
      const iso = /one or two places|a few places|isolated|some places/.test(c) && !named;
      if (/rain|shower|drizzle|thunder/.test(c)) up(iso ? "cloudy" : "rain");
      if (/fog|mist/.test(c) && (morn || !/night|morning/.test(c))) up("fog");
      if (/cloud|overcast|partly|snow/.test(c)) up("cloudy");
    });
    const ob = WX.observed, note = String(WX.note_en || "").toLowerCase();
    if (ob && ob.time && Date.now() - Date.parse(ob.time) < 12 * 36e5) {
      const m = note.match(/past 12 hours[^.]*/); if (m && m[0].includes(name) && /rain/.test(m[0])) up("rain", { t: ob.time, k: "observed" });
    }
    return { wx: best, src };
  }
  let DATA = null;
  function mood() {
    const f = Q.get("wx"); if (WXS.includes(f)) { S.wx = f; S.src = { t: new Date().toISOString(), k: "preview" }; return; }
    if (!DATA) { S.wx = "clear"; S.src = null; return; }
    const code = (G.district && G.district.get && G.district.get()) || "", D = DATA.D.find((d) => d.code === code) || DATA.D.find((d) => d.id === "kathmandu");
    S.dist = D; const r = D ? moodOf(DATA.WX, D, nptHour()) : null; S.wx = r ? r.wx : "clear"; S.src = r ? r.src : null;
  }
  /* Safety: off when the user turned it off (localStorage gati-sky = "off", toggle in Profile and settings, Display),
     and automatically off while a Severe or Extreme alert is active for my district (any district when none is chosen,
     and alerts with no district list), or today's DHM bulletin level is red, so the alert stands out.
     Preview: ?redalert=1 simulates that alert, ?redalert=0 ignores it. Reduced motion: CSS keeps every layer static. */
  function redAlert() {
    const f = Q.get("redalert"); if (f === "1") return true; if (f === "0" || !DATA) return false;
    const now = Date.now(), code = (G.district && G.district.get && G.district.get()) || "";
    const al = (DATA.AL && DATA.AL.alerts) || [];
    const hit = al.some((a) => (a.severity === "Severe" || a.severity === "Extreme") && !a.expired && !a.supersededBy && Date.parse(a.expires) > now
      && (!code || !(a.districts && a.districts.length) || a.districts.includes(code)));
    const b5 = DATA.WX && DATA.WX.bulletin5, ad = new Date(now + 345 * 6e4).toISOString().slice(0, 10);
    const d = b5 && b5.days && b5.days.find((x) => x.ad === ad);
    return hit || !!(d && d.level === "red");
  }
  const apply0 = apply;
  apply = () => { S.alert = redAlert(); S.user = G.skyOn(); S.on = S.user && !S.alert && Q.get("sky") !== "off"; mood(); apply0(); };
  G.sky = { state: S, apply: () => apply() };
  apply();
  const get = (p) => G.json(p).catch(() => null);
  Promise.all([get("data/weather.json"), get("data/districts.json"), get("data/alerts.json")]).then(([WX, D, AL]) => { DATA = { WX, D: D || [], AL }; apply(); });
  addEventListener("gati:district", () => apply());
  G.listeners && G.listeners.push(() => setTimeout(() => apply(), 0));
  /* the weather card is drawn later and redrawn on language change */
  const mo = new MutationObserver(() => { if (hosts().some((e) => !e.querySelector(":scope > .skyfx") === S.on || (S.on && !e.matches("header.top") && !e.querySelector(":scope > .skycap")))) apply(); });
  mo.observe(document.body, { childList: true, subtree: true });
  setInterval(() => apply(), 5 * 6e4);
})();
