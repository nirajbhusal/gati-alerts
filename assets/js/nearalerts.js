/* Alerts page: "Alerts near me". The reader's district first, then the districts next to it, then notices for
   the whole country. Only active Official alerts Gati already relays; nothing is inferred. A district with no
   alert is never called safe. The district is the one saved on this device; no location is read here. */
(function () {
  const G = window.Gati, box = document.getElementById("nearal"); if (!G || !box) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (v) => G.num(String(v)), R = G.root;
  const RK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };
  const live = (a) => a.trust === "Official" && !a.expired && !a.supersededBy && Date.parse(a.expires || "2999-01-01") > Date.now();
  const km = (a, b) => { const r = Math.PI / 180, x = (b[0] - a[0]) * r * Math.cos(((a[1] + b[1]) / 2) * r), y = (b[1] - a[1]) * r; return Math.sqrt(x * x + y * y) * 6371; };
  /* centre of a district: the middle of its outline's bounding box, enough to rank neighbours */
  const centre = (g) => { let x0 = 999, x1 = -999, y0 = 999, y1 = -999; const walk = (c) => { if (typeof c[0] === "number") { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(walk); }; walk(g.coordinates); return [(x0 + x1) / 2, (y0 + y1) / 2]; };
  let AL = null, D = {};
  const row = (a, where) => { const i = a.info[G.lang] || a.info.ne || a.info.en, sev = G.SEV[a.severity] ? a.severity : "Unknown";
    return `<li class="narow" style="--sc:${G.SEVCOLOR[sev] || G.SEVCOLOR.Unknown}"><div class="nahead">${G.sevChip(sev)}${where ? `<span class="nawhere">${where}</span>` : ""}</div>
      <a class="nabtn-h" href="#${encodeURIComponent(a.identifier)}">${E(G.headline ? G.headline(a, i) : i.headline)}</a>
      ${i.instruction ? `<p class="nado"><b>${T("के गर्ने", "What to do")}:</b> ${E(i.instruction)}</p>` : ""}
      <p class="meta">${G.trustChip(a.trust)} ${E(G.agencyOf ? G.agencyOf(a) : a.sender)} · ${G.npt(a.sent)}</p></li>`; };
  const sort = (l) => l.sort((a, b) => (RK[b.a.severity] || 0) - (RK[a.a.severity] || 0) || a.km - b.km);
  function draw() {
    if (!AL) return; const me = G.district.get(), my = D[me], act = AL.filter(live);
    const head = `<div class="nahd"><h2>${T("मेरो नजिकका सूचना", "Alerts near me")}</h2><button type="button" class="tcbtn nabtn-d" id="napick"><span aria-hidden="true">📍</span> ${my ? E(T(my.ne, my.en)) : T("जिल्ला छान्नुहोस्", "Choose district")}</button></div>`;
    const nat = act.filter((a) => !a.districts.length);
    const natHtml = nat.length ? `<h3 class="nagh">${T("देशभरका सूचना", "Notices for the whole country")} <span>${N(nat.length)}</span></h3><ul class="nalist">${nat.map((a) => row(a, "")).join("")}</ul>` : "";
    let body;
    if (!my) {
      const named = [...new Set(act.flatMap((a) => a.districts))].filter((c) => D[c]);
      body = `<p class="naempty">${T("आफ्नो जिल्ला छान्नुहोस्: त्यसपछि यहाँ पहिले हजुरको जिल्ला, अनि छेउका जिल्ला र देशभरका सूचना देखिन्छन्।", "Choose your district: this then shows your district first, the districts next to it, and notices for the whole country.")}</p>
        ${named.length ? `<p class="meta">${T("अहिले सक्रिय आधिकारिक सूचना भएका जिल्ला", "Districts with an active official alert now")}:</p><div class="tcchips">${named.map((c) => `<button type="button" class="tcchip nabtn-c" data-c="${c}">${E(T(D[c].ne, D[c].en))}</button>`).join("")}</div>` : ""}${natHtml}`;
    } else {
      const near = Object.keys(D).filter((c) => c !== me).map((c) => ({ c, km: km(my.ll, D[c].ll) })).sort((a, b) => a.km - b.km).slice(0, 6);
      const mine = act.filter((a) => a.districts.includes(me)).map((a) => ({ a, km: 0 }));
      const nb = []; act.forEach((a) => { if (a.districts.includes(me)) return; const hit = near.filter((n) => a.districts.includes(n.c)); if (hit.length) nb.push({ a, km: hit[0].km, c: hit[0].c }); });
      const nm = E(T(my.ne, my.en));
      body = `<h3 class="nagh">${T(`${nm} जिल्लामा`, `In ${nm}`)} <span>${N(mine.length)}</span></h3>` +
        (mine.length ? `<ul class="nalist">${sort(mine).map((x) => row(x.a, T("हजुरको जिल्ला", "Your district"))).join("")}</ul>` : `<p class="naempty">${T(`गतिमा अहिले ${nm} लाई नाम लिएको कुनै सक्रिय आधिकारिक सूचना छैन। यसको अर्थ खतरा छैन भन्ने होइन।`, `No active official alert in Gati names ${nm} right now. This is not an all clear.`)} <a href="${R}affected/">${T("के म प्रभावित छु?", "Am I affected?")} →</a></p>`) +
        `<h3 class="nagh">${T("छेउका जिल्लामा", "In districts next to you")} <span>${N(nb.length)}</span></h3>` +
        (nb.length ? `<ul class="nalist">${sort(nb).map((x) => row(x.a, `${E(T(D[x.c].ne, D[x.c].en))} · ${T("करिब ", "about ")}${N(Math.round(x.km / 5) * 5)} ${T("कि.मि.", "km")}`)).join("")}</ul>` : `<p class="naempty">${T("छेउका ६ जिल्लालाई नाम लिएको सक्रिय आधिकारिक सूचना छैन", "No active official alert names the six nearest districts")}: ${near.map((n) => E(T(D[n.c].ne, D[n.c].en))).join(", ")}.</p>`) + natHtml;
    }
    box.innerHTML = head + body + `<p class="meta nafoot">${T("दूरी जिल्लाको केन्द्रबीचको अनुमान हो। सूची तलको पूरा सूचीबाटै आएको हो; गतिले आधिकारिक सूचना मात्र फैलाउँछ।", "Distance is an estimate between district centres. The rows come from the full list below; Gati relays official notices only.")}</p>`;
    box.hidden = false;
    box.querySelector("#napick").onclick = () => G.district.open(draw);
    box.querySelectorAll(".nabtn-c").forEach((b) => (b.onclick = () => { try { localStorage.setItem("gati-district", b.dataset.c); } catch (e) {} dispatchEvent(new CustomEvent("gati:district", { detail: b.dataset.c })); draw(); }));
  }
  Promise.all([G.json("data/alerts.json"), G.json("data/districts.geojson")]).then(([al, geo]) => {
    AL = al.alerts || []; geo.features.forEach((f) => { const p = f.properties; D[p.code] = { ne: p.ne, en: p.en, ll: centre(f.geometry) }; });
    draw(); G.onLang(draw); addEventListener("gati:district", draw);
  }).catch(() => {});
})();
