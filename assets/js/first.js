/* Home, first screen: the two questions people open Gati with.
   1. "What affects my district right now?": one line each for alerts, DHM's weather warning, roads and rivers,
      every line with its agency and time. A line with nothing to report says so.
   2. "Is the road open?": from and to, answered on the route page.
   The rest of the home page is folded under "See the whole country" until the visitor opens it. */
(async function () {
  const G = window.Gati, box = document.getElementById("first"), main = document.getElementById("main"), more = document.getElementById("hmore");
  if (!G || !box) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root, N = (x) => G.num(String(x));
  const MKEY = "gati-home-more";
  const open = () => { try { return localStorage.getItem(MKEY) === "1"; } catch (e) { return false; } };
  function fold() {
    const o = open() || (location.hash.length > 1 && !!document.querySelector(location.hash.replace(/[^#\w-]/g, "")) && location.hash !== "#first");
    main.classList.toggle("calm", !o);
    if (more) more.innerHTML = `<button type="button" class="hmorebtn" aria-expanded="${o}">${o ? T("कम देखाउनुहोस्", "Show less") : T("देशभरको अवस्था हेर्नुहोस्: नक्सा, सबै सूचना, मौसम", "See the whole country: map, all alerts, weather")}<span aria-hidden="true">${o ? " ▴" : " ▾"}</span></button>`;
    const b = more && more.querySelector("button");
    if (b) b.onclick = () => { try { if (o) localStorage.removeItem(MKEY); else localStorage.setItem(MKEY, "1"); } catch (e) {} if (location.hash && location.hash !== "#first") history.replaceState(null, "", location.pathname + location.search); fold(); if (!o) { dispatchEvent(new Event("resize")); if (G.pulse) G.pulse.track("more_open"); } };
  }
  fold(); addEventListener("hashchange", fold);

  const [AL, WX, RD, RV, D] = await Promise.all(["data/alerts.json", "data/weather.json", "data/roads.json", "data/rivers.json", "data/districts.json"].map((p) => G.json(p).catch(() => null)));
  const GOOD = "#1e8e3e", WARN = "#B26A00", BAD = "#C5221F", GREY = "#5f6670";
  const SEVC = { Extreme: "#8E1B14", Severe: BAD, Moderate: "#E8590C", Minor: WARN };
  const day = (s) => String(s || "").split(/\s*\(|,/)[0];
  function rows(code) {
    const now = Date.now(), d = D.find((x) => x.code === code), nm = esc(T(d.ne, d.en));
    const act = (AL ? AL.alerts : []).filter((a) => (a.trust === "Official" || a.trust === "Verified") && Date.parse(a.expires) > now && !a.supersededBy && a.districts.includes(code));
    const who = (a) => esc(a.info[G.lang].senderName.split(" — ")[0]) + " · " + G.npt(a.info.en.params["gati:sourceTime"] || a.sent);
    const top = (l) => l.slice().sort((a, b) => Object.keys(SEVC).indexOf(a.severity) - Object.keys(SEVC).indexOf(b.severity))[0];
    const out = [];
    /* alerts (everything except road and weather notices, which have their own lines) */
    const al = act.filter((a) => a.hazard !== "road" && a.hazard !== "weather"), a0 = top(al);
    out.push(a0 ? { href: R + (al.length > 1 ? "affected/" : "alerts/" + a0.identifier + "/"), c: SEVC[a0.severity] || WARN, k: T("विपद् सूचना", "Hazard alerts"), v: esc(a0.info[G.lang].headline) + (al.length > 1 ? " +" + N(al.length - 1) : ""), n: who(a0) }
      : { href: R + "alerts/", c: GOOD, k: T("विपद् सूचना", "Hazard alerts"), v: T("बाढी, पहिरो वा अन्य विपद्को चालु सूचना छैन", "No active flood, landslide or other hazard alert"), n: T("आधिकारिक निकायबाट", "from official agencies") + (AL && AL.generated ? " · " + T("जाँचिएको ", "checked ") + G.npt(AL.generated) : "") });
    /* DHM weather warning today */
    const b5 = WX && WX.bulletin5, today = new Date(now + G.tzMs).toISOString().slice(0, 10), d0 = b5 && b5.days.find((x) => x.ad === today);
    const wxa = top(act.filter((a) => a.hazard === "weather"));
    const lv = d0 && d0.level !== "green" && (!d0.provinces || d0.provinces.includes(code.slice(0, 4))) ? d0.level : "green";
    const LVW = { yellow: ["अद्यावधिक रहनुहोस्", "Be updated", WARN], orange: ["सतर्क रहनुहोस्", "Be prepared", "#E8590C"], red: ["कारबाही गर्नुहोस्", "Take action", BAD] };
    if (wxa) out.push({ href: R + "alerts/" + wxa.identifier + "/", c: SEVC[wxa.severity] || WARN, k: T("मौसम चेतावनी", "Weather warning"), v: esc(wxa.info[G.lang].headline), n: who(wxa) });
    else if (!d0) out.push({ href: R + "weather/", c: GREY, k: T("मौसम चेतावनी", "Weather warning"), v: T("आजको DHM बुलेटिन गतिमा छैन", "DHM's bulletin for today is not in Gati"), n: T("DHM मा हेर्नुहोस्", "check DHM") });
    else out.push({ href: R + "weather/#wxdist", c: lv === "green" ? GOOD : LVW[lv][2], k: T("मौसम चेतावनी", "Weather warning"), v: lv === "green" ? T("आज चेतावनी जारी छैन", "No warning issued today") : T(LVW[lv][0], LVW[lv][1]), n: "DHM · " + T("जारी ", "issued ") + G.npt(b5.issued) });
    /* roads: a police notice naming the district, else the national picture */
    const rd = top(act.filter((a) => a.hazard === "road")), cnt = (st) => (RD && RD.routes ? RD.routes.filter((r) => r.status === st).length : 0);
    if (rd) out.push({ href: R + "alerts/" + rd.identifier + "/", c: BAD, k: T("सडक", "Roads"), v: esc(rd.info[G.lang].headline), n: who(rd) });
    else out.push({ href: R + "roads/", c: GOOD, k: T("सडक", "Roads"), v: T(`${nm} तोकिएको सडक सूचना छैन`, `No road notice names ${nm}`), n: RD ? T(`मुख्य राजमार्ग: ${N(cnt("blocked"))} बन्द, ${N(cnt("oneway"))} एकतर्फी`, `Main highways: ${cnt("blocked")} blocked, ${cnt("oneway")} one-way`) + " · " + esc(day(T(RD.as_of_ne, RD.as_of_en))) : "" });
    /* rivers: DHM gauges in the district */
    const gs = RV && RV.gauges ? RV.gauges.filter((g) => g.district === d.id) : [];
    if (gs.length) { const g = gs.slice().sort((a, b) => b.level / b.warning - a.level / a.warning)[0], hi = g.level >= g.danger ? 2 : g.level >= g.warning ? 1 : 0;
      out.push({ href: R + "rivers/", c: [GOOD, WARN, BAD][hi], k: T("नदी", "Rivers"), v: esc(T(g.ne, g.en)) + ": " + [T("चेतावनी तहमुनि", "below warning level"), T("चेतावनी तहमाथि", "above warning level"), T("खतरा तहमाथि", "above danger level")][hi], n: "DHM · " + esc(day(T(RV.as_of_ne, RV.as_of_en))) }); }
    else out.push({ href: R + "rivers/", c: GREY, k: T("नदी", "Rivers"), v: T("यो जिल्लाको DHM मापन केन्द्र गतिमा छैन", "No DHM gauge for this district in Gati"), n: T("सबै नदी हेर्नुहोस्", "see all rivers") });
    return { nm, out };
  }
  /* One-tap share: the four lines as a picture, each with its agency and time, so the official notice travels with its source. */
  const un = (h) => { const t = document.createElement("textarea"); t.innerHTML = h; return t.value; };
  const img = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  async function shareCard(r, btn) {
    const W = 1080, P = 64, c = document.createElement("canvas"), x = c.getContext("2d"), FF = getComputedStyle(document.body).fontFamily || "sans-serif";
    const font = (px, w = 400) => { x.font = `${w} ${px}px ${FF}`; };
    const wrap = (txt, px, w, max) => { font(px, w); const out = []; let line = ""; for (const word of String(txt).split(/\s+/)) { const t = line ? line + " " + word : word; if (x.measureText(t).width > max && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out.slice(0, 4); };
    try { await document.fonts.ready; } catch (e) {}
    const inner = W - P * 2 - 76, blocks = r.out.map((o) => ({ o, v: wrap(un(o.v), 40, 700, inner), n: wrap(un(o.n), 28, 400, inner) }));
    const H = 330 + blocks.reduce((h, b) => h + 70 + b.v.length * 52 + b.n.length * 38 + 26, 0) + 190;
    c.width = W; c.height = H;
    x.fillStyle = "#FFF8F4"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#0B1424"; x.fillRect(0, 0, W, 290);
    const logo = await img(R + "assets/img/brand/logo-h-white.png"); if (logo) x.drawImage(logo, P, 44, 96 * logo.width / logo.height, 96);
    x.fillStyle = "#fff"; x.textBaseline = "alphabetic"; font(58, 700); x.fillText("📍 " + un(r.nm), P, 216);
    font(28); x.fillStyle = "#C9D3DF"; x.fillText(G.npt(new Date().toISOString()), P, 262);
    let y = 330;
    for (const b of blocks) { const h = 70 + b.v.length * 52 + b.n.length * 38;
      x.fillStyle = "#fff"; x.strokeStyle = "#E6DAD3"; x.lineWidth = 2; x.beginPath(); x.roundRect(P, y, W - P * 2, h, 20); x.fill(); x.stroke();
      x.fillStyle = b.o.c; x.beginPath(); x.roundRect(P + 18, y + 18, 10, h - 36, 5); x.fill();
      let ty = y + 46; x.fillStyle = "#5B6470"; font(28); x.fillText(un(b.o.k), P + 44, ty);
      x.fillStyle = "#14202B"; for (const l of b.v) { ty += 52; font(40, 700); x.fillText(l, P + 44, ty); }
      x.fillStyle = "#5B6470"; for (const l of b.n) { ty += 38; font(28); x.fillText(l, P + 44, ty); }
      y += h + 26; }
    x.fillStyle = "#5B6470"; font(28); wrap(T("गतिले आधिकारिक निकायको सूचना मात्र फैलाउँछ; आफैँ चेतावनी जारी गर्दैन। आपतकालमा १००, १०१, १०२ वा १२३४।", "Gati relays official notices; it does not issue warnings. In an emergency call 100, 101, 102 or 1234."), 28, 400, W - P * 2).forEach((l, i) => x.fillText(l, P, y + 36 + i * 38));
    x.fillStyle = "#E2362B"; font(40, 700); x.fillText("gatialerts.com", P, H - 48);
    const blob = await new Promise((res) => c.toBlob(res, "image/png")); if (!blob) return;
    const name = "gati-" + (G.district.get() || "district").toLowerCase() + ".png", file = new File([blob], name, { type: "image/png" });
    const text = `${un(r.nm)}: ${T("अहिलेको आधिकारिक अवस्था", "official status right now")} · gatialerts.com`;
    if (G.pulse) G.pulse.track("share");
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (btn) { const old = btn.textContent; btn.textContent = T("तस्बिर डाउनलोड भयो", "Picture downloaded"); setTimeout(() => { btn.textContent = old; }, 2500); }
  }
  function draw() {
    const code = G.district.get(), ok = code && D && D.find((x) => x.code === code);
    let mine;
    if (!D) mine = `<div class="na">${T("डेटा लोड भएन।", "Could not load the data.")}</div>`;
    else if (!ok) mine = `<p class="fqlead">${T("आफ्नो जिल्ला छान्नुहोस्। सूचना, मौसम चेतावनी, सडक र नदी एकै ठाउँमा देखिन्छ।", "Choose your district to see alerts, weather warning, roads and rivers in one place.")}</p><button type="button" class="fqpick" id="fqpick">📍 ${T("मेरो जिल्ला छान्नुहोस्", "Choose my district")}</button>`;
    else { const r = rows(code);
      mine = `<p class="fqwho"><b>📍 ${r.nm}</b><button type="button" class="fqchg" id="fqpick">${T("फेर्नुहोस्", "Change")}</button></p>
        <ul class="fqrows">${r.out.map((x) => `<li><a class="fqrow fqbtn" href="${x.href}" style="--c:${x.c}"><i aria-hidden="true"></i><span class="fqk">${x.k}</span><b>${x.v}</b><small>${x.n}</small></a></li>`).join("")}</ul>
        <p class="fqmore"><button type="button" class="fqshare" id="fqshare">${T("यो अवस्था सेयर गर्नुहोस्", "Share this status")}</button><a class="fqlink" href="${R}affected/">${T("पूरा जाँच: के म प्रभावित छु?", "Full check: Am I affected?")} →</a></p>`; }
    const NODES = RD && RD.nodes ? Object.entries(RD.nodes).map(([id, n]) => [id, T(n.ne, n.en)]).sort((a, b) => a[1].localeCompare(b[1], G.lang)) : [];
    let rf = "ktm", rt = "pokhara"; try { rf = localStorage.getItem("gati-rfrom") || rf; rt = localStorage.getItem("gati-rto") || rt; } catch (e) {}
    const opts = (sel) => NODES.map(([id, n]) => `<option value="${id}"${id === sel ? " selected" : ""}>${esc(n)}</option>`).join("");
    const route = NODES.length ? `<form class="fqroute" id="fqroute" action="${R}route/" method="get"><label><span>${T("कहाँबाट", "From")}</span><select name="from">${opts(rf)}</select></label><label><span>${T("कहाँसम्म", "To")}</span><select name="to">${opts(rt)}</select></label><button type="submit" class="fqgo">${T("बाटो जाँच्नुहोस्", "Check the road")}</button></form><p class="meta fqsrc">${T("नेपाल प्रहरी र सडक विभागको सूचनाबाट", "From Nepal Police and Department of Roads notices")} · ${esc(day(T(RD.as_of_ne, RD.as_of_en)))}</p>` : `<p><a class="fqlink" href="${R}route/">${T("बाटो जाँच्नुहोस्", "Check the road")} →</a></p>`;
    box.innerHTML = `<section class="card fq" aria-labelledby="fqh1"><h2 id="fqh1">${T("मेरो जिल्लामा अहिले के छ?", "What affects my district right now?")}</h2>${mine}</section>
      <section class="card fq" aria-labelledby="fqh2"><h2 id="fqh2">${T("बाटो खुला छ?", "Is the road open?")}</h2>${route}</section>`;
    const pk = document.getElementById("fqpick"); if (pk) pk.onclick = () => G.district.open(() => { if (G.pulse) G.pulse.track("district_set"); draw(); });
    const sh = document.getElementById("fqshare"); if (sh && ok) sh.onclick = () => shareCard(rows(code), sh);
    const rf2 = document.getElementById("fqroute"); if (rf2) rf2.addEventListener("submit", () => { if (G.pulse) G.pulse.track("route_check"); });
    fold();
  }
  draw(); G.onLang(draw); addEventListener("gati:district", draw);
})();
