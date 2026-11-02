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
    fx.innerHTML = (S.phase === "night" ? NIGHT : "") + (S.wx === "rain" ? '<i class="skyrain"></i>' : S.wx === "fog" ? '<i class="skyfog"></i>' : "");
  }
  function hosts() { return [document.querySelector("header.top"), document.querySelector("#today .td-wx"), document.getElementById("wx5")].filter(Boolean); }
  function apply() {
    const f = Q.get("sky"); S.phase = PH.includes(f) ? f : phaseOf(nptHour());
    H.dataset.sky = S.on ? S.phase : "off";
    hosts().forEach(host);
  }
  G.sky = { state: S, apply };
  apply();
  /* the weather card is drawn later and redrawn on language change */
  const mo = new MutationObserver(() => { const h = hosts(); if (h.some((e) => !e.querySelector(":scope > .skyfx") === S.on)) apply(); });
  mo.observe(document.body, { childList: true, subtree: true });
  setInterval(apply, 5 * 6e4);
})();
